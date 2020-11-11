const { OabTJRS } = require('../extratores/OabTJRS');
const { ProcessoTJRS } = require('../extratores/ProcessoTJRS');

const main = async () => {
  // let extrator = new OabTJRS('https://www.tjrs.jus.br/site_php/consulta/index.php', false);
  //
  // let extracao = await extrator.extrair("24065RS", "6faa86ff934b60ff61c4a0e2");
  // return extracao;

  let extrator = new ProcessoTJRS(
    'https://www.tjrs.jus.br/site_php/consulta/index.php',
    false
  );
  let extracao = await extrator.extrair('24065RS', '5014648-26.2019.8.21.7000', '6faa86ff934b60ff61c4a0e2');
  return extracao;
};

Promise.all([main()])
  .then((e) =>
    console.log(
      e[0].nProcessos.length,
      'processos enviados para a fila de extracao de processos.'
    )
  )
  .then(() => process.exit(0));
