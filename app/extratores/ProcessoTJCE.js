const sleep = require('await-sleep');
const cheerio = require('cheerio');
const { TJCEParser } = require('../parsers/TJCEParser');
const { CaptchaHandler } = require('../lib/captchaHandler');
const { Logger } = require('../lib/util');
const { Processo } = require('../models/schemas/processo');
const { Robo } = require('../lib/newRobo');

const proxy = false;

class ProcessoTJCE {
  constructor() {
    this.robo = new Robo();
    this.url = 'http://esaj.tjce.jus.br/cpopg/';
    this.parser = new TJCEParser();
    this.dataSiteKey = '6LeME0QUAAAAAPy7yj7hh7kKDLjuIc6P1Vs96wW3'
  }

  async extrair(numeroProcesso, msg = null) {
    this.numeroProcesso = numeroProcesso;
    this.message = msg;
    this.detalhes = Processo.identificarDetalhes(numeroProcesso);
    this.detalhes = Processo.formatarDetalhes(this.detalhes);
    this.logger = new Logger('info', 'logs/TJRS/processo.log', {
      nomeRobo: 'processoTJCE',
      NumeroDoProcesso: this.detalhes.numeroProcessoMascara,
    });
    this.resposta = {};

    this.resposta = {
      numeroProcesso: this.detalhes.numeroProcessoMascara,
    };

    try {
      let objResponse;
      let tentativa = 1;
      let primeiroAcesso;
      let limite = 5;
      let gResponse;
      let paginaReturn
      let resultado;

      primeiroAcesso = await this.fazerPrimeiroAcesso();

      if (!primeiroAcesso.sucesso) {
        this.logger.log(
          'error',
          'Não foi possivel realizar a primeira conexão'
        );
        this.logger.info('Desligando robo para preservar fila');
        process.exit(0);
      }

      objResponse = await this.acessarPaginaConsulta();

      let uuidCaptcha = await this.consultarUUID();

      this.logger.info('Preparando para resolver captcha');
      do {
        this.logger.info(`Tentativa de acesso [${tentativa}]`);

        gResponse = await this.resolverCaptcha();

        objResponse = await this.acessandoPaginaProcesso(uuidCaptcha, gResponse);

        paginaReturn = this.avaliaPagina(objResponse.responseBody)

        if (!paginaReturn.sucesso) {
          tentativa ++
          continue;
        }

        resultado = await this.parser.parse(objResponse.responseBody);
        break;

      } while(tentativa <= limite)

      if (tentativa === limite)
        throw new Error('Limite de tentativas excedidos');

      this.logger.info('Processo de extração concluído.');
      this.logger.info('Iniciando salvamento de Andamento');
      await Andamento.salvarAndamentos(extracao.andamentos);
      this.logger.info('Andamentos salvos');

      this.logger.info('Iniciando salvamento do Processo');
      resultado = await extracao.processo.salvar();
      this.logger.info(
        `Processo: ${extracao.processo.detalhes.numeroProcessoMascara} salvo | Quantidade de andamentos: ${extracao.andamentos.length}`
      );

      this.resposta.resultado = resultado;
      this.resposta.sucesso = true;
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

  /**
   * Faz tentativas de acessar a pagina do site
   * @returns {Promise<{sucesso: boolean}>}
   */
  async fazerPrimeiroAcesso() {
    this.logger.info('Fazendo primeiro acesso');
    let primeiroAcessoWait = 10000;
    let tentativa = 1;
    let primeiroAcessoTentativas = 5;
    let objResponse;

    do {
      this.logger.info(
        `Tentando realizar a primeira conexão. [Tentativa: ${tentativa}]`
      );
      objResponse = await this.realizaPrimeiraConexao().catch((err) => err);
      console.log({ tentativa, status: objResponse.status });
      if (objResponse.status === 200) {
        return { sucesso: true };
      }

      this.logger.info(`Falha ao tentar conectar no site.`);
      tentativa++;
      await sleep(primeiroAcessoWait);
    } while (tentativa <= primeiroAcessoTentativas);

    return { sucesso: false };
  }

  /**
   * Faz a primeira conexão
   * @returns {Promise<{Object}>}
   */
  async realizaPrimeiraConexao() {
    this.robo.setHeader({
      Host: 'esaj.tjce.jus.br',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-User': '?1',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'navigate',
      Referer: `${this.url}/open.do`,
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    })

    return await this.robo.acessar({
      url: `${this.url}/open.do`,
      method: 'GET',
      proxy: true
    });
  }

  /**
   * Acessa a pagina de consulta
   * @returns {Promise<{Object}>}
   */
  async acessarPaginaConsulta() {
    this.logger.info('Entrando na pagina de consulta');

    let options = {
      url: `${this.url}/search.do`,
      method: 'GET',
      queryString: {
        conversationId: '',
        'dadosConsulta.localPesquisa.cdLocal': '-1',
        cbPesquisa: 'NUMPROC',
        'dadosConsulta.tipoNuProcesso': 'UNIFICADO',
        numeroDigitoAnoUnificado: this.detalhes.numeroProcessoMascara.slice(
          0,
          15
        ),
        foroNumeroUnificado: this.detalhes.origem,
        'dadosConsulta.valorConsultaNuUnificado': this.detalhes
          .numeroProcessoMascara,
        'dadosConsulta.valorConsulta': '',
      },
      proxy: true,
    };

    return this.robo.acessar(options);
  }

  /**
   * faz o request para adquirir o uuid
   * @returns {Promise<void>}
   */
  async consultarUUID() {
    this.logger.info('Consultando UUID do site');
    let objResponse;

    objResponse = await this.robo.acessar({
      url: `${this.url}/captchaControleAcesso.do`,
      method: 'POST',
      proxy: true
    })

    return objResponse.responseBody.uuidCaptcha;
  }

  /**
   * Recebe o captcha e o resolve, retorna string com o catpcha resolvido
   * @returns {Promise<String>}
   */
  async resolverCaptcha() {
    const ch = new CaptchaHandler(5, 10000, 'ProcessoTJCE', {numeroDoProcesso: this.detalhes.numeroProcessoMascara});

    this.logger.info('Tentando resolver captcha');
    let captcha = await ch.resolveRecaptchaV2(`${this.url}/open.do`, this.dataSiteKey, '/')
      .catch(err => {throw err})

    if(!captcha.sucesso) {
      throw new Error('Falha na resposta. Não foi possivel recuperar a resposta para o captcha');
    }

    this.logger.info('Retornada resposta da API');
    return captcha.gResponse;
  }

  /**
   * Recebe o uuid e a resposta do captcha e realiza a consulta do processo
   * @param uuid
   * @param gResponse
   * @returns {Promise<{Object}>}
   */
  async acessandoPaginaProcesso(uuid, gResponse) {
    this.logger.info('Tentando acessar pagina do processo');

    let options = {
      url: `${this.url}/search.do`,
      method: 'GET',
      queryString: {
        conversationId: '',
        'dadosConsulta.localPesquisa.cdLocal': '-1',
        cbPesquisa: 'NUMPROC',
        'dadosConsulta.tipoNuProcesso': 'UNIFICADO',
        numeroDigitoAnoUnificado: this.detalhes.numeroProcessoMascara.slice(
          0,
          15
        ),
        foroNumeroUnificado: this.detalhes.origem,
        'dadosConsulta.valorConsultaNuUnificado': this.detalhes
          .numeroProcessoMascara,
        'dadosConsulta.valorConsulta': '',
        uuidCaptcha: uuid,
        "g-recaptcha-response": gResponse
      },
      proxy: proxy,
      encoding: 'utf8'
    };

    return await this.robo.acessar(options);
  }

  /**
   *
   * @param body
   * @returns {{causa: string, sucesso: boolean, detalhes: string}|{sucesso: boolean}}
   */
  avaliaPagina(body) {
    this.logger.info('Avaliando a pagina para detectar presença de erros');

    const $ = cheerio.load(body);
    const mensagemRetornoSelector = '#mensagemRetorno'; //TODO checar selector
    let mensagemRetornoText = $(mensagemRetornoSelector).text();
    const tabelaMovimentacoesSelector = '#tabelaTodasMovimentacoes'; //TODO checar selector
    const senhaProcessoSelector = '#senhaProcesso'; //TODO checar selector

    if (/Não\sexistem\sinformações\sdisponíveis\spara\sos\sparâmetros\sinformados/.test(mensagemRetornoText)) {
      this.logger.info('Não existem informações disponíveis para o processo informado.');
      throw new Error('Não encontrados')
    }

    if ($(senhaProcessoSelector).length && $(tabelaMovimentacoesSelector).length === 0) {
      this.logger.info('Se for uma parte ou interessado, digite a senha do processo')
      throw new Error('Senha necessária')
    }

    if ($(tabelaMovimentacoesSelector).length === 0) {
      this.logger.info('Não foi encontrada a tabela de movimentação');
      return {sucesso: false, causa: 'Erro de acesso', detalhes: 'Não foi encontrada a tabela de movimentações'}
    }

    this.logger.info('Não foram encontrados erros');
    return {sucesso: true}
  }
}

module.exports.ProcessoTJCE = ProcessoTJCE;