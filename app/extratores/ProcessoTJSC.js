const cheerio = require('cheerio');
const { CaptchaHandler } = require('../lib/captchaHandler');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');
const { Logger } = require('../lib/util');
const { Robo } = require('../lib/newRobo');
const { ExtratorBase } = require('./extratores');
const { TJSCParser } = require('../parsers/TJSCParser');

const proxy = true;

class ProcessoTJSC extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new TJSCParser();
    this.robo = new Robo();
    this.dataSiteKey = '6LfzsTMUAAAAAOj49QyP0k-jzSkGmhFVlTtmPTGL';
    this.logger = null;
    this.resposta = {
      sucesso: false,
      resultado: null,
      detalhes: null,
      logs: null
    }
  }

  async extrair(numeroProcesso, numeroOab) {
    const nomeRobo = 'ProcessoTJSC';
    this.numeroOab = numeroOab;
    this.numeroProcesso = numeroProcesso;
    this.detalhes = Processo.identificarDetalhes(numeroProcesso);

    this.logger = new Logger('info', `logs/TJSC/${nomeRobo}.log`, {
      nomeRobo: nomeRobo,
      NumeroDoProcesso: this.numeroProcesso
    });

    let tentativas = 0;
    const limite = 5;

    try {

      await this.fazerPrimeiroAcesso();
      let uuidCaptcha = await this.consultarUuid();

      do {
        let captchaString = await this.resolveCaptcha();
        let objResponse = await this.consultarProcesso(uuidCaptcha, captchaString);
        let avaliacao = await this.avaliaPagina(objResponse.responseBody);

        if (!avaliacao.sucesso && avaliacao.causa === 'Erro de acesso') {
          this.logger.info(paginaReturn.detalhes);
          tentativa++;
          continue;
        }

        this.logger.info('Pagina capturada com sucesso');
        this.logger.info('Iniciando processo de extração');
        let extracao = await this.parser.parse(objResponse.responseBody);

        this.logger.info('Processo de extração concluido');
        this.logger.info(`Andamentos recuperados: ${extracao.andamentos.length}`);

        let resultado = await this.salvarProcessos(extracao.processo, extracao.andamentos);

        this.resposta = {
          sucesso: true,
          resultado: resultado,
          detalhes: '',
        }

        break;
      } while(tentativas <= limite)

      if (tentativas === limite){
        throw new Error('Não foi possivel recuperar o processo com 5 tentativas');
      }
    } catch (e) {
      console.log(e)
      this.logger.log('error', `${e}`);
      this.resposta.sucesso = false;
      this.resposta.detalhes = e.message;
    }
    finally {
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

  async consultarProcesso(uuidCaptcha, gResponse) {
    this.logger.info('Fazendo consulta a pagina do processo.')
    let url = `${this.url}/search.do`;
    let regex = /(\d+)-(\d{2}).(\d{4}).(\d).(\d{2}).(\d{4})/

    let queryString = {
      conversationId:"",
      cbPesquisa: "NUMPROC",
      numeroDigitoAnoUnificado: this.numeroProcesso.replace(regex, "$1-$2.$3"),
      foroNumeroUnificado: this.numeroProcesso.replace(regex, '$6'),
      "dadosConsulta.valorConsultaNuUnificado": this.numeroProcesso,
      "dadosConsulta.valorConsulta":"",
      "dadosConsulta.tipoNuProcesso": "UNIFICADO",
      uuidCaptcha: uuidCaptcha,
      "g-recaptcha-response": gResponse
    }

    return await this.robo.acessar({
      url,
      method:'GET',
      proxy,
      encoding: 'utf8',
      queryString
    });
  }

  async avaliaPagina(body) {
    const $ = cheerio.load(body);
    const mensagemRetornoSelector = '#mensagemRetorno';
    let mensagemRetornoText = $(mensagemRetornoSelector).text();
    const tableMovimentacoesSelector = '#tabelaTodasMovimentacoes';
    const senhaProcessoSelector = '#senhaProcesso';

    const regexErroInfo = /Não\sexistem\sinformações\sdisponíveis\spara\sos\sparâmetros\sinformados/;

    if (regexErroInfo.test(mensagemRetornoText)){
      this.logger.info('Não existem informações disponíveis para o processo informado');
      throw new Error('Processo não encontrado');
    }

    if ($(senhaProcessoSelector).length && $(tableMovimentacoesSelector).length === 0){
      this.logger.info('Se for uma parte ou interessado, digite a senha do processo');
      throw new Error('Senha necessaria');
    }

    if($(tableMovimentacoesSelector).length === 0)
      return {
        sucesso: false,
        causa: 'Erro de acesso',
        detalhes: 'Não foi encontrada a tabela de movimentações'
      }

    return {sucesso: true}
  }

  async salvarProcessos(processo, andamentos) {
    this.logger.info('Iniciando salvamento de andamentos');
    await Andamento.salvarAndamentos(andamentos);
    this.logger.info('Andamentos salvos');

    this.logger.info('Iniciando salvamento do processo');
    let resultado = await processo.salvar();
    this.logger.info(`Processo: ${this.numeroProcesso} | Andamentos: ${andamentos.length}`);

    return resultado;
  }
}

module.exports.ProcessoTJSC = ProcessoTJSC;