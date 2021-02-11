const { OabTJMS } = require('./OabESAJ');
const { OabTJBAPortal } = require('./OabTJBAPortal');
const { OabTJMG } = require('./OabTJMG');
const { OabTJRS } = require('./OabTJRS');
const { ProcessoTJRS } = require('./ProcessoTJRS');
const { ProcessoTJCE } = require('./ProcessoTJCE');
const { ProcJTE } = require('./ProcJTE');
const { PeticaoTJRS1 } = require('./PeticaoTJRS1');
const extratores = require('./index');

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
      // extrator = new OabTJSP('https://esaj.tjsp.jus.br/cpopg', isDebug);
      extrator = new extratores.OabTJSP();
    }

    if (/oab.TJRS/.test(fila)) {
      extrator = new OabTJRS(
        'https://www.tjrs.jus.br/site_php/consulta/index.php',
        isDebug
      );
    }

    if (/processo.TJRS/.test(fila)) {
      extrator = new ProcessoTJRS(
        'https://www.tjrs.jus.br/site_php/consulta/index.php',
        isDebug
      );
    }

    if (/peticao.TJRS/.test(fila)) {
      extrator = new PeticaoTJRS1(false);
    }

    if (/processo.JTE/.test(fila)) {
      extrator = new ProcJTE('https://jte.csjt.jus.br/', isDebug);
    }

    if (/processo.TJSP/.test(fila)) {
      extrator = new extratores.ProcessoTJSP();
    }

    if (/peticao.TJSP/.test(fila)) {
      // usa puppeteer
      extrator = new extratores.PeticaoTJSP();
    }

    if (/oab.TJSC/.test(fila)) {
      // extrator = new OabTJSC('https://esaj.tjsc.jus.br/cpopg', isDebug);
      extrator = new extratores.OabTJSC();
    }

    if (/processo.TJSC/.test(fila)) {
      extrator = new extratores.ProcessoTJSC();
    }

    if (/oab.TJMG/.test(fila)) {
      extrator = new OabTJMG(
        'https://www4.tjmg.jus.br/juridico/sf/index_oab.jsp',
        isDebug
      );
    }

    if (/processo.TJCE/.test(fila)) {
      extrator = new extratores.ProcessoTJCE();
    }

    if (/processo.PJE/.test(fila)) {
      extrator = new ExtratorTrtPje(
        'https://www.trt1.jus.br/consulta-processual',
        isDebug
      );
    }

    if (/oab.TJMS/.test(fila)) {
      extrator = new OabTJMS();
    }

    if (/processo.TJMS/.test(fila)) {
      extrator = new extratores.ProcessoTJMS();
    }

    if (/peticao.TJMS/.test(fila)) {
      extrator = new extratores.PeticaoTJMS();
    }
    return extrator;
  }
}

module.exports.ExtratorFactory = ExtratorFactory;
