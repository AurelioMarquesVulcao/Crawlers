const { Helper } = require('../../lib/util');
// let t1 = "https://jte.trt2.jus.br/mobileservices/consultaDocumento?json={%22header%22:%22%27FqgYuiXYhljRyRtJZYj51o5iQ8kfXDdFzD9ggECe2b3asA1z9G7xnptO93x9qmvz3vPhMtpQyPDnCEL5AQUeZXoXfkevQTcwOOpzk94mjMvd0KG5qG%2BtKnq0R%2BqrHaUWML3LSZRUVzK8HCmTDoU%2B%2B%2BLSRiWpw9q4JEtIXEkr8g7UfiXWD0Wk4pTUb9CzdOaua1DP3%2Bvc/BlrD9reFGaVpUEtu9LZpX%2BG85wtd3wfqelZUtAB1eaZx5UNKjmrKyrJvm276NQannlGqIPO%2BoqMbT/Han7sp6RgRcJ1K8cekriNvDXX4mAxBlSaxGOpNF2D9ejuZf4RhEcBo/QnycauMOIPsPJ96KfqHp3eANbIaAbRzjxPSKW5sqsbs9gNNfrJINzjhOJmh7p0QPKI%2BtLPBdY%2BEoAzR7MYK6NZSvt6D9rzUufdiVDybyXxZpsoYXeZfZywJO2YIFTgp0zC31z/zDyg5EVPutqixUIWEFwRM3KJar4Jno/cAJ6YzNitM3lNARXsaAhcbRj1pycAXuYK/Uh3GjTnUb1wc7j6NgjFUt8JlJ7SIZxyKAza7GOq85X89WN36jgMzW7g4Ogn/w077bBRF1QdQ0MC7vggupZBQcNI1gCIPOohaAZKgD1/a7oQT4sbnH6mCHR%2B1e1yXr9MzJuVJ2JPMC2WlOyXloj4RqwUku%2B4OJ/AHKXoZraYqJOwxFmP5TVgY0w4/EiZjMTYOPOmxilVqpaHlXJVxGgiH8MIYai3vgIsxVHb8QHevIPIA8kYmIUUOel1p2mTvLN/w9SMqmBCqAi4mOksAqdFitiRjOFwnLWqyPa2qZRA9cwqgTGTuEGXPUm1ElbOj8s1cKH5U5b2O2yhusZNd7ZhbjDxb4e7GETsFPGD/KrM1sDhxi8fhS5VJgCQMPKtg5%2BGrEYyoSyNBDQzG/Y70VC%2BHkoyEDRLLWhzKl0gryQAKnp7Qott%2BdwYnNhu%2Bwa4DBTTVG9gAxy9vTIb%2BpRxXttcNAZMjvhFNTh6MxviZnR4qI/WHwKYWPSG5x9EZl6fqERGpPowSM9udb06OOOZ1JmlsBCGTvLPQBjKye34L473hWhUmllagfYSysspXPT/iINU36FCV3%2BifyhMbrVHrMzvnTvhwCRflYVJu10gwHvadO0NvIWAi7odF9luGfqdQeGMi6P0sdzz8x/iXcBI5pYQbwsWbjF2NaE6HGhvG3FhOQbJylkNruwYagE6RIzrGMqS8lSl3mrLc/ZBMjkZc3mA%2BO9O5EUpX13VJ9dCUuIbcYUg4Be0djizpxtBol/M4rptXJvUSn5Q4hZ5xFINBtbFV4/QWRWY2/Twsb56izuvMUC/e8xycXwhCFR7E4kTvP8CFN/jBdhw4Z6rNKaRPCX5USqJ91Gt0SxnvbLj0QMQ3fgqUJMiyLkduF/8vIZU4Z2poX2XjZRNOhe79DWKynz3S1vfpTJWWuC7zXeiQVdhTxADPr1VahFy/lEO/2hZ8HOYw%2BoMfzYRhOOCZZjaTpE/ZsnRlLfEGWjSFTn3A1XxzUf5V5rtb8YBdoLqhlttewudEpyQF4NtGYHuqy%2B1btH5FQyvnre527an6XfZcVmsrX1dzSNG7UBDUNNBe5R1k9v8Vuj4VKGj9OC3Vy6iWQW8szGEli%2B/5mo8XqmZiKqI/kh%2Br7rI%2BXtzC3g%2ByXeKOpujf4As7fHO72DgDXpDvSh//kb1NONx0rA2GN1rxhd0K%2B3dVsDPONPlmFKyap%2BXmLwIRqmek2IygexFlPMc%2BI8YFAs7XLN99Y%2BroddzwZFbf/hqKzB4DM2Qe7Ulj2houURjsu/OEu/BDRn1qP232iYjV4WGhHdKXbZ2XtkNgJbH0tyWfgmGYOQGki9gKLMh/5Xve3Ldltftuz40GqkAfL2SGjkjSQ6mM49lFx5N7aV9Stbe3FTeh2SIaXv%2BaDTSUIxS%2BTfHMaaiiPYvYJPArQSsWQoHCMG2xNpdOCyPiklX6AUkpX8%2BCKP92nxjYuz1qqYrXSTLik9EaRMOAqls7QtFeLwR3v5bMrrGjLXZ2j8v8AHCk6FP6Tc2fvPerlBGMNSrd24KpV%2BoCLClquPMYKIEj9sS/y9I%2BRDZTj/UQxZLOmQObuI94ymCoS0reW7x3dw3EE6jjxHLRjgSlMm%2BQBZlf7i7n7hym/LNIvzxSAdE74q/%27%22,%22body%22:%22%27KlcbPnEQqJpm8IEz2JxINQa0A1aAKVthvsCyoLB5M8hPVODr5QLHtyLjPYnlt1Zpx1XJySlioRjOG2C5Gyqa7Q==%27%22}&Host=jte.trt2.jus.br";
// let t2 = "https://jte.trt2.jus.br/mobileservices/consultaDocumento?json={%22header%22:%22%27FqgYuiXYhljRyRtJZYj51o5iQ8kfXDdFzD9ggECe2b3asA1z9G7xnptO93x9qmvz3vPhMtpQyPDnCEL5AQUeZXoXfkevQTcwOOpzk94mjMvd0KG5qG%2BtKnq0R%2BqrHaUWML3LSZRUVzK8HCmTDoU%2B%2B%2BLSRiWpw9q4JEtIXEkr8g7UfiXWD0Wk4pTUb9CzdOaua1DP3%2Bvc/BlrD9reFGaVpUEtu9LZpX%2BG85wtd3wfqelZUtAB1eaZx5UNKjmrKyrJvm276NQannlGqIPO%2BoqMbT/Han7sp6RgRcJ1K8cekriNvDXX4mAxBlSaxGOpNF2D9ejuZf4RhEcBo/QnycauMOIPsPJ96KfqHp3eANbIaAbRzjxPSKW5sqsbs9gNNfrJINzjhOJmh7p0QPKI%2BtLPBdY%2BEoAzR7MYK6NZSvt6D9rzUufdiVDybyXxZpsoYXeZfZywJO2YIFTgp0zC31z/zDyg5EVPutqixUIWEFwRM3KJar4Jno/cAJ6YzNitM3lNARXsaAhcbRj1pycAXuYK/Uh3GjTnUb1wc7j6NgjFUt8JlJ7SIZxyKAza7GOq85X89WN36jgMzW7g4Ogn/w077bBRF1QdQ0MC7vggupZBQcNI1gCIPOohaAZKgD1/a7oQT4sbnH6mCHR%2B1e1yXr9MzJuVJ2JPMC2WlOyXloj4RqwUku%2B4OJ/AHKXoZraYqJOwxFmP5TVgY0w4/EiZjMTYOPOmxilVqpaHlXJVxGgiH8MIYai3vgIsxVHb8QHevIPIA8kYmIUUOel1p2mTvLN/w9SMqmBCqAi4mOksAqdFitiRjOFwnLWqyPa2qZRA9cwqgTGTuEGXPUm1ElbOj8s1cKH5U5b2O2yhusZNd7ZhbjDxb4e7GETsFPGD/KrM1sDhxi8fhS5VJgCQMPKtg5%2BGrEYyoSyNBDQzG/Y70VC%2BHkoyEDRLLWhzKl0gryQAKnp7Qott%2BdwYnNhu%2Bwa4DBTTVG9gAxy9vTIb%2BpRxXttcNAZMjvhFNTh6MxviZnR4qI/WHwKYWPSG5x9EZl6fqERGpPowSM9udb06OOOZ1JmlsBCGTvLPQBjKye34L473hWhUmllagfYSysspXPT/iINU36FCV3%2BifyhMbrVHrMzvnTvhwCRflYVJu10gwHvadO0NvIWAi7odF9luGfqdQeGMi6P0sdzz8x/iXcBI5pYQbwsWbjF2NaE6HGhvG3FhOQbJylkNruwYagE6RIzrGMqS8lSl3mrLc/ZBMjkZc3mA%2BO9O5EUpX13VJ9dCUuIbcYUg4Be0djizpxtBol/M4rptXJvUSn5Q4hZ5xFINBtbFV4/QWRWY2/Twsb56izuvMUC/e8xycXwhCFR7E4kTvP8CFN/jBdhw4Z6rNKaRPCX5USqJ91Gt0SxnvbLj0QMQ3fgqUJMiyLkduF/8vIZU4Z2poX2XjZRNOhe79DWKynz3S1vfpTJWWuC7zXeiQVdhTxADPr1VahFy/lEO/2hZ8HOYw%2BoMfzYRhOOCZZjaTpE/ZsnRlLfEGWjSFTn3A1XxzUf5V5rtb8YBdoLqhlttewudEpyQF4NtGYHuqy%2B1btH5FQyvnre527an6XfZcVmsrX1dzSNG7UBDUNNBe5R1k9v8Vuj4VKGj9OC3Vy6iWQW8szGEli%2B/5mo8XqmZiKqI/kh%2Br7rI%2BXtzC3g%2ByXeKOpujf4As7fHO72DgDXpDvSh//kb1NONx0rA2GN1rxhd0K%2B3dVsDPONPlmFKyap%2BXmLwIRqmek2IygexFlPMc%2BI8YFAs7XLN99Y%2BroddzwZFbf/hqKzB4DM2Qe7Ulj2houURjsu/OEu/BDRn1qP232iYjV4WGhHdKXbZ2XtkNgJbH0tyWfgmGYOQGki9gKLMh/5Xve3Ldltftuz40GqkAfL2SGjkjSQ6mM49lFx5N7aV9Stbe3FTeh2SIaXv%2BaDTSUIxS%2BTfHMaaiiPYvYJPArQSsWQoHCMG2xNpdOCyPiklX6AUkpX8%2BCKP92nxjYuz1qqYrXSTLik9EaRMOAqls7QtFeLwR3v5bMrrGjLXZ2j8v8AHCk6FP6Tc2fvPerlBGMNSrd24KpV%2BoCLClquPMYKIEj9sS/y9I%2BRDZTj/UQxZLOmQObuI94ymCoS0reW7x3dw3EE6jjxHLRjgSlMm%2BQBZlf7i7n7hym/LNIvzxSAdE74q/%27%22,%22body%22:%22%27KlcbPnEQqJpm8IEz2JxINQa0A1aAKVthvsCyoLB5M8hPVODr5QLHtyLjPYnlt1Zpx1XJySlioRjOG2C5Gyqa7Q==%27%22}&Host=jte.trt2.jus.br";

// if(t1==t2){
//   console.log("igual");
// }else{
//   console.log("diferente");
// }

let date = new Date();
let date1 = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 3);
let dataOntem = new Date(
  date.getFullYear(),
  date.getMonth(),
  date.getDate() - 1
);
console.log(date1);
console.log(dataOntem);
console.log(date1 >= dataOntem);
console.log(date >= dataOntem);
(async () => {
  try {
    // console.log(await Helper.getVariaveisAmbiente({aplicacao: 'CheckPointAutoPilot'}));

    await Helper.erroMonitorado({ origem: 'peticao.jte.extracao.01' }, true);
  } catch (e) {
    console.log(e);
  }
  process.exit();
})();
