const { PeticaoTJSP } = require('../extratores/PeticaoTJSP');

describe('PeticaoTJSP Worker', async () => {
  console.log('1 Instancia | Caso Perfeito');
  const teste = new PeticaoTJSP({ debug: true, headless: false }).extrair(
    '1011131-88.2018.8.26.0562',
    1
  );

  console.log('1 Instancia | Multiplos resultados na pesquisa');
  const teste = await new PeticaoTJSP({ debug: true, headless: false }).extrair(
    '1011131-88.2018.8.26.0562',
    1
  );

  console.log('1 Instancia | Caso com erro de consulta');
  const teste = await new PeticaoTJSP({ debug: true, headless: false }).extrair(
    '0000261-83.2017.8.26.0546',
    1
  );

  console.log('2 Instancia | Caso Perfeito');
  const teste = await new PeticaoTJSP({ debug: true, headless: false }).extrair(
    '0000261-83.2017.8.26.0546',
    2
  );

  console.log('2 Instancia | Caso com erro de consulta');
  const teste = await new PeticaoTJSP({ debug: true, headless: false }).extrair(
    '0000261-83.2017.8.26.0546',
    2
  );

  console.log('3 Instancia | Caso Perfeito');
  const teste = await new PeticaoTJSP({ debug: true, headless: false }).extrair(
    '1000907-79.2019.8.26.0102',
    3
  );

  console.log('2 Instancia | Caso com erro de consulta');
  const teste = await new PeticaoTJSP({ debug: true, headless: false }).extrair(
    '1200907-79.2019.8.26.0102',
    3
  );

  delete teste['logs'];
  console.table(teste);
});
