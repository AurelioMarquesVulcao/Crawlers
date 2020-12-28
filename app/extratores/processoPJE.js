// const { Robo } = require('../lib/robo');
const { Robo } = require('../lib/newRobo');
const { Logger } = require('../lib/util');
const { enums } = require('../configs/enums');
const sleep = require('await-sleep');
var heartBeat = 0;

var red = '\u001b[31m';
var blue = '\u001b[34m';
var reset = '\u001b[0m';


setInterval(async function () {
  heartBeat++;
  if (heartBeat > 120) {
    console.log(
      red +
      '----------------- Fechando o processo por Indisponibilidade 120 -------------------' +
      reset
    );
    // await mongoose.connection.close()
    // process.exit();
    const error = new Error('Tempo de tentativa de resolução esgotado');
    error.code = 'Não é possível obter o processo em 5 minutos';
    throw error;
  }
}, 1000);



class ExtratorTrtPje {
  constructor(url, isDebug) {
    this.robo = new Robo();
    this.url = `http://pje.trt1.jus.br/pje-consulta-api`;
    this.qtdTentativas = 1;
    this.proxy = true;
    this.cnj = "";
    this.numeroEstado = "";
    this.logger;
    this.url_1 = "";
    this.urlCaptcha = "http://172.16.16.8:8082/api/refinar/";
    // this.urlCaptcha="http://127.0.0.1:8082/api/refinar/";
  }
  async extrair(cnj, numeroEstado) {
    this.cnj = cnj;
    this.numeroEstado = numeroEstado;
    this.logger = new Logger(
      'info',
      'logs/ProcessoJTE/ProcessoTRT-RJInfo.log',
      {
        nomeRobo: enums.nomesRobos.TRTRJ,
        NumeroDoProcesso: cnj,
      }
    );
    this.url_1 = `http://pje.trt${numeroEstado}.jus.br/pje-consulta-api`
    return await this.instancias();

  }

  async instancias() {


    try {
      let captura = await this.captura(
        { 'X-Grau-Instancia': '1' },
      );
      if (captura == "Nao possui") {
        this.logger.info("Não possui 1 instância");
      }
      // return captura
    } catch (e) {
      console.log(e);

    }
    // process.exit();
    try {
      let captura_2ins = await this.captura(
        { 'X-Grau-Instancia': '2' },
      );

      if (captura_2ins == "Nao possui") {
        this.logger.info("Não possui 2 instância");
      }
      // return captura_2ins
    } catch (e) {
      console.log(e);
    }


  }

