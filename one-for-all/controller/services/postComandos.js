const { Util } = require('../lib/util');

class PostComandos {

  static async limpaMemoria(rec, res) {
    try {
      await Util.limpaMemoria();
      return res.json({ serviço: "ok" })
    } catch (e) {
      console.log(e);
      return res.json(e)
    }
  }

  static async Pm2Variaval(rec, res) {
    try {
      const { servico, nome, variavel } = rec.body;
      await Util.Pm2Variaval(servico, nome, variavel);
      return res.json({ serviço: "ok" })
    } catch (e) {
      console.log(e);
      return res.json(e)
    }
  }

  static async PM2(rec, res) {
    try {
      const { comando } = rec.body;
      await Util.PM2(comando);
      return res.json({ serviço: "ok" })
    } catch (e) {
      console.log(e);
      return res.json(e)
    }
  }


  static async dockerUp(rec, res) {
    try {
      const { servico } = rec.body;
      await Util.dockerUp(servico);
      return res.json({ serviço: "ok" })
    } catch (e) {
      console.log(e);
      return res.json(e)
    }
  }

  static async dockerStop(rec, res) {
    try {
      const { servico } = rec.body;
      await Util.dockerStop(servico);
      return res.json({ serviço: "ok" })
    } catch (e) {
      console.log(e);
      return res.json(e)
    }
  }

  static async dockerStopAll(rec, res) {
    try {
      // const { servico } = rec.body;
      await Util.dockerStopAll();
      return res.json({ serviço: "ok" })
    } catch (e) {
      console.log(e);
      return res.json(e)
    }
  }

  static async escaleContainer(rec, res) {
    try {
      const { servico, quantidade } = rec.body;
      await Util.escaleContainer(servico, quantidade);
      return res.json({ serviço: "ok" })
    } catch (e) {
      console.log(e);
      return res.json(e)
    }
  }

  static async dockerUpBuild(rec, res) {
    try {
      const { servico } = rec.body;
      await Util.dockerUpBuild(servico);
      return res.json({ serviço: "ok" })
    } catch (e) {
      console.log(e);
      return res.json(e)
    }
  }

  static async escaleContainer(rec, res) {
    try {
      const { servico, quantidade } = rec.body;
      await Util.escaleContainer(servico, quantidade);
      return res.json({ serviço: "ok" })
    } catch (e) {
      console.log(e);
      return res.json(e)
    }
  }

}

module.exports.PostComandos = PostComandos;