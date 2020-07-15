const removerAcentos = (texto) => {
  if (texto) {
    texto = texto.normalize("NFKD");
    // texto = Buffer.from(texto, 'ascii');
    texto = texto.toString("utf8");
    texto = texto.replace(/[\u0300-\u036f]/g, "");
    texto = texto.replace(/['"”“‘’º]+/g, "");
    texto = texto.replace(/N[^\w\s]/gi, "N");
    return texto;
  } else {
    return "";
  }
};

if (typeof String.prototype.strip === "undefined") {
  String.prototype.strip = function() {
    return String(this).replace(/^\s+|\s+$/g, "");
  };
}

module.exports.BaseParser = class BaseParser {
  constructor() {
    this.cnj = "";
    this.isBaixa = false;
    this.hasAudiencia = false;
    this.jsonCapa = {};
    this.jsonPartes = [];
    this.jsonAdvogados = [];
    this.jsonAssuntos = [];
    this.jsonAndamentos = [];
  }

  filtrarUnicosLista(lista) {
    let listaString = [];
    lista = lista.map(element => {
      let envString = JSON.stringify(element);
      if (listaString.indexOf(envString) === -1){
        listaString.push(envString);
        return element;
      }
      listaString.push(envString);
      return false;
    })
    return lista.filter(x => Boolean(x));
  }
};

const tradutor = {
  "A": "Autor",
  "Advogada": "Advogado",
  "Advogado": "Advogado",
  "Advogadomigracao": "Advogado",
  "Agdo": "Agravado",
  "Agravado": "Agravado",
  "Agte": "Agravante",
  "Agravante": "Agravante",
  "Apelado": "Apelado",
  "Apelante": "Apelante",
  "Apeldo": "Apelado",
  "Apelte": "Apelante",
  "Apdo": "Apelado",
  "Apte": "Apelante",
  "Autor": "Autor",
  "Embargdo": "Embargado",
  "Embargte": "Embargante",
  "Exectdo": "Executado",
  "Exeqte": "Exequente",
  "Impetrado": "Impetrado",
  "Impetrante": "Impetrante",
  "Interessado": "Interessado",
  "Perito": "Perito",
  "Procsoab": "Procurador",
  "Procurador": "Procurador",
  "R": "Reu",
  "Reqdo": "Requerido",
  "Reqte": "Requerente",
  "Requerente": "Requerente",
  "Requerido": "Requerido",
  "Reu": "Reu",
  "Suscdo": "Suscitado",
  "Suscte": "Suscitante"
};

/**
 * Traduz o uma string para o tipo de envolvido correspondente
 * @param {string} titulo o tipo de personagem
 * @returns {string}
 */
const traduzir = (tipo) => {

  // Remove acentos
  tipo = removerAcentos(tipo);
  // Remove caracteres indesejados
  tipo = tipo.replace(/(\W|\_)/g, '');
  // Capitalize
  const key = tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();

  if (tradutor[key]){
    return tradutor[key];
  }
  return key;
};

module.exports.removerAcentos = removerAcentos;
module.exports.tradutor = tradutor;
module.exports.traduzir = traduzir;
