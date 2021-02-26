# Robô de iniciais - Fluxo/ Instruções de uso.

## Partes monitoradas por variaveis

### 1- Uso de senhas

- Rotas:
  <br> url 01 --> **http://172.16.16.38:3305/variaveis/credenciaisAdvogados**
  <br> url 02 --> **http://172.16.16.38:3338/credencialAdvogado/modificando**
  <br> url 03 --> **http://172.16.16.38:3305/variaveis.sistema**

- A senhas serão cadastradas ou atualizadas no endereço url 01
  <br> ou pelo endPoint: url 02
- No Arquivo /lib/uil.js temos o método de consulta e uso de credencial de advogado.
  <br>Abaixo temos uma busca por todas as senhas cadastradas do protal JTE para o estado do Rio de Janeiro.

```js
// Entre chaves usamos o parametro de busca para localizar a credencial do advogado desejado
await Helper.getCredencialAdvogado({ portal: 'JTE', ufCode: 1, estado: 'RJ' });
```

- Inserindo senhas na sua aplicação. <br>Em seu "constructor()" de extração utilize o seguinte código e você tera o Login menos utilizado e que não possui nenhum erro no dia de hoje. Utilizamos por padrão apenas uma tentativa para que tenhamos ainda 2 tentativas de verificar o login antes de bloquear a senha.

```js
Helper.geraLoginSenha().then((x) => {
  this.login = x.login;
  this.senha = x.senha;
  this.objLogin = x;
});
```

- Após utilizar a senha você deve enviar o feedback deste uso para o Banco. Assim temos o ultimo utilizador do login e senha, se ela travar guardamos o erro (por 24horas). Inserir o código abaixo no fim do "try{}"

```js
// Uso com sucesso da login e senha
let datas = {
  status: {
    ultimoUso: new Date(),
    robo: 'Nome do robô que está utilizando a senha',
    status: true,
    erro: null,
    errosDoDia: 0,
  },
  utilizado: this.objLogin.utilizado + 1,
};
await Helper.updateCredencialAdvogado(datas, this.objLogin._id);
```

- Caso a senha falhe inserir esse código no fim do "catch(e){}"

```js
// Falha no uso do Login e senha
catch (e) {
      e = e.stack.replace(/\n+/, ' ').trim();
      let datas = {
        status: {
          ultimoUso: new Date(),
          robo: robo,
          status: false,
          erro: `${e}`,
          errosDoDia: this.objLogin.status.errosDoDia + 1,
        },
        utilizado: this.objLogin.utilizado + 1,
      };
      await Helper.updateCredencialAdvogado(datas, this.objLogin._id);
      await Helper.erroMonitorado({ origem: robo });
    }
```

### 2- Partes críticas do código

- Rotas criticas do códico que em caso de falhas consecutivas o robô precise ser desligado.
<br> Para criamos uma variável na url 03 e utilizamos a função descrita abaixo para contar esses erros. Quando o limite de erros estipulado é ultrapassado a aplicação para. Caso um erro monitorado seja crítico, você pode forçar o desligamento do container para posteriomente análizar o problema.

- Rotas com monitoramento de erros:
  Entrar no site JTE --> **https://jte.csjt.jus.br/**, A url inicial pode ficar offline mesmo com os estados online.
  
- Uso de Login

- envio de FeedBack para o BigData. Caso o BigData tenha problemas eu vou tentar algumas vezes e vou finalizar a aplicação.


## Partes monitoradas por Telegram/e-mail/slack
