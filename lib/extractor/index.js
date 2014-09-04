/**
 * Created by vrut on 02/09/14.
 */

var sa = require('superagent');
var cheerio = require('cheerio');
var fs = require('fs');

function Extractor() {
  this.cellCount = null;
}

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
  var buffer = {};
  //
  $tr.each(function(index) {
    var $cells;
    // salto prima riga, in quanto è titolo della tabella, per il motivo di cui sopra.
    if (!index) {
      $cells = $(this).find('th');
      // store td count!
      that.cellCount = $cells.length;
      return;
    }
    $cells = $(this).find('td');
    that.digest($cells, buffer, current);
    // se ho un prefix tipo: 3120-3128, faccio foreach.
    var arTmp = current.prefix.split('-').map(function(el) {
      return ~~el;
    });
    var i, len;
    if (arTmp.length === 1) {
      len = arTmp[0];
    } else {
      len = arTmp[arTmp.length-1];
    }
    for (i=arTmp[0];i<=len;i++) {
      // dopo il digest, ho in current la riga appena letta!
      var tmpObj = JSON.parse(JSON.stringify(current));
      tmpObj.prefix = i;
      results.push(tmpObj);
    }
  });
  cb&&cb(null, results);
};

// i tr con dei buchi davanti (riga con cell con colspan > 1) iniziano da zero, quindi devo contare quante celle ho
// per capire i valori che devo leggere!
Extractor.prototype.digest = function($cells, buffer, current) {
  var that = this;
  var index = 0;
  var indexes = {
    0: 'country',
    1: 'intPrefix',
    2: 'prefix',
    3: 'nsn',
    4: 'carrier',
    5: 'notes'
  };
  var $tmpCells = {};
  var fn = function(index) {
    var rowSpan;
    if (rowSpan = that.$(this).attr('rowspan')) {
      that.$(this).attr('rowspan', null);
      buffer[index] = {
        $: this,
        count: rowSpan
      };
    }
    //
    current[indexes[index]] = that.getValue(that.$(this));
  };
  // fill $cells with buffer that should exists!
  if ($cells.length < that.cellCount) {
    for (var i=0;i<that.cellCount;i++) {
      if (buffer[i]) {
        $tmpCells[i] = buffer[i].$;
        if (!(--buffer[i].count)) {
          delete buffer[i];
        }
      } else {
        $tmpCells[i] = $cells[index++];
      }
      if ($tmpCells[i]) {
        fn.bind($tmpCells[i])(i);
      } else {
        console.log('Skipping cell. Maybe empty?', i, index-1);
      }
    }
  } else {
    $cells.each(fn);
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
    .replace('&nbsp;', '')
    .replace('&#A0;', '')
  ;
};

module.exports = Extractor;