  async captura(header) {
    try {
      let url_1 = `http://pje.trt${this.numeroEstado}.jus.br/pje-consulta-api`;
      this.logger.info("Inicio da captura.")
      let id = await this.getId(header);
      this.logger.info("Finalizada - Captura do id do processos");
      if (id == "Nao possui") {
        const error = new Error('Não possui está Instância');
        error.code = 'Processo não existe';
        throw error;
      }
      console.log(id);
      let captcha = await this.getCaptcha(id);
      this.logger.info("Finalizado - Captura do Captcha");
      console.log(!!captcha, "captcha");
      let solveCaptcha = await this.getSolveCaptcha(captcha);
      console.log(solveCaptcha);
      this.logger.info("Finalizado - Resolução do Captcha");
      let detalhes = await this.getDetalhes(header, id, captcha.tokenDesafio, solveCaptcha);
      console.log(detalhes);
      this.logger.info("Finalizado - Captura dos Detalhes");
    } catch (e) {
      this.logger.info(e)
    }
  }
  async getId(header) {
    this.logger.info("Iniciada - captura do id do processos")
    const url = `${this.url_1}/api/processos/dadosbasicos/${this.cnj}`;
    try {
      const getId = await this.robo.acessar({
        url: url,
        encoding: 'latin1',
        poxy: this.proxy,
        headers: header,
      });
      const body = getId.responseBody;
      // console.log(body);
      if (body == true) {
        return "Nao possui"
      }
      if (body === undefined) {
        this.logger.info('Não foi possivel obter a resposta inicial');
        return null;
      }

      // console.log(body[0]);
      return body[0].id
    } catch (e) {
      // console.log(e);
      this.logger.info(e)
    }
  }
  async getCaptcha(id) {
    this.logger.info("Iniciado - captura do Captcha");
    try {
      const getCaptcha = await this.robo.acessar({
        url: `${this.url_1}/api/processos/${id}`,
        method: 'GET',
        encoding: 'latin1',
        proxy: this.proxy,
      });
      const desafio = getCaptcha.responseBody;
      // console.log(desafio);
      const captcha = {
        refinador: 'trt_1',
        imagem: `${desafio.imagem}`,
        tokenDesafio: `${desafio.tokenDesafio}`
      };
      this.logger.info('Captcha obtido com sucesso');
      return captcha

    } catch (e) {
      this.logger.info(e);
    }
  }
  async getSolveCaptcha(captcha) {
    this.logger.info("Iniciado - Resolução do Captcha");
    try {
      let { refinador, imagem } = captcha;
      let params = { refinador, imagem };
      const resQuebrarCaptcha = await this.robo.acessar({
        url: this.urlCaptcha,
        method: 'POST',
        encoding: 'utf8',
        proxy: false,
        json: params,
      });
      const captchaSolved = resQuebrarCaptcha.responseBody;
      // console.log(resQuebrarCaptcha.responseBody);
      if (captchaSolved.sucesso) {
        this.logger.info('Solução do captcha é: ' + captchaSolved.texto);
        // removendo caracteres especiais da solução do captcha
        const texto = captchaSolved.texto.replace(/[^a-z0-9]/g, '');
        // console.log(texto);
        // console.log(texto.length);
        if (texto.length < 6) {
          this.logger.info(
            'Não foi possivél resolver o Captcha corretamente, reiniciando o processo!'
          );
          process.exit();
        }
        return texto
      } else {
        process.exit();
      }
    } catch (e) {
      this.logger.info(e)
    }
  }
  async getDetalhes(header, id, tokenDesafio, texto) {
    this.logger.info("Iniciado - Captura dos Detalhes");
    try {
      const detalheProcesso = await this.robo.acessar({
        url: `https://pje.trt${this.numeroEstado}.jus.br/pje-consulta-api/api/processos/${id}?tokenDesafio=${tokenDesafio}&resposta=${texto}`,
        method: 'get',
        encoding: 'utf8',
        proxy: true,
        headers: header,
        // responseType: 'stream'
      });
      // console.log(detalheProcesso.responseBody);
      if (detalheProcesso.responseBody.mensagem) {
        const error = new Error('Captcha invalido');
        error.code = 'Ocorreu um problema na solução do Captcha';
        throw error;
      }
      if (!!detalheProcesso.responseBody.mensagemErro) {
        // return detalheProcesso.responseBody;
        return { segredoJustica: true };
        const error = new Error('Processo sigiloso');
        error.code = 'Não é possível obter devido ao processo ser sigiliso';
        throw error;
      }
      this.logger.info('Dados do processo obtidos com sucesso.');
      return detalheProcesso.responseBody;

    } catch (e) {
      this.logger.info(e);
      return e.code
    }
  }






