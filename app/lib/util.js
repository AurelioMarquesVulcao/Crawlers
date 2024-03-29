const axios = require('axios');
const Crypto = require('crypto-js');
const moment = require('moment');
const winston = require('winston');

const { Token } = require('../models/schemas/token');
const { enums } = require('../configs/enums');
const { Robo } = require('../lib/robo');
const awaitSleep = require('await-sleep');

class Helper {
  /**
   * Converte data comum para formato Date. sem alterar o fuso horário
   * @param {string} data Data comum. Ex.: 25/02/2020 09:40
   * @returns {string} 2020-01-01T10:10.000Z
   */
  static data(data) {
    // O GMT-0000 mantem a hora que você inseriu sem alterar fuso -3
    // se quiser inserir fuso, ex.: horario de brazilia -3GMT.
    //GMT-0300
    let regex = data.replace(
      /([0-9]{1,2})\W([0-9]{1,2})\W([0-9]{4})\s([0-9]{2}\W[0-9]{2})/i,
      '$3-$2-$1 $4 GMT-0000'
    );
    console.log(regex);
    return new Date(regex);
  }

  /**
   * Converte data comum para formato Date. sem alterar o fuso horário
   * @param {string} data Data comum. Ex.: 25/02/2020 09:40
   * @returns {string} 2020-01-01T10:10.000Z
   */
  static data2(data) {
    // O GMT-0000 mantem a hora que você inseriu sem alterar fuso -3
    // se quiser inserir fuso, ex.: horario de brazilia -3GMT.
    //GMT-0300
    let regex = data.replace(
      /(\D+)([0123]?\d)\W([01]\d)\W(\d{4})\s+([012]\d\W[0-5]\d)(\D+)/i,
      '$4-$3-$2 $5 GMT-0000'
    );
    console.log(regex);
    return new Date(regex);
  }

  /**
   * Gera um hash em sha1 para o parametro fornecido
   * @param {string} texto Texto para gerar o hash
   */
  static hash(texto) {
    const cifra = Crypto.SHA1(texto);
    return cifra.toString();
  }

  static exit(signal = 0) {
    process.exit(signal);
  }

  static pre(param) {
    console.log(param);
  }

  static pred(param, signal = 0) {
    this.pre(param);
    this.exit(signal);
  }

  static removerEspacosEmBranco(texto) {
    return texto.replace(/\n+|\s+|\t+/g, ' ').trim();
  }

  static removerEspeciais(texto) {
    return texto
      .replace(/\n+|\t+/g, ' ')
      .replace(/\:+/, '')
      .replace(/\s+/g, '_')
      .replace(/\(+|\)+/g, '')
      .trim();
  }

  static removerAcento(texto) {
    return texto
      .toLowerCase()
      .replace(/[ÁÀÂÃÄ]/gi, 'a')
      .replace(/[ÉÈÊË]/gi, 'e')
      .replace(/[ÍÌÎÏ]/gi, 'i')
      .replace(/[ÓÒÔÕÖ]/gi, 'o')
      .replace(/[ÚÙÛÜ]/gi, 'u')
      .replace(/[Ç]/gi, 'c');
  }

  static async resgatarNovoToken() {
    const robo = new Robo();
    const data =
      '{\n	"Login":"extratificador_bigdata@impacta.adv.br",\n	"Senha":"extratificador2019"\n}';
    const config = {
      method: 'post',
      url: 'http://172.16.16.3:8083/login/',
      headers: {
        'Content-Type': 'text/plain',
      },
      data: data,
    };
    return axios(options);
  }

  static async enviarFeedback(msg) {
    const robo = new Robo();
    let resposta = await Token.hasValid();
    let token;

    if (resposta.sucesso) {
      token = resposta.token;
    } else {
      resposta = await this.resgatarNovoToken();
      if (resposta.responseBody.Sucesso) {
        await new Token({ token: resposta.responseBody.Token }).save();
      } else {
        console.log('Não foi possivel recuperar o Token');
        process.exit(1);
      }
    }

    return await robo.acessar({
      url: enums.bigdataUrls.resultadoConsulta,
      method: 'POST',
      encoding: '',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      usaProxy: false,
      usaJson: true,
      params: msg,
    });
  }

