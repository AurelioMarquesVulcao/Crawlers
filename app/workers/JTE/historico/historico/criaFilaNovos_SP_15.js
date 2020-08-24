const mongoose = require("mongoose");
const cheerio = require('cheerio');
const re = require('xregexp');
const sleep = require('await-sleep');
const { CriaFilaJTE } = require('../../lib/criaFilaJTE');

const fila = new CriaFilaJTE();

(async () => {
    let second = 0;
    let origens = [
        '0000', '0001', '0002', '0003', '0004', '0005',
        '0006', '0007', '0008', '0009', '0010',
        '0011', '0012', '0013', '0014', '0015',
        '0016', '0017', '0018', '0019', '0020',
        '0021', '0022', '0023', '0024', '0025',
        '0026', '0027', '0028', '0029', '0030',
        '0031', '0032', '0033', '0034', '0035',
        '0036', '0037', '0038', '0039', '0040',
        '0041', '0042', '0043', '0044', '0045',
        '0046', '0047', '0048', '0049',
        '0050', '0051', '0052', '0053', '0054',
        '0055', '0056', '0057', '0058', '0059',
        '0060', '0061', '0062', '0063', '0064',
        '0065', '0066', '0067', '0068', '0069',
        '0070', '0071', '0072', '0073', '0074',
        '0075', '0076', '0077', '0078', '0079',
        '0080', '0081', '0082', '0083', '0084',
        '0085', '0086', '0087', '0088', '0089',
        '0090', '0091', '0092', '0093', '0094',
        '0095', '0096', '0097', '0098', '0099',
        '0100', '0101', '0102', '0103', '0104', '0105',
        '0106', '0107', '0108', '0109', '0110', '0111',
        '0112', '0113', '0114', '0115', '0116', '0117',
        '0118', '0119', '0120', '0121', '0122', '0123',
        '0124', '0125', '0126', '0127', '0128', '0129',
        '0130', '0131', '0132', '0133', '0134', '0135',
        '0136', '0137', '0138', '0139', '0140', '0141',
        '0142', '0143', '0144', '0145', '0146', '0147',
        '0148', '0149', '0150', '0151', '0152', '0153',
        '0154', '0156', '0157', '0159', '0161', '0162',
        '0898'
    ]
    let contaOrigem = 100;
    for (let w = 0; w < 1;) {
        second++
        let timer = fila.relogio();
        // if (timer.min == 20 && timer.seg == 01 || timer.min == 47) {
        if ("a") {
            let relogio = fila.relogio();
            try {
                // string de busca no banco de dados
                let parametroBusca = { "tribunal": 15, "origem": origens[contaOrigem] };
                // console.log(origens.length);
                let buscar = await fila.abreUltimo(parametroBusca);
                console.log(buscar.length);
                let sequencial = maiorSequencial(buscar)
                let numeroSequencial = sequencial.numeroProcesso.slice(0, 7);
                console.log(numeroSequencial);
                let comarca = sequencial.numeroProcesso.slice(16, 20);
                // isso que vai pegar os processos
                console.log("Estamos na comarca: " + origens[contaOrigem]);
                // console.log(sequencial.data.dia == relogio.dia);
                // console.log(sequencial.data.mes < relogio.mes);
                if (sequencial.data.dia == relogio.dia && sequencial.data.mes <= relogio.mes) {
                    if (sequencial.data.mes < relogio.mes - 1) {
                        await fila.procura10(numeroSequencial, comarca, 4, '15')
                        console.log("----------------------- Estou dando um salto no Tempo--------------------------");
                    } else {
                        await fila.procura(numeroSequencial, comarca, 1, '15')
                    }
                    await sleep(500)
                } else if (sequencial.data.dia <= relogio.dia && sequencial.data.mes <= relogio.mes) {
                    if (sequencial.data.mes < relogio.mes - 1) {
                        await fila.procura10(numeroSequencial, comarca, 3, '15')
                        console.log("----------------------- Estou dando um salto no Tempo--------------------------");
                    } else {
                        await fila.procura(numeroSequencial, comarca, 1, '15')
                    }
                    await sleep(500)
                } else if (sequencial.data.dia >= relogio.dia && sequencial.data.mes <= relogio.mes) {
                    if (sequencial.data.mes < relogio.mes - 1) {
                        await fila.procura10(numeroSequencial, comarca, 3, '15')
                        console.log("----------------------- Estou dando um salto no Tempo--------------------------");
                    } else {
                        await fila.procura(numeroSequencial, comarca, 1, '15')
                    }
                    await sleep(500)
                }
                console.log(sequencial);
            } catch (e) {
                console.log(e);
                console.log("------------- A comarca :" + origens[contaOrigem] + ' falhou na busca--------------------');
            }
            //if (contaOrigem == 219) { break } else { contaOrigem++ };
            let pausaNaConsulta = 3600000 // Tempo de espera entre consultas no momento está 1 hora.
            if (contaOrigem == 160) { contaOrigem = 0; await sleep(pausaNaConsulta) } else { contaOrigem++ };
        };
        await sleep(1000)
    };
    await sleep(2000)
})();


function maiorSequencial(obj) {
    let resultado = obj[0]
    let teste = parseInt(obj[0].numeroProcesso.slice(0, 7));
    //console.log(teste);
    console.log(obj[0].numeroProcesso);
    for (let i = 0; i < obj.length; i++) {
        let sequencial = parseInt(obj[i].numeroProcesso.slice(0, 7));
        //console.log(sequencial);
        if (sequencial > teste) {
            teste = sequencial
            resultado = obj[i]
        }
    };
    return resultado
}