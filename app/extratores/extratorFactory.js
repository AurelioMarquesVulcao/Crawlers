const { OabTJBAPortal } = require('./OabTJBAPortal');
const { OabTJSP } = require('./OabTJSP');
const { ProcessoTJSP } = require("./ProcessoTJSP");

const { OabTJSC } = require('./OabTJSC');

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

    if (/processo.TJSP/.test(fila)) {
      extrator = new ProcessoTJSP(isDebug);
    }

    if (/oab.TJSC/.test(fila)) {
      extrator = new OabTJSC('https://esaj.tjsc.jus.br/cposgtj/open.do', isDebug);
    }

    return extrator;
  }
}

module.exports.ExtratorFactory = ExtratorFactory;
