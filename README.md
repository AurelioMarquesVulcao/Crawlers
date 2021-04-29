# Crawlers BigData

Projeto que abrange todos os crawlers de acesso e extração de processos.

## Env

| Nome                    | Descrição                                |
| ----------------------- | ---------------------------------------- |
| API_PORT                | Porta de acesso para web                 |
| MONGO_ADDRESS           | Endereço do banco                        |
| MONGO_DATABASE          | Nome do banco                            |
| MONGO_PORT              | Porta de conexao no banco                |
| MONGO_ROOT_USERNAME     | Nome de ususario para conexao no banco   |
| MONGO_ROOT_PASSWORD     | Senha para conexao no banco              |
| RABBITMQ_ADDRESS        | Endereço do Rabbit para fila             |
| RABBITMQ_PORT           | Porta do Rabbit para fila                |
| RABBITMQ_USERNAME       | Username de acesso no Rabbit             |
| RABBITMQ_PASSWORD       | Senha de acesso no Rabbit                |
| NGINX_PORT              | Porta do NGINX                           |
| RABBITMQ_CONNECTION     | String descritiva de conexao no RabbitMQ |
| MONGO_CONNECTION_STRING | String descritiva de conexao no MongoDB  |
| BIG_DATA_ADDRESS        | Endereco do bigdata                      |
| PROXIES_ADDRESS         | Endereço do servidor de proxies          |
| PUPPETEER_MEMORIA_MAX   | Memória maxima do puppeteer              |
| PUPPETEER_MEMORIA_MIN   | Memória minima do puppeteer              |

## Filas

Devemos enviar para o gerador de fluxo de mensagens os campos marcados com "->", pois esses campos são obrigátórios.

```js
const { FluxoController } = require('./lib/fluxoController');
await FluxoController.cadastrarExecucao(
  'NomeRobo',
  'nome da fila',
  {
    Instancia: 1,
    NumeroProcesso: '1000105-60.2021.5.02.0060',
    NomeRobo: 'processo.pje.atualizacao.01',
    ConsultaCadastradaId: '602283191da194310bbf7521', // ou null
  }
);
```

### Entrada

| Campo                     | Tipo   | Descrição                                      |
| ------------------------- | ------ | ---------------------------------------------- |
| LogConsulta               | String | \_id do Log de Consulta enviado pelo BigData   |
| -> **NumeroDoProcesso\*** | String | Numero do processo para se realizar a extração |
| -> **NumeroDaOab\***      | Number | Numero da Oab para se realizar a extração      |
| DataHoraEnfileiramento    | Date   | Data do envio a fila                           |
| -> Instancia              | Number | Instancia de consulta (default: 1)             |
| -> NomeRobo               | String | Nome do Robô que realiza a extração            |

- Deve-se conter ou NumeroDoProcesso ou NumeroDaOab.

#### Exemplo:

```json
{
  "Instancia": 1, // Para a busca de novos processos adotar "null".
  "NumeroProcesso": "10001056020215020060", // com ou sem mascara
  "NomeRobo": "processo.pje.atualizacao.01", // por padrão nome do robô e fila devem ser os mesmos
  "ExecucaoConsultaId": "602283191da194310bbf7521", // será gerado pelo "cadastrarExecucao()"
  "ConsultaCadastradaId": null, // Estou utilizando por padrão "null" para os robôs de busca de Processo
  "DataEnfileiramento": "2021-02-09T12:42:00.971Z" // será gerado pelo "cadastrarExecucao()"
}
```

### Saída

| Campo            | Tipo                 | Descrição                                                        |
| ---------------- | -------------------- | ---------------------------------------------------------------- |
| IdLog            | String               | \_id do Log de COnsulta que foi previamente enviado pelo BigData |
| NumeroDoProcesso | String               | Numero do processo em que foi realizado a extração               |
| NumeroDaOab      | String               | Numero da Oab em que foi realizado a extração                    |
| Resultado        | [ExtracaoResultados] | Lista de Objetos do tipo ExtracaoResultados. \*                  |
| Sucesso          | Boolean              | Indicador se houve sucesso ao realizar a extração                |
| Detalhes         | String               | Caso houve algum erro aqui entra a _message_ do erro.            |

- ExtracaoResultado

  ```json
  {
    "idProcesso": "{String}",
    "numeroProcesso": "{String}",
    "temAndamentosNovos": "{Boolean}",
    "qtdAndamentosNovos": "{Number}"
  }
  ```

## Endpoints

### /getProcessos

Retorna o processo completo com capa, envolvidos e andamentos.

**METHOD: GET**

#### Params

| Campo          | Descricção         |
| -------------- | ------------------ |
| numeroProcesso | Numero do processo |

### /getAndamentos

Retorna somente os andamentos referente ao processo.

**METHOD: GET**

**Params**

| Campo          | Descrição          |
| -------------- | ------------------ |
| numeroProcesso | Numero do processo |
