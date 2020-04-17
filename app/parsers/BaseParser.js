module.exports.removerAcentos = function removerAcentos(texto) {
  texto = texto.normalize('NFKD');
  // texto = Buffer.from(texto, 'ascii');
  texto = texto.toString('utf8');
  texto = texto.replace(/[\u0300-\u036f]/g, '');
  texto = texto.replace(/['"”“‘’º]+/g, '');
  texto = texto.replace(/N[^\w\s]/gi, 'N');
  return texto;
};

if (typeof String.prototype.strip === 'undefined') {
  String.prototype.strip = function () {
    return String(this).replace(/^\s+|\s+$/g, '');
  };
}

module.exports.BaseParser = class BaseParser {
  constructor() {
    this.cnj = '';
    this.isBaixa = false;
    this.hasAudiencia = false;
    this.jsonCapa = {};
    this.jsonPartes = [];
    this.jsonAdvogados = [];
    this.jsonAssuntos = [];
    this.jsonAndamentos = [];
  }
};

const tradutor = {
  AUTOR: 'Autor',
  REU: 'Reu',
  AGTE: 'Agravante',
  AGDO: 'Agravado',
  REQUERIDO: 'Requerido',
  REQUERENTE: 'Requerente',
  SUSCTE: 'Suscitante',
  SUSCDO: 'Suscitado',
  APELANTE: 'Apelante',
  APELADO: 'Apelado',
  ADVOGADO: 'Advogado',
  Advogada: 'Advogado',
  ADVOGADO_MIGRACAO: 'Advogado',
  PROCURADOR: 'Procurador',
  IMPETRANTE: 'Impetrante',
  IMPETRADO: 'Impetrado',
  INTERESSADO: 'Interessado',
  MPF: 'mpf',
  'PROC/S/OAB': 'Procurador',
  Exeqte: 'Exequente',
  Exectdo: 'Executado',
  Reqte: 'Requerente',
  Reqdo: 'Requerido',
  'Nº Guia': 'NGuia',
  'Situação da guia': 'SituacaoDaGuia',
  'Valor Pago': 'ValorPago',
  'Data Pagamento': 'DataPagamento',
  'FASE ATUAL': 'FaseAtual',
  'Data do Movimento': 'DataDoMovimento',
};
module.exports.tradutor = tradutor;
