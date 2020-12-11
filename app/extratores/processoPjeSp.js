const cheerio = require('cheerio');
const { Robo } = require('../lib/newRobo');
const { Logger, Cnj } = require('../lib/util');
const { enums } = require('../configs/enums');
const sleep = require('await-sleep');
const { CaptchaHandler } = require('../lib/captchaHandler');
const HttpsProxyAgent = require('https-proxy-agent');




var heartBeat = 0;

setInterval(async function () {
  if (heartBeat == 340) {
    process.exit()
  }
  heartBeat++
  // console.log(heartBeat);
}, 1000);

class ExtratorPje {
  constructor() {
    this.red = '\u001b[31m';
    this.blue = '\u001b[34m';
    this.reset = '\u001b[0m';
    this.robo = new Robo();
    this.instancia1 = { 'X-Grau-Instancia': '1' };
    this.instancia2 = { 'X-Grau-Instancia': '2' };
    this.proxy = true
    // this.urlBase = "http://pje.trt#.jus.br/pje-consulta-api";
    this.key = "6LfRfkIUAAAAAIXuT_GrTfak46Mm6TTvUWAaDYfQ";

  }
  async baseMethod() { try { } catch (e) { console.log(e); } }

  async extrair(cnj) {
    let { sequencial, ano, estado, comarca } = Cnj.processoSlice(cnj);
    estado = parseInt(estado);

    // let id = null;
    // while (id == null) {
    //   id = await this.getId(cnj, this.instancia1, estado);
    // }
    // console.log(id);

    if (estado == 15) {
      // iniciando obtenção fornçada do formulario de inicio.
      let start = null;
      while (start == null) {
        start = await this.startPage(estado);
      };
      // console.log(start);
      let recapcha = await this.desafioRecapcha(estado, start, cnj);
      // console.log(recapcha);
      let resposta = await this.responseCapcha(start, recapcha, estado);
      resposta
      // console.log(resposta);
    }
    await this.extrair(cnj);
    // obtendo a imagem base 64 do capcha
    let captcha = await this.desafioCapcha(estado, id);
    console.log(!!captcha);

    let captchaSolve = await this.apiCapcha(captcha);
    console.log(captchaSolve);

    let processo = await this.processo(estado, id, captcha, captchaSolve);
    console.log(processo);

    return processo
  }

  async startPage(estado) {
    try {
      let url = `https://pje.trt${estado}.jus.br/consultaprocessual/`;
      let request = { url, proxy: this.proxy, method: "GET" };
      let get = await this.robo.acessar(request);
      let body = get.responseBody;
      let $ = cheerio.load(body);
      let datas = $("body > script")[0].children[0].data;
      let random = $("body > div.gcaptcha > form > input[type=hidden]:nth-child(3)").attr('value');
      let name = datas.match(/document\.getElementById\("bid"\)\.name\s+=\s?"(\w+)"/)[1];
      let value = datas.match(/document\.getElementById\("bid"\)\.value\s+=\s?"(\w+)"/)[1];
      let FormData = {
        url: url,
        random: random,
        name: name,
        value: value
      }
      this.logT("Form Data");
      console.table(FormData);
      return FormData
    } catch (e) {
      if (/'1' of null/gmi.test(e)) {
        this.logE("Form Data");
        return null
      } else {
        console.log(e);
      }

    }
  }

  async desafioRecapcha(estado, start, cnj) {
    try {
      let { url } = start;
      // let url = `https://pje.trt${estado}.jus.br/consultaprocessual/`;
      let response = await new CaptchaHandler(5, 15000, `PJE-${estado}`, { numeroDoProcesso: cnj }).resolveRecaptchaV2(url, this.key, "/");
      console.log(this.robo.cookies);
      console.log(this.robo.cookies);
      console.log(response.gResponse);
      process.exit();
      return response.gResponse
    } catch (e) {
      console.log(e);
    }
  }


