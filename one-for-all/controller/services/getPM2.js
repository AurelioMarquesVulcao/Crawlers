const { Pm2Handler } = require('../lib/pm2Handler');

class GetPm2 {

  static async get(rec, res) {
    try {
      let get = await Pm2Handler.list();
      return res.json({ get })
    } catch (e) {
      console.log(e);
      return res.json(e)
    }
  }
}
module.exports.GetPm2 = GetPm2;