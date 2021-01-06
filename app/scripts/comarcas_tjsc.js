const { PeticaoTJRS1 } = require('../extratores/PeticaoTJRS1');
const { OabTJRS } = require('../extratores/OabTJRS');
const Comarca = require('../models/schemas/comarcas');
require('../bootstrap');

const main = () => {
  // let extrator = new PeticaoTJRS1();

  let extrator = new OabTJRS(
    'https://www.tjrs.jus.br/site_php/consulta/index.php',
    false
  );
  // extrator
  //   .extrair('71775RS', '5fb6a87a9f0dbd915a12b0bc', 1)
  //   .then((res) => console.log(res));

  // extrator.extrair('5018418-72.2019.8.21.0001').then(resp => console.log(resp));

  // let comarca = new Comarca({Estado: 'RS', Comarca: '000', Nome: 'teste', Tribunal: 21, Orgao: 8, Metadados: {slang: 'comarca_code', outro: 'outro'}});
  // comarca.salvar().then(e => console.log(e));

  let feitos = Object.keys(comarcasCode).map(codigo => {
    let comarca_obj = {
      Estado: 'SC',
      Comarca: codigo,
      Nome: comarcasCode[codigo].nome,
      Tribunal: 8,
      Orgao: 24,
      // Metadados: {
      //   tjrs_select_id: comarcasCode[codigo].id
      // },
    }

    // if (ultimosProcessos[Number(codigo)])
    new Comarca(comarca_obj).salvar().then(res => 'salvo')
    // .then(e => console.log(`${codigo} -> ${}`)).catch(err => console.log(err))
  })
  //
  // console.log(feitos.filter(e => e).length)
};



const comarcasCode = {
  '1': { nome: 'FLORIANÓPOLIS' },
  '2': { nome: 'BLUMENAU' },
  '3': { nome: 'CRICIÚMA' },
  '4': { nome: 'JOINVILLE' },
  '5': { nome: 'ITAJAÍ' },
  '6': { nome: 'TUBARÃO' },
  '7': { nome: 'LAGES' },
  '8': { nome: 'CONCÓRDIA' },
  '9': { nome: 'CHAPECÓ' },
  '10': { nome: 'BRUSQUE' },
  '11': { nome: 'RIO DO SUL' },
  '12': { nome: 'JOAÇABA' },
  '13': { nome: 'CAÇADOR' },
  '14': { nome: 'FLORIANÓPOLIS' },
  '15': { nome: 'SÃO MIGUEL DO OESTE' },
  '16': { nome: 'JOINVILLE' },
  '17': { nome: 'MAFRA' },
  '18': { nome: 'BLUMENAU' },
  '19': { nome: 'JARAGUÁ DO SUL' },
  '20': { nome: 'VIDEIRA' },
  '21': { nome: 'CANOINHAS' },
  '22': { nome: 'ITAJAÍ' },
  '23': { nome: 'ARARANGUÁ' },
  '24': { nome: 'SÃO BENTO DO SUL' },
  '25': { nome: 'XANXERÊ' },
  '26': { nome: 'FLORIANÓPOLIS' },
  '27': { nome: 'CRICIÚMA' },
  '28': { nome: 'JOINVILLE' },
  '29': { nome: 'LAGES' },
  '30': { nome: 'JOINVILLE' },
  '31': { nome: 'SÃO JOSÉ' },
  '32': { nome: 'SÃO JOSÉ' },
  '33': { nome: 'INDAIAL' },
  '34': { nome: 'FLORIANÓPOLIS' },
  '35': { nome: 'FLORIANÓPOLIS' },
  '36': { nome: 'FLORIANÓPOLIS' },
  '37': { nome: 'FLORIANÓPOLIS' },
  '38': { nome: 'CHAPECÓ' },
  '39': { nome: 'BLUMENAU' },
  '40': { nome: 'BALNEÁRIO CAMBORIÚ' },
  '41': { nome: 'TUBARÃO' },
  '42': { nome: 'CURITIBANOS' },
  '43': { nome: 'IMBITUBA' },
  '44': { nome: 'PORTO UNIÃO' },
  '45': { nome: 'BALNEÁRIO CAMBORIÚ' },
  '46': { nome: 'JARAGUÁ DO SUL' },
  '47': { nome: 'ITAJAÍ' },
  '48': { nome: 'RIO DO SUL' },
  '49': { nome: 'FRAIBURGO' },
  '50': { nome: 'JOINVILLE' },
  '51': { nome: 'BLUMENAU' },
  '52': { nome: 'TIMBÓ' },
  '53': { nome: 'CRICIÚMA' },
  '54': { nome: 'SÃO JOSÉ' },
  '55': { nome: 'CIRCIÚMA' },
}

main()