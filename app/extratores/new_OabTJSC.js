const cheerio = require('cheerio');
const { enums } = require('../configs/enums');
const { CaptchaHandler } = require('../lib/captchaHandler');
const { Processo } = require('../models/schemas/processo');
const { Logger } = require('../lib/util');
const { Robo } = require('../lib/newRobo');
const { ExtratorBase } = require('./extratores');
const { LogExecucao } = require('../lib/logExecucao');
// const { INSTANCIAS_URLS } = require('../assets/TJSC/instancias_urls.json')

const proxy = true;

class OabTJSC extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.dataSiteKey = '6LfzsTMUAAAAAOj49QyP0k-jzSkGmhFVlTtmPTGL';
    this.logger = null;
    this.robo = new Robo();
  }

  async extrair(numeroOab, cadastroConsultaId, instancia = 1) {
    let tentativas = 1;
    let limite = 5;
    this.numeroOab = numeroOab;
    this.instancia = Number(instancia);
    this.cadastroConsulta = {
      SeccionalOab: 'SC',
      TipoConsulta: 'processo',
      NumeroOab: numeroOab,
      Instancia: instancia,
      _id: cadastroConsultaId
    }

    const nomeRobo = `${enums.tipoConsulta.Oab}${enums.nomesRobos.TJSC}`;

    this.logger = new Logger('info', `logs/TJSC/${nomeRobo}.info`, {
      nomeRobo: nomeRobo,
      NumeroOab: numeroOab,
      NumeroDoProcesso: null
    });

    // IT START WITH... ONE THING I DONT KNOW WHY AND DOESNT EVEN MATTER HOW HARD I TRY
    try {
      await this.fazerPrimeiroAcesso();
      let uuidCaptcha = await this.consultarUuid();

      do {
        let captchaString = await this.resolveCaptcha();
        let listaProcessos = await this.recuperarListaProcessos(uuidCaptcha, captchaString);

        if(!listaProcessos.sucesso){
          tentativas++;
          continue;
        }

        let listaProcessosTratada = await this.tratarListaProcessos(listaProcessos.processos);
        await this.enviarProcessos(listaProcessosTratada);

        break;
      } while(tentativas !== limite)

      if (tentativas === limite)
        throw new Error('Foi excedido as tentativas para esta oab')
    } catch (e) {
      console.log(e);
      this.logger.log('error', `${e}`);
      this.resposta.sucesso = false;
      this.resposta.detalhes = e.message;
    } finally {
      this.resposta.logs = this.logger.logs;
      return this.resposta;
    }

  }

  async fazerPrimeiroAcesso() {
    this.logger.info('Fazendo primeira conexão.');

    let url = `${this.url}/open.do`;

    let objResponse = await this.robo.acessar({
      url: url,
      method: 'GET',
      proxy: proxy
    });

    let regexErroBanco = /Erro\sao\sestabelecer\suma\sconexão\scom\so\sbanco\sde\sdados/;

    if (regexErroBanco.test(objResponse.responseBody)) {
      console.log('===============Pagina com erro com o banco===============');
      process.exit(0);
    }

    if (objResponse.status === 500) {
      console.log('===============Pagina com status 500===============');
      process.exit(0);
    }

    return objResponse;
  }

  async consultarUuid() {
    this.logger.info(`Recuperando UUID`);
    let objResponse;

    objResponse = await this.robo.acessar({
      url: `${this.url}/captchaControleAcesso.do`,
      method: 'POST',
      encoding: 'utf8',
      proxy: proxy
    })

    return objResponse.responseBody.uuidCaptcha;
  }

  async resolveCaptcha() {
    this.logger.info('Tentando resolver captcha');
    const ch = new CaptchaHandler(5, 10000, 'ProcessoTJSC', {numeroDoProcesso: this.numeroProcesso});

    let captcha = await ch.resolveRecaptchaV2(`${this.url}/open.do`, this.dataSiteKey, '/');

    if (!captcha.sucesso)
      throw new Error('Falha ao tentar resolver captcha');

    return captcha.gResponse;
  }

  async recuperarListaProcessos(uuidCaptcha, gResponse) {
    this.logger.info('Fazendo consulta na pagina de oabs');
    let processos = [];
    let url = `${this.url}/search.do?conversationId=&cbPesquisa=NUMOAB&dadosConsulta.valorConsulta=${this.numeroOab}&dadosConsulta.localPesquisa.cdLocal=-1&uuidCaptcha=${uuidCaptcha}&g-recaptcha-response=${gResponse}`;

    this.logger.info('Acessando a lista de processos');

    do {

      let objResponse = await this.robo.acessar({
        url,
        method: 'GET',
        encoding: 'latin1',
        proxy
      });

      let avaliacao = this.avaliaAcesso(objResponse.responseBody);

      if(!avaliacao.sucesso) return {sucesso: false}

      let pagina = this.processaPaginaProcessos(objResponse.responseBody);

      processos = [...processos, ...pagina.processos];

      if (!pagina.proximaPagina)
        break;

      url = `https://esaj.tjsc.jus.br${ pagina.proximaPagina.attr('href') }`;

    } while (true)

    return { sucesso: true, processos };
  }

  avaliaAcesso(body) {
    const $ = cheerio.load(body);
    const mensagemRetorno = $('#mensagemRetorno').text()
    const regexErroInfo = /Não\sexistem\sinformações\sdisponíveis\spara\sos\sparâmetros\sinformados/;

    if ($('#recaptcha-anchor-label').length){
      return {sucesso: false, detalhes: 'Captcha não solucionado'}
    }

    if(regexErroInfo.test(mensagemRetorno)){
      this.logger.info('Não existem informações disponíveis para os parâmetros informados.');
      throw new Error('Oab não encontrada');
    }

    return {sucesso: true}

  }

  processaPaginaProcessos(body) {
    const $ = cheerio.load(body)

    let numeroProcessos = this.extrairNumeros($)
    let proximaPagina = $('[title|="Pŕoxima página"]');
    proximaPagina = (proximaPagina.length) ? proximaPagina.first() : false;

    return {processos: numeroProcessos, proximaPagina};
  }

  extrairNumeros($) {
    const rawProcessos = $('a.linkProcesso');
    const listaNumeros = [];

    rawProcessos.each((index, element) => {
      let numero = $(element).text();
      listaNumeros.push(numero.trim());
    });

    return listaNumeros;
  }

  async tratarListaProcessos(listaProcessos) {
    if (listaProcessos.length) {
      this.logger.info(`Foram recuperados ${listaProcessos.length}`);
      this.logger.info('Enviando processos para fila de extração');

      let processosNoBanco = [];

      processosNoBanco = await Processo.listarProcessos(2);
      listaProcessos = listaProcessos.filter(e => !processosNoBanco.includes(e))
      return listaProcessos;
    }
  }

  async enviarProcessos(listaProcessos) {
    const tam = listaProcessos.length;
    let resultados = [];

    for(let i =0; i < tam; i++) {
      let cadastroConsulta = this.cadastroConsulta;
      cadastroConsulta['NumeroProcesso'] = listaProcessos[i];
      let logExec = await LogExecucao.cadastrarConsultaPendente(cadastroConsulta, 'processo.TJSC.extracao.novos');
      if (logExec.enviado) {
        this.logger.info(`${listaProcessos[i]} => processo.TJSC.extracao.novos`);
        resultados.push({ numeroProcesso: listaProcessos[i] });
      } else {
        this.logger.info(`${listaProcessos[i]} não enviado. Msg.: ${logExec.mensagem}`);
      }
    }

    this.logger.info(`${resultados.length} Processos enviados para a extração`);
    this.resposta = {
      resultado: resultados,
      sucesso: true,
      detalhes: ''
    }
  }
}

module.exports = {
  OabTJSC
}