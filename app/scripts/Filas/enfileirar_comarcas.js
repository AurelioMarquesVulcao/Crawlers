const Comarca = require('../../models/schemas/comarcas');
const { GerenciadorFila } = require('../../lib/filaHandler');
const axios = require('axios');
require('../../bootstrap');
const { buscar_sequencial } = require('../../lib/busca_sequencial');

let args = process.argv;

const resgata_comarcas_bd = async (orgao, tribunal, ano) => {
  let config = {
    method: 'get',
    url: `http://172.16.16.3:8083/processos/obterUnidadesOrigemPorTribunal/?orgao=${orgao}&tribunal=${tribunal}&ano=${ano}`,
    headers: {
      'x-api-key': 'tk3TqbruYqJdFdW5fqctsurkNcZi5UHIVWUfiWfM7Xw'
    }
  };

  await axios(config).then(res => res.data);

}

const atualizar_comarcas = async (orgao, tribunal) => {

}

const enfileirar_comarcas = async () => {
  let trib = args[2];
  let ano = args[3];

  let comarcasBD = await buscar_sequencial(trib, ano);

  comarcasBD = comarcasBD.map(comarca => {
    let numero = comarca.CNJ;
    numero = numero.replace(/(\d{7})(\d{2})(\d{4})(\d)(\d{2})(\d{4})/, '$1-$2.$3.$4.$5.$6');

    return {
      CNJ: numero,
      UnidadeOrigem: comarca.UnidadeOrigem,
      UltimoSequencial: comarca.UltimoSequencial
    }
  })

  console.log('oi')

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
    process.exit(0)
  })
  .catch((e) => console.log(e));
