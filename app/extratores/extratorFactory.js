const { OabTJBAPortal } = require('./extratores');

class ExtratorFactory {
  static getExtrator(fila, isDebug) {
    let extrator;

    if (/OabTJBAPortal/.test(fila))
      extrator = new OabTJBAPortal('http://www5.tjba.jus.br/portal/', isDebug);

    return extrator;
  }
}

module.exports.ExtratorFactory = ExtratorFactory;
