const moment = require('moment');
const Tribunal = require('../../models/schemas/tribunal');
const GerenciadorFila = require('../../lib/filaHandler');
const { Processo } = require("../../models/schemas/processo");
const { Andamento } = require("../../models/schemas/andamento");
const { Helper, CnjValidator } = require('../../lib/util');

const context = {
  LogConsultaId: '5e5d7b8b09219b50a2edae31',
  NumeroDoProcesso: null,
  NumeroOab: 54768,
  Tribunal: 'TJBA',
  DataEnfileiramento: '2020-03-02T18:32:59.417685',
};

class Tradutor {

  /**
   * Monta a capa do processo.
   * @param {JSON} processo JSON do processo original para montar a capa nova.
   * @param {JSON} ultimoAndamento JSON do primeiro andamento adicionado a lista de andamentos.
   */
  montarCapa(processo, ultimoAndamento) {
    const capa = processo.capa;    
    const envolvidos = processo.envolvidos.map((envolvido)=> {
      
      const tipo = /advogado/i.test(envolvido.tipo) ? true : false;
      let oabs = [];

      if (tipo) {
        const oabMatch = envolvido.nome.match(/\((?<numero>\d+)(?<tipo>\w{0,1})(?<secc>\w{2})\)/);
        if (oabMatch) {
          oabs = [
            {
              Inscricao: oabMatch[1],
              TipoInscricao: oabMatch[2],
              Seccional:  oabMatch[3]
            }
          ]
        }
      }


      return {
        Nome: envolvido.nome,
        Cnpj: '',
        Cpf: '',
        Chave: envolvido.tipo.toLowerCase(),
        Telefones: [],
        Oabs: oabs,
        IsAdvogado: tipo
      }
    });

    return {
      Envolvidos: envolvidos,
      Assuntos: capa.assunto,
      Situacao: 'ativo',
      Classe: capa.classe,      
      Comarca: capa.comarca,
      Metadados: {},
      JusticaGratuita: false,
      SegredoDeJustica: false,
      ValorDaCausa: 0,
      Instancia: processo.detalhes.instancia,
      DataDistribuicao: this.verificarDataDistribuicao(ultimoAndamento)
    };
  }

  /**
   * Monta dos detalhes da numeracao do processo.
   * @param {string} numeroMascara Numero do proocesso com mascara 
   */
  montarDetalhes(numeroMascara) {
    const cnj = numeroMascara.split(/[-.]/);
    return {
      isValido: CnjValidator.validar(numeroMascara),
      NumeroSequencial: parseInt(cnj[0]),
      Ano: parseInt(cnj[2]),
      Tribunal: parseInt(cnj[4]),
      OrgaoJustica: parseInt(cnj[3]),
      UnidadeOrigem: parseInt(cnj[5]),
      DigitoVerificador: parseInt(cnj[1]),
    };
  }

  /**
   * Verifica a data de distribuicao pelo primeiro andamento da lista de andamentos.
   * @param {JSON} ultimoAndamento JSON do primeiro andamento adicionado a lista de andamentos.
   */
  verificarDataDistribuicao(ultimoAndamento) {
    return /distribui(do|cao)/i.test(ultimoAndamento.descricao) ? ultimoAndamento.data : '';
  }

  /**
   * Traduz um objeto de processo salvo na base intermediaria para um objeto de processo que o bigdata compreenda.
   * @param {JSON} processo Objeto json corresponde do processo a ser traduzido.
   * @param {Array} andamentos Lista de andamentos a ser processado.
   */
  traduzirProcesso(processo, ultimoAndamento) {
    return {
      NumeroCNJ: processo.detalhes.numeroProcesso,
      Capa: this.montarCapa(processo, ultimoAndamento),
      CnjDetalhes: this.montarDetalhes(processo.detalhes.numeroProcessoMascara)
    };
  }

  /**
   * Traduz uma lista de andamentos salvas na base intermediaria para o objeto que o bigdata compreenda.
   * @param {Array} andamentos Lista de andamentos
   */
  traduzirAndamentos(andamentos) {
    const listaAndamentosNovos = [];
    for (let i = 0, si = andamentos.length; i < si; i++) {
      const andamento = andamentos[i];
      listaAndamentosNovos.push({
        Data: andamento.data,
        Conteudo: andamento.descricao,
        Documentos: [],
        ChavePrimariaTribunal: '',
        Observacao: andamento.obs ? andamento.obs : ''
      });
     }
    return listaAndamentosNovos;
  }
};

