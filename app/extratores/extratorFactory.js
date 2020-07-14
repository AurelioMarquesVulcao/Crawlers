const { OabTJBAPortal } = require('./OabTJBAPortal');
const { OabTJSP } = require('./OabTJSP');
const { ProcessoTJSP } = require("./ProcessoTJSP");
const { OabTJSC } = require('./OabTJSC');
const { ProcessoTJSC } = require('./ProcessoTJSC');
const { OabTJMG } = require('./OabTJMG');
const { ProcJTE } = require('./ProcJTE');

class ExtratorFactory {
  static getExtrator(fila, isDebug) {
    let extrator;
    let url;

    if (/oab.TJBAPortal/.test(fila)) {
      extrator = new OabTJBAPortal(
        'http://www5.tjba.jus.br/portal/busca-resultado',
        isDebug
      );
    }

    if (/oab.TJSP/.test(fila)) {
      extrator = new OabTJSP('https://esaj.tjsp.jus.br/cpopg/open.do', isDebug);
    }

    if (/processo.JTE/.test(fila)) {
      extrator = new ProcJTE('https://jte.csjt.jus.br/', isDebug);
    }

    if (/processo.TJSP/.test(fila)) {
      extrator = new ProcessoTJSP(isDebug);
    }

    if (/oab.TJSC/.test(fila)) {
      extrator = new OabTJSC('https://esaj.tjsc.jus.br/cpopg', isDebug);
    }

    if (/processo.TJSC/.test(fila)) {
      extrator = new ProcessoTJSC('https://esaj.tjsc.jus.br/cpopg', isDebug);
    }

    if (/oab.TJMG/.test(fila)) {
      extrator = new OabTJMG(
        'https://www4.tjmg.jus.br/juridico/sf/index_oab.jsp',
        isDebug
      );
    }
    return extrator;
  }
}

module.exports.ExtratorFactory = ExtratorFactory;
