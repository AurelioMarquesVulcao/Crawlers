const Comarca = require('../../models/schemas/comarcas');
const { GerenciadorFila } = require('../../lib/filaHandler');
require('../../bootstrap');

let args = process.argv;

const enfileirar_comarcas = async () => {
  let tribunal = args[2];

  let gf = new GerenciadorFila();
  let comarcas = await Comarca.find({ Estado: tribunal.substring(tribunal.length - 2) });
  let tam = comarcas.length;
  // process.exit(0);
  for (let i = 0; i < tam; i++) {
    let msg = comarcas[i].toJSON();
    let obj = comarcas[i].toObject();

    console.log(`[${msg.Comarca}] [${msg.UltimoProcesso}] -> `);

    if(obj.UltimoProcesso) {
      gf.enviar(`comarcas.${tribunal}.extracao`, msg);

      await new Comarca(obj).setStatus(1);
    }
  }
  return true;
};

enfileirar_comarcas()
  .then((res) => console.log('processo de enfileiramento terminado'))
  .catch((e) => console.log(e));
