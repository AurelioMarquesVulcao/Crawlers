let cheerio = require('cheerio');
const async = require('async');
const { antiCaptchaImage } = require('../lib/captchaHandler');
const { Robo } = require('../lib/newRobo');
const { LogExecucao } = require('../lib/logExecucao');
const { ExecucaoConsulta } = require("../models/schemas/execucao_consulta");
const { Logger } = require('../lib/util');

const { ExtratorBase } = require('./extratores');

module.exports.OabTJRS = class OabTJRS extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    // this.dataSiteKey = '6LcX22AUAAAAABvrd9PDOqsE2Rlj0h3AijenXoft';
    this.robo = new Robo();
    this.resultado = [];
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
      objResponse = await this.validaCaptcha(captchaResposta);

      this.logger.info('Iniciando tratamento de processos');
      nProcessos = await this.tratarProcessos(objResponse.responseBody);

      this.logger.info('Processos a serem enviados para fila:', nProcessos.length)

      // nProcessos = ["0226688-20.2014.8.21.7000", "0523312-55.2011.8.21.7000"]
      this.logger.info('Enfileirando processos');
      this.resultado = await this.enfileirarProcessos(nProcessos);

      this.logger.info('Retornando');
      this.resposta = {
        sucesso: true,
        nProcessos: this.resultado,
      };

    } catch (e) {
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

    let consultasCadastradas = await ExecucaoConsulta.find(
      {
        'Mensagem.NumeroProcesso': {$in: processos},
        'Mensagem.Instancia': 1,
        DataTermino: null,
      },
      {},
      {
        limit: 1,
        sort: {
          'Mensagem.NumeroProcesso': -1,
        },
      },
    );

    consultasCadastradas = consultasCadastradas.filter(e => processos.indexOf(e.Mensagem.NumeroProcesso) === -1);

    console.log({processos: consultasCadastradas.length})

    // resultados = await async.mapLimit(processos, 30, async p => {
    //   cadastroConsulta['NumeroProcesso'] = p;
    //
    //   let logExec = await LogExecucao.cadastrarConsultaPendente(
    //     cadastroConsulta
    //   );
    //
    //   if (logExec.enviado) resultados.push(p);
    // }

    for(let p of processos){
      cadastroConsulta['NumeroProcesso'] = p;

      let logExec = await LogExecucao.cadastrarConsultaPendente(
        cadastroConsulta,
        'processo.TJRS.extracao.novos',
      )

      if (logExec.enviado) resultados.push(p);
    }

    return resultados;
  }
};
