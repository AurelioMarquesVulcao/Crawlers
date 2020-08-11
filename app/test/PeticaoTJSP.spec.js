const { PeticaoTJSP } = require('../extratores/PeticaoTJSP');

describe('PeticaoTJSP Worker', async () => {
  let teste;

  console.log('1 Instancia | Caso Perfeito');
  teste = await new PeticaoTJSP({debug: true, headless: false}).extrair('1011131-88.2018.8.26.0562', 1);

  console.log('1 Instancia | Caso com erro de consulta');
  teste = await new PeticaoTJSP({debug: true, headless: false}).extrair('1011131-88.2018.8.26.0362', 1);

  console.log('1 Instancia | Multiplos resultados na pesquisa');
  teste = await new PeticaoTJSP({debug: true, headless: false}).extrair('0000261-83.2017.8.26.0546', 1);

  console.log('2 Instancia | Caso Perfeito');
  teste = await new PeticaoTJSP({debug: true, headless: false}).extrair('0000261-83.2017.8.26.0546', 2);

  console.log('2 Instancia | Caso com erro de consulta');
  teste = await new PeticaoTJSP({debug: true, headless: false}).extrair('0200261-83.2017.8.26.0546', 2);

  console.log('3 Instancia | Caso Perfeito');
  teste = await new PeticaoTJSP({debug: true, headless: false}).extrair('1000907-79.2019.8.26.0102', 3);

  console.log('2 Instancia | Caso com erro de consulta');
  teste = await new PeticaoTJSP({debug: true, headless: false}).extrair('1200907-79.2019.8.26.0102', 3);

  console.log('---- Fim dos Testess ----');
});
