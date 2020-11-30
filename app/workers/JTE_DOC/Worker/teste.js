const Fs = require('fs');
const base64 = Fs.readFileSync("/home/aurelio/crawlers-bigdata/downloads/Petição Inicial (RESTRITO) [ 1bfec57 ].pdf", 'base64');
console.log(base64);