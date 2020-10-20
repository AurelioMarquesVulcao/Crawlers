const axios = require('axios');
const puppeter = require('puppeteer');
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

  it('Deve retornar a pagina carrega do Horário de Brasília através do puppeteer', () => {
    const browser = await puppeter.launch({
      // args: [
      //   '--proxy-server=http://proadvproxy:C4fMSSjzKR5v9dzg@proxy-proadv.7lan.net:8182',
      // ],
    });

    const page = await browser.newPage();
    try {
      await page.goto('https://www.horariodebrasilia.org/');g
    } catch (e) {
      await browser.close();
      done(e);
      return;
    }
    console.log(await page.evaluate(() => document.body.innerHTML));
    await browser.close();
    done();
  });
});
