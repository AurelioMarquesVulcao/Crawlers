const { OabTJBAPortal } = require('./OabTJBAPortal');
const { OabTJSP } = require('./OabTJSP');
const { OabTJMG } = require('./OabTJMG');

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

    if (/OabTJMG/.test(fila)) {
      extrator = new OabTJMG(
        'https://www4.tjmg.jus.br/juridico/sf/index_oab.jsp',
        isDebug
      );
    }
    return extrator;
  }
}

module.exports.ExtratorFactory = ExtratorFactory;
