const { Helper } = require('../lib/util');
const { antiCaptchaImage } = require('../lib/captchaHandler');
const re = require('xregexp');
const { Robo } = require('../lib/newRobo');

const {
  BaseException,
  RequestException,
  ExtracaoException,
  AntiCaptchaResponseException,
} = require('../models/exception/exception');

const { ExtratorBase } = require('./extratores');
const { TJRSParser } = require('../parsers/TJRSParser');

const saveFileSync = (path, arquivo, encoding) => {
  try {
    if (arquivo) {
      require('fs').writeFileSync(path, arquivo, encoding);
    } else {
      console.log('O arquivo não está vindo');
    }
  } catch (error) {
    Helper.pred(error);
  }
};

module.exports.OabTJRS = class OabTJRS extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new TJRSParser();
    // this.dataSiteKey = '6LcX22AUAAAAABvrd9PDOqsE2Rlj0h3AijenXoft';
    this.robo = new Robo();
  }

  async resolverCaptchaAudio(oab, url, cookies) {
    cookies = cookies.replace(/\spath\=\/\;?/g, '');
    let audio;

    const imagemResponse = await axios({
      method: 'get',
      url: `https://www.tjrs.jus.br/site_php/consulta/human_check/humancheck_showcode.php?${new Date(
        '2020-07-06'
      ).getTime()}`,
      headers: {
        Cookie: cookies,
      },
      responseType: 'arraybuffer',
    });

    const somResponse = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      headers: {
        Cookie: cookies.replace(/path\=\//),
      },
    });

    // const resQuebrarCaptcha = await this.robo.acessar({
    //   // url: `http://172.16.16.8:5000/api/solve`,
    //   url: `http://localhost:5000/api/solve`,
    //   method: "post",
    //   encoding: "utf8",
    //   usaProxy: false,
    //   usaJson: true,
    //   params: captcha
    // });

    audio = Buffer.from(somResponse.data).toString('base64');

    console.log(url);
    console.log();
    console.log(`Cookie: ${cookies}`);
    console.log();
    console.log(audio);

    // let audio = Buffer.from(captchaResponse.data)
    //   .toString('base64');

    // let audio2 = Buffer.from(fs.readFileSync('./assets/captcha/audiofile.wav')).toString('base64');

    // console.log(audio2);

    // Helper.pred('----');

    //     console.log('0 - GET', url, `cookie: ${cookies}`);
    //     console.log(1, audio.toString('base64'));
    //     fs.writeFileSync(`./assets/captcha/1.audio.captcha.${oab}.wav`, audio);
    //     // Helper.pred('teste123');

    //     // console.log('1', captchaResponse.data);
    //     // console.log('2', audio.toString('base64'));

    saveFileSync(`./assets/captcha/audio.captcha.${oab}.wav`, audio, 'base64');

    const captcha = {
      audio,
    };

    console.log(2, captcha);

    // const resQuebrarCaptcha = await this.robo.acessar({
    //   // url: `http://172.16.16.8:5000/api/solve`,
    //   url: `http://localhost:5000/api/solve`,
    //   method: "post",
    //   encoding: "utf8",
    //   usaProxy: false,
    //   usaJson: true,
    //   params: captcha
    // });

    const resQuebrarCaptcha = await axios({
      // url: `http://172.16.16.8:5000/api/solve`,
      url: `http://localhost:5000/api/solve`,
      method: 'POST',
      encoding: 'utf8',
      data: captcha,
    });

    console.log(3, resQuebrarCaptcha.data);
    // Helper.pred('---');

    //     // return resQuebrarCaptcha.responseBody;

    return {
      texto: '0542',
      sucesso: true,
    };
  }

  extrairLinkCaptcha(content) {
    let url;
    let $ = cheerio.load(content);

    if (
      $(
        '#humancheck > table > tbody > tr:nth-child(1) > td > span > a:nth-child(2)'
      ).length > 0
    ) {
      url = `https://www.tjrs.jus.br/site_php/consulta/${$(
        '#humancheck > table > tbody > tr:nth-child(1) > td > span > a:nth-child(2)'
      ).attr('href')}`;
    }

    return url;
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

      objResponse = await this.fazerPrimeiroAcesso();

      captchaString = await this.pegaCaptcha();

      captchaResposta = await this.resolveCaptcha(captchaString);

      await this.validaCaptcha(captchaString);

      objResponse = await this.acessarProcessos(captchaResposta);

      nProcessos = await this.tratarProcessos(objResponse);

      await this.enfileirarProcessos(nProcessos);

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
    return this.robo.acessar({ url: this.url });
  }

  async pegaCaptcha() {
    let objRespose;
    let url = `https://www.tjrs.jus.br/site_php/consulta/human_check/humancheck_showcode.php?${new Date().getTime()}`;

    return await Helper.downloadImage(
      `https://www.tjrs.jus.br/site_php/consulta/human_check/humancheck_showcode.php?${new Date().getTime()}`,
      this.robo.headers
    );
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
    const url = 'https://www.tjrs.jus.br/site_php/consulta/verifica_codigo_novo.php';
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

    return await this.robo.acessar({url, queryString});
  }

  async acessarProcessos(captcha) {

  }

  async tratarProcessos(body) {}

  async enfileirarProcessos(processos) {}
};
