let cheerio = require('cheerio');
const { antiCaptchaImage } = require('../lib/captchaHandler');
const { LogExecucao } = require('../lib/logExecucao');
const { TJRSParser } = require('../parsers/TJRSParser');
const { Robo } = require('../lib/newRobo');
const { ExtratorBase } = require('./extratores');

module.exports.ProcessoTJRS = class ProcessoTJRS extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new TJRSParser();
    this.robo = new Robo();
    // this.dataSiteKey = '6LcX22AUAAAAABvrd9PDOqsE2Rlj0h3AijenXoft';
  }

  async extrair(numeroOab, numeroProcesso, cadastroConsultaId, instancia = 1) {
    this.resposta = {};
    this.numeroProcesso = numeroProcesso;
    this.numeroOab = numeroOab.replace(/[A-Z]/g, '');
    this.ufOab = numeroOab.replace(/[0-9]/g, '');

    try {
      let objResponse;
      let captchaString;
      let captchaResposta;
      let processoOriginarioLink = false;
      let extracao;

      console.log('Fazendo primeiro acesso');
      await this.fazerPrimeiroAcesso();

      captchaString = await this.pegaCaptcha();

      captchaResposta = await this.resolveCaptcha(captchaString);

      objResponse = await this.validaCaptcha(captchaResposta);

      processoOriginarioLink = await this.verificaProcessoOriginario(
        objResponse.responseBody
      );

      if (processoOriginarioLink)
        extracao = await this.resgatarProcessoOriginario(
          processoOriginarioLink
        );
      else extracao = await this.converterProcesso(objResponse.responseBody); //entra na pagina inicial do processo, e nas 2 outras paginas de todas partes e todos andamentos

      return Promise.all([extracao]).then((extracao) => extracao);
    } catch (e) {
      console.log(e);
    }
  }

  async fazerPrimeiroAcesso() {
    const url =
      'https://www.tjrs.jus.br/novo/busca/?return=proc&client=wp_index';
    await this.robo.acessar({ url: this.url });
    return this.robo.acessar({ url });
  }

  async pegaCaptcha() {
    let objResponse;
    let expire = new Date();
    let time = new Date().getTime();
    expire.setTime(time + 365 * 3600000 * 24);
    let url = `https://www.tjrs.jus.br/site_php/consulta/human_check/humancheck_showcode.php?${time}`;

    objResponse = await this.robo.acessar({ url, responseType: 'arraybuffer' });
    return Buffer.from(objResponse.responseBody).toString('base64');
  }

  async resolveCaptcha(captchaString) {
    let resposta;
    let tentativa = 0;
    do {
      tentativa++;
      resposta = await antiCaptchaImage(captchaString);

      if (resposta.sucesso) return resposta.resposta;

      captchaString = await this.pegaCaptcha();
    } while (tentativa < 5);
  }

  async validaCaptcha(captcha) {
    const url = 'https://www.tjrs.jus.br/site_php/consulta/verifica_codigo.php';

    let comarca = comarcasCode[this.numeroProcesso.substr(22)];
    if (!comarca)
      comarca = comarcasCode["700"];

    let id_comarca = comarca.id;
    let nomeComarca = comarca.nome;

    let queryString = {
      nome_comarca: nomeComarca,
      versao: '',
      versao_fonetica: 2,
      tipo: 1,
      id_comarca: id_comarca,
      intervalo_movimentacao: 0,
      N1_var2: 1,
      id_comarca1: id_comarca,
      num_processo_mask: this.numeroProcesso,
      num_processo: this.numeroProcesso.replace(/\D/g, ''),
      numCNJ: 'S',
      id_comarca2: 700,
      uf_oab: this.ufOab,
      num_oab: '',
      foro: 0,
      N1_var2_1: 1,
      intervalo_movimentacao_1: 15,
      ordem_consulta: 1,
      N1_var: '',
      id_comarca3: 'todas',
      nome_parte: '',
      N1_var2_2: 1,
      intervalo_movimentacao_2: 0,
      code: captcha,
    };

    return await this.robo.acessar({ url, queryString });
  }

  async verificaProcessoOriginario(body) {
    const $ = cheerio.load(body);

    let processoOriginario = $('#conteudo > table:nth-child(2) > tbody > tr:nth-child(2) > td:nth-child(4)').text();

    if(!(/Processo\sOriginário/.test(processoOriginario))) return false;

    let linkOriginario = $(
      '#conteudo > table:nth-child(2) > tbody > tr:nth-child(2) > td:nth-child(5) > a'
    );



    processoOriginario =
      linkOriginario && linkOriginario[0]
        ? linkOriginario[0].attribs.href
        : false;

    return processoOriginario;
  }

  async converterProcesso(body) {
    let movimentacoes;
    let movimentacoesLink;
    let partes;
    let partesLink;
    let capa = body;

    const $ = cheerio.load(body);

    partesLink = $(
      '#conteudo > table:nth-child(6) > tbody > tr > td.texto_geral > a'
    )[0].attribs.href;
    movimentacoesLink = $(
      '#conteudo > table:nth-child(9) > tbody > tr > td.texto_geral > a'
    )[0].attribs.href;

    partes = await this.extrairPartes(partesLink);
    movimentacoes = await this.extrairMovimentacoes(movimentacoesLink);

    return Promise.resolve([capa, partes, movimentacoes]);
  }

  async extrairPartes(link) {
    let objResponse;
    let url = `https://www.tjrs.jus.br/site_php/consulta/${link}`;
    console.log('Extraindo partes');
    objResponse = await this.robo.acessar({ url: url });
    return objResponse.responseBody;
  }

  async extrairMovimentacoes(link) {
    let objResponse;
    let url = `https://www.tjrs.jus.br/site_php/consulta/${link}`;
    console.log('Extraindo movimentações');
    objResponse = await this.robo.acessar({ url: url });
    return objResponse.responseBody;
  }

  async resgatarProcessoOriginario(link) {
    let objResponse;
    let url = `https://www.tjrs.jus.br/site_php/consulta/${link}`;

    objResponse = await this.robo.acessar({ url });
    console.log('aaaaaaaa');
    return this.converterProcesso(objResponse.responseBody);
  }
};

