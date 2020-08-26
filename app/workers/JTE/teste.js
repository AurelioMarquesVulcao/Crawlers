const shell = require('shelljs');

(async () => {
    await shell.exec('pkill chrome');
    shell.exec('ls');
})()
