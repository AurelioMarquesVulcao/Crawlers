let cheerio = require('cheerio');
const { antiCaptchaImage } = require('../lib/captchaHandler');
const { LogExecucao } = require('../lib/logExecucao');
const { TJRSParser } = require('../parsers/TJRSParser');
const { Robo } = require('../lib/newRobo');
const { ExtratorBase } = require('./extratores');

module.exports.ProcessoTJRS = class ProcessoTJRS extends ExtratorBase {

  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new TJRSParser();
    this.robo = new Robo();
    // this.dataSiteKey = '6LcX22AUAAAAABvrd9PDOqsE2Rlj0h3AijenXoft';
  }

  async extrair(numeroOab, numeroProcesso, cadastroConsultaId, instancia = 1) {
    this.resposta = {};
    this.numeroProcesso = numeroProcesso;
    this.numeroOab = numeroOab.replace(/[A-Z]/g, '');
    this.ufOab = numeroOab.replace(/[0-9]/g, '');

    try {
      let objResponse;
      let captchaString;
      let captchaResposta;
      let processoOriginarioLink = false;
      let extracao;

      console.log('Fazendo primeiro acesso');
      await this.fazerPrimeiroAcesso();

      captchaString = await this.pegaCaptcha();

      captchaResposta = await this.resolveCaptcha(captchaString);

      objResponse = await this.validaCaptcha(captchaResposta);

      processoOriginarioLink = await this.verificaProcessoOriginario(objResponse.responseBody);

      extracao = await this.converterProcesso(objResponse.responseBody); //entra na pagina inicial do processo, e nas 2 outras paginas de todas partes e todos andamentos

      if (processoOriginarioLink)
        extracao = await this.resgatarProcessoOriginario(processoOriginarioLink);

      return Promise.all([extracao]).then(extracao => extracao);
    }
     catch (e) {
    }
  };

  async fazerPrimeiroAcesso() {
    const url = "https://www.tjrs.jus.br/novo/busca/?return=proc&client=wp_index";
    await this.robo.acessar({url: this.url});
    return this.robo.acessar({url});
  }

  async pegaCaptcha() {
    let objResponse;
    let expire = new Date();
    let time = new Date().getTime();
    expire.setTime(time + 365 * 3600000 * 24)
    let url = `https://www.tjrs.jus.br/site_php/consulta/human_check/humancheck_showcode.php?${time}`;

    objResponse = await this.robo.acessar({url, responseType: 'arraybuffer'})
    return Buffer.from(objResponse.responseBody).toString('base64');
  }

  async resolveCaptcha(captchaString) {
    let resposta;
    let tentativa = 0;
    do {
      tentativa++;
      resposta = await antiCaptchaImage(captchaString);

      if (resposta.sucesso) return resposta.resposta;

      captchaString = await this.pegaCaptcha();
    } while(tentativa < 5)
  }

  async validaCaptcha(captcha) {
    const url =
      'https://www.tjrs.jus.br/site_php/consulta/verifica_codigo_novo.php';

    let queryString = {
      nome_comarca:"Tribunal+de+Justi%E7a",
      versao:"",
      versao_fonetica:1,
      tipo:1,
      id_comarca:700,
      intervalo_movimentacao:0,
      N1_var2:1,
      id_comarca1:700,
      num_processo_mask:this.numeroProcesso,
      num_processo:this.numeroProcesso.replace(/\D/g, ''),
      numCNJ:"S",
      id_comarca2:700,
      uf_oab:this.ufOab,
      num_oab:"",
      foro:0,
      N1_var2_1:1,
      intervalo_movimentacao_1:15,
      ordem_consulta:1,
      N1_var:"",
      id_comarca3:"todas",
      nome_parte:"",
      N1_var2_2:1,
      intervalo_movimentacao_2:0,
      code:captcha,
    }

    return await this.robo.acessar({url, queryString});
  }

  async verificaProcessoOriginario(body) {
    const $ = cheerio.load(body);

    let linkOriginario = $('#conteudo > table:nth-child(2) > tbody > tr:nth-child(2) > td:nth-child(5) > a');

    let processoOriginario = linkOriginario ? linkOriginario[0].attribs.href : false

    return processoOriginario;
  }

  async converterProcesso(body) {
    let movimentacoes;
    let movimentacoesLink;
    let partes;
    let partesLink;
    let capa = body;

    const $ = cheerio.load(body);

    partesLink = $('#conteudo > table:nth-child(6) > tbody > tr > td.texto_geral > a')[0].attribs.href;
    movimentacoesLink = $('#conteudo > table:nth-child(9) > tbody > tr > td.texto_geral > a')[0].attribs.href;

    partes = await this.extrairPartes(partesLink);
    movimentacoes = await this.extrairMovimentacoes(movimentacoesLink);

    return Promise.resolve([capa, partes, movimentacoes]);

  }

  async extrairPartes(link) {
    let objResponse;
    let url = `https://www.tjrs.jus.br/site_php/consulta/${link}`;
    console.log('Extraindo partes')
    objResponse = await this.robo.acessar({url: url});
    return objResponse.responseBody;
  }

  async extrairMovimentacoes(link) {
    let objResponse;
    let url = `https://www.tjrs.jus.br/site_php/consulta/${link}`;
    console.log('Extraindo movimentações')
    objResponse = await this.robo.acessar({url: url});
    return objResponse.responseBody;
  }

  async resgatarProcessoOriginario(link) {
    let objResponse;
    let url = `https://www.tjrs.jus.br/site_php/consulta/${link}`

    objResponse = await this.robo.acessar({url});
    console.log('aaaaaaaa');
    return this.converterProcesso(objResponse.responseBody);
  }
}