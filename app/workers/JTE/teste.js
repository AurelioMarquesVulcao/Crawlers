const mongoose = require("mongoose");




// (async()=>{
//     const test = 'mongodb+srv://admin:1234@cluster0-9jhwf.mongodb.net/test-jte?retryWrites=true&w=majority'
//     mongoose.connect(test,{
//             useNewUrlParser: true,
//             useUnifiedTopology: true
//         });

//     const Processos = mongoose.model('processos', {

//         detalhes: {
//           tipo: String,
//           numeroProcesso: String,
//           numeroProcessoMascara: String,
//           instancia: Number,
//           ano: Number,
//           orgao: Number,
//           tribunal: Number,
//           origem: Number
//         },
//         capa: {
//           assunto: Array,
//           uf: String,
//           comarca: String,
//           vara: String,
//           fase: String,
//           classe: String,
//           dataDistribuicao: Date,
//         },
//         dataAtualizacao: Date,
//         dataCriacao: Date,
//         envolvidos: Array,
//         oabs: Array,
//         origemExtracao: String,
//         qtdAndamentos: Number,
//         temAndamentosNovos: Boolean
//       });
//     await Processos.find(function (err, processos) {
//         if (err) return console.error(err);
//         let dados = processos[0]

//         console.log(dados.detalhes.numeroProcesso);
//         console.log("foi!");
//     })
//     process.exit()
// })()

const buscador = {
        NumeroProcesso: String,
        DataCadastro: Date,
        AtivoParaAtualizacao: Boolean,
        DataUltimaConsultaTribunal: Date,
        Instancia: String,
        TipoConsulta: String
    };



(async () => {
    const test1 = 'mongodb+srv://admin:1234@cluster0-9jhwf.mongodb.net/test-jte?retryWrites=true&w=majority'
    const test = 'mongodb://admin:admin@bigrj01mon01:19000,bigrj01mon02:19000/crawlersBigdata?authSource=admin&replicaSet=rsBigData&readPreference=primary&appname=MongoDB%20Compass&ssl=false'
    mongoose.connect(test, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    const Processos = mongoose.model('consultasCadastradas', {
        NumeroProcesso: String,
        DataCadastro: Date,
        AtivoParaAtualizacao: Boolean,
        DataUltimaConsultaTribunal: Date,
        Instancia: String,
        TipoConsulta: String
    }, 'consultasCadastradas');
    // await Processos.find(function (err, consultasCadastradas) {
        
    //     if (err) return console.error(err);
    //     let dados = consultasCadastradas

    //     console.log(dados);
    //     console.log("foi!");
    // })
    const filtro = await Processos.find({"TipoConsulta" : "processo"})
    console.log(filtro[0]);
     

    process.exit()
})()

