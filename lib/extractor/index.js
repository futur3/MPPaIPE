/**
 * Created by vrut on 02/09/14.
 */

var sa = require('superagent');
var cheerio = require('cheerio');
var fs = require('fs');

function Extractor() {}

Extractor.prototype.doer = function(url, cb) {
  if (fs.existsSync('cache.html')) {
    return this.elab(fs.readFileSync('cache.html'), cb);
  }
  sa(url).end(function(res) {
    if (res.ok) {
      fs.writeFileSync('cache.html', res.text);
      this.elab(res.text, cb);
    } else {
      cb(res.error);
    }
  }.bind(this));
};

Extractor.prototype.elab = function(html, cb) {
  var $ = this.$ = cheerio.load(html);
  var $tr = $('tr'); // non funziona selettore table > tbody > tr, dio merda
  var that = this;
  var results = [];
  var current = {
    country: null,
    intPrefix: null,
    prefix: null,
    nsn: null,
    carrier: null
  };
  //
  $tr.each(function(index) {
    // salto prima riga, in quanto è titolo della tabella, per il motivo di cui sopra.
    if (!index) {
      return;
    }
    var $cells = $(this).find('td');
    that.digest($cells, current);
    // dopo il digest, ho in current la riga appena letta!
    results.push(JSON.parse(JSON.stringify(current)));
  });
  cb&&cb(null, results);
};

// i tr con dei buchi davanti (riga con cell con colspan > 1) iniziano da zero, quindi devo contare quante celle ho
// per capire i valori che devo leggere!
Extractor.prototype.digest = function($cells, current) {
  var indexes = {
    country: null,
    intPrefix: null,
    prefix: null,
    nsn: null,
    carrier: null
  };
  switch ($cells.length) {
    case 6:
      indexes.country = 0;
      indexes.intPrefix = 1;
      indexes.prefix = 2;
      indexes.nsn = 3;
      indexes.carrier = 4;
      break;
    case 5:
      indexes.intPrefix = 0;
      indexes.prefix = 1;
      indexes.nsn = 2;
      indexes.carrier = 3;
      break;
    case 4:
    case 3:
      indexes.prefix = 0;
      indexes.nsn = 1;
      indexes.carrier = 2;
      break;
    default:
      // boooh!
  }
  // i valori a null, rimangono dalla riga precedente, gli altri li leggo e godo come un riccio.
  for (var key in indexes) {
    var index = indexes[key];
    if (index !== null) {
      current[key] = this.getValue($cells[index]);
    }
  }
};

// estraggo valore. Se c'è un a, prendo il contenuto, altrimenti devo prendere contenuto cella.
Extractor.prototype.getValue = function($cell) {
  //
  var ret;
  var $a = this.$($cell).find('a');
  if ($a.length) {
    ret = this.$($a[0]).html();
  } else {
    ret = this.$($cell).html();
  }
  return ret
    .replace(/x/g, '')
    .replace(/\?/g, '')
    .replace(/&nbsp;/g, '')
  ;
};

module.exports = Extractor;