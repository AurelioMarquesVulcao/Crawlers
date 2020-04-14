const OabTJBAPortal = require("./extratores/extratores").OabTJBAPortal;

let extrator = new OabTJBAPortal(
  "http://www5.tjba.jus.br/portal/busca-resultado",
  true
);

extrator.extrair("31034");
