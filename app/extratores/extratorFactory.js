const { OabTJBAPortal } = require('./extratores');
const { OabTJSP } = require('./OabTJSP');

class ExtratorFactory {
  static getExtrator(fila, isDebug) {
    let extrator;

    if (/OabTJBAPortal/.test(fila)) {
      extrator = new OabTJBAPortal(
        'http://www5.tjba.jus.br/portal/busca-resultado',
        isDebug
      );
    }

    if (/OabTJSP/.test(fila)) {
      extrator = new OabTJSP('https://esaj.tjsp.jus.br/cpopg/open.do', isDebug);
    }

    return extrator;
  }
}

module.exports.ExtratorFactory = ExtratorFactory;