  static async feedbackDocumentos(msg) {
    const robo = new Robo();
    // let resposta = await Token.hasValid();
    // let token;
    //
    // if (resposta.sucesso) {
    //   token = resposta.token;
    // } else {
    //   resposta = await this.resgatarNovoToken();
    //   if (resposta.responseBody.Sucesso) {
    //     await new Token({ token: resposta.responseBody.Token }).save();
    //   } else {
    //     console.log("Não foi possivel recuperar o Token");
    //     process.exit(1);
    //   }
    // }

    const config = {
      method: 'post',
      url: enums.bigdataUrls.resultadoDocumentos,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': 'tk3TqbruYqJdFdW5fqctsurkNcZi5UHIVWUfiWfM7Xw',
      },
      data: JSON.stringify(msg),
    };

    return axios(config)
      .then(function (response) {
        console.log(JSON.stringify(response.data));
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  static async downloadImage(url, headers) {
    return await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      headers: headers,
    }).then((response) => {
      return Buffer.from(response.data).toString('base64');
    });
  }

  static async downloadAudio(url, headers) {
    return await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      headers: headers,
    }).then((response) => {
      return Buffer.from(response.data).toString('base64');
    });
  }

  static async downloadFiles(url, headers, method = 'GET') {
    return await axios({
      url,
      method: method,
      responseType: 'arraybuffer',
      headers: headers,
    }).then((response) => {
      return Buffer.from(response.data).toString('base64');
    });
  }

  static async quebrarCaptcha(captchaString, tipo) {
    return await new Robo().acessar({
      url: enums.bigdataUrls.captchaDecoder,
      method: 'POST',
      usaProxy: false,
      usaJson: true,
      params: { captcha: captchaString, tipp: tipo },
    });
  }

  /**
   * Ordenar uma por uma propriedade ASC
   * @param {Array} lista Lista de que deseja ordenar
   * @param {string} prop String do nome da propriedade
   * @param {number} sortOrder int indicando a ordem de classificacao
   */
  static ordenar(lista, prop, sortOrder) {
    if (sortOrder == 0) this.ordenarCrescente(lista, prop);
    else if (sortOrder == 1) this.ordenarDecrescente(lista, prop);
    else null;
  }

  /**
   * Ordenar uma por uma propriedade ASC
   * @param {Array} lista Lista de que deseja ordenar
   * @param {string} prop String do nome da propriedade
   */
  static ordenarCrescente(lista, prop) {
    return lista.sort((a, b) => {
      if (a[prop] < b[prop]) {
        return -1;
      }
      if (a[prop] > b[prop]) {
        return 1;
      }
    });
  }

  /**
   * Ordenar uma por uma propriedade DESC
   * @param {Array} lista Lista de que deseja ordenar
   * @param {string} prop String do nome da propriedade
   */
  static ordenarDecrescente(lista, prop) {
    return lista.sort((a, b) => {
      if (a[prop] < b[prop]) {
        return 1;
      }
      if (a[prop] > b[prop]) {
        return -1;
      }
    });
  }

  /**
   * Busca Crecenial de advogado para ser usada no login dos robôs
   * @param {object} find Parametro de busca para o mongoDB
   */
  static async getCredencialAdvogado(find) {
    // const url = 'http://localhost:3338/credencialAdvogado';
    const url = 'http://172.16.16.38:3338/credencialAdvogado';
    return (
      await axios({
        url: `${url}`,
        method: 'GET',
        data: find,
      })
    ).data;
  }

  /**
   * Atualiza credencial após o seu uso pelo robô.
   * @param {object} data Dados a serem atualizados
   * @param {_id} _id id de busca da credencial
   */
  static async updateCredencialAdvogado(data, _id) {
    const url = 'http://172.16.16.38:3338/credencialAdvogado';
    return (
      await axios({
        url: `${url}/modificando`,
        method: 'post',
        data: { options: 'updateOne', data, _id },
      })
    ).data;
  }

  static async geraLoginSenha(find) {
    try {
      
      let senhas = await Helper.getCredencialAdvogado(find);
      console.log(senhas);
      senhas.map(async (x) => {
        if (x.status) {
          // console.log(new Date(x.status.ultimoUso));
          // console.log(new Date(this.subtraiDia(1)));
          if (new Date(x.status.ultimoUso) > new Date(this.subtraiDia(1))) {
            let _id = x._id;
            x.status.errosDoDia = 0;
            // console.log(x.status.errosDoDia);
            await Helper.updateCredencialAdvogado(
              { 'status.errosDoDia': x.status.errosDoDia },
              _id
            );
          }
        }
      });
      await awaitSleep(1000);
      let senhasValidas = senhas
      .filter((x) => {
        try {
          return x.status.errosDoDia == 0;
        } catch (e) {}
      })
      .sort((a, b) => a.utilizado - b.utilizado);
      // process.exit();
      return senhasValidas[0];
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * Busca Variavél no MongoDb para ser usada nas aplicações
   * @param {object} find Parametro de busca para o mongoDB
   */
  static async getVariaveisAmbiente(find) {
    const url = 'http://172.16.16.38:3338/variaveisAmbiente';
    return (
      await axios({
        url: `${url}`,
        method: 'GET',
        data: find,
      })
    ).data;
  }

  /**
   * Atualiza variavel após o seu uso
   * @param {object} data Dados a serem atualizados
   * @param {_id} _id id de busca da credencial
   */
  static async updateVariaveisAmbiente(data, _id) {
    const url = 'http://172.16.16.38:3338/variaveisAmbiente';
    // const url = 'http://localhost:3338/variaveisAmbiente';
    return (
      await axios({
        url: `${url}/m`,
        method: 'post',
        data: { options: 'updateOne', data, _id },
      })
    ).data;
  }

  /**
   * Mantem o Robô parado por 3 dias caso ele atinja a cota máxima de erros estipulada.
   * @param {object} find Nome do robô
   * @param {Boolean} paraRobo Se quiser forçar a parada imediata do robô use true
   */
  static async erroMonitorado(find, paraRobo = false) {
    try {
      let { _id, variaveis, origem } = (
        await Helper.getVariaveisAmbiente(find)
      )[0];

      let {
        date,
        tentativas,
        containerOn,
        tentativasPermitidas,
      } = variaveis[0];

      // Se a ultima vez que o container parou foi a mais de 3 dias ele libera o worker
      if (new Date(date) >= new Date(Helper.subtraiDia(3))) {
        variaveis[0].tentativas = 0;
        variaveis[0].containerOn = true;
        await Helper.updateVariaveisAmbiente({ variaveis: variaveis }, _id);
      }
      // zera os erros dos dia anterior, para tentar novamente hoje. Caso não tenha ultrapassado o limite
      if (new Date(date) >= new Date(Helper.subtraiDia(1))) {
        variaveis[0].tentativas = 0;
        await Helper.updateVariaveisAmbiente({ variaveis: variaveis }, _id);
      }
      // impede o container de continuar rodando.
      if (tentativas >= tentativasPermitidas || paraRobo === true) {
        containerOn = false;
        console.log('aqui');
        variaveis[0].containerOn = containerOn;
        variaveis[0].date = new Date();
        console.log(variaveis);
        await Helper.updateVariaveisAmbiente({ variaveis: variaveis }, _id);
        console.log('passou');
        await axios({
          url: `http://172.16.16.38:3338/dockerStop`,
          method: 'POST',
          data: { servico: origem },
        });
      }
      // Soma 1 ao numero de tentativas
      variaveis[0].tentativas = tentativas + 1;
      // console.log(variaveis);
      await Helper.updateVariaveisAmbiente({ variaveis: variaveis }, _id);

      console.log((await Helper.getVariaveisAmbiente(find))[0]);
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * Gera uma data retroativa apartir de hoje
   * @param {Number} day numero de dias para subtrair
   */
  static subtraiDia(day) {
    let date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() - day);
  }
}

class CnjValidator {
  /**
   * No CNJ NNNNNNN-xx.AAAA.J.TR.OOOO
   * @param NNNNNNN numero sequencial
   * @param AAAA ano
   * @param JTR orgao e tribunal
   * @param OOOO origem (codigo comarca)
   * @returns {string|*}
   */
  static calcula_mod97(NNNNNNN, AAAA, JTR, OOOO) {
    let valor1 = '';
    let resto1 = 0;
    let valor2 = '';
    let resto2 = 0;
    let valor3 = '';
    valor1 = this.preencheZeros(NNNNNNN, 7);
    resto1 = parseInt(valor1) % 97;
    valor2 =
      this.preencheZeros(resto1, 2) +
      this.preencheZeros(AAAA, 4) +
      this.preencheZeros(JTR, 3);
    resto2 = parseInt(valor2) % 97;
    valor3 = this.preencheZeros(resto2, 2) + this.preencheZeros(OOOO, 4) + '00';
    return this.preencheZeros(98 - (parseInt(valor3) % 97), 2);
  }

  static valida_mod97(NNNNNNN, DD, AAAA, JTR, OOOO) {
    let valor1 = '';
    let resto1 = 0;
    let valor2 = '';
    let resto2 = 0;
    let valor3 = '';
    valor1 = this.preencheZeros(NNNNNNN, 7);
    resto1 = parseInt(valor1) % 97;
    valor2 =
      this.preencheZeros(resto1, 2) +
      this.preencheZeros(AAAA, 4) +
      this.preencheZeros(JTR, 3);
    resto2 = parseInt(valor2) % 97;
    valor3 =
      this.preencheZeros(resto2, 2) +
      this.preencheZeros(OOOO, 4) +
      this.preencheZeros(DD, 2);
    return parseInt(valor3) % 97 == 1;
  }

  static preencheZeros(numero, quantidade) {
    let temp = `${numero}`;
    let retorno = '';
    if (quantidade < temp.length) return temp;
    else {
      for (let i = 0; i < quantidade - temp.length; i++)
        retorno = '0' + retorno;
      return retorno + temp;
    }
  }

  static validar(cnj) {
    let sub = cnj.replace('-', '.').split('.');
    let NNNNNNN = sub[0];
    let DD = sub[1];
    let AAAA = sub[2];
    let JTR = sub[3] + sub[4];
    let OOOO = sub[5];

    return this.valida_mod97(NNNNNNN, DD, AAAA, JTR, OOOO);
  }
}

/**
 * @type {Class} Logger
 * @param {string} logLevel
 * @param {string} nomeArquivo
 * @param {object} options
 * @param {string} options.nomeRobo
 * @param {null|string} options.NumeroDoProcesso
 * @param {null|string} options.NumeroOab
 */
class Logger {
  constructor(
    logLevel = 'info',
    nomeArquivo = '',
    { nomeRobo, NumeroDoProcesso, NumeroOab } = {}
  ) {
    this.nomeRobo = nomeRobo;
    this.NumeroProcesso = NumeroDoProcesso;
    this.numeroOab = NumeroOab;
    this.logs = [];
    this.consoleLogger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()],
    });
    this.fileLogger = winston.createLogger({
      level: logLevel,
      format: winston.format.simple(),
      transports: [
        new winston.transports.File({
          filename: nomeArquivo,
        }),
      ],
    });
  }

  /**
   * Faz um print no console
   * @param {string} log mensagem
   */
  info(log) {
    let identificador = this.NumeroProcesso
      ? `CNJ: ${this.NumeroProcesso}`
      : `OAB: ${this.numeroOab}`;
    this.logs.push(`${this.nomeRobo} - ${identificador} - ${log}`);
    return this.consoleLogger.info(
      `${this.nomeRobo} - ${identificador} - ${log}`
    );
  }

  /**
   * Faz um print no console e salva o log em arquivo
   * @param {string} level nivel de importancia do log
   * @param {string} log mensagem
   */
  log(level, log) {
    this.info(log);
    return this.fileLogger.log(level, `[${moment().format()}] ${log}`);
  }
  allLog() {
    return this.logs;
  }
  resetLog() {
    this.logs = [];
  }

  addLog(logs) {
    for (let i = 0; i < logs.length; i++) {
      this.logs.push(logs[i]);
    }
  }
}

