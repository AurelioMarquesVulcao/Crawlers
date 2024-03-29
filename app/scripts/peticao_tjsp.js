const { PeticaoTJRS1 } = require('../extratores/PeticaoTJRS1');
const Comarca = require('../models/schemas/comarcas');
require('../bootstrap');


const main =() => {
  // let extrator = new PeticaoTJRS1();

  // extrator.extrair('5018418-72.2019.8.21.0001').then(resp => console.log(resp));

  // let comarca = new Comarca({Estado: 'RS', Comarca: '000', Nome: 'teste', Tribunal: 21, Orgao: 8, Metadados: {slang: 'comarca_code', outro: 'outro'}});
  // comarca.salvar().then(e => console.log(e));

  let feitos = Object.keys(comarcasCode).map(codigo => {
    let comarca_obj = {
      Estado: 'SP',
      Comarca: codigo,
      Nome: comarcasCode[codigo].nome,
      Tribunal: 8,
      Orgao: 26,
    }

    if (ultimosProcessos[Number(codigo)])
      comarca_obj.UltimoProcesso = ultimosProcessos[Number(codigo)]

    return new Comarca(comarca_obj).salvar().then(e => console.log(`${codigo} -> ${ultimosProcessos[Number(codigo)]}`));
    // if (!ultimosProcessos[Number(codigo)]) {
    //   console.log(codigo)
    // }
  })

  console.log(Promise.all(feitos).then(e => console.log(e.length)))
}


