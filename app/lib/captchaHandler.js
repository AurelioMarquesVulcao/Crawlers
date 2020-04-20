const { enums } = require('../configs/enums');
const Anticaptcha = require('../bin/js/anticaptcha');

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
        console.log(err);
        return reject(false);
      }
      console.log('balance', balance);
      if (balance > 0) {
        Anticaptcha.createTaskProxyless((err, taskId) => {
          if (err) {
            console.log(err);
            return reject(false);
          }
          console.log(taskId);
          Anticaptcha.getTaskSolution(taskId, (err, gResponse) => {
            if (err) {
              console.log(err);
              return reject(false);
            }
            return resolve({ gResponse, balance });
          });
        });
      }
    });
  });
};
