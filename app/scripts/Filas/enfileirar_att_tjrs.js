const moment = require('moment');
const { paginar } = require('../../lib/paginar')
const { Processo } = require("../../models/schemas/processo");
const { LogExecucao } = require('../../lib/logExecucao');

let tribunalOption = 'TJRS'

const tribunalDict = {
  'TJRS': {
    tribunal: 21,
    orgao: 8
  }
}

const main = async () => {
  let data = moment().subtract('3', 'days');
  let ultimoId;
  let limite = 1000;

  let tribunal = tribunalDict[tribunalOption];
  const query = {
    dataCriacao: {$lte: data.toISOString()},
    "detalhes.tribunal": tribunal.tribunal,
    "detalhes.orgao": tribunal.orgao,
  }

  do {
    let pagina = await paginar(query, Processo, ultimoId, limite);


    if(!pagina.tamanho) {
      console.log('Não existe correspondente para a query');
      break;
    }

    const listaEnvio = pagina.documentos.map((processo) => {
      return {
        _id: "6fb4192bf97dec1d9c268f56",
        NumeroProcesso: processo.detalhes.numeroProcessoMascara,
        Instancia: 1,
        SeccionalOab: 'RS'
      };
    });


    console.log('Enviando para filas');

    for(let i=0, tam=listaEnvio.length;i < tam; i++) {
      let logExec = await LogExecucao.cadastrarConsultaPendente(listaEnvio[i], 'processo.TJRS.extracao.atualizacao')
      if (logExec.enviado && logExec.sucesso) console.log(`Processo: ${listaEnvio[i].NumeroProcesso} ==> processo.TJRS.extracao.atualizacao`);
    }

    if (pagina.tamanho < limite) {
      break;
    }

    ultimoId = pagina.ultimoId;
  } while(true)

}

main().then(e => {
  console.log('Finalizado');
})