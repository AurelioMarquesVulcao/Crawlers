const { OabTJBAPortal } = require('./OabTJBAPortal');
const { OabTJSP } = require('./OabTJSP');
const { ProcJTE } = require('./ProcJTE');

class ExtratorFactory {
  static getExtrator(fila, isDebug) {
    let extrator;

    if (/oab.TJBAPortal/.test(fila)) {
      extrator = new OabTJBAPortal(
        'http://www5.tjba.jus.br/portal/busca-resultado',
        isDebug
      );
    }

    if (/oab.TJSP/.test(fila)) {
      extrator = new OabTJSP('https://esaj.tjsp.jus.br/cpopg/open.do', isDebug);
    }

    if (/oab.JTE/.test(fila)) {
      extrator = new ProcJTE('https://jte.csjt.jus.br/', isDebug);
    }

    return extrator;
  }
}

module.exports.ExtratorFactory = ExtratorFactory;
