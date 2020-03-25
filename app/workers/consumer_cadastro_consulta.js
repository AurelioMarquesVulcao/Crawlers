const GerenciadorFila = require('../lib/filaHandler').GerenciadorFila

const gerenciadorFila = new GerenciadorFila()

gerenciadorFila.consumir('cadastro_consulta', (_, mensagem) => {
    /**
     * Neste ponto tudo o que precisa ser feito é a 
     */
    console.log(JSON.parse(mensagem.content))
})