  /**
   * Executa a extração da capa do cnj desejado.
   * @param {string} cnj Numero de processo a ser buscado.
   */
  async extrair1(cnj, numeroEstado) {
    let url_1 = `http://pje.trt${numeroEstado}.jus.br/pje-consulta-api`;
    /**Logger para console de arquivos */
    var logger = new Logger('info', 'logs/ProcessoJTE/ProcessoTRT-RJInfo.log', {
      nomeRobo: enums.nomesRobos.PJE,
      NumeroDoProcesso: cnj,
    });

    // let capturaProcesso;
    logger.info('Extrator de processos TRT_PJE Iniciado');

    // Cria um contador que reinicia o robô caso ele fique inativo por algum tempo.
    setInterval(async function () {
      heartBeat++;
      if (heartBeat > 180) {
        console.log(
          red +
          '----------------- Fechando o processo por inatividade 180 -------------------' +
          reset
        );
        // await mongoose.connection.close()
        process.exit();
      }
    }, 1000);
    /**Logger para console de arquivos */

    let resultado;
    let contaCaptcha = 0;

    try {
      // capturaProcesso = await this.tryCaptura(cnj, numeroEstado);
      // return capturaProcesso

      let captura = await this.captura(
        { 'X-Grau-Instancia': '1' },
        cnj,
        numeroEstado
      );
      let captura_2ins = await this.captura(
        { 'X-Grau-Instancia': '2' },
        cnj,
        numeroEstado
      );

      if (captura) {
        logger.info('Entrando no fluxo 01 - tentativa 01');
        heartBeat = 0;
        // console.log(captura);
        return captura;
      } else {
        // console.log(captura);
        //logger.info("Entrando no fluxo 01 - tentativa 02");
        heartBeat = 0;
        return captura_2ins;
      }
    } catch (e) {
      heartBeat = 0;
      console.log(e);
      logger.info('Entrando no fluxo 02 - tentativa 01');
      if (/Não é possível obter devido ao processo ser sigiliso/.test(e.code)) {
        return { segredoJustica: true };
      } else if (
        /Ocorreu um problema na solução do Captcha/.test(e.code) &&
        6 > contaCaptcha
      ) {
        contaCaptcha++;
        await this.tryCaptura(cnj, numeroEstado);
      } else if (6 > contaCaptcha) {
        contaCaptcha++;
        await this.tryCaptura(cnj, numeroEstado);
      }

      logger.log('warn', `${e} CNJ: ${cnj}`);

      // if (/Ocorreu um problema na solução do Captcha/.test(e.code)) {
      //   if (this.qtdTentativas < 5) {
      //     logger.info(`Captcha falhou!`, this.qtdTentativas);
      //     this.qtdTentativas += 1;
      //     logger.info("Vou reiniciar a extração");
      //     capturaProcesso = await this.extrair(cnj, numeroEstado);
      //   } else {
      //     const error = new Error('Não conseguimos resolver o capcha em 4 tentativas');
      //     error.code = "Ocorreu um problema na solução do Captcha";
      //     throw error;
      //   }
      // } else if (/Não é possível obter devido ao processo ser sigiliso/.test(e.code)) {
      //   const error = new Error('Processo sigiloso');
      //   error.code = "Processo sigiloso não exibe dados";
      //   throw error;
      // }
    }
  }

  async tryCaptura(cnj, numeroEstado) {
    // Cria um contador que reinicia o robô caso ele fique inativo por algum tempo.

    /**Logger para console de arquivos */
    const logger = new Logger(
      'info',
      'logs/ProcessoJTE/ProcessoTRT-RJInfo.log',
      {
        nomeRobo: enums.nomesRobos.PJE,
        NumeroDoProcesso: cnj,
      }
    );
    let resultado;
    let contaCaptcha = 0;
    try {
      let captura = await this.captura(
        { 'X-Grau-Instancia': '1' },
        cnj,
        numeroEstado
      );
      let captura_2ins = await this.captura(
        { 'X-Grau-Instancia': '2' },
        cnj,
        numeroEstado
      );

      if (captura) {
        logger.info('Entrando no fluxo 01 - tentativa 01');
        heartBeat = 0;
        // console.log(captura);
        return captura;
      } else {
        // console.log(captura);
        //logger.info("Entrando no fluxo 01 - tentativa 02");
        heartBeat = 0;
        return captura_2ins;
      }

      // Promise.allSettled([captura, captura_2ins])
      //   .then(res => {

      //     // console.log(res[0])
      //     // console.log(res[1].value)
      //     if (res[0].value !== null) {
      //       return res[0].value
      //     } else {
      //       return res[1].value
      //     }
      //   });

      // if (captura_2ins && captura_2ins.andamentos && captura_2ins.andamentos.length > 0) {
      //   if (!captura)
      //     captura = captura_2ins;
      //   else
      //     captura.andamentos = captura.andamentos.concat(captura_2ins.andamentos);
      // }
      // resultado = captura
      // return resultado
    } catch (e) {
      heartBeat = 0;
      console.log(e);
      logger.info('Entrando no fluxo 02 - tentativa 01');
      if (/Não é possível obter devido ao processo ser sigiliso/.test(e.code)) {
        return { segredoJustica: true };
      } else if (
        /Ocorreu um problema na solução do Captcha/.test(e.code) &&
        6 > contaCaptcha
      ) {
        contaCaptcha++;
        await this.tryCaptura(cnj, numeroEstado);
      } else if (6 > contaCaptcha) {
        contaCaptcha++;
        await this.tryCaptura(cnj, numeroEstado);
      }
      // const captura_2ins = await new ExtratorTrtPje().captura({ "X-Grau-Instancia": "2" }, cnj, numeroEstado);
      // resultado = captura_2ins

      // return resultado
    }
  }

