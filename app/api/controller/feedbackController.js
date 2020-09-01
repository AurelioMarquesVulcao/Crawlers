const { FeedbackIntegracaoProadv } = require('../../models/schemas/feedbackIntegracaoProadv');
const { LogCaptcha } = require("../../models/schemas/logCaptcha");

module.exports.FeedbackController = class FeedbackController {

  static async receber(req, res) {
    try {      
      const context = req.body;      
      const response = await FeedbackIntegracaoProadv.salvar(context);
      res.status(200).send('Registro salvo com sucesso!');
    } catch (e) {
      console.log(e);
      res.status(500).send('Houve um erro');
    }
  }

  static async marcarAtualizado(req, res) {
    try {      
      const context = req.body;      
      const response = await FeedbackIntegracaoProadv.marcarAtualizado(context);
      res.status(200).send(`${context.id} marcado com sucesso!`);
    } catch (e) {
      console.log(e);
      res.status(500).send('Houve um erro');
    }
  }

  static async anticaptcha(req, res) {
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

}