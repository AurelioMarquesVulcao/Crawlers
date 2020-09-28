var textos = [
    "Gabinete da Desembargadora Maria Inês Corrêa",
    "Gabinete do Desembargador Renan Ravel Rodrigues Fagun",
    "Gabinete do ",
    ""
];
var regex = /(Gabinete\sd[aoe])/i;
for (texto of textos) {
    // console.log(texto);
    if (/(Gabinete\sd[aoe])/i.test(texto))    
        console.log(texto, regex.test(texto))
    // console.log(
    //     regex.test(textos[i]), textos[i]

    // );
}
console.log(regex.test(textos[1]));