  /**
   * Captura o Processo informado usando a API de quebra de captcha da Impacta
   * @param {string} cnj Numero de processo a ser buscado.
   * @param {string} objResponse Obtem objeto inicial para a captura do processo.
   * @param {string} objResponseCaptcha Obtem a imagem em base64 do captcha
   */
  async captura1(header, cnj, numeroEstado) {
    let url_1 = `http://pje.trt${numeroEstado}.jus.br/pje-consulta-api`;

    const logger = new Logger(
      'info',
      'logs/ProcessoJTE/ProcessoTRT-RJInfo.log',
      {
        nomeRobo: enums.nomesRobos.TRTRJ,
        NumeroDoProcesso: cnj,
      }
    );
    logger.info('Iniciado captura do processo.');
    const url = `${url_1}/api/processos/dadosbasicos/${cnj}`;
    // Primeira requisição ao TRT-RJ
    try {
      const objResponse = await this.robo.acessar({
        url: url,
        encoding: 'latin1',
        usaProxy: true,
        headers: header,
      });
      const bodyRes = objResponse.responseBody;
      console.log(bodyRes);

      if (bodyRes === undefined) {
        logger.info('Não foi possivel obter a resposta inicial');
        return null;
      }

      const info = bodyRes[0];
      console.log(info);

      // obtem a imagem em base64 do captcha
      const objResponseCaptcha = await this.robo.acessar({
        url: `${url_1}/api/processos/${info.id}`,
        method: 'GET',
        encoding: 'latin1',
        usaProxy: true,
      });
      const desafio = objResponseCaptcha.responseBody;

      const captcha = {
        refinador: 'trt_1',
        imagem: `${desafio.imagem}`,
      };
      logger.info('Captcha obtido com sucesso');

      logger.info('Iniciado processo de solução do captcha');

      // envia captcha para API de resolução
      const resQuebrarCaptcha = await this.robo.acessar({
        url: `http://172.16.16.8:8082/api/refinar/`,
        // url: `http://127.0.0.1:8082/api/refinar/`,
        method: 'POST',
        encoding: 'utf8',
        usaProxy: false,
        usaJson: true,
        params: captcha,
      });
      const captchaSolved = resQuebrarCaptcha.responseBody;

      if (captchaSolved.sucesso) {
        logger.info('Solução do captcha é: ' + captchaSolved.texto);

        // removendo caracteres especiais da solução do captcha
        const texto = captchaSolved.texto.replace(/[^a-z0-9]/g, '');
        console.log(texto);
        console.log(texto.length);
        if (texto.length < 6) {
          logger.info(
            'Não foi possivél resolver o Captcha corretamente, reiniciando o processo!'
          );
          process.exit()
          throw 'A resolução do captcha está errada!';

        }

        // const texto = captchaSolved.texto.replace(/[a-z0-9]/g, ""); // cria erro para testes

        // obtendo dados do processo.
        const detalheProcesso = await this.robo.acessar({
          url: `https://pje.trt${numeroEstado}.jus.br/pje-consulta-api/api/processos/${info.id}?tokenDesafio=${desafio.tokenDesafio}&resposta=${texto}`,
          method: 'get',
          encoding: 'utf8',
          usaProxy: true,
          headers: header,
          // responseType: 'stream'
        });
        if (detalheProcesso.responseBody.mensagem) {
          const error = new Error('Captcha invalido');
          error.code = 'Ocorreu um problema na solução do Captcha';
          throw error;
        }
        logger.info("passei aqui");
        if (!!detalheProcesso.responseBody.mensagemErro) {
          const error = new Error('Processo sigiloso');
          error.code = 'Não é possível obter devido ao processo ser sigiliso';
          throw error;
        }

        logger.info('Dados do processo obtidos com sucesso.');
        return detalheProcesso.responseBody;

      } else {
        logger.info('Não foi possível resolver o captcha');
      }
    } catch (e) {
      console.log(e);
      console.log(" ----------------- Erro captura  ----------------- ");
      // await sleep(5000);
      // await this.captura(header, cnj, numeroEstado);
    }
  }
}



module.exports.ExtratorTrtPje = ExtratorTrtPje;
