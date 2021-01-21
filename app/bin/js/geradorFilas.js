const { enums } = require('../../configs/enums');
const { GerenciadorFila } = require('../../lib/filaHandler');


class GeraFila {
  constructor() {
    this.tipo = enums.tipoConsulta;
    this.tribunal = enums.nomesRobos;
    this.tipoFila = enums.tipoFila;
    this.outros; // Qualquer necessidade "especial".
  }

  verificador(tipo, tribunal, tipoFila, outros) {
    let nomeFila = []
    try {
      if (!this.tipo[tipo]) {
        throw new Error("Tipo invalido!")
      }
      nomeFila.push(this.tipo[tipo]);

      if (!this.tribunal[tribunal]) {
        throw new Error("Tribunal invalido!")
      }
      nomeFila.push(this.tribunal[tribunal]);

      if (!this.tipoFila[tipoFila]) {
        throw new Error("Tipo Fila invalido!")
      }
      nomeFila.push(this.tipoFila[tipoFila]);

      if (outros) {
        nomeFila.push(outros);
      }
      return nomeFila.join(".")
    } catch (e) {
      console.log(e);
      process.exit()

    }

  }

  async god(tipo, tribunal, tipoFila, outros) {
    let nomeFila = new GeraFila().verificador(tipo, tribunal, tipoFila, outros);
    console.log(nomeFila);
    await new GerenciadorFila().consumir(nomeFila, async (ch, msg) => {
      console.log("Criado");
     })
        
  }
}

// Coloque o nome da fila aqui.
new GeraFila().god("Oab", "JTE", "Extracao", "01")
// peticao.JTE.extracao.link.doc

