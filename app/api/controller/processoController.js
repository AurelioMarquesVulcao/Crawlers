const moment = require('moment');
const Tribunal = require('../../models/schemas/tribunal');
const { GerenciadorFila } = require('../../lib/filaHandler');
const { Processo } = require("../../models/schemas/processo");
const { Andamento } = require("../../models/schemas/andamento");
const { Helper, CnjValidator } = require('../../lib/util');

// const context = {
//   LogConsultaId: '5e5d7b8b09219b50a2edae31',
//   NumeroDoProcesso: null,
//   NumeroOab: 54768,
//   Tribunal: 'TJBA',
//   DataEnfileiramento: '2020-03-02T18:32:59.417685',
// };

const identificarTribunal = (cnj) => {

  let tribunal;
  let idTribunalMatch = cnj.match(/\.([0-9]\.[0-9]{2})\./);

  if (idTribunalMatch) {
    if (/5.[0-9]{2}/.test(idTribunalMatch[1])) {
      tribunal = 'JTE';
    } else {
      switch(idTribunalMatch[1]) {
        case '8.05': tribunal = 'TJBA'; break; // TJBA
        case '8.13': tribunal = 'TJMG'; break; // TJMG     
        case '8.24': tribunal = 'TJSC'; break; // TJSC
        case '8.26': tribunal = 'TJSP'; break; // TJSP      
        default: tribunal = ''; break;
      }
    }
  }

  return tribunal;

}

const identificarFila = (lista) => {
  
  // let lote = { tribunal: "", processos: [] };
  let lote = [];
  // 8.05 // TJBA
  // 8.24 // TJSC
  // 8.26 // TJSP    
  // 8.13 // TJMG
  // 5.* //   

  for(let i = 0, si = lista.length; i < si; i++) {

    const cnj = lista[i].NumeroProcesso.replace(/([0-9]{7})([0-9]{2})([0-9]{4})([0-9]{1})([0-9]{2})([0-9]{4})/, "$1-$2.$3.$4.$5.$6");

    lista[i].tribunal = identificarTribunal(cnj);

  }

  return lista.reduce((acc, curVal) => {

    let index = acc.findIndex(x => x.tribunal === curVal.tribunal);

    if (index === -1) {      
      let obj = {};
      obj.tribunal = curVal.tribunal;
      delete curVal.tribunal;
      obj.processos = [curVal];
      acc.push(obj);
    } else {
      delete curVal.tribunal;
      acc[index].processos.push(curVal);
    }

    return acc;
  }, []);

}

class Tradutor {

  /**
   * Monta a capa do processo.
   * @param {JSON} processo JSON do processo original para montar a capa nova.
   * @param {JSON} ultimoAndamento JSON do primeiro andamento adicionado a lista de andamentos.
   */
  montarCapa(processo) {
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
      DataDistribuicao: processo.capa.dataDistribuicao
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
    return ultimoAndamento && /distribui(do|cao)/i.test(ultimoAndamento.descricao) ? ultimoAndamento.data : '';    
  }

  /**
   * Traduz um objeto de processo salvo na base intermediaria para um objeto de processo que o bigdata compreenda.
   * @param {JSON} processo Objeto json corresponde do processo a ser traduzido.
   * @param {Array} andamentos Lista de andamentos a ser processado.
   */
  traduzirProcesso(processo) {
    return {
      NumeroCNJ: processo.detalhes.numeroProcesso,
      Capa: this.montarCapa(processo),
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
      const results = await Processo.countDocuments({});
      response.status = 200;
      response.data = results;
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

      response.status = 200;
      response.data = new Tradutor().traduzirProcesso(resProcesso);
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
      const filtros = req.query;
      const query = {};

      if (Object.keys(filtros).length > 0) {        
        if (filtros.data) {          
          query.dataCriacao = {            
            $gt: moment(filtros.data, 'YYYY-MM-DD').format('YYYY-MM-DDT00:00:00Z'),
          }
        }
      }

      const skip = filtros && filtros.pagina ? parseInt(filtros.pagina) : 0;
      const limit = filtros && filtros.limite ? parseInt(filtros.limite) : 1000;
      const sort = filtros && filtros.ord ? parseInt(filtros.ord) : 1;

      const count = await Processo.countDocuments(query);
      const resProcessos = await Processo.find(query).skip(skip).limit(limit).sort({ _id: sort });

      const tradutor = new Tradutor();
      const listaProcessos = [];

      for (let i = 0, si = resProcessos.length; i < si; i++) {
        listaProcessos.push(tradutor.traduzirProcesso(resProcessos[i]));
      }

      response.status = 200;
      response.data = { totalRegistros: count, pagina: skip, limite: limit, resultados: listaProcessos };
      response.error = null;
    } catch (e) {
      console.log(e);
      response.status = 500;
      response.data = '';
      response.error = e.message;       
    }

    res.status(response.status).send(response.data);
  }

  static async enfileirarDocumentos(req, res) {
    const response = {status: 500, data: '', error: null};
    try {

      const context = req.body; 

      const lote = identificarFila(context);
      let contador = 0;

      for(let i = 0, si = lote.length; i < si; i++) {
        console.log(`peticao.${lote[i].tribunal}.extracao`, lote[i].processos.length);
        contador += lote[i].processos.length;
        await new GerenciadorFila()
          .enfileirarLote(`peticao.${lote[i].tribunal}.extracao`, lote[i].processos);
      }

      response.status = 200;
      response.data = `${contador} Processos enviados!`;
      response.error = null;
    } catch (e) {
      console.log(e);
      response.status = 500;
      response.data = '';
      response.error = e.message;       
    } finally {
      res.status(response.status).send(response.data);
    }

    
  }

}

module.exports.ProcessoController = ProcessoController;