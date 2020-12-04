const cheerio = require('cheerio');
const { CaptchaHandler } = require('../lib/captchaHandler');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');
const { Logger } = require('../lib/util');
const { Robo } = require('../lib/newRobo');
// const { GerenciadorFila } = require('../lib/filaHandler');

const {
  AntiCaptchaResponseException,
} = require('../models/exception/exception');
const { ExtratorBase } = require('./extratores');
const { TJSPParser } = require('../parsers/TJSPParser');

const INSTANCIAS_URLS = require('../assets/TJSP/instancias_urls.json')
  .INSTANCIAS_URL;

class ProcessoTJSP extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new TJSPParser();
    this.robo = new Robo();
    this.dataSiteKey = '6LcX22AUAAAAABvrd9PDOqsE2Rlj0h3AijenXoft';
    this.logger = null;
    this.numeroProcesso = '';
  }


  async extrair(numeroProcesso, numeroOab, instancia){
    const nomeRobo = 'ProcessoTJSP';
    let tentativa = 1;
    let limite = 2;
    let gResponse;
    let paginaReturn;
    let objResponse;
    
    this.numeroOab = numeroOab;
    this.numeroProcesso = numeroProcesso;
    this.detalhes = Processo.identificarDetalhes(numeroProcesso);
    this.instancia = Number(instancia);
    this.setInstanciaUrl();
    this.resposta = {numeroDoProcesso: this.numeroProcesso}

    this.logger = new Logger('info', `logs/${nomeRobo}/${nomeRobo}Info.log`, {
      nomeRobo: 'processo.TJSP',
      NumeroDoProcesso: numeroProcesso,
    });

    try {

      this.logger.info('Realizando primeira conexao');
      await this.realizaPrimeiraConexao();

      this.logger.info('Entrando na pagina de consulta');
      objResponse = await this.acessarPaginaConsulta();

      this.logger.info('Consultando UUID do site');
      let uuidCaptcha = await this.consultarUUID();
      this.logger.info('Preparando para resolver captcha');
      do {
        this.logger.info(`Tentativa de resolução ${tentativa}`);
        
        this.logger.info('Tentando resolver captcha');
        gResponse = await this.resolveCaptcha();
        this.logger.info('Retornada resposta da API');

        this.logger.info('Tentando acessar pagina do processo');
        objResponse = await this.acessandoPaginaProcesso(uuidCaptcha, gResponse);

        this.logger.info('Verificando presença de erros');
        paginaReturn = this.avaliaPagina(objResponse.responseBody);

        if (!paginaReturn.sucesso && paginaReturn.causa === 'Não encontrado'){
          this.logger.info(paginaReturn.detalhes);
          throw new Error(paginaReturn.causa)
        }

        if (!paginaReturn.sucesso && paginaReturn.causa === 'Senha necessaria') {
          this.logger.info(paginaReturn.detalhes);
          throw new Error(paginaReturn.causa);
        }

        if (!paginaReturn.sucesso && paginaReturn.causa === 'Erro de acesso') {
          this.logger.info(paginaReturn.detalhes);
          tentativa++;
          continue;
        }

        this.logger.info('Pagina capturada com sucesso');
        this.logger.info('Iniciando processo de extração');
        extracao = await this.parser.parse(objResponse.responseBody, this.instancia);

        this.logger.info('Processo de extração concluido');
        this.logger.info(`Andamentos recuperados: ${extracao.andamentos.length}`);

        this.logger.info('Iniciando salvamento de andamento');
        await Andamento.salvarAndamentos(extracao.andamentos);
        this.logger.info('Andamentos salvos');

        this.logger.info('Iniciando salvamento do processo');
        resultado = await extracao.processo.salvar();
        this.logger.info(`Processo: ${this.numeroProcesso} | Andamentos: ${extracao.andamentos.length}`);

        this.resposta = {
          sucesso: true,
          resultado: resultado,
          detalhes: '',
          logs: this.logger.logs
        }
      } while(tentativa < limite)

      throw new Error('Não foi possivel recuperar o processo com 5 tentativas');

    } catch(e) {
      this.resposta = {
        sucesso: false,
        resultado: '',
        detalhes: e.message,
        logs: this.logger.logs
      }
    } finally {
      return this.resposta;
    }
  }


  async realizaPrimeiraConexao() {
    this.robo.setHeader({
      Host: 'esaj.tjsp.jus.br',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-User': '?1',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'navigate',
      Referer: `${this.url}/esaj/portal.do`,
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    })

    return await this.robo.acessar({
      url: `${this.url}/open.do`,
      method: 'GET',
      proxy: true
    });
  }

  async acessarPaginaConsulta() {
    let url = `${
      this.url
    }/search.do?conversationId=&paginaConsulta=0&cbPesquisa=NUMPROC&numeroDigitoAnoUnificado=${this.detalhes.numeroProcessoMascara.slice(
      0,
      15
    )}&foroNumeroUnificado=${this.detalhes.origem}&dePesquisaNuUnificado=${
      this.detalhes.numeroProcessoMascara
    }&dePesquisaNuUnificado=UNIFICADO&dePesquisa=&tipoNuProcesso=UNIFICADO`;

    return await this.robo.acessar({
      url: url,
      method: 'GET',
      proxy: true
    });
  }

  async consultarUUID() {
    let objResponse;

    objResponse = await this.robo.acessar({
      url: `${this.url}/captchaControleAcesso.do`,
      method: 'POST',
      proxy: true,
    });

    return objResponse.responseBody.uuidCaptcha;
  }

  async resolveCaptcha() {
    const ch = new CaptchaHandler(5, 10000, 'ProcessoTJSP', {numeroDoProcesso: this.numeroProcesso});

    let captcha = await ch.resolveRecaptchaV2(`${this.url}/open.do`, this.dataSiteKey, '/').catch(err => {throw err})

    if (!captcha.sucesso) {
      throw new AntiCaptchaResponseException('Falha na resposta', 'Não foi possivel recuperar a resposta para o captcha');
    }
    
    return captcha.gResponse;
  }

  async acessandoPaginaProcesso (uuidCaptcha, gResponse) {
    let url = `${this.url}/search.do`
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
      url: url,
      method: 'GET',
      proxy: true,
      encoding: 'utf8',
      queryString
    });
  }

  avaliaPagina (body) {
    const $ = cheerio.load(body);
    const mensagemRetornoSelector = '#mensagemRetorno';
    let mensagemRetornoText = $(mensagemRetornoSelector).text();
    const tabelaMovimentacoesSelector = '#tabelaTodasMovimentacoes';
    const senhaProcessoSelector = '#senhaProcesso';

    if (/Não\sexistem\sinformações\sdisponíveis\spara\sos\sparâmetros\sinformados/.test(mensagemRetornoText)) {
      return {sucesso: false, causa: 'Não encontrado', detalhes: 'Não existem informações disponíveis para o processo informado.'}
    }

    if ($(senhaProcessoSelector).length) {
      return {sucesso: false, causa: 'Senha necessaria', detalhes: 'Se for uma parte ou interessado, digite a senha do processo'}
    }

    if ($(tabelaMovimentacoesSelector).length === 0) {
      return {sucesso: false, causa: 'Erro de acesso', detalhes: 'Não foi encontrada a tabela de movimentações'}
    }

    return {sucesso: true}
  }
  //===================== Funções secundarias =====================
  setInstanciaUrl() {
    // this.url = INSTANCIAS_URLS[this.instancia - 1];
    this.url = "http://esaj.tjsp.jus.br/cpopg"

  }
}

module.exports.ProcessoTJSP = ProcessoTJSP;