const Comarca = require('../../models/schemas/comarcas');
const { GerenciadorFila } = require('../../lib/filaHandler');
require('../../bootstrap');
const { buscar_sequencial } = require('../../lib/busca_sequencial');
const sleep = require('await-sleep');

let args = process.argv;

// node <caminho para esse arquivi> <TRIBUNAL> <ANO>

const atualizar_comarcas = async (tribunal, comarcasBD) => {
  let comarcas = await Comarca.find({
    Estado: tribunal.substring(tribunal.length - 2),
  });
  let tam = comarcas.length;

  let comarcasAEnviar = [];

  for (let i = 0; i < tam; i++) {
    let comarca = comarcas[i];
    let comarcaBD = comarcasBD[comarca.Comarca];

    if (!comarcaBD) continue;

    comarca.UltimoProcesso = comarcaBD;
    comarca = new Comarca(comarca);

    await comarca.salvar();
    let msg = comarca.toJSON();

    comarcasAEnviar.push(msg);
  }

  return comarcasAEnviar;
};

async function enviarComarcas(tribunal, comarcasAEnviar) {
  let gf = new GerenciadorFila();
  const tam = comarcasAEnviar.length;

  for (let i = 0; i < tam; i++) {
    await new Comarca(comarcasAEnviar[i]).salvar();

    gf.enviar(`comarcas.${tribunal}.extracao`, comarcasAEnviar[i]);

    await sleep(200);
    console.log(
      `${comarcasAEnviar[i].Comarca} => comarcas.${tribunal}.extracao`
    );
  }
}

const enfileirar_comarcas = async () => {
  let trib = args[2];
  let ano = args[3];

  let comarcasBD = await buscar_sequencial(trib, ano);

  let comarcasDict = {};
  comarcasBD.map((comarca) => {
    let numero = comarca.CNJ;
    numero = numero.replace(
      /(\d{7})(\d{2})(\d{4})(\d)(\d{2})(\d{4})/,
      '$1-$2.$3.$4.$5.$6'
    );

    comarcasDict[String(comarca.UnidadeOrigem)] = numero;
  });

  let comarcasAEnviar = await atualizar_comarcas(trib, comarcasDict);

  await enviarComarcas(trib, comarcasAEnviar);

  console.log('oi');

  // let gf = new GerenciadorFila();
  // let comarcas = await Comarca.find({ Estado: tribunal.substring(tribunal.length - 2) });
  // let tam = comarcas.length;
  // // process.exit(0);
  // for (let i = 0; i < tam; i++) {
  //   let msg = comarcas[i].toJSON();
  //   let obj = comarcas[i].toObject();
  //
  //   console.log(`[${msg.Comarca}] [${msg.UltimoProcesso}] -> `);
  //
  //   if(obj.UltimoProcesso) {
  //     gf.enviar(`comarcas.${tribunal}.extracao`, msg);
  //
  //     await new Comarca(obj).setStatus(1);
  //   }
  // }
  return true;
};

enfileirar_comarcas()
  .then((res) => {
    console.log('Processo de enfileiramento terminado');
    process.exit(0);
  })
  .catch((e) => console.log(e));
