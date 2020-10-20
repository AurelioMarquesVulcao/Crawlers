const axios = require('axios');
const assert = require('assert');
const HttpsProxyAgent = require('https-proxy-agent');

describe('Test proxy', () => {
  it('Deve retornar status 200 para consulta do site Horário de Brasília', (done) => {
    let options = {};
    options.httpsAgent = new HttpsProxyAgent(
      'http://proadvproxy:C4fMSSjzKR5v9dzg@proxy-proadv.7lan.net:8182'
    );

    axios
      .get('https://www.horariodebrasilia.org/', options)
      .then((res) => {
        assert(
          res.status == 200,
          'Consulta com proxy não realizada com sucesso.'
        );
        done();
      })
      .catch(done);
  });
});
