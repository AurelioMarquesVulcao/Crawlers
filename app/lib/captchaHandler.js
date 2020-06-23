const { enums } = require('../configs/enums');
let Anticaptcha = require('../bin/js/anticaptcha')(
  '4b93beb6fe87d3bf3cfd92966ec841a6'
);
const CAPTCHAIO_KEY = 'aa2ecb19-5ef113a38b5931.24355257';

const { Robo } = require('../lib/robo');

const { AntiCaptchaResponseException } = require('../models/exception/exception');

module.exports.antiCaptchaHandler = (website, websiteKey, pageAction) => {
  return new Promise((resolve, reject) => {
    Anticaptcha.setWebsiteURL(website);
    Anticaptcha.setWebsiteKey(websiteKey);
    Anticaptcha.setMinScore(0.3);
    Anticaptcha.setPageAction(pageAction);

    Anticaptcha.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/52.0.2743.116'
    );
    Anticaptcha.getBalance((err, balance) => {
      if (err) {
        return reject(new AntiCaptchaResponseException('NOT_AVALIABLE', err.message))
      }
      console.log('balance', balance);
      if (balance > 0) {
        Anticaptcha.createTaskProxyless((err, taskId) => {
          if (err) {
            return reject(new AntiCaptchaResponseException('CREATE_PROXYLESS_TASK', err.message))
          }
          Anticaptcha.getTaskSolution(taskId, (err, gResponse) => {
            if (err) {
              return reject(new AntiCaptchaResponseException('GET_CAPTCHA_SOLUTION', err.message));
            }
            return resolve({ gResponse, balance });
          });
        });
      } else {
        return reject(new AntiCaptchaResponseException('NO_FOUNDS', 'Not enough founds to start the operation.'))
      }
    });
  });
};

module.exports.captchasIOHandler = async (website, websiteKey, pageAction) => {
  console.log(website, websiteKey, pageAction);
  const robo = new Robo();
  let captchaIn;
  let captchaRes;
  let url;
  let tentativas = 0;
  console.log(website, websiteKey, pageAction);

  // do {
  //   captchaIn = await robo.acessar(
  //     {
  //       url: "https://api.captchas.io/in.php",
  //       method: "post",
  //       params: {
  //         method: "userrecaptcha",
  //         key: CAPTCHAIO_KEY,
  //         googlekey: websiteKey,
  //         pageurl: website,
  //         json: 1
  //       }
  //     }
  //   );
  // } while (tentativas < 5);
  //
  // if (tentativas => 5) {}
  //
  // console.log(captchaIn);
  //
  // if (captchaIn.responseBody.test('OK')) {
  //   //TODO remover futuramente
  //   //console.log('----- CAPTCHAIN', captchaIn);
  //   captchaIn.responseBody.replace(/OK\|/g, '')
  //   let captchaId = captchaIn.responseBody.replace(/OK\|/g, '');
  //   url = `?key=${CAPTCHAIO_KEY}&action=get&id=${captchaId}&json=1`
  //
  //   captchaRes = await robo.acessar(
  //     {
  //       url: 'https://api.captchas.io/res.php'+url,
  //       method: 'get',
  //     }
  //   )
  //
  //
  //   console.log(captchaRes.responseBody);
  // }



}