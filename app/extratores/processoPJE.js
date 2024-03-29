const { Robo } = require('../lib/newRobo');
const { Logger } = require('../lib/util');
const { enums } = require('../configs/enums');
const sleep = require('await-sleep');
const { GetCookies } = require('../lib/roboPJE15');
var heartBeat = 0;

var red = '\u001b[31m';
var blue = '\u001b[34m';
var reset = '\u001b[0m';

class ExtratorTrtPje {
  constructor() {
    this.Cookies;
    this.robo = new Robo();
    this.url = `http://pje.trt1.jus.br/pje-consulta-api`;
    this.qtdTentativas = 1;
    this.proxy = true;
    this.cnj = '';
    this.numeroEstado = '';
    this.logger;
    this.url_1 = '';
    this.urlCaptcha = 'http://172.16.16.8:8082/api/refinar/';
    // this.urlCaptcha="http://127.0.0.1:8082/api/refinar/";
    // this.getCookies = new GetCookies();
  }

  allLogs() {
    return this.logger.allLog();
  }

  /**
   * Inicia o Processo de extração e carrega as primeiras variavéis
   * @param {string} cnj numero cnj sem mascara
   * @param {string} numeroEstado numero corespondente ao estado
   * @returns Retorna com os detalhes do processo.
   */
  async extrair(cnj, numeroEstado) {
    this.heartBeat();
    this.cnj = cnj;
    this.numeroEstado = numeroEstado;
    this.logger = new Logger(
      'info',
      'logs/ProcessoJTE/ProcessoTRT-RJInfo.log',
      {
        nomeRobo: enums.nomesRobos.PJE,
        NumeroDoProcesso: cnj,
      }
    );
    this.url_1 = `http://pje.trt${numeroEstado}.jus.br/pje-consulta-api`;
    heartBeat = 0;
    return await this.instancias();
  }

  /**
   * Extrai 1 e 2 instância, e caso um deles seja valido nos da esse retorno
   */
  async instancias() {
    let captura = await this.captura({ 'X-Grau-Instancia': '1' });
    if (captura === false) {
      this.logger.info('Não possui 1 instância');
    }
    let captura_2ins = await this.captura({ 'X-Grau-Instancia': '2' });
    if (captura_2ins === false) {
      this.logger.info('Não possui 2 instância');
    }

    // Verificações das extrações obtidas

    // Caso captura for verdadeira, verifico se houve problema de capcha ou outro erro qq
    // Se captura for falso, o processo é de 2 instância. Faço as mesmas checagens
    if (captura) {
      if (/Ocorreu um problema na solução do Captcha/.test(captura)) {
        this.logger.info('Ocorreu um problema na solução do Captcha');
        return null;
      } else if (/Reprocessar/.test(captura)) {
        return 'Reprocessar';
      } else {
        return captura;
      }
    } else {
      if (/Ocorreu um problema na solução do Captcha/.test(captura)) {
        this.logger.info('Ocorreu um problema na solução do Captcha');
        return null;
      } else if (/Reprocessar/.test(captura)) {
        return 'Reprocessar';
      } else {
        return captura_2ins;
      }
    }
  }

  /**
   * Passa por todos as fases da raspagem do processo
   * @param {object} header Header a ser enviado, 1 ou 2 instância.
   * @returns retorna os detalhes do processo
   */
  async captura(header) {
    try {
      this.logger.info('Inicio da captura.');
      let id = await this.getId(header);
      // console.log(heartBeat);
      // this.logger.info('Finalizada - Captura do id do processos');
      // Testa a resposta do ID para reprocessar ou não o processo.
      if (id == 'Nao possui') {
        // this.logger.info('Não possui id de processo');
        return false;
      } else if (id == 'Off Line') {
        this.logger.info('Requisição do id de processo está Off Line');
        return 'Reprocessar';
      }
      // Caso o processo seja de campinas é necessario obter os
      // Cookies do recaptcha.
      if (this.numeroEstado == '15') {
        heartBeat = -120;
        this.logger.info('O Processo é de Campinas');
        this.logger.info('Iniciando extração dos Cookies');
        this.robo.cookies = await new GetCookies().extrair(this.cnj);
        console.table(this.robo.cookies);
        this.logger.info('Cookies Extraidos com Sucesso');
        heartBeat = 0;
      }
      // Obtem a imagem do Captcha
      let captcha = await this.getCaptcha(id);
      this.logger.info('Finalizado - Captura do Captcha');
      // Obtem a solução do Captcha
      let solveCaptcha = await this.getSolveCaptcha(captcha);
      this.logger.info('Finalizado - Resolução do Captcha');
      // Obtem os detalhes do processo
      let detalhes = await this.getDetalhes(
        header,
        id,
        captcha.tokenDesafio,
        solveCaptcha
      );
      this.logger.info('Finalizado - Captura dos Detalhes');
      return detalhes;
    } catch (e) {
      this.logger.info(e);
      this.logger.log(e);
      return null;
    }
  }

