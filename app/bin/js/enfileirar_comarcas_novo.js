const Comarca = require('../../models/schemas/comarcas');
const { GerenciadorFila } = require('../../lib/filaHandler');
require('../../bootstrap');
const { buscar_sequencia_inicial, tribunalFactory } = require('../../lib/buscar_comarca_inicial');
const { CnjValidator } = require('../../lib/util');
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

  let tribunalCode = tribunalFactory[trib];

  let comarcasBD = await buscar_sequencia_inicial(trib, Number(ano) - 1 );

  let comarcasDict = {};
  comarcasBD.map((comarca) => {
    let sequencial = comarca.UltimoSequencial;
    sequencial = `0000000${sequencial}`.slice(-7);

    let digito = CnjValidator.calcula_mod97(
      sequencial,
      ano,
      `${tribunalCode.orgao}${tribunalCode.tribunal}`,
      comarca.UnidadeOrigem
      )
    let comarcaFormatada = `0000${comarca.UnidadeOrigem}`.slice(-4);

    comarcasDict[String(comarca.UnidadeOrigem)] = `${sequencial}-${digito}.${ano}.${tribunalCode.orgao}.${tribunalCode.tribunal}.${comarcaFormatada}`;
  });

  let comarcasAEnviar = await atualizar_comarcas(trib, comarcasDict);

  console.log('Comarcas a enviar', comarcasAEnviar)
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