class ProcessoController {
  
  static async enfileirar(req, res) {
    try {
      // TODO descomentar
      // const context = req.body;

      const tribunal = await new Tribunal().find({ _id: context.tribunalId });

      if (!tribunal) throw new Error('Tribunal não encontrado');

      if (!context.NumeroOab) throw new Error('Campo NumeroOab vazio');

      let fila = `${tribunal.sigla}.extracao`;

      const data = moment().isDST() ? moment.utc() : moment();

      GerenciadorFila.enviar(fila, {});
    } catch (e) {
      console.log(e.stack);
      res.status(500).send('Um erro inesperado aconteceu');
    }
  }

  static async contarDocumentos(req, res) {

    let response = {};

    try {
      const res = await Processo.countDocuments({});
      response.status = 200;
      response.data = res.data;
      response.error = null;
    } catch (e) {
      response.status = 500;
      response.data = '';
      response.error = e.message;
    }

    res.status(response.status).send(response);
  }

  static async obterProcesso(req, res) {
    
    const response = {};

    try {
      const numeroProcesso = req.params.numeroProcesso.replace(/[.-]/g, '');
      response.status = 200;
      response.data = await Processo.findOne({"detalhes.numeroProcesso": numeroProcesso });
      response.error = null;
    } catch (e) {
      console.log(e);
      response.status = 500;
      response.data = '';
      response.error = e.message;      
    }

    res.status(response.status).send(response);

  }

  static async obterAndamentos(req, res) {

    const response = {};

    try {
      const numeroProcesso = req.params.numeroProcesso.replace(/[.-]/g, '');
      response.status =  200;
      response.data = await Andamento.find({numeroProcesso});
      response.error = null;
    } catch (e) {
      console.log(e);
      response.status = 500;
      response.data = '';
      response.error = e.message;        
    }
    
    res.status(response.status).send(response);
  }

  static async obterProcessoSolr(req, res) {
    const response = {};

    try {
      const cnj = req.params.numeroProcesso;
      const numeroProcesso = /[.-]/.test(cnj) ? cnj.replace(/[.-]/g, '') : cnj;
      const resProcesso = await Processo.findOne({"detalhes.numeroProcesso": numeroProcesso });
      const resAndamentos = await Andamento.find({ numeroProcesso });

      response.status = 200;
      response.data = new Tradutor().traduzirProcesso(resProcesso, resAndamentos[resAndamentos.length-1]);
      response.error = null;
      console.log(`Consulta do processo ${numeroProcesso} realizada com sucesso!\n`);
    } catch (e) {
      response.status = 500;
      response.data = '';
      response.error = e.message;
      console.log(`Consulta do processo ${numeroProcesso} não realizada com sucesso!\n`, e.message);
    }

    res.status(response.status).send(response.data);
  }

  static async obterAndamentosSolar(req, res) {
    const response = {};

    try {
      const cnj = req.params.numeroProcesso;
      const numeroProcesso = /[.-]/.test(cnj) ? cnj.replace(/[.-]/g, '') : cnj;
      const resAndamentos = await Andamento.find({ numeroProcesso });

      response.status = 200;
      response.data = new Tradutor().traduzirAndamentos(resAndamentos);
      response.error = null;
    } catch (e) {
      console.log(e);
      response.status = 500;
      response.data = '';
      response.error = e.message;       
    }

    res.status(response.status).send(response.data);
  }

  static async obterProcessos(req, res) {
    const response = {};

    try {
      const data = req.params.data;
      const resProcessos = await Processo.find({ 
        dataCriacao: {
          $lte: moment(data, 'YYYY-MM-DD').format('YYYY-MM-DDT00:00:00Z'),
          $gt: moment(data, 'YYYY-MM-DD').add(1, 'days').format('YYYY-MM-DDT00:00:00Z'),
        } 
      });

      response.status = 200;
      response.data = resProcessos;
      response.error = null;
    } catch (e) {
      console.log(e);
      response.status = 500;
      response.data = '';
      response.error = e.message;       
    }

    res.status(response.status).send(response.data);
  }
}

module.exports.ProcessoController = ProcessoController;
