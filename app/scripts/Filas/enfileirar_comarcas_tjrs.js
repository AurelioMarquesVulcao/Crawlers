const Comarca = require('../../models/schemas/comarcas');
const { GerenciadorFila } = require('../../lib/filaHandler');
require('../../bootstrap');
const enfileirar_comarcas = async () => {
  let gf = new GerenciadorFila();
  let comarcas = await Comarca.find({ Estado: 'RS' });
  let tam = comarcas.length;

  for (let i = 0; i < tam; i++) {
    let msg = comarcas[i].toJSON();
    let obj = comarcas[i].toObject();

    console.log(msg);

    if(obj.UltimoProcesso) {
      gf.enviar('comarcas.TJRS.extracao', msg);

      await new Comarca(obj).setStatus(1);
    }
  }
  return true;
};

enfileirar_comarcas()
  .then((res) => console.log('processo de enfileiramento terminado'))
  .catch((e) => console.log(e));
