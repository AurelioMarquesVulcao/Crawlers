const Comarca = require('../../models/schemas/comarcas');
const { GerenciadorFila } = require('../../lib/filaHandler');
require('../../bootstrap');
const { CnjValidator } = require('../../lib/util');
const sleep = require('await-sleep');

const { tribunalFactory } = require('../../configs/enums').enums;

let tribunalArgv = process.argv[2];

const enfileirar_comarcas = async () => {
  let tribunal = tribunalFactory[tribunalArgv];
  const query = {
    Tribunal: tribunal.tribunal,
    Orgao: tribunal.orgao,
  };

  let comarcas = await Comarca.find(query);

  comarcas = comarcas.map((c) => {
    return {
      _id: c._id,
      Comarca: c.Comarca,
      Nome: c.Nome,
      UltimoProcesso: c.UltimoProcesso,
    };
  });

  await new GerenciadorFila().enviarLista('comarcas.TJMS.extracao', comarcas);

  await sleep(15000);

  return true;
};

enfileirar_comarcas()
  .then((res) => {
    console.log('Processo de enfileiramento terminado');
    process.exit(0);
  })
  .catch((e) => console.log(e));
