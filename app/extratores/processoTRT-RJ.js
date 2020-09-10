const { Robo } = require("../lib/robo");
const { Logger } = require('../lib/util');
const { enums } = require('../configs/enums');


class ExtratorTrtrj {
  constructor(url, isDebug) {
    // super(url, isDebug);
    this.robo = new Robo();
    this.url = `http://pje.trt1.jus.br/pje-consulta-api`;
    this.qtdTentativas = 1;
  }

  /**
   * Executa a extração da capa do cnj desejado.
   * @param {string} cnj Numero de processo a ser buscado.
   */
  async extrair(cnj) {
    /**Logger para console de arquivos */
    const logger = new Logger('info', 'logs/ProcessoJTE/ProcessoTRT-RJInfo.log', {
      nomeRobo: enums.nomesRobos.TRTRJ,
      NumeroDoProcesso: cnj,
    });
    let captura;
    logger.info("Extrator de processos TRT_RJ Iniciado");
    try {
      captura = await this.tryCaptura(cnj);
      const valor = captura.valorDaCausa;
      const segredoJustica = captura.segredoJustica;
      const justicaGratuita = captura.justicaGratuita;
      console.log({ valor, segredoJustica, justicaGratuita });
      return { valor, segredoJustica, justicaGratuita }
    } catch (e) {
      logger.log('warn', `${e} CNJ: ${cnj}`);

      if (/Ocorreu um problema na solução do Captcha/.test(e.code)) {
        if (this.qtdTentativas < 5) {
          logger.info(`Captcha falhou!`, this.qtdTentativas);
          this.qtdTentativas += 1;
          logger.info("vou reiniciar a extração");
          captura = await this.extrair(cnj);
        } else {
          const error = new Error('Não conseguimos resolver o capcha 4 vezes');
          error.code = "Ocorreu um problema na solução do Captcha";
          throw error;
        }
      } else if (/Não é possível obter devido ao processo ser sigiliso/.test(e.code)) {
        const error = new Error('Processo sigiloso');
        error.code = "Processo sigiloso não exibe dados";
        throw error;
      }
    }
    return captura
  }


  /** 
   * Captura o Processo informado usando a API de quebra de captcha da Impacta
   * @param {string} cnj Numero de processo a ser buscado.
   * @param {string} objResponse Obtem objeto inicial para a captura do processo.
   * @param {string} objResponseCaptcha Obtem a imagem em base64 do captcha
   */
  async captura(header, cnj) {


    /**Logger para console de arquivos */
    const logger = new Logger('info', 'logs/ProcessoJTE/ProcessoTRT-RJInfo.log', {
      nomeRobo: enums.nomesRobos.TRTRJ,
      NumeroDoProcesso: cnj,
    });
    logger.info("Iniciado captura do processo.");

    const url = `${this.url}/api/processos/dadosbasicos/${cnj}`;
    //console.log("dentro da captura", url);
    // Primeira requisição ao TRT-RJ    
    const objResponse = await this.robo.acessar({
      url: url,
      encoding: "latin1",
      usaProxy: true,
      headers: header
    });

    const bodyRes = objResponse.responseBody;
    // console.log(bodyRes);

    const info = bodyRes[0];
    // finaliza a captura caso não obtenho os dados iniciais.
    if (!info) {
      // logger.info("Não foi possível obter os primeiros dados do processo.");
      throw new Error("Não foi possível obter os primeiros dados do processo.")
    };
    // process.exit()
    // obtem a imagem em base64 do captcha
    const objResponseCaptcha = await this.robo.acessar({
      url: `${this.url}/api/processos/${info.id}`,
      method: "GET",
      encoding: "latin1",
      usaProxy: true
    });
    const desafio = objResponseCaptcha.responseBody
    const captcha = {
      refinador: "trt_1",
      imagem: `${desafio.imagem}`
    }
    logger.info("Captcha obtido com sucesso");

    logger.info("Iniciado processo de solução do captcha")
    // envia captcha para API de resolução
    const resQuebrarCaptcha = await this.robo.acessar({
      url: `http://172.16.16.8:8082/api/refinar/`,
      method: "POST",
      encoding: "utf8",
      usaProxy: false,
      usaJson: true,
      params: captcha
    });
    const captchaSolved = resQuebrarCaptcha.responseBody;


    if (captchaSolved.sucesso) {
      logger.info("Solução do captcha é: " + captchaSolved.texto);

      // removendo caracteres especiais da solução do captcha
      const texto = captchaSolved.texto.replace(/[^a-z0-9]/g, "");
      // const texto = captchaSolved.texto.replace(/[a-z0-9]/g, ""); // cria erro para testes

      // obtendo dados do processo.
      const detalheProcesso = await this.robo.acessar({
        url: `https://pje.trt1.jus.br/pje-consulta-api/api/processos/${info.id}?tokenDesafio=${desafio.tokenDesafio}&resposta=${texto}`,
        method: "get",
        encoding: "utf8",
        usaProxy: true,
        headers: header
      });
      if (detalheProcesso.responseBody.mensagem) {
        const error = new Error('Captcha invalido');
        error.code = "Ocorreu um problema na solução do Captcha";
        throw error;
      }
      // logger.info("passei aqui");
      if (!!detalheProcesso.responseBody.mensagemErro) {
        const error = new Error('Processo sigiloso');
        error.code = "Não é possível obter devido ao processo ser sigiliso";
        throw error;
      }

      logger.info("Dados do processo obtidos com sucesso.")
      return detalheProcesso.responseBody
    } else {
      logger.info("Não foi possível resolver o captcha");
    }


  }

  /**Existe processos que não possuem cadastro em primeira instancia e o servidor
   * do TRT-RJ trava a requisição sendo necessario baixar direto em 2 instância
   * @param {string} cnj Numero de processo a ser buscado.
   */
  async tryCaptura(cnj) {
    let resultado;
    try {

      const captura = await new ExtratorTrtrj().captura({ "X-Grau-Instancia": "1" }, cnj);
      const captura_2ins = await new ExtratorTrtrj().captura({ "X-Grau-Instancia": "2" }, cnj);

      if (captura_2ins && captura_2ins.andamentos && captura_2ins.andamentos.length > 0) {
        if (!captura)
          captura = captura_2ins;
        else
          captura.andamentos = captura.andamentos.concat(captura_2ins.andamentos);
      }
      resultado = captura
      return resultado

    } catch (e) {
      //console.log(e);
      if (/Não é possível obter devido ao processo ser sigiliso/.test(e.code)) {
        return undefined
      }
      const captura_2ins = await new ExtratorTrtrj().captura({ "X-Grau-Instancia": "2" }, cnj);
      resultado = captura_2ins
      return resultado
    }
  }
}
// (async () => {
//   console.log(await new ExtratorTrtrj().extrair("01001199020205010041"));

//   process.exit()
// })()
module.exports.ExtratorTrtrj = ExtratorTrtrj;