const {Util} = require('../../controller/lib/util');

(async () => {
    // vai dar um reset nas aplicações a cada 20 minutos.
    await new Util().resetPM2(1200000)

})();