  /**
   * Obtem o id do processo, caso não seja possivél o processo não possui a instância pesquisada.
   * @param {object} header Header a ser enviado, 1 ou 2 instância.
   */
  async getId(header) {
    this.logger.info('Iniciada - captura do id do processos');
    const url = `${this.url_1}/api/processos/dadosbasicos/${this.cnj}`;
    try {
      const getId = await this.robo.acessar({
        url: url,
        encoding: 'latin1',
        poxy: this.proxy,
        headers: header,
        // debug: true
      });
      const body = getId.responseBody;
      if (getId.status == 404) {
        console.log(getId);
        return 'Off Line';
      }
      // console.log(body);
      if (body == true) {
        return 'Nao possui';
      }
      if (body === undefined) {
        this.logger.info('Não foi possivel obter a resposta inicial');
        return null;
      }
      return body[0].id;
    } catch (e) {
      console.log(e);
      this.logger.info(e);
    }
  }

  /**
   * Captura a base64 do desafio Captcha
   * @param {number} id Numero do id do processo
   */
  async getCaptcha(id) {
    this.logger.info('Iniciado - captura do Captcha');
    try {
      const getCaptcha = await this.robo.acessar({
        url: `${this.url_1}/api/processos/${id}`,
        method: 'GET',
        encoding: 'latin1',
        proxy: this.proxy,
      });
      const desafio = getCaptcha.responseBody;
      const captcha = {
        refinador: 'trt_1',
        imagem: `${desafio.imagem}`,
        tokenDesafio: `${desafio.tokenDesafio}`,
      };
      this.logger.info('Captcha obtido com sucesso');
      return captcha;
    } catch (e) {
      this.logger.info(e);
    }
  }
  /**
   * Envia o desafio do captcha para api de resolução de captcha
   * @param {img} captcha Imagem em base64 do captcha
   * @returns Solução do captcha
   */
  async getSolveCaptcha(captcha) {
    heartBeat = 0
    this.logger.info('Iniciado - Resolução do Captcha');
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
      if (captchaSolved.sucesso) {
        this.logger.info('Solução do captcha é: ' + captchaSolved.texto);
        // removendo caracteres especiais da solução do captcha
        const texto = captchaSolved.texto.replace(/[^a-z0-9]/g, '');
        if (texto.length < 6) {
          this.logger.info(
            'Não foi possivél resolver o Captcha corretamente, reiniciando o processo!'
          );
          throw 'Não foi possivél resolver o Captcha corretamente, reiniciando o processo!'
          
        }
        return texto;
      } else {
        this.logger.info("O capcha possui menos de 6 caracteres");  
        throw "O capcha possui menos de 6 caracteres"
        process.exit();
      }
    } catch (e) {
      this.logger.info(e);
    }
  }

  /**
   * Obtem detalhes do processo
   * @param {object} header Header a ser enviado, 1 ou 2 instância.
   * @param {number} id id do processo
   * @param {string} tokenDesafio identificador do desafio captcha
   * @param {string} texto Resolução do Captcha
   * @returns Detalhes do processo ou segredoJustiça = true
   */
  async getDetalhes(header, id, tokenDesafio, texto) {
    this.logger.info('Iniciado - Captura dos Detalhes');
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
      }
      this.logger.info('Dados do processo obtidos com sucesso.');
      return detalheProcesso.responseBody;
    } catch (e) {
      this.logger.info(e);
      return e.code;
    }
  }

  async heartBeat() {
    setInterval(async function () {
      heartBeat++;
      if (heartBeat > 120) {
        console.log(
          red +
            '----------------- Fechando o processo por Indisponibilidade 120 -------------------' +
            reset
        );
        // await mongoose.connection.close()
        process.exit();
      }
    }, 1000);
  }

  // ---------------------------------------------------------------------------------------------------------------------------------
  // Código antigo não apagar até implementar captura de andamentos para processos que possuem andamentos em 1 e 2 instância

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

  async tryCaptura1(cnj, numeroEstado) {
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
          process.exit();
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
        logger.info('passei aqui');
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
      console.log(' ----------------- Erro captura  ----------------- ');
      // await sleep(5000);
      // await this.captura(header, cnj, numeroEstado);
    }
  }
}

module.exports.ExtratorTrtPje = ExtratorTrtPje;
