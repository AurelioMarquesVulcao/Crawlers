const { FeedbackIntegracaoProadv } = require('../../models/schemas/feedbackIntegracaoProadv');

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
}