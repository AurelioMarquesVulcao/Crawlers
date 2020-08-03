const { OabTJBAPortal } = require('./OabTJBAPortal');
const { OabTJSP } = require('./OabTJSP');
const { OabTJMG } = require('./OabTJMG');
const { OabTJRS } = require('./OabTJRS');
const { OabTJSC } = require('./OabTJSC');
const { ProcessoTJRS } = require('./ProcessoTJRS');
const { ProcessoTJSP } = require("./ProcessoTJSP");
const { ProcessoTJSC } = require('./ProcessoTJSC');
const { ProcJTE } = require('./ProcJTE');
const { PeticaoTJSP } = require('./PeticaoTJSP');


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

    if (/oab.TJRS/.test(fila)) {      
      extrator = new OabTJRS('https://www.tjrs.jus.br/site_php/consulta/index.php', isDebug);
    }

    if (/processo.TJRS/.test(fila)) {      
      extrator = new ProcessoTJRS('https://www.tjrs.jus.br/site_php/consulta/index.php', isDebug);
    }    

    if (/processo.JTE/.test(fila)) {
      extrator = new ProcJTE('https://jte.csjt.jus.br/', isDebug);
    }

    if (/processo.TJSP/.test(fila)) {
      extrator = new ProcessoTJSP(isDebug);
    }

    if (/peticao.TJSP/.test(fila)) { // usa puppeteer
      extrator = new PeticaoTJSP({headless: true});
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
