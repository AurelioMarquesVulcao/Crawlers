# One For All

## Ligando PM2:

* rode a aplicação apartir da pasta raiz da sua aplicação

* pegue o caminho relativo do seu arquivo: EX.: "app/worker/helloWorld.js"
* envie no corpo da requisição para pm2 com variaveis:
  
``` 
{"servico" : "app/worker/helloWorld.js",
 "nome" : "hello",
 "variavel" : "TestandoEnvio2" }
 ```
 

 * envie no corpo da requisição para pm2

``` 
{"comando" : "stop hello"}
 ```
<hr>

 ``` 
{"comando" : "start app/worker/helloWorld.js"}
 ```