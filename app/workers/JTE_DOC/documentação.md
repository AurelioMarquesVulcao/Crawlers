# Robô de iniciais - Fluxo/ Instruções de uso.

#### 1- Uso de senhas

- Rotas:
  url 01 --> **http://172.16.16.38:3305/variaveis/credenciaisAdvogados**
  url 02 --> **http://172.16.16.38:3338/credencialAdvogado/modificando**
  url 03 --> **http://172.16.16.38:3305/variaveis.sistema**
  <br>

1.  A senhas serão cadastradas ou atualizadas no endereço url 01 (feature) ou pelo endPoint: url 02
2.  No Arquivo /lib/uil.js temos o método de consulta e uso de credencial de advogado, uma para registrar o consumo da senha.
    Abaixo temos uma busca por todas as senhas cadastradas do protal JTE para o estado do Rio de Janeiro.

```js
// Entre chaves usamos o parametro de busca para localizar a credencial do advogado desejado
await Helper.getCredencialAdvogado({ portal: 'JTE', ufCode: 1, estado: 'RJ' });
```

3. Inserindo senhas na sua aplicação. <br>Em seu "constructor()" de extração utilize o código abaixo e você tera o Login com menor utilização e que não possui nenhum erro no dia de hoje. Utilizamos por padrão apenas uma tentativa de uso por senha para que tenhamos ainda 2 tentativas de verificar o motivo de não funcionr o login antes de bloquear a senha.

```js
Helper.geraLoginSenha().then((x) => {
  this.login = x.login;
  this.senha = x.senha;
  this.objLogin = x;
});
```

- Após utilizar a senha você deve enviar o feedback deste uso para o Banco. Assim temos armazenado o ultimo utilizador do login e senha. Em caso de falha é guardado o log de erro (por 24horas). Inserir o código abaixo no fim do "try{}"

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

#### 2- Partes críticas do código

Login.
Envio para o BigData.
Carregar url do JTE **https://jte.csjt.jus.br/**.
Confirmação da tag #consulta após entrar no tribunal
Confirmação da tag #formLogin após entrar no campo de sehna
Confirmação da tag #consulta após digitar a senha

- Rotas criticas do códico que em caso de falhas consecutivas o robô precise ser desligado.
  <br> Para criamos uma variável para esse fim usamos a url 03 e utilizamos a função descrita abaixo para contar esses erros. Quando o limite de erros estipulado é ultrapassado a aplicação para. Caso um erro monitorado seja crítico, você pode forçar o desligamento do container para posteriomente análizar o problema.

  ```js
  await Helper.erroMonitorado({ origem: robo });
  ```

## Features

- [ ] Criar tela para criação de senhas
- [ ] Enviar alerta por Mensagem após o robô parar por falhas consecutivas
- [ ] Voltar a tentar ligar o robô após 30 minutos (caso não seja erro de senha).
