require('../bootstrap');
const cheerio = require('cheerio');
const fs = require('fs');
const sleep = require('await-sleep');
const { ExtratorBase } = require('./extratores');
const { Logger } = require('../lib/util');
const { enums } = require('../configs/enums');
const { Robo } = require('../lib/newRobo');
const {
  CredenciaisAdvogados,
} = require('../models/schemas/credenciaisAdvogados');

const estado = 'RS';

class PeticaoTJRS1 extends ExtratorBase {
  constructor() {
    super();
    this.url = 'https://eproc1g.tjrs.jus.br/eproc';
    this.robo = new Robo();
    this.idsUsadas = []
    this.resultados = [];
    this.credenciais = {};
  }

  async extrair(numeroProcesso) {
    let objResponse;
    let hash;
    this.numeroProcesso = numeroProcesso;

    try {
      await this.primeiraConexao();

      objResponse = await this.login()

      objResponse = await this.acessaPaginaConsulta(objResponse.responseBody)

      hash = await this.preConsulta(objResponse.responseBody);

      objResponse = await this.consultarProcesso(hash);

      objResponse = await this.habilitarAndamentosCompletos(objResponse.responseBody);

      processosLinks = await this.recuperarLinkDocumentos(objResponse.responseBody);

      return true;

    } catch (e) {
      console.log(e);
      console.log('deu erro')
    }finally {
      console.log('terminou')
    }
  }

  async primeiraConexao() {
    const options = {
      url: this.url,
      method: 'GET'
    }
    return this.robo.acessar(options)
  }

  /**
   * Acessa o site, tenta fazer login com as credenciais disponiveis no banco
   * @returns {Promise<{Object}>}
   */
  async login() {
    let objResponse
    do {
      this.credenciais = await this.getCredenciais()

      objResponse = await this.fazerLogin(this.credenciais.login, this.credenciais.senha)

      if (this.isLogado(this.credenciais.nome, objResponse.responseBody)) {
        console.log(`Logado como ${this.credenciais.nome}`);
        break;
      }
    } while (true)

    return objResponse;
  }

  async getCredenciais() {
    const credenciais = await CredenciaisAdvogados.getCredenciais(
      estado,
      this.idsUsadas
    );
    this.idsUsadas.push(credenciais._doc._id);

    return credenciais._doc;
  }

  /**
   *
   * @param {string} usuario
   * @param {string} senha
   * @returns {Promise<{Object}>}
   */
  async fazerLogin(usuario, senha) {
    const formData = {
      'txtUsuario': usuario.replace(/\D/g, ''),
      'pwdSenha': senha,
      'hdnAcao': 'login',
      'hdnDebug': '',
    }

    const options = {
      url: `${this.url}/index.php`,
      method: 'POST',
      formData: formData
    }

    return await this.robo.acessar(options);
  }

  isLogado(nome, body) {
    let regex = new RegExp(nome.split(' ')[0], 'gmi')
    return regex.test(body);
  }

  /**
   * Resgata a hash da pagina e acessa a pagina de consulta de processos
   * @param {string} body
   * @returns {Promise<{Object}>}
   */
  async acessaPaginaConsulta(body) {
    let hash = await this.buscarHash(body);

    const options = {
      url: `${this.url}/controlador.php?acao=processo_consultar&acao_origem=consultar&hash=${hash}`,
      method: 'GET'
    }

    return this.robo.acessar(options);

  }

  async buscarHash(body) {
    const $ = cheerio.load(body);
    let selector = '#menu-ul-3 > li > a';

    let link = $(selector)[0].attribs.href;

    return link.match(/hash=(\w+)\W?/)[1]
  }

  /**
   * Faz um acesso ao endpoint para pegar o hash mutavel da consulta do processo
   * @param {string} body
   * @returns {Promise<string>}
   */
  async preConsulta(body) {
    let hash = this.buscarFormHash(body); // TODO criar essa funcao
    let objResponse;

    const formData = {
      hdnInfraTipoPagina:'1',
      txtCaptcha: '',
      acao_origem: 'consultar',
      acao_retorno:'',
      acao: 'processo_consultar',
      tipoPesquisa: 'NU',
      numNrProcesso: this.numeroProcesso,
      selIdClasseSelecionados: '',
      strChave: ''
    }

    const options = {
      url: `${this.url}/controlador_ajax.php?acao_ajax=processos_consulta_por_numprocesso&hash=${hash}`,
      method: 'POST',
      formData: formData
    }

    objResponse = await this.robo.acessar(options);

    return this.resgataNovoHash(objResponse.responseBody);
  }

  buscarFormHash(body) {
    const selector = '#divNumNrProcesso';
    const $ = cheerio.load(body);

    let link = $(selector)[0].attribs['data-acaoassinada']

    return link.match(/hash=(\w+)\W?/)[1];
  }

  async resgataNovoHash(body) {
    let context = body.resultados[0].linkProcessoAssinado

    return context.match(/hash=(\w+)\W?/)[1]
  }

  /**
   * Faz a consulta do processo no site
   * @param {string} hash
   * @returns {Promise<{Object}>}
   */
  async consultarProcesso(hash) {
    let queryString = {
      acao: 'processo_selecionar',
      acao_origem: 'processo_consultar',
      acao_retorno: 'processo_consultar',
      num_processo: this.numeroProcesso.replace(/\D/g, ''),
      hash: hash
    }

    const options = {
      url: `${this.url}/controlador.php`,
      method: 'GET',
      queryString: queryString
    }

    return this.robo.acessar(options);
  }

  async habilitarAndamentosCompletos(body) {
    const $ = cheerio.load(body);
    let link = $('#fldAcoes > center > a')[0].attribs.href;
    let hash = link.match(/hash=(\w+)\W?/)[1];

    const options = {
      url: `${this.url}/controlador.php`,
      queryString:{
        acao: "processo_vista_sem_procuracao",
        txtNumProcesso: this.numeroProcesso.replace(/\D/g, ''),
        hash: hash
      }
    }

    return await this.robo.acessar(options);
  }

  async recuperarLinkDocumentos(body) {
    const $ = cheerio.load(body);
    const selector = '#trEvento1 > td:nth-child(5) > a';
    let nodes = $(selector);
    let links = [];

    nodes.map((index, node) => {
      links.push($(node)[0].attribs.href);
    })

    return links;
  }
}

module.exports.PeticaoTJRS1 = PeticaoTJRS1;