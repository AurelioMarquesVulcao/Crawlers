const { PeticaoTJRS1 } = require('../extratores/PeticaoTJRS1');
const { OabTJRS } = require('../extratores/OabTJRS');
const Comarca = require('../models/schemas/comarcas');
require('../bootstrap');

const main = () => {
  // let extrator = new PeticaoTJRS1();

  // let extrator = new OabTJRS('https://www.tjrs.jus.br/site_php/consulta/index.php', false)
  // extrator.extrair("71775RS", "5fb6a87a9f0dbd915a12b0bc", 1).then(res => console.log(res));

  // extrator.extrair('5018418-72.2019.8.21.0001').then(resp => console.log(resp));

  // let comarca = new Comarca({Estado: 'RS', Comarca: '000', Nome: 'teste', Tribunal: 21, Orgao: 8, Metadados: {slang: 'comarca_code', outro: 'outro'}});
  // comarca.salvar().then(e => console.log(e));

  let feitos = Object.keys(comarcasCode).map((codigo) => {
    let comarca_obj = {
      Estado: 'MS',
      Comarca: codigo,
      Nome: comarcasCode[codigo].nome,
      Tribunal: 12,
      Orgao: 8,
      // Metadados: {
      //   tjrs_select_id: comarcasCode[codigo].id
      // },
      // UltimoProcesso: ultimosProcessos[Number(codigo)]
    };

    // if (ultimosProcessos[Number(codigo)])
    new Comarca(comarca_obj).salvar().then(
      (e) => console.log(e)
      // console.log(`${codigo} -> ${ultimosProcessos[Number(codigo)]}`)
    );
  });

  console.log(feitos.filter((e) => e).length);
};

const comarcasCode = {
  '49': { nome: 'Água Clara' },
  '4': { nome: 'Amambai' },
  '52': { nome: 'Anastácio' },
  '22': { nome: 'Anaurilândia' },
  '23': { nome: 'Angélica' },
  '24': { nome: 'Aparecida do Taboado' },
  '5': { nome: 'Aquidauana' },
  '25': { nome: 'Bandeirantes' },
  '26': { nome: 'Bataguassu' },
  '27': { nome: 'Batayporã' },
  '3': { nome: 'Bela Vista' },
  '28': { nome: 'Bonito' },
  '30': { nome: 'Brasilândia' },
  '31': { nome: 'Caarapó' },
  '6': { nome: 'Camapuã' },
  '1': { nome: 'Campo Grande' },
  '7': { nome: 'Cassilândia' },
  '46': { nome: 'Chapadão do Sul' },
  '8': { nome: 'Corumbá' },
  '9': { nome: 'Costa Rica' },
  '11': { nome: 'Coxim' },
  '32': { nome: 'Deodápolis' },
  '53': { nome: 'Dois Irmãos do Buriti' },
  '2': { nome: 'Dourados' },
  '33': { nome: 'Eldorado' },
  '10': { nome: 'Fátima do Sul' },
  '34': { nome: 'Glória de Dourados' },
  '35': { nome: 'Iguatemi' },
  '36': { nome: 'Inocência' },
  '37': { nome: 'Itaporã' },
  '51': { nome: 'Itaquiraí' },
  '12': { nome: 'Ivinhema' },
  '13': { nome: 'Jardim' },
  '14': { nome: 'Maracaju' },
  '15': { nome: 'Miranda' },
  '16': { nome: 'Mundo Novo' },
  '29': { nome: 'Naviraí' },
  '38': { nome: 'Nioaque' },
  '54': { nome: 'Nova Alvorada do Sul' },
  '17': { nome: 'Nova Andradina' },
  '18': { nome: 'Paranaíba' },
  '39': { nome: 'Pedro Gomes' },
  '19': { nome: 'Ponta Porã' },
  '40': { nome: 'Porto Murtinho' },
  '41': { nome: 'Ribas do Rio Pardo' },
  '20': { nome: 'Rio Brilhante' },
  '48': { nome: 'Rio Negro' },
  '42': { nome: 'Rio Verde de Mato Grosso' },
  '43': { nome: 'São Gabriel do Oeste' },
  '44': { nome: 'Sete Quedas' },
  '45': { nome: 'Sidrolândia' },
  '55': { nome: 'Sonora' },
  '47': { nome: 'Terenos' },
  '21': { nome: 'Três Lagoas' },
};

main();

// db.processo.aggregate([
//   {'$match': {
//       'CnjDetalhes.Tribunal': 21,
//       'CnjDetalhes.OrgaoJustica': 8,
//       'CnjDetalhes.Ano': 2020,
//     }},
//   {'$group': {
//       '_id': '$CnjDetalhes.UnidadeOrigem',
//       'NumeroCNJ': {'$max': '$NumeroCNJ'},
//     }},
//   {'$project': {
//       '_id': 0,
//       'Comarca': '$_id',
//       'NumeroCNJ': 1,
//     }},
// ])
