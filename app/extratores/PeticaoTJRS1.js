require('../bootstrap');
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

  async extrair() {
    let objResponse;
    let hash;

    try {
      await this.primeiraConexao();

      objResponse = await this.login()

      objResponse = await this.acessaPaginaConsulta(objResponse.responseBody)

      hash = await this.preConsulta();

      objResponse = await this.consultarProcesso(hash);

    } catch (e) {
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

  async login() {
    let objResponse
    do {
      this.credenciais = await this.getCredenciais()

      objResponse = await this.fazerLogin(this.credenciais.login, this.credenciais.senha)

      if (this.isLogado(this.credenciais.nome, objResponse.responseBody)) {
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
    this.idsUsadas.push(credenciais.id);

    return credenciais;
  }

  /**
   *
   * @param {string} usuario
   * @param {string} senha
   * @returns {Promise<{Object}>}
   */
  async fazerLogin(usuario, senha) {
    const formData = {
      txtUsuario: usuario,
      pwdSenha: senha,
      hdnAcao: 'login',
      hdhDebug: ''
    }

    const options = {
      url: `${this.url}/index.php`,
      method: 'POST',
      formData: formData
    }

    return this.robo.acessar(options);
  }

  isLogado(nome, body) {
    let regex = new RegExp(nome.split(',')[0], 'gmi')
    return regex.test(body);
  }

  async acessaPaginaConsulta(body) {
    let hash = await this.buscarHash(body);

    const options = {
      url: `${this.url}/controlador.php?acao=processo_consultar&acao_origem=consultar&hash=${hash}`
      method: 'GET'
    }

    return this.robo.acessar(options);

  }

  async buscarHash(body) {
    const $ = cheerio.load(body);
    let selector = '#menu-ul-3 > li > a';

    let link = $(selector).attr.href;

    return link.match(/hash=(\w+)\W?/)
  }

  async preConsulta(body) {
    let hash = this.buscarFormHash(body);
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
      url: `${this.url}/controlador_ajax.php?acao_ajax=processos_consulta_por_numprocesso&hash=${hash}`
      method: 'POST',
      formData: formData
    }

    objResponse = await this.robo.acessar(options);

    return this.resgataNovoHash(objResponse.responseBody);
  }

  async resgataNovoHash(body) {
    let context = JSON.stringify(body);

    return context.match(/hash=(\w+)\W?/)
  }

  async consultarProcesso(hash) {
    let queryString = {
      acao: 'processo_selecionar',
      acao_origem: 'processo_consultar',
      acao_retorno: 'processo_consultar',
      num_processo: this.numeroProcesso,
      hash: hash
    }

    const options = {
      url: `${this.url}/controlador.php`,
      method: 'GET',
      queryString: queryString
    }

    return this.robo.acessar(options);
  }
}