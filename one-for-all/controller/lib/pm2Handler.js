const pm2 = require('pm2');

class Pm2Handler {

  static async start(options) {
    return new Promise(resolve => {
      pm2.connect(function(err) {
        if (err){
          console.error(err);
          process.exit(2);
        }

        pm2.start(options, function(err, apps) {
          if (err){
            console.error(err);
            process.exit(2);
          }

          pm2.disconnect();
          resolve(true);
        })
      })
    })
  }

  static async delete(nome) {
    return new Promise((resolve) => {
      pm2.connect(function(err) {
        if (err){
          console.error(err);
          process.exit(2);
        }

        pm2.delete(nome, function(err, apps) {
          if (err){
            console.error(err);
            process.exit(2);
          }
          pm2.disconnect();
          resolve(true);
        })
      })
    })
  }

  static async list() {
    return new Promise(resolve => {
      pm2.connect(function(err) {
        if (err){
         console.error(err);
         process.exit(2);
        }

        pm2.list((err, list) => {
          if(err) {
            console.error(err);
            process.exit(2);
          }
          resolve(list);
        })
      })
    })

  }

  static async connect() {}
  static async disconnect() {}
}

module.exports.Pm2Handler = Pm2Handler;