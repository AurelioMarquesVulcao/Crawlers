const { LogCaptcha } = require("../../models/schemas/logCaptcha");
const moment = require('moment');

const captilize = (texto) => {
  return `${texto[0].toUpperCase()}${texto.slice(1)}`;
}

module.exports.CaptchaController = class CaptchaController {

  static async salvarConsumo(req, res) {
    const response = {status: 500, data: '', error: null};
    try {
      let log = {}
      log.Servico = "AntiCaptcha";
      log.Tipo = req.body.Tipo;
      log.Website = req.body.Website;
      log.WebsiteKey = req.body.WebsiteKey;
      log.Robo = req.body.Robo;
      log.NumeroProcesso = req.body.NumeroProcesso;
      log.NumeroOab = req.body.NumeroOab;
      log.Data = req.body.Data;
      log.CaptchaBody = req.body.CaptchaBody;

      await new LogCaptcha(log)
        .save()
        .then(() => {
          response.status = 200;
          response.data = 'Salvo';
        }).catch(e => {
          throw e;
        });
    } catch (e) {
      console.log(e);
      response.status = 500;
      response.data = '';
      response.error = e.message;  
    } finally {
      res.status(response.status).send(response.data);
    }

  }

  static async contarQtdConsumo(req, res) {
    const response = { status: 500, data: '', error: null };
    try {

      const context = req.query;      
      let query = {};

      if (context.tipo)
        query.Tipo = context.tipo;

      const result = await LogCaptcha.countDocuments(query);
      response.status = 200;
      response.data = { total: result };
      response.error = null;
    } catch (e) {
      console.log(e);
      response.status = 500;
      response.data = '';
      response.error = e.message;  
    } finally {      
      res.status(response.status).send(response.data);
    }
  }

  static async buscarConsumo(req, res) {
    const response = {status: 500, data: '', error: null};
    try {

      const context = req.query;
      const query = { };
      let pagina = 0;
      let limite = 100;

      for(let item in context) {
        if(!/pagina|limite/.test(item)) {
          if (!/data/.test(item))
            query[captilize(item)] = context[item];
          else {
            query[captilize(item)] = {
              $gte : moment(context[item]).format('YYYY-MM-DDT00:00:00.000Z'),
              $lt : moment(context[item]).add(1, 'days').format('YYYY-MM-DDT00:00:00.000Z')
            }
          }
            
        } else if (/pagina/.test(item))
          pagina = parseInt(context[item]);
        else if (/limite/.test(item))
          limite = parseInt(context[item]);
      }

      console.log(pagina, limite);
      console.log(query);

      const result = await LogCaptcha.find(query).skip(pagina).limit(limite);
      response.status = 200;
      response.data = result;
      response.error = null;
    } catch (e) {
      console.log(e);
      response.status = 500;
      response.data = '';
      response.error = e.message;  
    } finally {
      res.status(response.status).send(response.data);
    }
  }
}