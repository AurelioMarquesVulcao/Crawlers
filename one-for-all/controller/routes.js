const express = require("express");
const routes = express.Router();
const { CPU } = require("./lib/getCpu");
const {PostComandos} = require('./services/postComandos');
const {GetPm2} = require('./services/getPM2');

routes.get("/", function (req, res) {
  return res.send("Você esta no serviço One for All");
});
routes.post("/", function (req, res) {
  return res.send("Você esta no serviço One for All");
});

routes.post("/limpaMemoria", PostComandos.limpaMemoria);

routes.post("/Pm2Variaval", PostComandos.Pm2Variaval);

routes.post("/PM2", PostComandos.PM2);

routes.post("/dockerUp", PostComandos.dockerUp);

routes.post("/dockerStop", PostComandos.dockerStop);

routes.post("/dockerStopAll", PostComandos.dockerStopAll);

routes.post("/escaleContainer", PostComandos.escaleContainer);

routes.post("/dockerUpBuild", PostComandos.dockerUpBuild);

routes.post("/escaleContainer", PostComandos.escaleContainer);


routes.get("/cpu", CPU.cpuStatus);

routes.get("/pm2List", GetPm2.get);



module.exports = routes;