const { OabTJBAPortal } = require('./OabTJBAPortal');
const { OabTJSP } = require('./OabTJSP');
const { ProcessoTJSP } = require("./ProcessoTJSP");
const { OabTJSC } = require('./OabTJSC');
const { ProcessoTJSC } = require('./ProcessoTJSC');

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

    if (/processo.TJSP/.test(fila)) {
      extrator = new ProcessoTJSP(isDebug);
    }

    if (/oab.TJSC/.test(fila)) {
      if (/\.1/.test(fila)) // primeira instancia
        url = 'https://esaj.tjsc.jus.br/cpopg';
      if (/\.2/.test(fila)) // segunda instancia
        url = 'https://esaj.tjsc.jus.br/cposgtj';
      if(/\.tr/.test(fila)) // turmas recursais
        url = 'https://esaj.tjsc.jus.br/cposg5';

      extrator = new OabTJSC(url, isDebug);
    }

    if (/processo.TJSC/.test(fila)) {
      if (/\.1/.test(fila))
        url = 'https://esaj.tjsc.jus.br/cpopg';
      if (/\.2/.test(fila))
        url = 'https://esaj.tjsc.jus.br/cposgtj';
      if(/\.tr/.test(fila))
        url = 'https://esaj.tjsc.jus.br/cposg5';

      extrator = new ProcessoTJSC(url, isDebug);
    }

    return extrator;
  }
}

module.exports.ExtratorFactory = ExtratorFactory;
