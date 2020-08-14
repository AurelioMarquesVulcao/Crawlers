var fs = require('fs');
var pdf = require('html-pdf');


class HtmlparaPdf {
    async converter(html) {
        //var html = ""
        var options = { format: 'A4' };

        pdf.create(html, options).toFile('./teste01.pdf', function (err, res) {
            if (err) return console.log(err);
            console.log(res); // { filename: '/app/businesscard.pdf' }
        });

    }
}

module.exports.HtmlparaPdf = HtmlparaPdf;

// new HtmlparaPdf().converter()


