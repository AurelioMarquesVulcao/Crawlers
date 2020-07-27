const { PeticaoTJSP } = require("../extratores/PeticaoTJSP");

describe('Worker', async () => {
  await new PeticaoTJSP().extrair('1011131-88.2018.8.26.0562', 1);
  console.log('x');
});
