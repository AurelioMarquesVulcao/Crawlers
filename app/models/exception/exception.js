class BaseException extends Error {
  /**
   * Base Exception
   * @param {String} code Codigo de erro da excessão
   * @param {string} message Mensagem de erro da excessão
   * @param  {...any} params Dados da excessão
   */
  constructor(code = 'GENERIC', message = '', ...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BaseException);
    }

    this.code = code;
  }
}

class ExtracaoException extends Error {
  /**
   * ExtracaoException
   * @param {string} code Codigo da excessão
   * @param {JSON} objExtracao Objeto que estava a ser preenchido no momento de extração
   * @param  {any} params Dados da excessão
   */
  constructor(code = 'GENERIC', objExtracao = {}, ...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ExtracaoException);
    }

    this.code = code;
    this.objExtracao = objExtracao;
  }
}

class RequestException extends Error {
  /**
   * RequestException
   * @param {string} code Codigo de erro da excessão
   * @param {number} status Codigo do request
   * @param  {any} params Dados da excessão
   */
  constructor(code = 'GENERIC', status = 500, ...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RequestException);
    }

    this.code = code;
    this.status = status;
  }
}

class AntiCaptchaResponseException extends BaseException {
  /**
   * AntiCaptchaResponseException
   * @param {string} code Codigo de erro da excessão
   * @param {any} params dados da excessao
   */
  constructor(code = 'GENERIC', message = '', ...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AntiCaptchaResponseException);
    }

    this.code = code;
    this.message = message;
  }
}

class CaptchaIOException extends BaseException {
  constructor(code = 'GENERIC', message = '', ...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CaptchaIoException);
    }

    this.code = code;
    this.message = message;
  }
}

module.exports.BaseException = BaseException;
module.exports.ExtracaoException = ExtracaoException;
module.exports.RequestException = RequestException;
module.exports.AntiCaptchaResponseException = AntiCaptchaResponseException;
module.exports.CaptchaIOException = CaptchaIOException;
