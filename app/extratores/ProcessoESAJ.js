const cheerio = require('cheerio');
const { CaptchaHandler } = require('../lib/captchaHandler');
const { Logger } = require('../lib/util');
const { BaseParser } = require('../parsers/BaseParser');
const { Robo } = require('../lib/newRobo');

const proxy = true;

class ProcessoESAJ extends BaseParser {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = null;
    this.robo = new Robo();
    this.resposta = {};
  }

  async extrair(numeroProcesso, numeroOab, instancia = 1, mensagem) {
    this.numeroProcesso = numeroProcesso;
    this.mensagem = mensagem;

    this.resposta = { numeroProcesso: this.numeroProcesso };

    this.setLogger();
    let uuidCaptcha;

    try {
      let objResponse;
      let tentativa = 1;
      let limite = 5;
      let gResponse;
      let paginaReturn;
      let resultado;
      let extracao;

      await this.fazerPrimeiroAcesso();

      objResponse = await this.acessarPaginaConsulta();

      uuidCaptcha = await this.consultarUUID();

      this.logger.info('Preparando para resolver captcha');
      do {
        this.logger.info(`Tentativa de acesso [${tentativa}]`);

        gResponse = await this.resolverCaptcha();

        objResponse = await this.acessandoPaginaProcesso(
          uuidCaptcha,
          gResponse
        );

        paginaReturn = this.avaliaPagina(objResponse.responseBody);

        if (!paginaReturn.sucesso) {
          tentativa++;
          continue;
        }

        extracao = await this.parser.parse(objResponse.responseBody);
        break;
      } while (tentativa === limite);
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

  setLogger(tribunal) {
    this.logger = new Logger('info', `logs/${tribunal}/processo.js`, {
      nomeRobo: `Processo${tribunal}`,
      NumeroDoProcesso: numeroProcesso,
      NumeroOab: null,
    });
  }

  async fazerPrimeiroAcesso() {
    this.logger.info('Fazendo primeiro acesso');
    let options = { url: `${this.url}/open.do`, method: 'GET', proxy: true };

    return await this.robo.acessar(options);
  }

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

  async consultarUUID() {
    this.logger.info('Consultando UUID do site');
    let objResponse;

    let options = {
      url: `${this.url}/captchaControleAcesso.do`,
      method: 'POST',
      proxy: true,
    };

    objResponse = await this.robo.acessar(options);

    return objResponse.responseBody.uuidCaptcha;
  }

  /**
   * Recebe o captcha e o resolve, retorna string com o catpcha resolvido
   * @returns {Promise<String>}
   */
  async resolverCaptcha() {
    const ch = new CaptchaHandler(5, 10000, 'ProcessoTJMS', {
      numeroDoProcesso: this.detalhes.numeroProcessoMascara,
      numeroDaOab: null,
    });

    this.logger.info('Tentando resolver captcha');
    /**
     *
     * @type {{gResponse: string, body: {}, sucesso: boolean, detalhes: []} | void}
     */
    let captcha = await ch
      .resolveRecaptchaV2(`${this.url}/open.do`, this.dataSiteKey, '/')
      .catch((err) => {
        throw err;
      });

    if (!captcha.sucesso) {
      throw new Error(
        'Falha na resposta. Não foi possivel recuperar a resposta para o captcha'
      );
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
        'g-recaptcha-response': gResponse,
      },
      proxy: proxy,
      encoding: 'utf8',
    };

    return await this.robo.acessar(options);
  }

  avaliaPagina(body) {
    this.logger.info('Avaliando a pagina para detectar presença de erros');

    const $ = cheerio.load(body);
    const mensagemRetornoSelector = '#mensagemRetorno'; //TODO checar selector
    let mensagemRetornoText = $(mensagemRetornoSelector).text();
    const tabelaMovimentacoesSelector = '#tabelaTodasMovimentacoes'; //TODO checar selector
    const senhaProcessoSelector = '#senhaProcesso'; //TODO checar selector

    if (
      /Não\sexistem\sinformações\sdisponíveis\spara\sos\sparâmetros\sinformados/.test(
        mensagemRetornoText
      )
    ) {
      this.logger.info(
        'Não existem informações disponíveis para o processo informado.'
      );
      throw new Error('Não encontrados');
    }

    if (
      $(senhaProcessoSelector).length &&
      $(tabelaMovimentacoesSelector).length === 0
    ) {
      this.logger.info(
        'Se for uma parte ou interessado, digite a senha do processo'
      );
      throw new Error('Senha necessaria');
    }

    if ($(tabelaMovimentacoesSelector).length === 0) {
      this.logger.info('Não foi encontrada a tabela de movimentação');
      return {
        sucesso: false,
        causa: 'Erro de acesso',
        detalhes: 'Não foi encontrada a tabela de movimentações',
      };
    }

    this.logger.info('Não foram encontrados erros');
    return { sucesso: true };
  }
}

class ProcessoTJMS extends ProcessoESAJ {
  constructor() {
    super('https://esaj.tjms.jus.br/cpopg', false);
  }

  async setLogger() {
    super.setLogger('TJMS');
  }
}

module.exports = {
  ProcessoTJMS,
};
