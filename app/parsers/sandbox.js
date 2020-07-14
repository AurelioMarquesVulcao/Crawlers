let numeroProcesso = '00107243620185150084'
function teste(numeroProcesso){
    let resultado = '';
    resultado = numeroProcesso.slice(0,7)+'-'+numeroProcesso.slice(7,9)
    +'.'+numeroProcesso.slice(9,13)+'.'+numeroProcesso.slice(13,14)
    +'.'+numeroProcesso.slice(numeroProcesso.length-6,numeroProcesso.length-4)
    +'.'+numeroProcesso.slice(numeroProcesso.length-4,numeroProcesso.length)

    return resultado
  }
console.log(teste(numeroProcesso));
