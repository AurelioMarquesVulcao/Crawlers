const { PeticaoTJSP } = require("../extratores/PeticaoTJSP");

describe('Worker', async () => {
  const x = await new PeticaoTJSP({headless: false}).extrair('1011131-88.2018.8.26.0562', 1);
  console.table(x);
  console.log('fim');
});
