const {Util} = require('../../controller/lib/util');

(async () => {
    // vai dar um reset nas aplicações a cada 1/2 hora.
    await new Util().resetPM2(3600000/2)

})();