class Cnj {
  /**
   * Separa a string do processo com cada uma das suas infomações
   * @param {string} numero String com o numero do processo sem mascara
   * @returns sequencial, dois, ano, tipo, estado, comarca
   */
  static processoSlice(numero) {
    let sequencial = numero.slice(0, 7);
    let dois = numero.slice(7, 9);
    let ano = numero.slice(9, 13);
    let tipo = numero.slice(13, 14);
    let estado = numero.slice(14, 16);
    let comarca = numero.slice(16, 20);

    return { sequencial, dois, ano, tipo, estado, comarca };
  }
  // separa os zeros a serem acrecidos no inicio do numero sequencial
  corrigeSequencial(sequencial) {
    let novoSequencial = sequencial;
    let zero = '';
    for (let i = 0; i < sequencial.length; i++) {
      if (sequencial[i] == '0') {
        novoSequencial = novoSequencial.slice(1, novoSequencial.length);
        zero += '0';
      } else {
        break;
      }
    }
    let seq = novoSequencial;
    return { seq, zero };
  }
  // --------- Funções melhoradas ---------

  /**
   * Cria a mensagem a ser enviada para a fila
   * @param {string} numero
   */
  static criaPostJTE(numero, estado = 'Principal') {
    // sequencial true serve para não atualizar a ultima comarmarca baixada no controle de comarcas.
    if (numero.length != 20) {
      if (numero.substr(0, 1) != 0) {
        numero = numero.replace('0', '');
      } else {
        numero = numero.slice(-20);
      }
    }
    let post = `{"NumeroProcesso" : "${numero}","NovosProcessos" : true, "estado":"${estado}", "sequencial" : true}`;
    return post;
  }
  /**
   * Cria um numero CNJ para consumo.
   * @param {number} ultimoSequencial Ultimo numero sequencial obtido no BigData V2.
   * @param {number} Tribunal Numero que representa o Estado.
   * @param {number} unidadeOrigem Numero da comarca.
   * @returns String com cnj valido.
   */
  static organizaCNJ(ultimoSequencial, Tribunal, unidadeOrigem) {
    // console.log(ultimoSequencial, Tribunal, unidadeOrigem);
    let sequencial = this.completaNumero(ultimoSequencial, 'ultimoSequencial');
    let tribunal = this.completaNumero(Tribunal, 'Tribunal');
    let origem = this.completaNumero(unidadeOrigem, 'unidadeOrigem');
    return `${sequencial}00${new Date().getFullYear()}5${tribunal}${origem}`;
  }

  /**
   * Ajusta o numero para string e completa com zeros para ficar no padrão do numero CNJ
   * @param {number} numero
   * @param {string} tipo
   */
  static completaNumero(numero, tipo) {
    let teste;
    if (tipo == 'unidadeOrigem') {
      teste = 4;
    } else if (tipo == 'Tribunal') {
      teste = 2;
    } else if (tipo == 'ultimoSequencial') {
      teste = 7;
    }
    let resultado = '';
    numero = numero.toString();
    if (numero.length < teste) {
      let zero = teste - numero.length;
      for (let i = 0; i < zero; i++) {
        resultado += '0';
      }
      resultado = resultado + numero;
    } else {
      resultado = numero;
    }
    return resultado;
  }
}

module.exports.Helper = Helper;
module.exports.CnjValidator = CnjValidator;
module.exports.Logger = Logger;
module.exports.Cnj = Cnj;
