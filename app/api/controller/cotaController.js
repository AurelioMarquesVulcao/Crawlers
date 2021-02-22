const { CotaEstado, CotaMensal } = require('../../models');

class CotaController {
  static async cadastrar(req, res) {
    const estado = {
      UF: req.body.UF,
      Nome: req.body.Nome,
      ValorCota: Number(req.body.ValorCota),
    };

    let cotaEstado = CotaEstado(estado);
    await cotaEstado.salvar();

    res.status(200).send({ sucesso: true, detalhes: 'Estado cadastrado' });
  }

  static async setValor(req, res) {
    const valor = Number(req.body.ValorCota);
    const UF = req.body.UF;

    let cotaEstado = await CotaEstado.findOne({ UF: UF });

    if (!cotaEstado)
      res.status(200).send({
        sucesso: false,
        detalhes: 'Não foi encontrado processo a uf especificada',
      });

    await CotaEstado.updateOne(
      { _hash: cotaEstado._hash },
      { $set: { ValorCota: valor } }
    );

    res
      .status(200)
      .send({ sucesso: true, detalhes: 'Valor do estado atualizado' });
  }

  static async getCota(req, res) {
    const UF = req.body.UF;

    let cotaEstado = await CotaEstado.findOne({ UF });
    if (!cotaEstado)
      res
        .status(200)
        .send({ sucesso: false, detalhes: 'Estado não foi localizado' });

    cotaEstado = cotaEstado.toObject();
    delete cotaEstado._id;
    delete cotaEstado.__v;
    let cotasMensaisHash = cotaEstado.Gastos;

    let cotaMensais = await CotaMensal.find({
      _hash: { $in: cotasMensaisHash },
    });
    cotaMensais = cotaMensais.map((element) => {
      let cotaMes = element.toObject();
      delete cotaMes._id;
      delete cotaMes.__v;
      return cotaMes;
    });

    cotaEstado.Gastos = cotaMensais;

    res.status(200).send({ sucesso: true, cotaEstado });
  }
}

module.exports.CotaController = CotaController;
