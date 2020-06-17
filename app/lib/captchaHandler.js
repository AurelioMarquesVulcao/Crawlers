const { enums } = require('../configs/enums');
let Anticaptcha = require('../bin/js/anticaptcha')(
  '4b93beb6fe87d3bf3cfd92966ec841a6'
);

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
