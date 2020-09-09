class ExtratorAndamentosTrtrj extends ExtratorBase {
    constructor(url, isDebug) {
      super(url, isDebug);
      this.parser = new TrtrjParser();
      this.qtdTentativas = 1;
    }
  
    /**
     * Executa a extracao do cnj
     * @param {string} cnj Numero do processo no padrão CNJ
     */
    async extrair(cnj) {    
  
      console.log();
      console.log(`ExtratorAndamentosTrtrj@extrair#${cnj}`);
      console.log();
      console.log("Debug? ", this.isDebug ? "Sim" : "Não");
      console.log();
  
      let extracao;
  
      try {
       
        if (cnj.length < 25)
          throw new BaseException("CNJ_INVALIDO","Cnj inválido, o cnj enviado possui menos de 25 caracteres!");
        if (!CnjValidator.validar(cnj))
          throw new BaseException("CNJ_INVALIDO", "Cnj inválido!");      
  
        extracao = await this.capturar({ "X-Grau-Instancia": "1" }, cnj);
  
        const extracao2ins = await this.capturar({ "X-Grau-Instancia": "2" } , cnj);
      
        if (extracao == null && extracao2ins == null)
          throw new ExtracaoException("SISTEMA_SAPWEB", null, "Extracao no sistema sapweb!");
          // throw new ExtracaoException('PROCESSO_NAO_ENCONTRADO', null, 'Processo não encontrado!');
  
        if (extracao2ins && extracao2ins.andamentos && extracao2ins.andamentos.length > 0) {
          if (!extracao)
            extracao = extracao2ins;
          else 
            extracao.andamentos = extracao.andamentos.concat(extracao2ins.andamentos);
        }
          
  
      } catch (e) {
  
        if (e instanceof RequestException) {
          throw new RequestException(e.code, e.status, e.message);
        } else if (e instanceof BaseException) {
          throw new BaseException(e.code, e.message);
        } else if (e instanceof ExtracaoException) {
          if (/ERRO_CAPTCHA/.test(e.code)) {
            if (this.qtdTentativas < 5) {
              console.log();
              console.log(`Captcha falhou!`, this.qtdTentativas);
              this.qtdTentativas += 1;
              extracao = await this.extrair(cnj);
            } else {
              // TODO enviar erro para a api do bruno pra informar que a quebra de captcha falhou
              throw new ExtracaoException(e.code, null, e.message);
            }
          } else if(/PROCESSO_SIGILOSO/.test(e.code)) {
            throw new ExtracaoException(e.code, null, e.message);
          } else throw new BaseException(e.code, e.message);
        } else {
          if (/ESOCKETTIMEDOUT|ETIMEDOUT|EBUSY|ECONNREFUSED|ECONNRESET|ENOPROTOOPT|EAI_AGAIN/.test(e.code)) {
            throw new RequestException(e.code, e.status, e.message);
          }
        }
      }
  
      return extracao;
    }
  
    async capturar(header, cnj) {
  
      let extracao;
  
      const numeroProcesso = cnj.replace(/[-.]/g, "");
      const url = `${this.url}/api/processos/dadosbasicos/${numeroProcesso}`;
      const objResponse = await this.robo.acessar(url, "GET", "latin1", true, false, null, header);
      const bodyRes = JSON.parse(objResponse.responseBody);
      const info = bodyRes[0];
   
      if(!info)
        return null
  
      const objResponseCaptcha = await this.robo.acessar(`${this.url}/api/processos/${info.id}`, "GET", "latin1", true);
      const desafio = JSON.parse(objResponseCaptcha.responseBody);
  
      // // salvando imagem do captcha atual
      // require("fs")
      //   .writeFile(`/var/www/html/assets/captcha/captcha_${numeroProcesso}.png`, 
      //     desafio.imagem, 'base64', 
      //     function (err) {
      //       if (err)
      //         console.log(err);
      // });
  
      const captcha = {
        refinador: "trt_1",
        imagem: desafio.imagem
      };
  
      console.log()
      console.log('aguardando quebra do captcha! Instancia:', header["X-Grau-Instancia"]);
  
      const resQuebrarCaptcha = await this.robo.acessar(`${bootstrap.captcha.url}/api/refinar/`, "post", "utf8", false, true, captcha);
  
      await sleep(600);
  
      const captchaSolved = resQuebrarCaptcha.responseBody;      
  
      if (captchaSolved.sucesso) {
  
        console.log(`Captcha quebrado com sucesso ${captchaSolved.texto}!`);
  
        const texto = captchaSolved.texto.replace(/[^a-z0-9]/g, "");
  
        const detalheProcesso = await this.robo.acessar(`https://pje.trt1.jus.br/pje-consulta-api/api/processos/${info.id}?tokenDesafio=${desafio.tokenDesafio}&resposta=${texto}`, "get", "utf8", true, false, null, header);
  
        const jsonResposta = JSON.parse(detalheProcesso.responseBody);
  
        if (jsonResposta.mensagem)
          throw new ExtracaoException("ERRO_CAPTCHA", null, "Captcha Falhou");
  
        if (jsonResposta.mensagemErro)
          throw new ExtracaoException("PROCESSO_SIGILOSO", null, "Processo com sigilo de justiça!");
  
        let parser = new TrtrjParser();
        parser.setDados(cnj, header["X-Grau-Instancia"]);
        extracao = parser.parse(jsonResposta);        
  
      }
      
      return extracao;
    }
  
    /**
     * Pre extracao e verificacao de inconsistencias ou lista de processos
     * @param {string} conteudo Html do site para verificacao
     */
    async preParse(conteudo) {
      const $ = cheerio.load(conteudo);
      let preParse = {
        linkLista: "",
        captcha: false,
        inconsistencias: [],
        response: null
      };
  
      if (/Erro\socorreu\:\sProcesso\sinexistente\./.test(conteudo))
        preParse.inconsistencias.push("Processo inexistente");
      if (/Erro\socorreu\:\sPar[aâ]metro incorreto\./.test(conteudo))
        preParse.inconsistencias.push("Parâmetro incorreto");
      if (/Processo\sinexistente\./.test(conteudo))
        preParse.inconsistencias.push("Processo inexistente");
      if (/Nenhum\sregistro\sencontrado\./.test(conteudo))
        preParse.inconsistencias.push("Nenhum registro encontrado!");
      if (/Nova\sconsulta/.test(conteudo))
        preParse.inconsistencias.push("Processo inexistente");
      if ($("#imgCaptcha").length > 0) preParse.captcha = true;
  
      if ($("#content > #form > table > tbody > tr > td > ul").length > 0) {
        const elemento = $(
          "#content > #form > table > tbody > tr > td > ul > li"
        ).first();
        if (elemento.find("a") && elemento.find("a").attr("href")) {
          preParse.linkLista = elemento
            .find("a")
            .attr("href")
            .trim();
        }
      }
  
      if (preParse.linkLista) {
        const objResponse = await this.robo.acessar(
          preParse.linkLista,
          "GET",
          "utf8"
        );
        preParse = await this.preParse(objResponse.responseBody);
        preParse.response = objResponse.responseBody;
        return preParse;
      }
  
      return preParse;
    }
  }