const comarcasCode = {
  "0": {nome: "São Paulo"},
  "1": {nome: "São Paulo"},
  "2": {nome: "São Paulo"},
  "3": {nome: "São Paulo"},
  "4": {nome: "São Paulo"},
  "5": {nome: "São Paulo"},
  "6": {nome: "São Paulo"},
  "7": {nome: "São Paulo"},
  "8": {nome: "São Paulo"},
  "9": {nome: "São Paulo"},
  "10": {nome: "São Paulo"},
  "11": {nome: "São Paulo"},
  "12": {nome: "São Paulo"},
  "13": {nome: "São Paulo"},
  "14": {nome: "São Paulo"},
  "15": {nome: "São Paulo"},
  "16": {nome: "São Paulo"},
  "17": {nome: "São Paulo"},
  "18": {nome: "São Paulo"},
  "19": {nome: "Americana"},
  "20": {nome: "São Paulo"},
  "21": {nome: "São Paulo"},
  "22": {nome: "Amparo"},
  "24": {nome: "Andradina"},
  "25": {nome: "Angatuba"},
  "28": {nome: "Aparecida"},
  "30": {nome: "Apiaí"},
  "32": {nome: "Araçatuba"},
  "35": {nome: "Águas de Lindóia"},
  "37": {nome: "Araraquara"},
  "38": {nome: "Araras"},
  "40": {nome: "Araraquara"},
  "42": {nome: "Altinópolis"},
  "45": {nome: "Santa Isabel"},
  "47": {nome: "Assis"},
  "48": {nome: "Atibaia"},
  "50": {nome: "São Paulo"},
  "52": {nome: "São Paulo"},
  "53": {nome: "São Paulo"},
  "58": {nome: "Agudos"},
  "59": {nome: "Bananal"},
  "60": {nome: "Auriflama"},
  "62": {nome: "Bariri"},
  "63": {nome: "Barra Bonita"},
  "66": {nome: "Barretos"},
  "67": {nome: "Borborema"},
  "68": {nome: "Barueri"},
  "69": {nome: "Tupã"},
  "70": {nome: "Batatais"},
  "71": {nome: "Bauru"},
  "72": {nome: "Bebedouro"},
  "73": {nome: "Avaré"},
  "75": {nome: "Santos"},
  "76": {nome: "Bilac"},
  "77": {nome: "Birigüi"},
  "79": {nome: "Botucatu"},
  "80": {nome: "Cabreúva"},
  "81": {nome: "Adamantina"},
  "82": {nome: "Boituva"},
  "83": {nome: "Aguaí"},
  "84": {nome: "Campinas"},
  "85": {nome: "São Paulo"},
  "86": {nome: "São Paulo"},
  "87": {nome: "São Paulo"},
  "88": {nome: "São Paulo"},
  "89": {nome: "São Paulo"},
  "90": {nome: "São Paulo"},
  "91": {nome: "Mogi das Cruzes"},
  "93": {nome: "Guarujá"},
  "94": {nome: "Brodowski"},
  "95": {nome: "Brotas"},
  "97": {nome: "Buritama"},
  "99": {nome: "Bragança Paulista"},
  "100": {nome: "São Paulo"},
  "101": {nome: "Caçapava"},
  "102": {nome: "Cachoeira Paulista"},
  "103": {nome: "Caconde"},
  "104": {nome: "Cafelândia"},
  "106": {nome: "Franco da Rocha"},
  "108": {nome: "Jundiaí"},
  "111": {nome: "Cajuru"},
  "114": {nome: "Campinas"},
  "115": {nome: "Jundiaí"},
  "116": {nome: "Campos do Jordão"},
  "118": {nome: "Cananéia"},
  "120": {nome: "Cândido Mota"},
  "123": {nome: "Capão Bonito"},
  "125": {nome: "Capivari"},
  "126": {nome: "Caraguatatuba"},
  "127": {nome: "Carapicuíba"},
  "128": {nome: "Cardoso"},
  "129": {nome: "Casa Branca"},
  "132": {nome: "Catanduva"},
  "136": {nome: "Cerqueira César"},
  "137": {nome: "Cerquilho"},
  "140": {nome: "Chavantes"},
  "142": {nome: "Colina"},
  "144": {nome: "Mogi-Mirim"},
  "145": {nome: "Conchas"},
  "146": {nome: "Cordeirópolis"},
  "150": {nome: "Cosmópolis"},
  "152": {nome: "Cotia"},
  "153": {nome: "Cravinhos"},
  "156": {nome: "Cruzeiro"},
  "157": {nome: "Cubatão"},
  "159": {nome: "Cunha"},
  "160": {nome: "Descalvado"},
  "161": {nome: "Diadema"},
  "165": {nome: "Dois Córregos"},
  "168": {nome: "Dracena"},
  "169": {nome: "Duartina"},
  "172": {nome: "Eldorado"},
  "176": {nome: "Embu"},
  "177": {nome: "Itapecerica da Serra"},
  "180": {nome: "Espírito Santo do Pinhal"},
  "185": {nome: "Estrela D'Oeste"},
  "187": {nome: "Fartura"},
  "189": {nome: "Fernandópolis"},
  "191": {nome: "Poá"},
  "196": {nome: "Franca"},
  "197": {nome: "Francisco Morato"},
  "198": {nome: "Franco da Rocha"},
  "200": {nome: "Gália"},
  "201": {nome: "Garça"},
  "204": {nome: "General Salgado"},
  "205": {nome: "Getulina"},
  "210": {nome: "Guaíra"},
  "213": {nome: "Guará"},
  "218": {nome: "Guararapes"},
  "219": {nome: "Mogi das Cruzes"},
  "220": {nome: "Guaratinguetá"},
  "222": {nome: "Guariba"},
  "223": {nome: "Guarujá"},
  "224": {nome: "Guarulhos"},
  "229": {nome: "Sumaré"},
  "233": {nome: "São Carlos"},
  "236": {nome: "Ibitinga"},
  "238": {nome: "Ibiúna"},
  "240": {nome: "Rancharia"},
  "242": {nome: "Igarapava"},
  "244": {nome: "Iguape"},
  "246": {nome: "Ilha Solteira"},
  "247": {nome: "São Sebastião"},
  "248": {nome: "Indaiatuba"},
  "252": {nome: "Ipauçu"},
  "257": {nome: "Ipuã"},
  "262": {nome: "Itapeva"},
  "263": {nome: "Itaí"},
  "264": {nome: "Novo Horizonte"},
  "266": {nome: "Itanhaém"},
  "268": {nome: "Itapecerica da Serra"},
  "269": {nome: "Itapetininga"},
  "270": {nome: "Itapeva"},
  "271": {nome: "Itapevi"},
  "272": {nome: "Itapira"},
  "274": {nome: "Itápolis"},
  "275": {nome: "Itaporanga"},
  "278": {nome: "Itaquaquecetuba"},
  "279": {nome: "Itararé"},
  "280": {nome: "Itanhaém"},
  "281": {nome: "Itatiba"},
  "282": {nome: "Botucatu"},
  "283": {nome: "Rio Claro"},
  "286": {nome: "Itu"},
  "288": {nome: "Ituverava"},
  "291": {nome: "Jaboticabal"},
  "292": {nome: "Jacareí"},
  "294": {nome: "Jacupiranga"},
  "296": {nome: "Jaguariúna"},
  "297": {nome: "Jales"},
  "299": {nome: "Barueri"},
  "300": {nome: "Jardinópolis"},
  "301": {nome: "Atibaia"},
  "302": {nome: "Jaú"},
  "306": {nome: "José Bonifácio"},
  "309": {nome: "Jundiaí"},
  "311": {nome: "Junqueirópolis"},
  "312": {nome: "Juquiá"},
  "315": {nome: "Laranjal Paulista"},
  "318": {nome: "Leme"},
  "319": {nome: "Lençóis Paulista"},
  "320": {nome: "Limeira"},
  "322": {nome: "Lins"},
  "323": {nome: "Lorena"},
  "326": {nome: "Lucélia"},
  "333": {nome: "Macatuba"},
  "334": {nome: "Monte Aprazível"},
  "337": {nome: "Mairinque"},
  "338": {nome: "Mairiporã"},
  "341": {nome: "Maracaí"},
  "344": {nome: "Marília"},
  "346": {nome: "Martinópolis"},
  "347": {nome: "Matão"},
  "348": {nome: "Mauá"},
  "352": {nome: "Miguelópolis"},
  "355": {nome: "Miracatu"},
  "356": {nome: "Mirandópolis"},
  "357": {nome: "Mirante do Paranapanema"},
  "358": {nome: "Mirassol"},
  "360": {nome: "Mococa"},
  "361": {nome: "Mogi das Cruzes"},
  "362": {nome: "Mogi-Guaçu"},
  "363": {nome: "Mogi-Mirim"},
  "366": {nome: "Mongaguá"},
  "368": {nome: "Monte Alto"},
  "369": {nome: "Monte Aprazível"},
  "370": {nome: "Monte Azul Paulista"},
  "372": {nome: "Monte Mor"},
  "374": {nome: "Morro Agudo"},
  "382": {nome: "Mirassol"},
  "383": {nome: "Nhandeara"},
  "390": {nome: "Nova Granada"},
  "394": {nome: "Nova Odessa"},
  "396": {nome: "Novo Horizonte"},
  "397": {nome: "Nuporanga"},
  "400": {nome: "Olímpia"},
  "404": {nome: "Orlândia"},
  "405": {nome: "Osasco"},
  "407": {nome: "Osvaldo Cruz"},
  "408": {nome: "Ourinhos"},
  "411": {nome: "Pacaembu"},
  "412": {nome: "Palestina"},
  "414": {nome: "Palmeira D'Oeste"},
  "415": {nome: "Palmital"},
  "416": {nome: "Panorama"},
  "417": {nome: "Paraguaçu Paulista"},
  "418": {nome: "Paraibuna"},
  "420": {nome: "Avaré"},
  "424": {nome: "Jacupiranga"},
  "426": {nome: "Patrocínio Paulista"},
  "428": {nome: "Campinas"},
  "430": {nome: "Paulo de Faria"},
  "431": {nome: "Pederneiras"},
  "434": {nome: "Pedregulho"},
  "435": {nome: "Pedreira"},
  "438": {nome: "Penápolis"},
  "439": {nome: "Pereira Barreto"},
  "441": {nome: "Peruíbe"},
  "443": {nome: "Piedade"},
  "444": {nome: "Pilar do Sul"},
  "445": {nome: "Pindamonhangaba"},
  "447": {nome: "Bragança Paulista"},
  "449": {nome: "Lorena"},
  "450": {nome: "Piracaia"},
  "451": {nome: "Piracicaba"},
  "452": {nome: "Piraju"},
  "453": {nome: "Pirajuí"},
  "456": {nome: "Pirapozinho"},
  "457": {nome: "Pirassununga"},
  "458": {nome: "Piratininga"},
  "459": {nome: "Pitangueiras"},
  "462": {nome: "Poá"},
  "464": {nome: "Pompéia"},
  "466": {nome: "Pontal"},
  "470": {nome: "Porangaba"},
  "471": {nome: "Porto Feliz"},
  "472": {nome: "Porto Ferreira"},
  "474": {nome: "Potirendaba"},
  "477": {nome: "Praia Grande"},
  "480": {nome: "Presidente Bernardes"},
  "481": {nome: "Presidente Epitácio"},
  "482": {nome: "Presidente Prudente"},
  "483": {nome: "Presidente Venceslau"},
  "484": {nome: "Promissão"},
  "486": {nome: "Quatá"},
  "488": {nome: "Queluz"},
  "491": {nome: "Rancharia"},
  "493": {nome: "Regente Feijó"},
  "495": {nome: "Registro"},
  "498": {nome: "Ribeirão Bonito"},
  "505": {nome: "Ribeirão Pires"},
  "506": {nome: "Ribeirão Preto"},
  "510": {nome: "Rio Claro"},
  "511": {nome: "Piracicaba"},
  "512": {nome: "Ribeirão Pires"},
  "515": {nome: "Rosana"},
  "516": {nome: "Aparecida"},
  "523": {nome: "Santa Branca"},
  "526": {nome: "Salto"},
  "531": {nome: "Santa Adélia"},
  "533": {nome: "Santa Bárbara D'Oeste"},
  "534": {nome: "Santa Branca"},
  "538": {nome: "Santa Cruz das Palmeiras"},
  "539": {nome: "Santa Cruz do Rio Pardo"},
  "541": {nome: "Santa Fé do Sul"},
  "543": {nome: "Santa Isabel"},
  "547": {nome: "Santa Rita do Passa Quatro"},
  "549": {nome: "Santa Rosa de Viterbo"},
  "553": {nome: "Santo Anastácio"},
  "554": {nome: "Santo André"},
  "562": {nome: "Santos"},
  "563": {nome: "São Bento do Sapucaí"},
  "564": {nome: "São Bernardo do Campo"},
  "565": {nome: "São Caetano do Sul"},
  "566": {nome: "São Carlos"},
  "568": {nome: "São João da Boa Vista"},
  "572": {nome: "São Joaquim da Barra"},
  "575": {nome: "São José do Rio Pardo"},
  "576": {nome: "São José do Rio Preto"},
  "577": {nome: "São José dos Campos"},
  "579": {nome: "São Luiz do Paraitinga"},
  "581": {nome: "São Manuel"},
  "582": {nome: "São Miguel Arcanjo"},
  "584": {nome: "São Pedro"},
  "586": {nome: "São Roque"},
  "587": {nome: "São Sebastião"},
  "588": {nome: "São José do Rio Pardo"},
  "589": {nome: "São Simão"},
  "590": {nome: "São Vicente"},
  "595": {nome: "Serra Negra"},
  "596": {nome: "Serrana"},
  "597": {nome: "Sertãozinho"},
  "601": {nome: "Socorro"},
  "602": {nome: "Sorocaba"},
  "604": {nome: "Sumaré"},
  "606": {nome: "Suzano"},
  "607": {nome: "Catanduva"},
  "609": {nome: "Taboão da Serra"},
  "614": {nome: "Tambaú"},
  "615": {nome: "Tanabi"},
  "619": {nome: "Taquaritinga"},
  "620": {nome: "Taquarituba"},
  "624": {nome: "Tatuí"},
  "625": {nome: "Taubaté"},
  "627": {nome: "Teodoro Sampaio"},
  "629": {nome: "Tietê"},
  "634": {nome: "Tremembé"},
  "637": {nome: "Tupã"},
  "638": {nome: "Tupi Paulista"},
  "642": {nome: "Ubatuba"},
  "646": {nome: "Urânia"},
  "648": {nome: "Urupês"},
  "650": {nome: "Valinhos"},
  "651": {nome: "Valparaíso"},
  "653": {nome: "Vargem Grande do Sul"},
  "654": {nome: "Cotia"},
  "655": {nome: "Várzea Paulista"},
  "659": {nome: "Vinhedo"},
  "660": {nome: "Viradouro"},
  "663": {nome: "Votorantim"},
  "664": {nome: "Votuporanga"},
  "665": {nome: "Presidente Prudente"},
  "666": {nome: "Mogi-Mirim"},
  "667": {nome: "Jacupiranga"},
  "668": {nome: "Sertãozinho"},
  "669": {nome: "Porangaba"},
  "670": {nome: "Jacupiranga"},
  "671": {nome: "Olímpia"},
  "672": {nome: "Tatuí"},
  "673": {nome: "Adamantina"},
  "674": {nome: "Assis"},
  "675": {nome: "São José do Rio Preto"},
  "676": {nome: "Mirandópolis"},
  "677": {nome: "Ibitinga"},
  "678": {nome: "Barra Bonita"},
  "679": {nome: "Jundiaí"},
  "680": {nome: "Itapecerica da Serra"},
  "681": {nome: "Vinhedo"},
  "682": {nome: "Monte Aprazível"},
  "683": {nome: "Paulo de Faria"},
  "684": {nome: "Bananal"},
  "685": {nome: "Itapecerica da Serra"},
  "686": {nome: "Cachoeira Paulista"},
  "687": {nome: "Pereira Barreto"},
  "688": {nome: "Assis"},
  "689": {nome: "Santa Fé do Sul"},
  "690": {nome: "Votuporanga"},
  "691": {nome: "Itapeva"},
  "692": {nome: "Ribeirão Bonito"},
  "693": {nome: "Tatuí"},
  "694": {nome: "Piracaia"},
  "695": {nome: "Atibaia"},
  "696": {nome: "Fernandópolis"},
  "697": {nome: "Jales"},
  "698": {nome: "Monte Alto"},
  "699": {nome: "Sorocaba"},
  "700": {nome: "Olímpia"},
  "701": {nome: "Ibitinga"},
  "702": {nome: "São Paulo"},
  "703": {nome: "São Paulo"},
  "704": {nome: "São Paulo"},
  "705": {nome: "Aspásia"},
  "706": {nome: "Bernardino de Campos"},
  "707": {nome: "Pindorama"},
  "708": {nome: "Santa Salete"},
  "709": {nome: "Santa Albertina"},
  "710": {nome: "São Paulo"},
  "990": {nome: "São Paulo"},
}

