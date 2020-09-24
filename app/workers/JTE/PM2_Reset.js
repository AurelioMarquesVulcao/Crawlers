const {Util} = require('../../controller/lib/util');

(async () => {
    // vai dar um reset nas aplicações a cada 1 hora.
    await new Util().resetPM2(3600000)

})();