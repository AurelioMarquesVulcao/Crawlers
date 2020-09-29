const { Robo } = require("../lib/robo");
const { Logger } = require('../lib/util');
const { enums } = require('../configs/enums');
var heartBeat = 0;    // Verifica se a aplicação esta consumindo a fila, caso não ele reinicia o worker


class ExtratorTrtPje {
  constructor(url, isDebug) {
    this.robo = new Robo();
    this.url = `http://pje.trt1.jus.br/pje-consulta-api`;
    this.qtdTentativas = 1;

  }

  /**
   * Executa a extração da capa do cnj desejado.
   * @param {string} cnj Numero de processo a ser buscado.
   */
  async extrair(cnj, numeroEstado) {
    setInterval(async function () {
      heartBeat++;
      console.log(`setInterval: Ja passou ${heartBeat} segundos!`);
      if (heartBeat > 30) {
        console.log('----------------- Fechando o processo por inatividade -------------------');
        // await mongoose.connection.close()
        process.exit();
      }
    }, 1000);


    let url_1 = `http://pje.trt${numeroEstado}.jus.br/pje-consulta-api`;
    /**Logger para console de arquivos */
    var logger = new Logger('info', 'logs/ProcessoJTE/ProcessoTRT-RJInfo.log', {
      nomeRobo: enums.nomesRobos.TRTRJ,
      NumeroDoProcesso: cnj,
    });
    let capturaProcesso;
    logger.info("Extrator de processos TRT_RJ Iniciado");
    try {
      capturaProcesso = await this.tryCaptura(cnj, numeroEstado);
    } catch (e) {
      logger.log('warn', `${e} CNJ: ${cnj}`);

      if (/Ocorreu um problema na solução do Captcha/.test(e.code)) {
        if (this.qtdTentativas < 5) {
          logger.info(`Captcha falhou!`, this.qtdTentativas);
          this.qtdTentativas += 1;
          logger.info("Vou reiniciar a extração");
          capturaProcesso = await this.extrair(cnj, numeroEstado);
        } else {
          const error = new Error('Não conseguimos resolver o capcha em 4 tentativas');
          error.code = "Ocorreu um problema na solução do Captcha";
          throw error;
        }
      } else if (/Não é possível obter devido ao processo ser sigiliso/.test(e.code)) {
        const error = new Error('Processo sigiloso');
        error.code = "Processo sigiloso não exibe dados";
        throw error;
      }
    }
    heartBeat = 0;
    return capturaProcesso
  }


  /** 
   * Captura o Processo informado usando a API de quebra de captcha da Impacta
   * @param {string} cnj Numero de processo a ser buscado.
   * @param {string} objResponse Obtem objeto inicial para a captura do processo.
   * @param {string} objResponseCaptcha Obtem a imagem em base64 do captcha
   */
  async captura(header, cnj, numeroEstado) {
    let url_1 = `http://pje.trt${numeroEstado}.jus.br/pje-consulta-api`;
    /**Logger para console de arquivos */
    const logger = new Logger('info', 'logs/ProcessoJTE/ProcessoTRT-RJInfo.log', {
      nomeRobo: enums.nomesRobos.TRTRJ,
      NumeroDoProcesso: cnj,
    });
    logger.info("Iniciado captura do processo.");
    const url = `${url_1}/api/processos/dadosbasicos/${cnj}`;
    // Primeira requisição ao TRT-RJ    
    const objResponse = await this.robo.acessar({
      url: url,
      encoding: "latin1",
      usaProxy: true,
      headers: header,

    });
    const bodyRes = objResponse.responseBody;

    if (bodyRes === undefined) {
      logger.info("Não foi possivel obter a resposta inicial");
      return null;
    }

    const info = bodyRes[0];


    // obtem a imagem em base64 do captcha
    const objResponseCaptcha = await this.robo.acessar({
      url: `${url_1}/api/processos/${info.id}`,
      method: "GET",
      encoding: "latin1",
      usaProxy: true,

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
      params: captcha,

    });
    const captchaSolved = resQuebrarCaptcha.responseBody;


    if (captchaSolved.sucesso) {
      logger.info("Solução do captcha é: " + captchaSolved.texto);

      // removendo caracteres especiais da solução do captcha
      const texto = captchaSolved.texto.replace(/[^a-z0-9]/g, "");
      // const texto = captchaSolved.texto.replace(/[a-z0-9]/g, ""); // cria erro para testes

      // obtendo dados do processo.
      const detalheProcesso = await this.robo.acessar({
        url: `https://pje.trt${numeroEstado}.jus.br/pje-consulta-api/api/processos/${info.id}?tokenDesafio=${desafio.tokenDesafio}&resposta=${texto}`,
        method: "get",
        encoding: "utf8",
        usaProxy: true,
        headers: header,
        // responseType: 'stream'

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
   */
  async tryCaptura(cnj, numeroEstado) {
    /**Logger para console de arquivos */
    const logger = new Logger('info', 'logs/ProcessoJTE/ProcessoTRT-RJInfo.log', {
      nomeRobo: enums.nomesRobos.TRTRJ,
      NumeroDoProcesso: cnj,
    });
    let resultado;
    try {
      logger.info("Entrando no fluxo 01 - tentativa 01");

      let captura = await this.captura({ "X-Grau-Instancia": "1" }, cnj, numeroEstado);

      logger.info("Entrando no fluxo 01 - tentativa 02");

      let captura_2ins = await this.captura({ "X-Grau-Instancia": "2" }, cnj, numeroEstado);

      if (captura_2ins && captura_2ins.andamentos && captura_2ins.andamentos.length > 0) {
        if (!captura)
          captura = captura_2ins;
        else
          captura.andamentos = captura.andamentos.concat(captura_2ins.andamentos);
      }
      resultado = captura
      return resultado

    } catch (e) {
      logger.info("Entrando no fluxo 02 - tentativa 01");
      if (/Não é possível obter devido ao processo ser sigiliso/.test(e.code)) {
        return { segredoJustica: true }
      }
      const captura_2ins = await new ExtratorTrtPje().captura({ "X-Grau-Instancia": "2" }, cnj, numeroEstado);
      resultado = captura_2ins

      return resultado
    }
  }
}
module.exports.ExtratorTrtPje = ExtratorTrtPje;



