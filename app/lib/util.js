const Crypto = require('crypto-js');

const { enums } = require('../configs/enums');
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

  static async enviarFeedback(msg) {
    const robo = new Robo();
    return await robo.acessar(
      enums.bigdataUrls.resultadoConsulta,
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
