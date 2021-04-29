const oabsEsaj = require('./OabESAJ');
const processosEsaj = require('./ProcessoESAJ');
const peticaoEsaj = require('./PeticaoEsaj');

module.exports = {
  ...oabsEsaj,
  ...processosEsaj,
  ...peticaoEsaj,
};
