const { Robo } = require("../lib/robo");
const { Logger } = require('../lib/util');
const { enums } = require('../configs/enums');
const async = require('async');



class ExtratorTrtPje15 {
  constructor() {
    this.robo = new Robo();
    this.url = `http://pje.trt15.jus.br/pje-consulta-api`;
    this.qtdTentativas = 1;

  }

  /**
   * Executa a extração do site PJe, Onde obtemos todos os processos trabalhistas
   * Neste site obtemos detalhes como valor de processo segredo de justiça
   * 
   * @param {string} cnj Numero de processo a ser buscado.
   * @param {Number} numeroEstado Numero a ser inserido na URL para busca do estado.
   */
  async extrair(cnj, numeroEstado) {
    let url_1 = `http://pje.trt${numeroEstado}.jus.br/pje-consulta-api`;
    /**Logger para console de arquivos */
    var logger = new Logger('info', 'logs/ProcessoJTE/ProcessoTRT-RJInfo.log', {
      nomeRobo: enums.nomesRobos.PJE,
      NumeroDoProcesso: cnj,
    });
    let capturaProcesso;
    logger.info("Extrator de processos TRT_PJE Iniciado");

    logger.info("Entrando no fluxo de captura de processo.");

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

    return capturaProcesso
  }

  /**Existe processos que não possuem cadastro em primeira instancia e o servidor
   * do TRT-RJ trava a requisição sendo necessario baixar direto em 2 instância
   * 
   * @param {String} logger Cria logger para ser exibido no terminal
   */
  async tryCaptura(cnj, numeroEstado) {
    let resultado;
    /**Logger para console de arquivos */
    const logger = new Logger('info', 'logs/ProcessoJTE/ProcessoTRT-RJInfo.log', {
      nomeRobo: enums.nomesRobos.PJE,
      NumeroDoProcesso: cnj,
    });


    try {
      // logger.info("Entrando no fluxo 01 - tentativa 01");
      // logger.info("Entrando no fluxo 01 - tentativa 02");
      logger.info("Verificando o processo na 1 e 2 instância.");
      let captura = await this.captura({ "X-Grau-Instancia": "1" }, cnj, numeroEstado)

      let captura_2ins = await this.captura({ "X-Grau-Instancia": "2" }, cnj, numeroEstado)

      console.log(captura);
      console.log(captura_2ins);

      // let captura_2ins = await this.captura({ "X-Grau-Instancia": "2" }, cnj, numeroEstado);
      Promise.allSettled([captura, captura_2ins]).then(res => { console.log(res) })






      // if (captura_2ins && captura_2ins.andamentos && captura_2ins.andamentos.length > 0) {
      //   if (!captura)
      //     captura = captura_2ins;
      //   else
      //     captura.andamentos = captura.andamentos.concat(captura_2ins.andamentos);
      // }
      // resultado = captura
      // return resultado

    } catch (e) {
      // logger.info("Entrando no fluxo 02 - tentativa 01");
      // if (/Não é possível obter devido ao processo ser sigiliso/.test(e.code)) {
      //   return { segredoJustica: true }
      // }
      // const captura_2ins = await new ExtratorTrtPje().captura({ "X-Grau-Instancia": "2" }, cnj, numeroEstado);
      // resultado = captura_2ins

      return resultado
    }
  }


  /** 
   * Captura o Processo informado usando a API de quebra de captcha da Impacta
   * @param {string} cnj Numero de processo a ser buscado.
   * @param {string} objResponse Obtem objeto inicial para a captura do processo.
   * @param {string} objResponseCaptcha Obtem a imagem em base64 do captcha
   * @param {string} url_1 Url base do tribunal para a raspagem.
   * @param {object} info Infomações basicas do processo no tribunal, como id.
   * @param {object} captcha Objeto a ser passado para a api de resolução de capcha.
   * @param {object} captchaSolved Retorno da Api de resolução de captcha
   * @param {object} desafio Possui todas as informações do capcha
   * @param {object} detalheProcesso Todas as informações do processo fornecidas pela pagina
   */
  async captura(header, cnj, numeroEstado) {
    let url_1 = `http://pje.trt${numeroEstado}.jus.br/pje-consulta-api`;
    /**Logger para console de arquivos */
    const logger = new Logger('info', 'logs/ProcessoJTE/ProcessoTRT-RJInfo.log', {
      nomeRobo: enums.nomesRobos.PJE,
      NumeroDoProcesso: cnj,
    });
    logger.info("Iniciado captura do processo");
    const info = await this.tryRepostaInicial(url_1, cnj, header);

    // obtem a imagem em base64 do captcha
    const desafio = await this.pegaCapcha(url_1, info);
    const captcha = {
      refinador: "trt_1",
      imagem: `${desafio.imagem}`
    }
    logger.info("Captcha obtido com sucesso");

    logger.info("Iniciado processo de solução do captcha")
    const captchaSolved = await this.resolveCaptcha(captcha);

    if (captchaSolved.sucesso) {
      logger.info("Solução do captcha é: " + captchaSolved.texto);
      try {
        const detalheProcesso = await this.pegaProcesso(
          captchaSolved,
          numeroEstado,
          info,
          desafio,
          header
        );
        logger.info("Dados do processo obtidos com sucesso.")
        return detalheProcesso
      } catch (e) { console.log(e); }


    } else {
      logger.info("Não foi possível resolver o captcha");
      // await this.captura(header, cnj, numeroEstado);
    }
  }

  async tryRepostaInicial(url_1, cnj, header) {
    const logger = new Logger('info', 'logs/ProcessoJTE/ProcessoTRT-RJInfo.log', {
      nomeRobo: enums.nomesRobos.PJE,
      NumeroDoProcesso: cnj,
    });
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


    return bodyRes[0]
  }
  async pegaCapcha(url_1, info) {
    const objResponseCaptcha = await this.robo.acessar({
      url: `${url_1}/api/processos/${info.id}`,
      method: "GET",
      encoding: "latin1",
      usaProxy: true,
    });
    const desafio = objResponseCaptcha.responseBody

    return desafio
  }
  async resolveCaptcha(captcha) {
    // console.time("Resolução do Capcha")
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
    // console.timeEnd("Resolução do Capcha")
    return captchaSolved
  }
  async pegaProcesso(captchaSolved, numeroEstado, info, desafio, header) {
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
    });
    if (detalheProcesso.responseBody.mensagem) {
      const error = new Error('Captcha invalido');
      error.code = "Ocorreu um problema na solução do Captcha";
      throw error;
    }

    if (!!detalheProcesso.responseBody.mensagemErro) {
      const error = new Error('Processo sigiloso');
      error.code = "Não é possível obter devido ao processo ser sigiliso";
      throw error;
    }
    // console.log(detalheProcesso.responseBody);
    return detalheProcesso.responseBody
  }

}
module.exports.ExtratorTrtPje15 = ExtratorTrtPje15;



