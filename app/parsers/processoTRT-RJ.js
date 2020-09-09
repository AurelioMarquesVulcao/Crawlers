const cheerio = require("cheerio");
const moment = require("moment");
const { Helper } = require("../lib/util");
const { BaseParser } = require("./BaseParser");
const {
  Processo,
  Capa,
  Personagem,
  Andamento,
  Aviso
} = require("../models/dto/processo");
const { BaseException, ExtracaoException } = require("../models/exception/exception");

module.exports.TrtrjParser = class TrtrjParser extends BaseParser {
  /**
   * TrtrjParser
   */
  constructor(cnj, instancia) {
    super();
    this.cnj = "";
    this.instancia = "";
    this.baixa = false;
    this.hasAudiencia = false;
  }

  setDados(cnj, instancia) {
    this.cnj = cnj;
    this.instancia = instancia;
  }

  extrairAssuntos(content) {
    let assuntoPrincipal = '';
    const assuntos = content ? content.filter(x => x.principal === true) : [];  
    assuntoPrincipal = assuntos.length > 0 ? assuntos[0].descricao : '';
    return assuntoPrincipal;
  }

  extrairCapa(content) {
    const capa = new Capa(
      Processo.identificarUF(this.cnj),
      "Rio de Janeiro",
      content.orgaoJulgador,
      content.itensProcesso[0].titulo,
      this.extrairAssuntos(content.assuntos),
      content.classe,
      content.distribuidoEm ? Helper.converterDataHoraParaDataMoment(
        content.distribuidoEm) : null
    ).toString();

    return capa;
  }

  extrairPersonagens(poloAtivo, poloPassivo) {
    
    let jsonPartes = [];
    let jsonAdvogados = [];

    if (poloAtivo)
      for (let i = 0, s1 = poloAtivo.length; i < s1; i++) {
        jsonPartes.push(
          new Personagem(poloAtivo[i].nome, poloAtivo[i].tipo).toString()
        );

        if (poloAtivo[i].representantes)
          for (let j = 0, s2 = poloAtivo[i].representantes.length; j < s2; j++) {
            const advogado = new Personagem(
              poloAtivo[i].representantes[j].nome,
              poloAtivo[i].representantes[j].tipo
            ).toString();
            advogado.oab = {};
            jsonAdvogados.push(advogado);
          }
      }

    if(poloPassivo)
      for (let k = 0, s3 = poloPassivo.length; k < s3; k++) {
        jsonPartes.push(
          new Personagem(poloPassivo[k].nome, poloPassivo[k].tipo).toString()
        );

        if(poloPassivo[k].representantes)
          for (let l = 0, s4 = poloPassivo[k].representantes.length; l < s4; l++) {
            const advogado = new Personagem(
              poloPassivo[k].representantes[l].nome,
              poloPassivo[k].representantes[l].tipo
            ).toString();
            advogado.oab = {};
            jsonAdvogados.push(advogado);
          }
      }

    return {
      partes: jsonPartes,
      advogados: jsonAdvogados
    }
  }

  extrairAndamentos(listaAndamentos) {

    const jsonAndamentos = [];

    for(let i = 0, s = listaAndamentos.length; i < s; i++) {

      let item = listaAndamentos[i];

      const andamento = new Andamento("", item.titulo, `${moment.utc(item.data).format("YYYY-MM-DDTHH:mm:ss.sss")}Z`,`${moment().format("YYYY-MM-DDTHH:mm:ss.sss")}Z`, "", null).toString();

      andamento.hash = Andamento.gerarHashAndamentoNovo(andamento);
      andamento.descricao = andamento.descricao.replace(/\s+/g,' ').trim();

      if (/arquivamento definitivo/i.test(andamento.descricao))
        this.isBaixa = true;

      jsonAndamentos.push(andamento);

    }  

    return jsonAndamentos;
  }

  parse(content) {
    const capa = this.extrairCapa(content);

    const detalhes = Processo.identificarDetalhesProcesso(this.cnj);
    detalhes.instancia = this.instancia;

    const clientes = [
      {
        hash: "b597d5b475cd89cdf1a2fc803f37af2b7266c0bf",
        periodicidade: "semanal",
        url_callback:
          "https://api.proadv.adv.br/v4/api/Processo/FeeadbackIntegracaoBigData"
      }
    ];

    const aviso = new Aviso(
      detalhes.numeroMascara,
      "OK",
      "",
      `${moment().format("YYYY-MM-DDTHH:mm:ss.sss")}Z`
    ).toString();

    const jsonPersonagens = this.extrairPersonagens(
      content.poloAtivo,
      content.poloPassivo
    );

    const jsonAndamentos = this.extrairAndamentos(content.itensProcesso);    

    const processo = new Processo(
      capa,
      detalhes,
      jsonPersonagens.partes,
      jsonPersonagens.advogados,
      clientes,
      this.isBaixa ? "inativo" : "extraido",
      aviso,
      null,
      null,
      false,
      this.isBaixa,
      this.hasAudiencia
    ).toString();
    
    processo.origemExtracao = "eproc-trtrj";

    return {
      processo: processo,
      andamentos: jsonAndamentos
    };
  }
};