  async responseCapcha(start, recapcha, estado) {
    try {

    let { random, name, value } = start
    console.log(start);
    // process.exit()
    let url = `https://pje.trt${estado}.jus.br/captcha/login_post.php`;
    let request = {
      url,
      proxy: this.proxy,
      method: "POST",
      debug: true,
      headers: {
        origin: `http://pje.trt${estado}.jus.br`,
        referer: `http://pje.trt${estado}.jus.br/consultaprocessual/`,
      },
      formData: {
        "g-recaptcha-response": recapcha,
        referer: "/consultaprocessual/",
        random: random,
        [name]: value
      }
    };
    let post = await this.robo.acessar(request);
    console.log(post);
    console.log(this.robo.cookies);
    this.logT("post_PHP")

  } catch(e) {
    console.log(e);
  }
}

/**
 * 
 * @param {string} cnj Cnj que se deseja consultar
 * @param {object} headers Objeto que referência a intãncia
 * @param {number} estado Numero do Estado que se deseja consultar
 * @returns Se o processo possuir 2 intãncia sera retornado true, se for primeira instancia o id do processo.
 */
async getId(cnj, headers, estado) {
  try {
    let url = `http://pje.trt${estado}.jus.br/pje-consulta-api/api/processos/dadosbasicos/${cnj}`;
    let request = { url, headers, proxy: this.proxy };
    let get = await this.robo.acessar(request);
    this.logT("id")
    return get.responseBody[0].id
  } catch (e) {
    // console.log(e);
    this.logE("id")
    return null
  }
}

async desafioCapcha(estado, id) {
  try {
    let url = `http://pje.trt${estado}.jus.br/pje-consulta-api/api/processos/${id}`;
    let request = { url, proxy: this.proxy, method: "GET", debut: true };
    let get = await this.robo.acessar(request);
    // console.log(get);
    let resposta = [{
      refinador: 'trt_1',
      imagem: get.responseBody.imagem,
    }, get.responseBody.tokenDesafio]
    this.logT("base64_Image");
    return resposta
  } catch (e) {
    this.logE("base64_Image");
    console.log(e);
    return null
  }
}

async apiCapcha(captcha) {
  console.log(captcha);
  try {
    let url = "http://172.16.16.8:8082/api/refinar/";
    // url: `http://127.0.0.1:8082/api/refinar/`,
    let request = {
      url,
      method: "POST",
      json: captcha[0],
    };
    let post = await this.robo.acessar(request);
    let texto = post.responseBody.texto.replace(/[^a-z0-9]/g, '');
    // texto.length = 5
    if (texto.length < 6) {
      throw this.red + "Capcha solve is too short" + this.reset
    }
    // console.log(post);
    this.logT("capchaSolve")
    return texto
  } catch (e) {
    this.logE("capchaSolve")
    console.log(e);
    process.exit();
  }
}

async processo(estado, id, captcha, captchaSolve) {
  try {
    let url = `https://pje.trt${estado}.jus.br/pje-consulta-api/api/processos/${id}?tokenDesafio=${captcha[1]}&resposta=${captchaSolve}`;
    let request = { url, proxy: this.proxy, method: "GET" };
    let get = await this.robo.acessar(request);
    let resultado = get.responseBody;
    if (get.mensagem) {
      throw 'Ocorreu um problema na solução do Captcha'
    }
    if (get.responseBody.mensagemErro) {
      return 'Não é possível obter devido ao processo ser sigiliso'
    }
    this.logT("Processo");
    return get.responseBody
  } catch (e) {
    this.logE("Processo");
    console.log(e);
    return null
  }
}

logT(name) {
  // const obj = [{
  //   Status: true,
  //   [name]: objeto
  // }];
  // console.table(obj);
  console.log(this.blue + `${name} => Obtido com sucesso!` + this.reset);
}
logE(name) {
  const obj = this.red + `Não foi possivél obter o.: ${name}` + this.reset;
  console.log(obj);
}

}

module.exports.ExtratorPje = ExtratorPje;




(async () => {
  // new ExtratorTrtPje().captura2({ 'X-Grau-Instancia': '1' }, "00114931020205150105", 15);
  // console.log(await new ExtratorPje().extrair("00114931020205150105"));
  await new ExtratorPje().extrair("00114931020205150105");
  // await new ExtratorPje().extrair("10013797020205020003");
  // await new ExtratorPje().extrair("00212492220205040211");
  process.exit()
})()


// const logger = new Logger(
//   'info',
//   'logs/ProcessoJTE/ProcessoTRT-RJInfo.log',
//   {
//     nomeRobo: enums.nomesRobos.TRTRJ,
//     NumeroDoProcesso: cnj,
//   }
// );
// logger.info('Iniciado captura do processo.');