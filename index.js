var program = require('commander');
var Extractor = require('./lib/extractor');

program
  .version('0.0.1')
  .option('-e, --extractor [url]', 'Estrae da url (wikipedia) int prefix/local prefix)')
  .parse(process.argv);

if (program.extractor) {
  var extractor = new Extractor();
  extractor.doer(program.extractor, function (err, res) {
    console.log(JSON.stringify(res));
  })
}