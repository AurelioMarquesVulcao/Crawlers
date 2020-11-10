const { OabTJRS } = require('../extratores/OabTJRS');
const { ProcessoTJRS } = require('../extratores/ProcessoTJRS');

const main = async () => {
  let extrator = new OabTJRS('https://www.tjrs.jus.br/site_php/consulta/index.php', false);

  let extracao = await extrator.extrair("24065RS");
  return extracao;
}

Promise.all([main()]).then(e => console.log(e));