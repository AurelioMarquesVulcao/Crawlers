const { OabTJBAPortal } = require('./OabTJBAPortal');
const { OabTJSP } = require('./OabTJSP');
const { OabTJRS } = require('./OabTJRS');
const { ProcessoTJRS } = require('./ProcessoTJRS');

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

    if (/oab.TJRS/.test(fila)) {      
      extrator = new OabTJRS('https://www.tjrs.jus.br/site_php/consulta/index.php', isDebug);
    }

    if (/processo.TJRS/.test(fila)) {      
      extrator = new ProcessoTJRS('https://www.tjrs.jus.br/site_php/consulta/index.php', isDebug);
    }    

    return extrator;
  }
}

module.exports.ExtratorFactory = ExtratorFactory;
