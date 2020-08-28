const cheerio = require('cheerio');
const { Andamento } = require('../models/schemas/andamento');
const { Logger } = require('../lib/util');

const {
  BaseException,
  RequestException,
  ExtracaoException,
} = require('../models/exception/exception');
const { ExtratorBase } = require('./extratores');
const { TJBAPortalParser } = require('../parsers/TJBAPortalParser');
const enums = require('../configs/enums').enums;
const sleep = require('await-sleep');

/**
 * Logger para console e arquivo
 */
let logger;

class OabTJBAPortal extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new TJBAPortalParser();
    this.numeroOab = '';
  }

  async extrair(numeroOab) {
    let listaProcessos = [];
    try {
      this.numeroOab = numeroOab;
      this.logger = new Logger(
        'info',
        'logs/OabTJBAPortal/OabTJBAPortalInfo.log',
        {
          nomeRobo: enums.nomesRobos.TJBAPortal,
          NumeroOab:numeroOab,
        }
      );
      this.resposta = {sucesso: true, detalhes: ''};
      let resultados = [];
      this.logger.info('Fazendo primeira conexão ao website');
      let tentativa = 0;
      let objResponse;
      do {
        tentativa++;
        this.logger.info(`Fazendo tentativa ${tentativa} de conexão.`);
        objResponse = await this.robo.acessar({
          url: `${this.url}`,
          method: 'POST',
          encoding: 'latin1',
          usaProxy: true,
          usaJson: false,
          params: {
            tipo: 'NUMOAB',
            funcao: 'funcOAB',
            processo: numeroOab + 'BA',
            'g-recaptcha-response': '',
          },
        });
        if (objResponse.status && objResponse.status === 200) {
          break;
        }
        if (tentativa === 3) {
          this.logger.log('error', 'Tentativa de conexão inicial com o website resultou em erro');
          this.logger.info('Finalizando robo por erro de conexão com o site');
          process.exit(0);
        }
        await sleep(15000);
      }while(true);
      this.logger.info('Conexão ao website concluida.');
      this.logger.info('Recuperando codigo de busca');
      let $ = cheerio.load(objResponse.responseBody);
      let codigoBusca = $.html().match(/var busca\s*=\s*'(.*)';/)[1];
      codigoBusca = codigoBusca.trim();
      this.logger.info('Codigo de busca recuperado');
      let cookies = objResponse.cookies;
      this.logger.info('Fazendo request de captura de processos');
      let paginaMax = 1;
      let paginaAtual = 0;
      let falhas = 0;
      do {
        if (falhas == 0) {
          paginaAtual++;
        }
        objResponse = await this.robo.acessar({
          url: `https://www.tjba.jus.br/consulta-processual/api/v1/carregar/oab/${codigoBusca}/${paginaAtual}/semCaptcha`,
          method: 'GET',
          encoding: 'latin1',
          usaProxy: true, //proxy
          usaJson: false,
          headers: { cookies: cookies },
        });
        if (objResponse.responseBody.lstProcessos) {
          listaProcessos = [...listaProcessos, ...objResponse.responseBody.lstProcessos];
          if (objResponse.responseBody.numPaginaTotal > paginaMax)
            paginaMax = objResponse.responseBody.numPaginaTotal;
          this.logger.info(`Recolhido processos. [Pagina ${paginaAtual} de ${paginaMax}]`);
          falhas = 0;
        } else {
          this.logger.info('Nova tentativa de acessar a pagina atual');
          falhas++;
        }

        await sleep(200);
        if (falhas > 3) {
          this.logger.info('Tentativas de acesso excederam limite');
          this.logger.info('Salvando processos já capturados');
          break;
        }
      } while(paginaAtual < paginaMax)

      this.logger.info('Request de captura de processos concluido.');
      this.logger.info('Iniciando processamento da lista de processos');
      if (listaProcessos.length === 0) {
        throw new ExtracaoException('Lista de processos vazia', 'Não foi possivel recuperar a lista de processos (l.72)');
      }
      this.logger.info(`${listaProcessos.length} processo(s) encontrado(s).`);
      resultados = listaProcessos.map(async (element) => {
        let extracao = new TJBAPortalParser().parse(element);
        let processo = extracao.processo;
        let andamentos = extracao.andamentos;
        await Andamento.salvarAndamentos(andamentos);
        let resultado = await processo.salvar();
        this.logger.info(
          `Processo: ${
            processo.toObject().detalhes.numeroProcesso
          } salvo | Quantidade de andamentos: ${andamentos.length}`
        );
        return resultado;
      });

      this.resposta.resultado = await Promise.all(resultados).then((args) => {
        this.logger.info('Processos extraidos com sucesso');
        return args;
      });
      this.resposta.logs = this.logger.logs;
    } catch (e) {
      this.logger.log('error', e);
      this.resposta.sucesso = false;
      if (e instanceof RequestException) {
        this.resposta.detalhes = `RequestExceptoion: ${e}`;
      } else if (e instanceof BaseException) {
        this.resposta.detalhes = `BaseException: ${e}`;
      } else if (e instanceof ExtracaoException) {
        if (/ERRO_CAPTCHA/.test(e.code)) {
          //refaz tentativas de captcha (deixar aqui mas portal tjba n usa captcha por enquanto)
          this.resposta.detalhes = `ExtracaoException: ${e}`;
        } else {
          this.resposta.detalhes = `BaseException: ${e}`;
        }
      } else {
        if (/ESOCKETTIMEDOUT|ETIMEDOUT|EBUSY|ECONNRESET|ENOPROTOOPT/.test(e.code)) {
          this.resposta.detalhes = `RequestExceptoion: ${e}`;
        } else {
          this.resposta.detalhes = `Exception: ${e}`;;
        }
      }
    } finally {
      this.resposta.logs = this.logger.logs;
      // console.table(this.resposta);
      return this.resposta;
    }
  }
}
module.exports.OabTJBAPortal = OabTJBAPortal;
