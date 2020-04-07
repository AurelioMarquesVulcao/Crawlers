const Crypto = require('crypto-js');
const { Robo } = require('../lib/robo');

class Helper {
  /**
   * Gera um hash em sha1 para o parametro fornecido
   * @param {string} texto Texto para gerar o hash
   */
  static hash(texto) {
    const cifra = Crypto.SHA1(texto);
    return cifra.toString();
  }

  static enviarFeedback(msg) {
    const robo = new Robo();
    robo.acessar(
      'bigdata url', //TODO preencher corretamente
      'POST',
      '',
      false,
      true,
      msg,
      {}
    );
  }
}

module.exports.Helper = Helper;