const ultimosProcessos = {
  "9046":"3000017-12.2020.8.26.9046",
  "234":"0000005-04.2020.8.26.0234",
  "800":"0000118-06.2020.8.26.0800",
  "243":"1500033-65.2020.8.26.0243",
  "9029":"3000009-86.2020.8.26.9029",
  "500":"2000003-75.2020.8.26.0500",
  "9052":"3000009-17.2020.8.26.9052",
  "9054":"3000022-10.2020.8.26.9054",
  "9034":"3000007-04.2020.8.26.9034",
  "260":"1000380-07.2020.8.26.0260",
  "458":"1500344-90.2020.8.26.0458",
  "417":"1500886-37.2020.8.26.0417",
  "352":"1500239-43.2020.8.26.0352",
  "9057":"0100062-42.2020.8.26.9057",
  "608":"1500238-66.2020.8.26.0608",
  "333":"1500163-76.2020.8.26.0333",
  "9004":"0100266-51.2020.8.26.9004",
  "240":"1500127-22.2020.8.26.0240",
  "154":"1000224-46.2020.8.26.0154",
  "596":"1500373-17.2020.8.26.0596",
  "459":"1500505-97.2020.8.26.0459",
  "9017":"3000013-62.2020.8.26.9017",
  "498":"1500305-70.2020.8.26.0498",
  "493":"1500527-53.2020.8.26.0493",
  "488":"2000005-81.2020.8.26.0488",
  "355":"1500162-25.2020.8.26.0355",
  "312":"1500406-83.2020.8.26.0312",
  "275":"1500319-44.2020.8.26.0275",
  "9055":"3000008-23.2020.8.26.9055",
  "264":"1500343-08.2020.8.26.0264",
  "9037":"3000012-17.2020.8.26.9037",
  "159":"1500153-69.2020.8.26.0159",
  "118":"1502392-72.2020.8.26.0118",
  "620":"1500516-31.2020.8.26.0620",
  "614":"1500412-57.2020.8.26.0614",
  "595":"1500630-45.2020.8.26.0595",
  "588":"1500324-97.2020.8.26.0588",
  "582":"1500777-13.2020.8.26.0582",
  "474":"1500348-79.2020.8.26.0474",
  "435":"1500400-95.2020.8.26.0435",
  "420":"1500233-26.2020.8.26.0420",
  "534":"1500152-26.2020.8.26.0534",
  "516":"1500076-56.2020.8.26.0516",
  "360":"2000010-02.2020.8.26.0360",
  "357":"1500370-03.2020.8.26.0357",
  "142":"9000001-90.2020.8.26.0142",
  "137":"2222971-63.2020.8.26.0137",
  "128":"7000001-69.2020.8.26.0128",
  "297":"1501741-85.2020.8.26.0297",
  "514":"1501340-17.2020.8.26.0514",
  "108":"1500810-67.2020.8.26.0108",
  "102":"1500683-50.2020.8.26.0102",
  "272":"1501073-92.2020.8.26.0272",
  "262":"1500207-17.2020.8.26.0262",
  "106":"1500644-41.2020.8.26.0106",
  "438":"1503221-63.2020.8.26.0438",
  "418":"1500281-88.2020.8.26.0418",
  "382":"1500073-18.2020.8.26.0382",
  "428":"1502160-03.2020.8.26.0428",
  "50":"9000569-91.2020.8.26.0050",
  "450":"1501003-26.2020.8.26.0450",
  "543":"1500515-83.2020.8.26.0543",
  "9049":"3000028-32.2020.8.26.9049",
  "323":"1501548-89.2020.8.26.0323",
  "60":"1500238-61.2020.8.26.0060",
  "558":"1500471-19.2020.8.26.0558",
  "368":"1500821-92.2020.8.26.0368",
  "633":"1500321-07.2020.8.26.0633",
  "628":"1501961-60.2020.8.26.0628",
  "506":"9000005-05.2020.8.26.0506",
  "426":"1500412-39.2020.8.26.0426",
  "319":"1501358-41.2020.8.26.0319",
  "535":"1502431-79.2020.8.26.0535",
  "544":"1502498-17.2020.8.26.0544",
  "104":"1500409-80.2020.8.26.0104",
  "523":"1500134-38.2020.8.26.0523",
  "9031":"3000007-13.2020.8.26.9031",
  "302":"9000022-71.2020.8.26.0302",
  "38":"1511979-67.2020.8.26.0038",
  "9009":"3000042-39.2020.8.26.9009",
  "605":"1500307-10.2020.8.26.0605",
  "550":"1500341-53.2020.8.26.0550",
  "125":"1502972-81.2020.8.26.0125",
  "397":"1500432-20.2020.8.26.0397",
  "180":"1501171-62.2020.8.26.0180",
  "9023":"3000023-88.2020.8.26.9023",
  "176":"1501965-95.2020.8.26.0176",
  "505":"1503055-24.2020.8.26.0505",
  "168":"9000011-56.2020.8.26.0168",
  "431":"1502007-58.2020.8.26.0431",
  "47":"9000014-83.2020.8.26.0047",
  "9044":"3000103-86.2020.8.26.9044",
  "537":"1502099-09.2020.8.26.0537",
  "320":"9000002-26.2020.8.26.0320",
  "161":"1506749-63.2020.8.26.0161",
  "621":"1500939-85.2020.8.26.0621",
  "362":"1504057-70.2020.8.26.0362",
  "152":"7000005-34.2020.8.26.0152",
  "9053":"3000003-07.2020.8.26.9053",
  "457":"1501297-57.2020.8.26.0457",
  "560":"1500208-78.2020.8.26.0560",
  "691":"1500294-44.2020.8.26.0691",
  "223":"1513063-33.2020.8.26.0223",
  "664":"1503678-96.2020.8.26.0664",
  "567":"1501758-87.2020.8.26.0567",
  "9024":"3000008-19.2020.8.26.9024",
  "663":"1500968-09.2020.8.26.0663",
  "648":"2000002-34.2020.8.26.0648",
  "637":"9000206-89.2020.8.26.0637",
  "40":"1501721-89.2020.8.26.0040",
  "370":"1500563-76.2020.8.26.0370",
  "629":"1500607-94.2020.8.26.0629",
  "602":"9000110-82.2020.8.26.0602",
  "530":"1502504-66.2020.8.26.0530",
  "597":"1503585-43.2020.8.26.0597",
  "585":"1500177-80.2020.8.26.0585",
  "344":"9000018-05.2020.8.26.0344",
  "601":"1500689-15.2020.8.26.0601",
  "451":"9000019-57.2020.8.26.0451",
  "996":"1000731-03.2020.8.26.0996",
  "447":"1500230-87.2020.8.26.0447",
  "577":"9000006-68.2020.8.26.0577",
  "445":"9000002-39.2020.8.26.0445",
  "146":"1500559-32.2020.8.26.0146",
  "443":"1500520-17.2020.8.26.0443",
  "145":"1500464-05.2020.8.26.0145",
  "559":"1501521-77.2020.8.26.0559",
  "598":"1500371-41.2020.8.26.0598",
  "576":"9000002-34.2020.8.26.0576",
  "22":"9000001-62.2020.8.26.0022",
  "613":"1500405-68.2020.8.26.0613",
  "358":"1501941-06.2020.8.26.0358",
  "444":"1500261-19.2020.8.26.0444",
  "575":"1500795-55.2020.8.26.0575",
  "263":"1500135-27.2020.8.26.0263",
  "160":"1500372-79.2020.8.26.0160",
  "611":"1500190-98.2020.8.26.0611",
  "115":"1501171-63.2020.8.26.0115",
  "572":"1501947-50.2020.8.26.0572",
  "9032":"3000003-70.2020.8.26.9032",
  "189":"1501398-25.2020.8.26.0189",
  "555":"1500251-30.2020.8.26.0555",
  "566":"1503886-83.2020.8.26.0566",
  "9008":"3000021-66.2020.8.26.9008",
  "564":"9000003-55.2020.8.26.0564",
  "9035":"3000080-70.2020.8.26.9035",
  "405":"1509058-04.2020.8.26.0405",
  "127":"7000001-72.2020.8.26.0127",
  "400":"1503218-28.2020.8.26.0400",
  "540":"1502107-74.2020.8.26.0540",
  "9001":"3000006-21.2020.8.26.9001",
  "156":"1502735-51.2020.8.26.0156",
  "509":"1000568-29.2020.8.26.0509",
  "81":"1501133-56.2020.8.26.0081",
  "233":"1500275-54.2020.8.26.0233",
  "26":"1000501-58.2020.8.26.0026",
  "414":"1500325-22.2020.8.26.0414",
  "136":"1510137-49.2020.8.26.0136",
  "590":"9000011-51.2020.8.26.0590",
  "62":"1500781-58.2020.8.26.0062",
  "580":"1500453-29.2020.8.26.0580",
  "536":"1503586-17.2020.8.26.0536",
  "70":"1500844-59.2020.8.26.0070",
  "660":"1500468-49.2020.8.26.0660",
  "616":"1502414-91.2020.8.26.0616",
  "82":"1505208-38.2020.8.26.0082",
  "10":"1500982-12.2020.8.26.0010",
  "1":"1505927-69.2020.8.26.0001",
  "557":"1500680-88.2020.8.26.0557",
  "981":"0000007-61.2020.8.26.0981",
  "35":"2000004-97.2020.8.26.0035",
  "292":"1502721-47.2020.8.26.0292",
  "72":"9000001-09.2020.8.26.0072",
  "592":"1500269-37.2020.8.26.0592",
  "9015":"3000026-67.2020.8.26.9015",
  "278":"1502426-52.2020.8.26.0278",
  "571":"1501649-61.2020.8.26.0571",
  "337":"1501203-81.2020.8.26.0337",
  "623":"1500258-12.2020.8.26.0623",
  "363":"1501535-67.2020.8.26.0363",
  "269":"9000070-32.2020.8.26.0269",
  "271":"1500854-82.2020.8.26.0271",
  "9059":"3000007-26.2020.8.26.9059",
  "228":"1524790-71.2020.8.26.0228",
  "19":"1512575-11.2020.8.26.0019",
  "177":"1500582-79.2020.8.26.0177",
  "347":"1502566-73.2020.8.26.0347",
  "452":"1500810-05.2020.8.26.0452",
  "53":"2000008-80.2020.8.26.0053",
  "546":"1500331-21.2020.8.26.0546",
  "114":"9000014-76.2020.8.26.0114",
  "201":"1501853-51.2020.8.26.0201",
  "603":"1501696-36.2020.8.26.0603",
  "570":"1500372-13.2020.8.26.0570",
  "286":"7000014-79.2020.8.26.0286",
  "100":"2000008-36.2020.8.26.0100",
  "244":"1528004-22.2020.8.26.0244",
  "666":"1501033-92.2020.8.26.0666",
  "218":"1500562-62.2020.8.26.0218",
  "569":"1500633-78.2020.8.26.0569",
  "968":"0101076-78.2020.8.26.0968",
  "9056":"3000022-04.2020.8.26.9056",
  "71":"7001270-23.2020.8.26.0071",
  "624":"1503510-20.2020.8.26.0624",
  "369":"1500408-76.2020.8.26.0369",
  "8":"1501082-70.2020.8.26.0008",
  "280":"1500360-93.2020.8.26.0280",
  "533":"1503564-65.2020.8.26.0533",
  "318":"2000197-39.2020.8.26.0318",
  "372":"1504637-70.2020.8.26.0372",
  "630":"1500724-82.2020.8.26.0630",
  "37":"9000031-52.2020.8.26.0037",
  "346":"1500836-30.2020.8.26.0346",
  "589":"1500759-68.2020.8.26.0589",
  "0":"3006378-23.2020.8.26.0000",
  "9048":"3000054-33.2020.8.26.9048",
  "556":"1500567-40.2020.8.26.0556",
  "77":"1502324-51.2020.8.26.0077",
  "612":"1500300-94.2020.8.26.0612",
  "291":"1502303-15.2020.8.26.0291",
  "539":"1501213-04.2020.8.26.0539",
  "185":"1500351-28.2020.8.26.0185",
  "631":"1500320-28.2020.8.26.0631",
  "20":"1011809-12.2020.8.26.0020",
  "549":"1500516-50.2020.8.26.0549",
  "326":"1500853-29.2020.8.26.0326",
  "578":"1500486-25.2020.8.26.0578",
  "99":"1506024-66.2020.8.26.0099",
  "366":"1500600-18.2020.8.26.0366",
  "4":"1502147-15.2020.8.26.0004",
  "356":"1501468-26.2020.8.26.0356",
  "609":"1507371-59.2020.8.26.0609",
  "229":"1502816-72.2020.8.26.0229",
  "79":"7000136-34.2020.8.26.0079",
  "551":"1500478-32.2020.8.26.0551",
  "274":"1503123-85.2020.8.26.0274",
  "434":"1501106-81.2020.8.26.0434",
  "653":"1500657-48.2020.8.26.0653",
  "383":"1500560-82.2020.8.26.0383",
  "41":"1001628-83.2020.8.26.0041",
  "483":"1500951-28.2020.8.26.0483",
  "165":"1500486-03.2020.8.26.0165",
  "306":"1501072-05.2020.8.26.0306",
  "69":"1500432-34.2020.8.26.0069",
  "361":"9000003-82.2020.8.26.0361",
  "116":"1500598-22.2020.8.26.0116",
  "9038":"3000017-36.2020.8.26.9038",
  "565":"1503533-46.2020.8.26.0565",
  "334":"1500236-45.2020.8.26.0334",
  "48":"1502584-21.2020.8.26.0048",
  "439":"1501030-42.2020.8.26.0439",
  "248":"1511147-83.2020.8.26.0248",
  "548":"1503005-63.2020.8.26.0548",
  "294":"1501836-27.2020.8.26.0294",
  "482":"9000160-80.2020.8.26.0482",
  "9030":"3000036-66.2020.8.26.9030",
  "309":"7000010-70.2020.8.26.0309",
  "103":"1500518-97.2020.8.26.0103",
  "515":"1500485-35.2020.8.26.0515",
  "9010":"3000025-97.2020.8.26.9010",
  "84":"1500571-38.2020.8.26.0084",
  "552":"1500341-47.2020.8.26.0552",
  "562":"1532721-93.2020.8.26.0562",
  "338":"9000001-84.2020.8.26.0338",
  "573":"1500307-09.2020.8.26.0573",
  "593":"1500379-33.2020.8.26.0593",
  "348":"9000003-24.2020.8.26.0348",
  "510":"9000019-74.2020.8.26.0510",
  "618":"1501216-13.2020.8.26.0618",
  "9022":"3000012-62.2020.8.26.9022",
  "9042":"3000011-17.2020.8.26.9042",
  "120":"1500474-27.2020.8.26.0120",
  "213":"1500553-18.2020.8.26.0213",
  "651":"1500308-51.2020.8.26.0651",
  "604":"1501865-20.2020.8.26.0604",
  "7":"1504736-68.2020.8.26.0007",
  "584":"1501867-50.2020.8.26.0584",
  "123":"1500980-91.2020.8.26.0123",
  "140":"1500483-26.2020.8.26.0140",
  "2":"1508111-92.2020.8.26.0002",
  "531":"1500536-95.2020.8.26.0531",
  "9018":"3000009-22.2020.8.26.9018",
  "15":"1504287-86.2020.8.26.0015",
  "394":"1501559-02.2020.8.26.0394",
  "9033":"3000016-66.2020.8.26.9033",
  "617":"1501498-54.2020.8.26.0617",
  "266":"1519042-41.2020.8.26.0266",
  "11":"1500808-97.2020.8.26.0011",
  "299":"1513595-70.2020.8.26.0299",
  "407":"1501626-25.2020.8.26.0407",
  "232":"1500225-31.2020.8.26.0232",
  "610":"1500223-91.2020.8.26.0610",
  "568":"1501937-18.2020.8.26.0568",
  "9040":"3000037-21.2020.8.26.9040",
  "462":"1512238-51.2020.8.26.0462",
  "472":"1500937-77.2020.8.26.0472",
  "247":"1500579-11.2020.8.26.0247",
  "3":"1500875-86.2020.8.26.0003",
  "242":"1501094-61.2020.8.26.0242",
  "126":"9000013-55.2020.8.26.0126",
  "699":"1500422-40.2020.8.26.0699",
  "484":"1500477-54.2020.8.26.0484",
  "6":"1502938-75.2020.8.26.0006",
  "600":"1500249-22.2020.8.26.0600",
  "16":"1088304-25.2020.8.26.0016",
  "153":"1500596-38.2020.8.26.0153",
  "132":"1507679-71.2020.8.26.0132",
  "520":"1000424-22.2020.8.26.0520",
  "9005":"0100215-37.2020.8.26.9005",
  "150":"1502162-31.2020.8.26.0150",
  "453":"1500608-25.2020.8.26.0453",
  "157":"1501052-73.2020.8.26.0157",
  "586":"1501182-37.2020.8.26.0586",
  "591":"1500205-30.2020.8.26.0591",
  "198":"7000126-21.2020.8.26.0198",
  "626":"1500395-82.2020.8.26.0626",
  "210":"1501322-35.2020.8.26.0210",
  "634":"1504121-40.2020.8.26.0634",
  "220":"1501950-91.2020.8.26.0220",
  "9":"1502478-79.2020.8.26.0009",
  "521":"1000497-88.2020.8.26.0521",
  "704":"1502038-35.2020.8.26.0704",
  "204":"1500142-02.2020.8.26.0204",
  "615":"1500752-95.2020.8.26.0615",
  "9050":"3000010-08.2020.8.26.9050",
  "659":"1500866-96.2020.8.26.0659",
  "415":"1500573-82.2020.8.26.0415",
  "45":"1500779-42.2020.8.26.0045",
  "238":"1500902-43.2020.8.26.0238",
  "606":"7000035-65.2020.8.26.0606",
  "63":"1501062-11.2020.8.26.0063",
  "9025":"3000046-28.2020.8.26.9025",
  "268":"9000004-55.2020.8.26.0268",
  "30":"1500533-91.2020.8.26.0030",
  "279":"1500860-65.2020.8.26.0279",
  "622":"1500229-62.2020.8.26.0622",
  "76":"1500173-18.2020.8.26.0076",
  "554":"2000005-77.2020.8.26.0554",
  "9016":"3000015-35.2020.8.26.9016",
  "101":"7000001-53.2020.8.26.0101",
  "301":"1500248-61.2020.8.26.0301",
  "322":"1504944-77.2020.8.26.0322",
  "541":"1501407-95.2020.8.26.0541",
  "144":"1500367-08.2020.8.26.0144",
  "441":"1500999-16.2020.8.26.0441",
  "529":"1501333-77.2020.8.26.0529",
  "158":"1000181-97.2020.8.26.0158",
  "411":"1501043-28.2020.8.26.0411",
  "129":"9000001-32.2020.8.26.0129",
  "9002":"0100446-73.2020.8.26.9002",
  "169":"1500311-94.2020.8.26.0169",
  "491":"1500871-40.2020.8.26.0491",
  "9014":"3000016-26.2020.8.26.9014",
  "258":"1500988-51.2020.8.26.0258",
  "594":"1501143-16.2020.8.26.0594",
  "599":"1501504-18.2020.8.26.0599",
  "200":"1500183-78.2020.8.26.0200",
  "9047":"3000005-92.2020.8.26.9047",
  "9021":"3000026-49.2020.8.26.9021",
  "456":"1500963-26.2020.8.26.0456",
  "222":"1500838-81.2020.8.26.0222",
  "477":"1503028-28.2020.8.26.0477",
  "481":"1500987-76.2020.8.26.0481",
  "9036":"3000016-57.2020.8.26.9036",
  "219":"1500541-83.2020.8.26.0219",
  "466":"1500381-93.2020.8.26.0466",
  "625":"9000113-65.2020.8.26.0625",
  "67":"1500389-06.2020.8.26.0067",
  "646":"1500240-19.2020.8.26.0646",
  "24":"7000053-86.2020.8.26.0024",
  "28":"1506748-71.2020.8.26.0028",
  "73":"1504716-73.2020.8.26.0073",
  "246":"1500622-48.2020.8.26.0246",
  "270":"1503658-26.2020.8.26.0270",
  "9028":"3000008-07.2020.8.26.9028",
  "288":"1508722-60.2020.8.26.0288",
  "495":"1503131-78.2020.8.26.0495",
  "32":"9000048-06.2020.8.26.0032",
  "311":"1500564-44.2020.8.26.0311",
  "512":"1500417-94.2020.8.26.0512",
  "681":"1500722-56.2020.8.26.0681",
  "97":"1500778-95.2020.8.26.0097",
  "9060":"3000046-20.2020.8.26.9060",
  "9000":"3000168-19.2020.8.26.9000",
  "553":"1500389-03.2020.8.26.0553",
  "80":"1500632-08.2020.8.26.0080",
  "196":"7000000-74.2020.8.26.0196",
  "583":"1500857-71.2020.8.26.0583",
  "416":"1500701-02.2020.8.26.0416",
  "424":"1500366-56.2020.8.26.0424",
  "9013":"3000026-73.2020.8.26.9013",
  "650":"1502555-08.2020.8.26.0650",
  "698":"1500157-41.2020.8.26.0698",
  "42":"1500855-75.2020.8.26.0042",
  "9020":"3000021-30.2020.8.26.9020",
  "545":"1501290-92.2020.8.26.0545",
  "90":"1550891-74.2020.8.26.0090",
  "257":"1500560-72.2020.8.26.0257",
  "14":"1508839-97.2020.8.26.0014",
  "9006":"3000028-64.2020.8.26.9006",
  "94":"1500721-86.2020.8.26.0094",
  "502":"1001082-03.2020.8.26.0502",
  "9051":"3000034-33.2020.8.26.9051",
  "9058":"3000041-04.2020.8.26.9058",
  "172":"1500314-40.2020.8.26.0172",
  "374":"1500573-11.2020.8.26.0374",
  "9045":"3000028-44.2020.8.26.9045",
  "408":"1505154-64.2020.8.26.0408",
  "561":"1500203-53.2020.8.26.0561",
  "9026":"3000026-34.2020.8.26.9026",
  "526":"1506160-43.2020.8.26.0526",
  "58":"1500304-47.2020.8.26.0058",
  "341":"1500247-53.2020.8.26.0341",
  "111":"1501081-67.2020.8.26.0111",
  "579":"1500161-47.2020.8.26.0579",
  "496":"1000456-02.2020.8.26.0496",
  "470":"1500514-26.2020.8.26.0470",
  "191":"7000000-89.2020.8.26.0191",
  "563":"1500148-96.2020.8.26.0563",
  "480":"1500427-40.2020.8.26.0480",
  "5":"1503645-46.2020.8.26.0005",
  "430":"1500174-08.2020.8.26.0430",
  "9012":"3000037-08.2020.8.26.9012",
  "9027":"3000007-25.2020.8.26.9027",
  "25":"1500406-71.2020.8.26.0025",
  "9011":"3000010-28.2020.8.26.9011",
  "236":"1501130-24.2020.8.26.0236",
  "283":"1500367-76.2020.8.26.0283",
  "673":"1500275-92.2020.8.26.0673",
  "619":"1502918-88.2020.8.26.0619",
  "205":"1500276-26.2020.8.26.0205",
  "224":"9000004-90.2020.8.26.0224",
  "695":"1500483-10.2020.8.26.0695",
  "696":"1500357-54.2020.8.26.0696",
  "75":"1501896-75.2020.8.26.0075",
  "9043":"3000174-91.2020.8.26.9043",
  "83":"1500497-84.2020.8.26.0083",
  "574":"1500250-85.2020.8.26.0574",
  "542":"1502597-90.2020.8.26.0542",
  "59":"1500261-10.2020.8.26.0059",
  "449":"2000003-34.2020.8.26.0449",
  "252":"1500582-48.2020.8.26.0252",
  "281":"1506853-83.2020.8.26.0281",
  "282":"1500264-72.2020.8.26.0282",
  "296":"1504360-88.2020.8.26.0296",
  "404":"1500730-88.2020.8.26.0404",
  "9003":"0100227-57.2020.8.26.9003",
  "95":"1500369-28.2020.8.26.0095",
  "300":"1500481-61.2020.8.26.0300",
  "9007":"3000024-24.2020.8.26.9007",
  "315":"1500378-09.2020.8.26.0315",
  "9019":"3000014-41.2020.8.26.9019",
  "9039":"3000018-18.2020.8.26.9039",
  "587":"1501367-72.2020.8.26.0587",
  "197":"1504367-86.2020.8.26.0197",
  "390":"7000000-74.2020.8.26.0390",
  "396":"1501354-64.2020.8.26.0396",
  "486":"1500268-79.2020.8.26.0486",
  "511":"2000003-42.2020.8.26.0511",
  "412":"1500059-41.2020.8.26.0412",
  "538":"1501327-43.2020.8.26.0538",
  "187":"1500955-80.2020.8.26.0187",
  "547":"1500297-43.2020.8.26.0547",
  "464":"1500361-11.2020.8.26.0464",
  "52":"1501721-53.2020.8.26.0052",
  "471":"1500640-73.2020.8.26.0471",
  "21":"1030429-69.2020.8.26.0021",
  "581":"1501219-79.2020.8.26.0581",
  "9041":"3000010-35.2020.8.26.9041",
  "607":"1500491-57.2020.8.26.0607",
  "627":"1500551-67.2020.8.26.0627",
  "66":"9000001-27.2020.8.26.0066",
  "638":"1500725-43.2020.8.26.0638",
  "642":"1503459-52.2020.8.26.0642",
  "632":"1500287-35.2020.8.26.0632",
  "68":"1503182-12.2020.8.26.0068",
  "654":"1500268-60.2020.8.26.0654",
  "655":"1500679-03.2020.8.26.0655",
  "27":"1501146-23.2020.8.26.0027"
}

main();