const comarcasCode = {
  "700": {nome: "Tribunal de Justiça", id:"tribunal_de_justica"},
  "710": {nome: "Turmas Recursais", id:"turmas_recursais"},
  "001": {nome: "Porto Alegre", id:"porto_alegre"},
  "154": {nome: "Agudo", id:"agudo"},
  "002": {nome: "Alegrete", id:"alegrete"},
  "003": {nome: "Alvorada", id:"alvorada"},
  "079": {nome: "Antônio Prado", id:"antonio_prado"},
  "080": {nome: "Arroio do Meio", id:"arroio_do_meio"},
  "143": {nome: "Arroio do Tigre", id:"arroio_do_tigre"},
  "081": {nome: "Arroio Grande", id:"arroio_grande"},
  "082": {nome: "Arvorezinha", id:"arvorezinha"},
  "149": {nome: "Augusto Pestana", id:"augusto_pestana"},
  "004": {nome: "Bagé", id:"bage"},
  "140": {nome: "Barra do Ribeiro", id:"barra_do_ribeiro"},
  "005": {nome: "Bento Gonçalves", id:"bento_goncalves"},
  "083": {nome: "Bom Jesus", id:"bom_jesus"},
  "084": {nome: "Butiá", id:"butia"},
  "040": {nome: "Caçapava do Sul", id:"cacapava_do_sul"},
  "085": {nome: "Cacequi", id:"cacequi"},
  "006": {nome: "Cachoeira do Sul", id:"cachoeira_do_sul"},
  "086": {nome: "Cachoeirinha", id:"cachoeirinha"},
  "007": {nome: "Camaquã", id:"camaqua"},
  "150": {nome: "Campina das Missões", id:"campina_das_missoes"},
  "087": {nome: "Campo Bom", id:"campo_bom"},
  "088": {nome: "Campo Novo", id:"campo_novo"},
  "089": {nome: "Candelária", id:"candelaria"},
  "041": {nome: "Canela", id:"canela"},
  "042": {nome: "Canguçu", id:"cangucu"},
  "008": {nome: "Canoas", id:"canoas"},
  "141": {nome: "Capão da Canoa", id:"capao_da_canoa"},
  "009": {nome: "Carazinho", id:"carazinho"},
  "144": {nome: "Carlos Barbosa", id:"carlos_barbosa"},
  "090": {nome: "Casca", id:"casca"},
  "091": {nome: "Catuípe", id:"catuipe"},
  "010": {nome: "Caxias do Sul", id:"caxias_do_sul"},
  "043": {nome: "Cerro Largo", id:"cerro_largo"},
  "156": {nome: "Charqueadas", id:"charqueadas"},
  "092": {nome: "Constantina", id:"constantina"},
  "093": {nome: "Coronel Bicaco", id:"coronel_bicaco"},
  "094": {nome: "Crissiumal", id:"crissiumal"},
  "011": {nome: "Cruz Alta", id:"cruz_alta"},
  "145": {nome: "Dois Irmãos", id:"dois_irmaos"},
  "012": {nome: "Dom Pedrito", id:"dom_pedrito"},
  "165": {nome: "Eldorado do Sul", id:"eldorado_do_sul"},
  "044": {nome: "Encantado", id:"encantado"},
  "045": {nome: "Encruzilhada do Sul", id:"encruzilhada_do_sul"},
  "013": {nome: "Erechim", id:"erechim"},
  "046": {nome: "Espumoso", id:"espumoso"},
  "095": {nome: "Estância Velha", id:"estancia_velha"},
  "014": {nome: "Esteio", id:"esteio"},
  "047": {nome: "Estrela", id:"estrela"},
  "048": {nome: "Farroupilha", id:"farroupilha"},
  "096": {nome: "Faxinal do Soturno", id:"faxinal_do_soturno"},
  "146": {nome: "Feliz", id:"feliz"},
  "097": {nome: "Flores da Cunha", id:"flores_da_cunha"},
  "049": {nome: "Frederico Westphalen", id:"frederico_westphalen"},
  "051": {nome: "Garibaldi", id:"garibaldi"},
  "098": {nome: "Gaurama", id:"gaurama"},
  "099": {nome: "General Câmara", id:"general_camara"},
  "050": {nome: "Getúlio Vargas", id:"getulio_vargas"},
  "100": {nome: "Giruá", id:"girua"},
  "101": {nome: "Gramado", id:"gramado"},
  "015": {nome: "Gravataí", id:"gravatai"},
  "052": {nome: "Guaíba", id:"guaiba"},
  "053": {nome: "Guaporé", id:"guapore"},
  "102": {nome: "Guarani das Missões", id:"guarani_das_missoes"},
  "103": {nome: "Herval", id:"herval"},
  "104": {nome: "Horizontina", id:"horizontina"},
  "105": {nome: "Ibirubá", id:"ibiruba"},
  "142": {nome: "Igrejinha", id:"igrejinha"},
  "016": {nome: "Ijuí", id:"ijui"},
  "106": {nome: "Iraí", id:"irai"},
  "054": {nome: "Itaqui", id:"itaqui"},
  "166": {nome: "Ivoti", id:"ivoti"},
  "055": {nome: "Jaguarão", id:"jaguarao"},
  "107": {nome: "Jaguari", id:"jaguari"},
  "056": {nome: "Júlio de Castilhos", id:"julio_de_castilhos"},
  "057": {nome: "Lagoa Vermelha", id:"lagoa_vermelha"},
  "017": {nome: "Lajeado", id:"lajeado"},
  "108": {nome: "Lavras do Sul", id:"lavras_do_sul"},
  "109": {nome: "Marau", id:"marau"},
  "110": {nome: "Marcelino Ramos", id:"marcelino_ramos"},
  "018": {nome: "Montenegro", id:"montenegro"},
  "111": {nome: "Mostardas", id:"mostardas"},
  "112": {nome: "Não-Me-Toque", id:"nao_me_toque"},
  "113": {nome: "Nonoai", id:"nonoai"},
  "114": {nome: "Nova Petrópolis", id:"nova_petropolis"},
  "058": {nome: "Nova Prata", id:"nova_prata"},
  "019": {nome: "Novo Hamburgo", id:"novo_hamburgo"},
  "059": {nome: "Osório", id:"osorio"},
  "151": {nome: "Palmares do Sul", id:"palmares_do_sul"},
  "020": {nome: "Palmeira das Missões", id:"palmeira_das_missoes"},
  "060": {nome: "Panambi", id:"panambi"},
  "157": {nome: "Parobé", id:"parobe"},
  "021": {nome: "Passo Fundo", id:"passo_fundo"},
  "115": {nome: "Pedro Osório", id:"pedro_osorio"},
  "022": {nome: "Pelotas", id:"pelotas"},
  "117": {nome: "Pinheiro Machado", id:"pinheiro_machado"},
  "118": {nome: "Piratini", id:"piratini"},
  "116": {nome: "Planalto", id:"planalto"},
  "155": {nome: "Portão", id:"portao"},
  "119": {nome: "Porto Xavier", id:"porto_xavier"},
  "061": {nome: "Quaraí", id:"quarai"},
  "147": {nome: "Restinga Seca", id:"restinga_seca"},
  "023": {nome: "Rio Grande", id:"rio_grande"},
  "024": {nome: "Rio Pardo", id:"rio_pardo"},
  "158": {nome: "Rodeio Bonito", id:"rodeio_bonito"},
  "148": {nome: "Ronda Alta", id:"ronda_alta"},
  "062": {nome: "Rosário do Sul", id:"rosario_do_sul"},
  "161": {nome: "Salto do Jacuí", id:"salto_do_jacui"},
  "120": {nome: "Sananduva", id:"sananduva"},
  "121": {nome: "Santa Bárbara do Sul", id:"santa_barbara_do_sul"},
  "026": {nome: "Santa Cruz do Sul", id:"santa_cruz_do_sul"},
  "027": {nome: "Santa Maria", id:"santa_maria"},
  "028": {nome: "Santa Rosa", id:"santa_rosa"},
  "063": {nome: "Santa Vitória do Palmar", id:"santa_vitoria_do_palmar"},
  "025": {nome: "Santana do Livramento", id:"santana_do_livramento"},
  "064": {nome: "Santiago", id:"santiago"},
  "029": {nome: "Santo Ângelo", id:"santo_angelo"},
  "065": {nome: "Santo Antônio da Patrulha", id:"santo_antonio_da_patrulha"},
  "122": {nome: "Santo Antônio das Missões", id:"santo_antonio_das_missoes"},
  "123": {nome: "Santo Augusto", id:"santo_augusto"},
  "124": {nome: "Santo Cristo", id:"santo_cristo"},
  "030": {nome: "São Borja", id:"sao_borja"},
  "125": {nome: "São Francisco de Assis", id:"sao_francisco_de_assis"},
  "066": {nome: "São Francisco de Paula", id:"sao_francisco_de_paula"},
  "031": {nome: "São Gabriel", id:"sao_gabriel"},
  "032": {nome: "São Jerônimo", id:"sao_jeronimo"},
  "126": {nome: "São José do Norte", id:"sao_jose_do_norte"},
  "127": {nome: "São José do Ouro", id:"sao_jose_do_ouro"},
  "033": {nome: "São Leopoldo", id:"sao_leopoldo"},
  "067": {nome: "São Lourenço do Sul", id:"sao_lourenco_do_sul"},
  "034": {nome: "São Luiz Gonzaga", id:"sao_luiz_gonzaga"},
  "128": {nome: "São Marcos", id:"sao_marcos"},
  "129": {nome: "São Pedro do Sul", id:"sao_pedro_do_sul"},
  "068": {nome: "São Sebastião do Caí", id:"sao_sebastiao_do_cai"},
  "130": {nome: "São Sepé", id:"sao_sepe"},
  "152": {nome: "São Valentim", id:"sao_valentim"},
  "131": {nome: "São Vicente do Sul", id:"sao_vicente_do_sul"},
  "132": {nome: "Sapiranga", id:"sapiranga"},
  "035": {nome: "Sapucaia do Sul", id:"sapucaia_do_sul"},
  "069": {nome: "Sarandi", id:"sarandi"},
  "133": {nome: "Seberi", id:"seberi"},
  "134": {nome: "Sobradinho", id:"sobradinho"},
  "036": {nome: "Soledade", id:"soledade"},
  "135": {nome: "Tapejara", id:"tapejara"},
  "136": {nome: "Tapera", id:"tapera"},
  "137": {nome: "Tapes", id:"tapes"},
  "070": {nome: "Taquara", id:"taquara"},
  "071": {nome: "Taquari", id:"taquari"},
  "138": {nome: "Tenente Portela", id:"tenente_portela"},
  "163": {nome: "Terra de Areia", id:"terra_de_areia"},
  "159": {nome: "Teutônia", id:"teutonia"},
  "072": {nome: "Torres", id:"torres"},
  "073": {nome: "Tramandaí", id:"tramandai"},
  "164": {nome: "Três Coroas", id:"tres_coroas"},
  "074": {nome: "Três de Maio", id:"tres_de_maio"},
  "075": {nome: "Três Passos", id:"tres_passos"},
  "139": {nome: "Triunfo", id:"triunfo"},
  "153": {nome: "Tucunduva", id:"tucunduva"},
  "076": {nome: "Tupanciretã", id:"tupancireta"},
  "037": {nome: "Uruguaiana", id:"uruguaiana"},
  "038": {nome: "Vacaria", id:"vacaria"},
  "077": {nome: "Venâncio Aires", id:"venancio_aires"},
  "160": {nome: "Vera Cruz", id:"vera_cruz"},
  "078": {nome: "Veranópolis", id:"veranopolis"},
  "039": {nome: "Viamão", id:"viamao"},
  "160": {nome: "Vera Cruz", id:"vera_cruz"},
  "078": {nome: "Veranópolis", id:"veranopolis"},
  "039": {nome: "Viamão", id:"viamao"},
}