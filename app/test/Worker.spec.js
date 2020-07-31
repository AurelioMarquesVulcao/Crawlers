const { PeticaoTJSP } = require('../extratores/PeticaoTJSP');

describe('Worker', async () => {
  const x = await new PeticaoTJSP({debug: true, headless: false}).extrair('1011131-88.2018.8.26.0562', 1);
  // const x = await new PeticaoTJSP({ headless: false }).extrair('0000261-83.2017.8.26.0546', 2);
  // const x = await new PeticaoTJSP({ headless: false }).extrair('1000907-79.2019.8.26.0102', 3);
  delete x['logs'];
  console.table(x);
  console.log('fim');
});
