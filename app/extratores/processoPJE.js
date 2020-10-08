const { Robo } = require('../lib/robo');
const { Logger } = require('../lib/util');
const { enums } = require('../configs/enums');
var heartBeat = 0;

var red = '\u001b[31m';
var blue = '\u001b[34m';
var reset = '\u001b[0m';

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
      if (heartBeat > 420) {
        console.log(
          red +
            '----------------- Fechando o processo por inatividade -------------------' +
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
    setInterval(async function () {
      heartBeat++;
      if (heartBeat > 340) {
        console.log(
          red +
            '----------------- Fechando o processo por Indisponibilidade -------------------' +
            reset
        );
        // await mongoose.connection.close()
        // process.exit();
        const error = new Error('Tempo de tentativa de resolução esgotado');
        error.code = 'Não é possível obter o processo em 5 minutos';
        throw error;
      }
    }, 1000);
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
  async captura(header, cnj, numeroEstado) {
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
    const objResponse = await this.robo.acessar({
      url: url,
      encoding: 'latin1',
      usaProxy: true,
      headers: header,
    });
    const bodyRes = objResponse.responseBody;

    if (bodyRes === undefined) {
      logger.info('Não foi possivel obter a resposta inicial');
      return null;
    }

    const info = bodyRes[0];

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
      // logger.info("passei aqui");
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
  }
}
module.exports.ExtratorTrtPje = ExtratorTrtPje;
