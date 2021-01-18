const shell = require('shelljs');
(async () => {
    setInterval(async function () {
        console.log("Vou executar remoção de core");
        
        shell.exec('rm ./core* -f')

        console.log("Executei remoção de core");

    }, 60000);
})()