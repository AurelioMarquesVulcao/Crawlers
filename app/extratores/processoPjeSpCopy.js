const cheerio = require('cheerio');
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const sleep = require('await-sleep')
require("dotenv/config");
const { JTEParser } = require('../parsers/JTEParser');
const shell = require('shelljs');
const { enums } = require('../configs/enums');



class RoboPuppeteer4 {
  constructor() {
    this.url = "https://pje.trt15.jus.br/consultaprocessual/";

  }




  async acessar() {

    this.browser = await puppeteer.launch({
      headless: false,
      slowMo: 1,
      ignoreHTTPSErrors: true,
      args: ['--ignore-certificate-errors', '--proxy-server=http://proxy-proadv.7lan.net:8182']
    });
    
    this.page = await this.browser.newPage();
    
    await this.page.authenticate({
      username: 'proadvproxy',
      password: 'C4fMSSjzKR5v9dzg',
    });
    

    let url = this.url

    console.log('O Puppeteer foi Iniciado corretamente');
    try {
      await this.page.goto(url, {
        waitUntil: "load",
        timeout: 40000,

      });
    } catch (e) {
      console.log(e);
    }
    console.log(`Tentando carregar a url => ${url}`);
  }

  async entrar() {
    await this.acessar();
    // await this.page.click("body > div.gcaptcha > form > p > input[type=submit]:nth-child(1)");

    await this.page.setRequestInterception(true);
    this.page.on('request', (request) => {
      const headers = request.headers();
      headers['X-Just-Must-Be-Request-In-All-Requests'] = '1';
      request.continue({
          headers, "g-recaptcha-response":"teste"
      });
  });
    // navigate to the website
    await this.page.goto('https://pje.trt15.jus.br/captcha/login_post.php');

  }


}



module.exports.RoboPuppeteer4 = RoboPuppeteer4;

(async () => {

  await new RoboPuppeteer4().entrar()
})()