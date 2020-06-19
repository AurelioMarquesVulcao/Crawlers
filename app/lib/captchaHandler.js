const { enums } = require('../configs/enums');
const { Robo } = require('../lib/robo');
const axios = require('axios');
let Anticaptcha = require('../bin/js/anticaptcha')(
  '4b93beb6fe87d3bf3cfd92966ec841a6'
);

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
          console.log('AntiCaptcha TaskId', taskId);
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

module.exports.audioCaptchaHandler = async (b64String) => {

  const data = JSON.stringify({"audio": b64String});

  var config = {
    method: 'post',
    url: 'http://172.16.16.8:5000/api/solve',
    headers: {
      'Accept-Encoding': 'utf8',
      'Content-Type': 'application/json'
    },
    data : data
  };

  let response = await axios(config);

  return response.data;
}