const Axios = require('axios');
const Fs = require('fs');
const Path = require('path');



const red = '\u001b[31m';
const blue = '\u001b[34m';
const reset = '\u001b[0m';


class Busca{
  static async buscaBigdata(tribunal){
        let resultado;
        try{
            await Axios({
                url:`http://172.16.16.3:8083/processos/obterUltimosSequenciaisPorUnidade/?orgao=5&tribunal=${tribunal}&ano=2020`,
                method: 'post',
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': 'tk3TqbruYqJdFdW5fqctsurkNcZi5UHIVWUfiWfM7Xw',
                },
                // query: {
                //     'orgao': 5,
                //     'tribunal': 3,
                //     'ano': 2020
                // }
              })
                .then((res) => {
                  resultado = res;
                  // console.log(resultado);
                })
                .catch((err) => {
                  console.log(err);
                  throw err;
                });
        }catch (e){
            console.log(red+"Falhou"+reset);
        }
        return resultado
    }

}
(async()=>{
// await Busca.buscaBigdata(2)
console.log(await Busca.buscaBigdata(2));
})()