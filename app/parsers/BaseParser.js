module.exports.removerAcentos = function removerAcentos(texto) {
  texto = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return texto.replace(/N[^\w\s]/gi, 'N');
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
