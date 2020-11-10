const { Helper } = require('../lib/util');
const { antiCaptchaImage } = require('../lib/captchaHandler');
let cheerio = require('cheerio');
const re = require('xregexp');
const { Robo } = require('../lib/newRobo');

const { ExtratorBase } = require('./extratores');
const { TJRSParser } = require('../parsers/TJRSParser');

module.exports.OabTJRS = class OabTJRS extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new TJRSParser();
    // this.dataSiteKey = '6LcX22AUAAAAABvrd9PDOqsE2Rlj0h3AijenXoft';
    this.robo = new Robo();
  }

  async extrair(numeroOab) {
    this.numeroOab = numeroOab.replace(/[A-Z]/g, '');
    this.ufOab = numeroOab.replace(/[0-9]/g, '');
    this.resposta;

    try {
      let objResponse;
      let captchaString;
      let nProcessos;
      let captchaResposta;

      console.log('Fazendo primeiro acesso');
      await this.fazerPrimeiroAcesso();

      console.log('Pegando imagem de captcha');
      captchaString = await this.pegaCaptcha();

      console.log('Resolvendo captcha');
      captchaResposta = await this.resolveCaptcha(captchaString);

      console.log('Validando captcha');
      objResponse = await this.validaCaptcha(captchaResposta);

      console.log('Iniciando tratamento de processos');
      nProcessos = await this.tratarProcessos(objResponse.responseBody);

      console.log('Enfileirando processos');
      await this.enfileirarProcessos(nProcessos);

      console.log('Retornando');
      this.resposta = {
        sucesso: true,
        nProcessos: nProcessos,
      };
    } catch (e) {
      this.resposta = { sucesso: false, detalhes: e.message };
    } finally {
      return this.resposta;
    }
  }

  async fazerPrimeiroAcesso() {
    await this.robo.acessar({ url: this.url });
    return this.robo.acessar({url: "https://www.tjrs.jus.br/novo/busca/?return=proc&client=wp_index"})
  }

  async pegaCaptcha() {
    let objResponse;
    let expire = new Date();
    let time = new Date().getTime();
    expire.setTime(time + 365 * 3600000 * 24)
    let url = `https://www.tjrs.jus.br/site_php/consulta/human_check/humancheck_showcode.php?${time}`;

    objResponse = await this.robo.acessar({url, responseType: 'arraybuffer'});
    return Buffer.from(objResponse.responseBody).toString('base64');

    // return await Helper.downloadImage(
    //   url,
    //   this.robo.headers
    // );
  }

  async resolveCaptcha(captchaString) {
    let resposta;
    let tentativa = 0;
    do {
      tentativa++;
      resposta = await antiCaptchaImage(captchaString);

      if (resposta.sucesso) return resposta.resposta;

      captchaString = await this.pegaCaptcha();
    } while (tentativa < 5);
  }

  async validaCaptcha(captcha) {
    const url =
      'https://www.tjrs.jus.br/site_php/consulta/verifica_codigo_novo.php';
    let queryString = {
      nome_comarca: 'Tribunal+de+Justi%E7a',
      versao: '',
      versao_fonetica: 1,
      tipo: 2,
      id_comarca: 700,
      intervalo_movimentacao: 0,
      N1_var2: 1,
      id_comarca1: 700,
      num_processo_mask: '',
      num_processo: '',
      numCNJ: 'N',
      id_comarca2: 700,
      uf_oab: this.ufOab,
      num_oab: this.numeroOab,
      foro: 0,
      N1_var2_1: 1,
      intervalo_movimentacao_1: 0,
      ordem_consulta: 1,
      N1_var: '',
      id_comarca3: 'todas',
      nome_parte: '',
      N1_var2_2: 1,
      intervalo_movimentacao_2: 0,
      code: captcha,
    };

    return this.robo.acessar({ url, queryString });
  }

  async acessarProcessos() {
    const url = 'https://www.tjrs.jus.br/site_php/consulta/consulta_oab.php';
    let queryString = {
      nome_comarca: 'Tribunal+de+Justi%E7a',
      versao: '',
      versao_fonetica: 1,
      tipo: 2,
      id_coma1rca: 700,
      intervalo_movimentacao: 0,
      N1_var2: 1,
      id_comarca1: 700,
      num_processo_mask: '',
      num_processo: '',
      numCNJ: 'N',
      id_comarca2: 700,
      uf_oab: this.ufOab,
      num_oab: this.numeroOab,
      foro: 0,
      N1_var2_1: 1,
      intervalo_movimentacao_1: 0,
      ordem_consulta: 1,
      N1_var: '',
      id_comarca3: 'todas',
      nome_parte: '',
      N1_var2_2: 1,
      intervalo_movimentacao_2: 0,
    };

    return await this.robo.acessar({ url, queryString });
  }

  async tratarProcessos(body) {
    let processos = [];
    let $ = cheerio.load(body);
    let texto = $('#conteudo > table:nth-child(6) > tbody').text();

    processos = texto.match(/\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}/gm)

    return processos
  }

  async enfileirarProcessos(processos) {}
};
