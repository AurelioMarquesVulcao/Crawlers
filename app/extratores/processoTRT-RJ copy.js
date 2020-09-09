const axios = require('axios');
const { Robo } = require("../lib/robo");


class ExtratorTrtrj {
  constructor(url, isDebug) {
    // super(url, isDebug);
    this.robo = new Robo();
    this.url = `http://pje.trt1.jus.br/pje-consulta-api`;
    // this.dataSiteKey = '6LcX22AUAAAAABvrd9PDOqsE2Rlj0h3AijenXoft';

  }
  /**
   * Executa a extração da capa do cnj desejado.
   * @param {string} cnj Numero de processo a ser buscado.
   */
  async extrair(cnj) {

  }
  async captura(header, cnj) {
    console.log("entrou");
    const url = `${this.url}/api/processos/dadosbasicos/${cnj}`;

    //console.log(url.toString());
    const objResponse = await this.robo.acessar({
      url: url,
      // method: 'GET',
      encoding: "latin1",
      usaProxy: true,
      //usaJson: true,
      // params: null,
      headers: header
    });
    //console.log(objResponse.responseBody);
    const bodyRes = objResponse.responseBody;
    //console.log(bodyRes);
    const info = bodyRes[0];
    if (!info) { return null };

    // console.log(info);

    const objResponseCaptcha = await this.robo.acessar({
      url: `${this.url}/api/processos/${info.id}`,
      method: "GET",
      encoding: "latin1",
      usaProxy: true
    });
    // console.log(objResponseCaptcha);
    const desafio = objResponseCaptcha.responseBody
    // console.log(desafio);
    const captcha = {
      refinador: "trt_1",
      imagem: `${desafio.imagem}`
    }
    // console.log(captcha);
    console.log("Obtive o base64 do captcha");

    // await axios.post('http://172.16.16.8:8082/api/refinar/', captcha)
    // .then(function (response) {
    //   console.log(response);
    // })
    // .catch(function (error) {
    //   console.log(error);
    // })

    const resQuebrarCaptcha = await this.robo.acessar({
      url: `http://172.16.16.8:8082/api/refinar/`,
      method: "POST",
      encoding: "utf8",
      usaProxy: false,
      usaJson: true,
      params: captcha
    });
    console.log("api resolveu o captcha");
    console.log("Resposta do captcha ---- " + resQuebrarCaptcha.responseBody.texto);

    const captchaSolved = resQuebrarCaptcha.responseBody;

    if (captchaSolved.sucesso) {
      console.log(`Captcha quebrado com sucesso ${captchaSolved.texto}!`);
      const texto = captchaSolved.texto.replace(/[^a-z0-9]/g, "");
      console.log(texto);
      
      const detalheProcesso = await this.robo.acessar({
        url: `https://pje.trt1.jus.br/pje-consulta-api/api/processos/${info.id}?tokenDesafio=${desafio.tokenDesafio}&resposta=${texto}`,
        method: "get",
        encoding: "utf8",
        usaProxy: true,
        headers: header
      });
      //detalheProcesso
      console.log(detalheProcesso.responseBody);

    }


    console.log("Ativei captura");
  }


}
(async () => {
  console.log("Teste");
  await new ExtratorTrtrj().captura({ "X-Grau-Instancia": "1" }, "01006283220205010005")
  process.exit()
})()