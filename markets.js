/* Custom right column: three stacked panels. STOCKS (Yahoo 5-min intraday, Stooq fallback; every 60 s), CRYPTO (Binance
   price every 5 s, 24 h line from 15-min klines every 5 min) and NEWS (CNBC / MarketWatch RSS every 10 min, 3 at a time,
   rotating). Prices flash on a tick and count to the new value. Plain ES5; everything fails silently. */
(function () {
  var C = window.CONFIG || {};
  var SYMS = (C.stockSymbols || 'SPY,QQQ,DIA,^VIX').split(',');
  var COINS = ['BTC', 'ETH', 'SOL'];
  var FEEDS = [['CNBC', 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114'],
               ['MarketWatch', 'https://feeds.content.dowjones.io/public/rss/mw_topstories']];
  function get(url, cb) {
    var x = new XMLHttpRequest();
    try { x.open('GET', url, true); } catch (e) { return cb(null); }
    x.timeout = 12000;
    x.onload = function () { cb(x.status === 200 ? x.responseText : null); };
    x.onerror = x.ontimeout = function () { cb(null); };
    x.send();
  }
  function json(t) { try { return JSON.parse(t); } catch (e) { return null; } }
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(function () { f(Date.now()); }, 33); };
  function lite() { return /\blite\b/.test(document.documentElement.className + ' ' + document.body.className); }
  function div(cls, parent, html) { var d = document.createElement('div'); d.className = cls; if (html) d.innerHTML = html; parent.appendChild(d); return d; }

  var col = div('', document.getElementById('top')); col.id = 'mk';
  var rows = {};
  function panel(title, keys, label, extra) {
    var p = div('mkp', col), h = div('mkh', p, '<span>' + title + '</span>');
    if (extra) { var e = div('', h); e.id = extra; }
    for (var i = 0; i < keys.length; i++) {
      var r = div('mkr', p, '<div class="t">' + label(keys[i]) + '</div><div class="s"></div><div class="p">–</div><div class="c"></div>');
      rows[keys[i]] = {el: r, s: r.children[1], p: r.children[2], c: r.children[3], v: null, line: null};
    }
    return p;
  }
  function etNow() { // US Eastern time without Intl (old Tizen): DST 2nd Sun Mar 07:00Z .. 1st Sun Nov 06:00Z
    var n = new Date(), y = n.getUTCFullYear();
    var m1 = new Date(Date.UTC(y, 2, 1)), a = Date.UTC(y, 2, 1 + (7 - m1.getUTCDay()) % 7 + 7, 7);
    var n1 = new Date(Date.UTC(y, 10, 1)), b = Date.UTC(y, 10, 1 + (7 - n1.getUTCDay()) % 7, 6);
    var t = n.getTime(), off = (t >= a && t < b) ? 4 : 5; return new Date(t - off * 3600000);
  }
  function mktOpen() { var e = etNow(), d = e.getUTCDay(), m = e.getUTCHours() * 60 + e.getUTCMinutes();
    return d > 0 && d < 6 && m >= 570 && m < 960; }
  var stp = panel('Stocks', SYMS, function (s) { return s.charAt(0) === '^' ? s.slice(1) : s; }, 'floorrow');
  var ctag = document.createElement('em'); ctag.className = 'closed'; ctag.textContent = 'Closed';
  ctag.style.cssText = 'font-style:normal;font-size:0.62em;margin-left:10px;padding:1px 7px;border-radius:6px;background:rgba(245,245,247,0.12);color:rgba(245,245,247,0.6);vertical-align:middle';
  stp.firstChild.firstChild.appendChild(ctag);
  function closedTag() { ctag.style.display = mktOpen() ? 'none' : 'inline'; }
  closedTag(); setInterval(closedTag, 60000);
  panel('Crypto <i class="live"></i>', COINS, function (k) { return k; });
  var np = div('mkp news', col); div('mkh', np, '<span>News</span>'); var nl = div('nl', np);

  function fmt(v) { return v >= 1000 ? Math.round(v).toLocaleString('en-US') : v.toFixed(2); }
  function spark(o) {
    var pts = o.line; if (!pts || pts.length < 2) { o.s.innerHTML = ''; return; }
    var w = 210, h = 86, mn = Math.min.apply(null, pts), mx = Math.max.apply(null, pts), d = '';
    if (o.hl) { mx = Math.max(mx, o.hl[0]); mn = Math.min(mn, o.hl[1]); }
    var r = (mx - mn) || 1;
    for (var i = 0; i < pts.length; i++) d += (i ? ' L' : 'M') + (i * (o.hl ? w - 46 : w) / (pts.length - 1)).toFixed(1) + ',' + (h - 3 - (pts[i] - mn) / r * (h - 6)).toFixed(1);
    var col = pts[pts.length - 1] >= pts[0] ? '#30D158' : '#FF453A', fresh = !o.s.firstChild;
    var g = '', gx; for (var k = 1; k < 6; k++) { gx = (k * w / 6).toFixed(1);
      g += '<line x1="' + gx + '" y1="0" x2="' + gx + '" y2="' + h + '" stroke="rgba(245,245,247,0.08)" stroke-width="1"/>'; }
    if (o.hl) for (var q = 0; q < 2; q++) { var yy = (h - 3 - (o.hl[q] - mn) / r * (h - 6)).toFixed(1);
      g += '<line x1="0" y1="' + yy + '" x2="' + w + '" y2="' + yy + '" stroke="rgba(245,245,247,0.18)" stroke-width="1" stroke-dasharray="3,3"/>' +
        '<text x="' + (w - 1) + '" y="' + (q ? +yy - 3 : +yy + 13) + '" text-anchor="end" font-size="13" fill="rgba(245,245,247,0.45)">' +
        (q ? 'L ' : 'H ') + kfmt(o.hl[q]) + '</text>'; }
    o.s.innerHTML = '<svg width="' + w + '" height="' + h + '">' + g + '<path ' + (fresh ? 'class="draw" pathLength="100" ' : '') + 'd="' + d +
      '" fill="none" stroke="' + col + '" stroke-width="3" stroke-linejoin="round"/></svg>';
  }
  function set(key, v, ch) {
    var o = rows[key]; if (!o || !(v > 0)) return;
    var from = o.v; o.v = v;
    if (!isNaN(ch)) { o.c.textContent = (ch >= 0 ? '+' : '') + ch.toFixed(2) + '%'; o.c.className = 'c ' + (ch >= 0 ? 'up' : 'dn'); }
    if (from !== null && from !== v) { o.el.className = 'mkr ' + (v > from ? 'fu' : 'fd'); setTimeout(function () { o.el.className = 'mkr'; }, 60); }
    if (from === null || from === v || lite()) { o.p.textContent = fmt(v); return; }
    var t0 = 0;
    raf(function step(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 600); k = 1 - Math.pow(1 - k, 3);
      if (o.v !== v) return; o.p.textContent = fmt(from + (v - from) * k); if (k < 1) raf(step); });
  }
  function kfmt(v) { return v >= 1000 ? (v / 1000).toFixed(v >= 100000 ? 0 : v >= 10000 ? 1 : 2) + 'k' : v.toFixed(2); }
  function hilo(key, hs, ls) { var o = rows[key]; hs = hs.filter(function (x) { return x > 0; }); ls = ls.filter(function (x) { return x > 0; });
    if (!o || !hs.length || !ls.length) return; o.hl = [Math.max.apply(null, hs), Math.min.apply(null, ls)]; if (o.line) spark(o); }
  // 30-day high/low: Yahoo daily bars for stocks, Binance daily klines for crypto (no keys). Every 30 min.
  function ranges() {
    SYMS.forEach(function (s) {
      get('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(s) + '?range=1mo&interval=1d', function (t) {
        try { var q = json(t).chart.result[0].indicators.quote[0]; hilo(s, q.high || [], q.low || []); } catch (e) {}
      });
    });
    COINS.forEach(function (k) {
      get(hosts[hi] + '/api/v3/klines?symbol=' + k + 'USDT&interval=1d&limit=30', function (t) {
        var j = json(t); if (j && j.length) hilo(k, j.map(function (r) { return +r[2]; }), j.map(function (r) { return +r[3]; }));
      });
    });
  }
  function line(key, pts) { var o = rows[key]; if (!o) return; o.line = pts; spark(o); }

  // Stocks: Yahoo's 5-minute chart for today (price, previous close and the line); Stooq for the price only.
  function stooq(s) {
    if (s.charAt(0) === '^') return;
    get('https://stooq.com/q/l/?s=' + s.toLowerCase() + '.us&f=sd2t2ohlcp&h&e=csv', function (t) {
      if (!t) return; var r = (t.split('\n')[1] || '').split(','), p = +r[6], prev = +r[7];
      if (p > 0 && prev > 0) set(s, p, (p / prev - 1) * 100);
    });
  }
  function stocks() {
    SYMS.forEach(function (s) {
      get('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(s) + '?range=1d&interval=5m', function (t) {
        try {
          var res = json(t).chart.result[0], m = res.meta, p = m.regularMarketPrice, prev = m.chartPreviousClose || m.previousClose;
          var cl = (res.indicators.quote[0].close || []).filter(function (x) { return x > 0; });
          if (p > 0 && prev > 0) { set(s, p, (p / prev - 1) * 100); if (cl.length > 1) line(s, cl); return; }
        } catch (e) {}
        stooq(s);
      });
    });
  }
  // Crypto: Binance.com refuses the US (451), so Binance.US first.
  var hosts = ['https://api.binance.us', 'https://api.binance.com'], hi = 0;
  function crypto() {
    var syms = encodeURIComponent(JSON.stringify(COINS.map(function (k) { return k + 'USDT'; })));
    get(hosts[hi] + '/api/v3/ticker/24hr?symbols=' + syms, function (t) {
      var j = json(t); if (!j || !j.length) { hi = (hi + 1) % hosts.length; return; }
      for (var i = 0; i < j.length; i++) {
        var k = j[i].symbol.replace('USDT', ''), o = rows[k], p = +j[i].lastPrice;
        set(k, p, +j[i].priceChangePercent);
        if (o && o.line) { o.line[o.line.length - 1] = p; spark(o); }
      }
    });
  }
  function klines() {
    COINS.forEach(function (k) {
      get(hosts[hi] + '/api/v3/klines?symbol=' + k + 'USDT&interval=15m&limit=96', function (t) {
        var j = json(t); if (j && j.length) line(k, j.map(function (r) { return +r[4]; }));
      });
    });
  }
  // News: newest first, three at a time; every 10 s the list moves up by one.
  var heads = [], at = 0;
  function decode(s) { var d = document.createElement('textarea'); d.innerHTML = s.replace(/<!\[CDATA\[|\]\]>/g, ''); return d.value.replace(/\s+/g, ' '); }
  function clock(t) { if (!t) return ''; var d = new Date(t), h = d.getHours(), m = d.getMinutes();
    return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? ' AM' : ' PM'); }
  function showNews() {
    if (!heads.length) return;
    nl.className = 'nl out';
    setTimeout(function () {
      var h = '';
      for (var i = 0; i < 3 && i < heads.length; i++) { var n = heads[(at + i) % heads.length];
        h += '<div class="n"><div class="nt">' + n.title.replace(/</g, '&lt;') + '</div><div class="nm">' + n.src + (n.t ? ' · ' + clock(n.t) : '') + '</div></div>'; }
      nl.innerHTML = h; nl.className = 'nl'; at = (at + 1) % heads.length;
    }, lite() ? 0 : 400);
  }
  function news() {
    var got = [], left = FEEDS.length;
    FEEDS.forEach(function (f) {
      get(f[1], function (t) {
        if (t) { var items = t.split('<item');
          for (var i = 1; i < items.length && i <= 8; i++) {
            var m = /<title>([\s\S]*?)<\/title>/.exec(items[i]), d = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(items[i]);
            if (m) got.push({title: decode(m[1]), src: f[0], t: d ? Date.parse(d[1]) || 0 : 0});
          } }
        if (--left === 0 && got.length) { got.sort(function (a, b) { return b.t - a.t; }); heads = got.slice(0, 12); at = 0; showNews(); }
      });
    });
  }
  var sky = document.getElementById('sky'); div('sweep', sky);
  stocks(); crypto(); klines(); news(); ranges(); setInterval(ranges, 1800000);
  setInterval(stocks, 60000); setInterval(crypto, 5000); setInterval(klines, 300000); setInterval(news, 600000); setInterval(showNews, 10000);
  window.MarketsMock = function (q, lines, h) { for (var k in q) set(k, q[k][0], q[k][1]); for (k in lines) line(k, lines[k]); heads = h; at = 0; showNews(); };
})();
