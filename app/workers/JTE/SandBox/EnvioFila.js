const { CriaFilaJTE } = require('../../../lib/criaFilaJTE');

const Fila = new CriaFilaJTE();

(async () => {
    await enfileirarTRT_RJ('01005525220205010055');
})()

function enfileirarTRT_RJ(numero) {
    let regex = (/([0-9]{7})([0-9]{2})(2020)(5)(01)([0-9]{4})/g.test(numero))
    //console.log(regex);
    if (regex) {
        let mensagem = criaPost(numero);
        Fila.enviarMensagem("fila TRT-RJ", mensagem);
    }
    function criaPost(numero) {
        let post = `{
        "ExecucaoConsultaId" : "${makeid()}",
        "ConsultaCadastradaId" : "${makeid()}",
        "DataEnfileiramento" : "${new Date}",
        "NumeroProcesso" : "${numero}",
        "NumeroOab" : "null",        
        "SeccionalOab" : "SP",
        "NovosProcessos" : true}`
        return post
    }

    function makeid() {
        let text = "5ed9";
        let possible = "abcdefghijklmnopqrstuvwxyz0123456789";
        let letra = "abcdefghijklmnopqrstuvwxyz";
        let numero = "0123456789";
        for (var i = 0; i < 20; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }
}

