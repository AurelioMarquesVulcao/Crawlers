const {Util} = require('../../controller/lib/util');

(async () => {
    // dará um reset nas aplicações a cada 20 minutos.
    await new Util().resetPM2(1200000)

})();