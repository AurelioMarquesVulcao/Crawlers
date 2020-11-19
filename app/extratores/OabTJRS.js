let cheerio = require('cheerio');
const { antiCaptchaImage } = require('../lib/captchaHandler');
const { Robo } = require('../lib/newRobo');
const { LogExecucao } = require('../lib/logExecucao');
const { Logger } = require('../lib/util');

const { Processo } = require('../models/schemas/processo');
const { ExtratorBase } = require('./extratores');

module.exports.OabTJRS = class OabTJRS extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    // this.dataSiteKey = '6LcX22AUAAAAABvrd9PDOqsE2Rlj0h3AijenXoft';
    this.robo = new Robo();
    this.resultados = [];
  }

  async extrair(numeroOab, cadastroConsultaId, instancia = 1) {
    this.logger = new Logger('info', `logs/OabTJRS/OabTJRSInfo.log`, {
      nomeRobo: 'oab.TJRS',
      NumeroOab: numeroOab,
    });
    this.numeroOab = numeroOab.replace(/[A-Z]/g, '');
    this.ufOab = numeroOab.replace(/[0-9]/g, '');
    this.resposta = {};
    this.cadastroConsulta = {
      SeccionalOab: 'RS',
      TipoConsulta: 'processo',
      NumeroOab: numeroOab,
      Instancia: instancia,
      NomeRobo: 'TJRS',
      _id: cadastroConsultaId,
    };

    try {
      let objResponse;
      let captchaString;
      let nProcessos;
      let captchaResposta;

      this.logger.info('Fazendo primeiro acesso');
      await this.fazerPrimeiroAcesso();

      this.logger.info('Pegando imagem de captcha');
      captchaString = await this.pegaCaptcha();

      this.logger.info('Resolvendo captcha');
      captchaResposta = await this.resolveCaptcha(captchaString);

      this.logger.info('Validando captcha');
      console.time('tempoCaptcha');
      objResponse = await this.validaCaptcha(captchaResposta);
      console.timeEnd('tempoCaptcha');

      this.logger.info('Iniciando tratamento de processos');
      nProcessos = await this.tratarProcessos(objResponse.responseBody);

      if (nProcessos) {

        this.logger.info(
          `Processos a serem enviados para fila: ${nProcessos.length}`
        );

        // nProcessos = ["0226688-20.2014.8.21.7000", "0523312-55.2011.8.21.7000"]
        this.logger.info('Enfileirando processos');
        this.resultados = await this.enfileirarProcessos(nProcessos);

        this.logger.info('Retornando');
      } else {
        this.logger.info('Não foi encontrado nenhum processo para a OAB');
        this.resultados = 0;
      }

      this.resposta = {
        sucesso: true,
        nProcessos: this.resultados,
      };
    } catch (e) {
      console.log(e);
      this.logger.info(e);
      this.resposta = { sucesso: false, detalhes: e.message };
    } finally {
      return {
        resultado: this.resultado,
        sucesso: true,
        detalhes: '',
        logs: this.logger.logs,
      };
    }
  }

  async fazerPrimeiroAcesso() {
    await this.robo.acessar({ url: this.url });
    return this.robo.acessar({
      url: 'https://www.tjrs.jus.br/novo/busca/?return=proc&client=wp_index',
    });
  }

  async pegaCaptcha() {
    let objResponse;
    let expire = new Date();
    let time = new Date().getTime();
    expire.setTime(time + 365 * 3600000 * 24);
    let url = `https://www.tjrs.jus.br/site_php/consulta/human_check/humancheck_showcode.php?${time}`;

    objResponse = await this.robo.acessar({ url, responseType: 'arraybuffer' });
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

  async tratarProcessos(body) {
    let processos;
    let $ = cheerio.load(body);
    let texto = $('#conteudo > table:nth-child(6) > tbody').text();

    processos = texto.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/gm);

    return processos;
  }

  async enfileirarProcessos(processos) {
    // let processosObj = processos.map(p => ({cnj: p}));
    let cadastroConsulta = this.cadastroConsulta;
    let resultados = [];

    let existentes = await Processo.find({
      'detalhes.numeroProcessoMascara': { $in: processos },
    });
    existentes = existentes.map((e) => e.detalhes.numeroProcessoMascara);

    const fila = 'processo.TJRS.extracao.novos';
    for (let p of processos) {
      cadastroConsulta['NumeroProcesso'] = p;

      if (existentes.indexOf(p) === -1) {
        let logExec = await LogExecucao.cadastrarConsultaPendente(
          cadastroConsulta,
          fila
        );

        if (logExec.enviado && logExec.sucesso) {
          this.logger.info(`Processo: ${p} ==> ${fila}`);
          resultados.push(p);
        }
      }
    }

    return resultados;
  }
};
