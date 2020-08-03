const fs = require('fs');
const { Helper } = require('../../lib/util');
module.exports.MockController = class MockController {

  static async lerArquivo(req, res) {
    try {    
      const context = req.body;
      const file = fs.readFileSync(context.path);
      res.set("Content-Type", "application/json; charset=iso-8859-1");      
      res.status(200).send(file);
    } catch (e) {      
      res.status(500).send(e.message);
    }
  }
}