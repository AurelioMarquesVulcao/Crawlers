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
        '0090', '0201', '0202', '0203', '0204',
        '0205', '0211', '0221', '0231', '0232',
        '0241', '0242', '0251', '0252', '0254', '0255', '0261',
        '0262', '0263', '0264', '0271', '0281', '0291', '0292',
        '0301', '0302', '0303', '0311', '0312', '0313', '0314',
        '0315', '0316', '0317', '0318', '0319', '0320', '0321',
        '0322', '0323', '0331', '0332', '0341', '0342', '0351',
        '0361', '0362', '0363', '0371', '0372', '0373', '0374',
        '0381', '0382', '0383', '0384', '0385', '0386', '0391',
        '0401', '0402', '0411', '0421', '0422', '0431', '0432',
        '0433', '0434', '0435', '0441', '0442', '0443', '0444',
        '0445', '0446', '0447', '0461', '0462', '0463', '0464',
        '0465', '0466', '0467', '0468', '0471', '0472', '0473',
        '0481', '0482', '0491', '0492', '0501', '0502', '0511',
        '0521', '0601', '0602', '0603', '0604', '0605', '0606',
        '0607', '0608', '0609', '0610', '0611', '0612', '0613',
        '0614', '0701',
        '0702', '0703', '0704', '0705', '0706',
        '0707', '0708', '0709', '0710', '0711',
        '0712', '0713', '0714', '0715', '0716',
        '0717', '0718', '0719', '0720'
    ]
    let contaOrigem = 0;
    for (let w = 0; w < 1;) {
        second++
        let timer = fila.relogio();
        // if (timer.min == 20 && timer.seg == 01 || timer.min == 47) {
        if ("a") {
            let relogio = fila.relogio();
            try {
                // string de busca no banco de dados
                let parametroBusca = { "tribunal": 2, "origem": origens[contaOrigem] };
                let buscar = await fila.abreUltimo(parametroBusca);
                let sequencial = maiorSequencial(buscar)
                let numeroSequencial = sequencial.numeroProcesso.slice(0, 7);
                let comarca = sequencial.numeroProcesso.slice(16, 20);
                // isso que vai pegar os processos
                console.log("Estamos na comarca: " + origens[contaOrigem]);
                //console.log(sequencial.data.dia, relogio.dia, sequencial.data.mes, relogio.mes);
                if (sequencial.data.dia == relogio.dia && sequencial.data.mes <= relogio.mes) {
                    if (sequencial.data.mes < relogio.mes) {
                        await fila.procura10(numeroSequencial, comarca, 4, '02')
                        console.log("----------------------- Estou dando um salto no Tempo--------------------------");
                    } else {
                        await fila.procura(numeroSequencial, comarca, 2, '02')
                    }
                    await sleep(500)
                } else if (sequencial.data.dia <= relogio.dia && sequencial.data.mes <= relogio.mes) {
                    if (sequencial.data.mes < relogio.mes) {
                        await fila.procura10(numeroSequencial, comarca, 4, '02')
                        console.log("----------------------- Estou dando um salto no Tempo--------------------------");
                    } else {
                        await fila.procura(numeroSequencial, comarca, 2, '02')
                    }
                    await sleep(500)
                } else if (sequencial.data.dia >= relogio.dia && sequencial.data.mes <= relogio.mes)  {
                    if (sequencial.data.mes < relogio.mes) {
                        await fila.procura10(numeroSequencial, comarca, 4, '02')
                        console.log("----------------------- Estou dando um salto no Tempo--------------------------");
                    } else {
                        await fila.procura(numeroSequencial, comarca, 2, '02')
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
            if (contaOrigem == 219) { contaOrigem = 0; await sleep(pausaNaConsulta) } else { contaOrigem++ };
        };
        await sleep(7000)
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