/* Right column + left boards. DESK (the stock paper desk's format: equity, total/today P&L, record, open positions, equity line)
   and BOSSES (each boss: day, 7 days, total, $ and % of starting balance) from floor.json + bosses.json on GitHub Pages;
   NEWS (CNBC / MarketWatch RSS every 10 min, 3 at a time, rotating). Plain ES5; everything fails silently. */
(function () {
  var BASE = window.DASH_BASE && window.DASH_REMOTE !== false ? window.DASH_BASE : '';
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
  function lite() { return /\blite\b/.test(document.documentElement.className + ' ' + document.body.className); }
  function div(cls, parent, html) { var d = document.createElement('div'); d.className = cls; if (html) d.innerHTML = html; parent.appendChild(d); return d; }
  function money(v, sign) { if (v == null || isNaN(v)) return '\u2013'; var n = Math.abs(v), s = n >= 1000 ? Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : n.toFixed(2);
    return (sign ? (v >= 0 ? '+' : '\u2212') : (v < 0 ? '\u2212' : '')) + '$' + s; }
  function pc(v, base) { if (v == null || !base) return ''; var p = v / base * 100; return (p >= 0 ? '+' : '\u2212') + Math.abs(p).toFixed(1) + '%'; }
  function ud(v) { return v == null ? 'na' : v >= 0 ? 'up' : 'dn'; }
  var col = div('', document.getElementById('top')); col.id = 'mk';
  var desk = div('mkp desk', col), bp = div('mkp bosses', col), cp = div('mkp crypto', col), wx = div('mkp wx', col);
  var np = div('mkp news', col); div('mkh', np, '<span>News</span><span class="cd">CNBC \u00b7 MarketWatch RSS \u00b7 every 10 min</span>'); var nl = div('nl', np);

  /* Chart: thin gridlines, $ labels on the left, date labels on the x axis, high/low markers, line redraws on a loop. */
  function chart(pts, up, w, h, base) {
    var v = [], lb = [], i; for (i = 0; i < (pts || []).length; i++) { if (typeof pts[i] === 'number') { v.push(pts[i]); lb.push(''); } else { v.push(pts[i][1]); lb.push(pts[i][0]); } }
    if (v.length < 2) return '<div class="off">Not enough points yet</div>';
    var L = 92, R = 16, T = 26, Bm = 30, cw = w - L - R, chh = h - T - Bm;
    var mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), pad = (mx - mn) * 0.12 || 1; mn -= pad; mx += pad; var r = mx - mn;
    function X(k) { return L + k * cw / (v.length - 1); } function Y(y) { return T + chh - (y - mn) / r * chh; }
    var c = up ? '#30D158' : '#FF453A', g = '', p = [];
    for (i = 0; i <= 2; i++) { var yv = mn + r * i / 2, yy = Y(yv).toFixed(1);
      g += '<line x1="' + L + '" x2="' + (w - R) + '" y1="' + yy + '" y2="' + yy + '" class="gl"/><text x="' + (L - 10) + '" y="' + (+yy + 6) + '" class="ax" text-anchor="end">' + (r < 5 ? '$' + yv.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/, ',') : money(yv)) + '</text>'; }
    for (i = 0; i < v.length; i++) { p.push(X(i).toFixed(1) + ',' + Y(v[i]).toFixed(1));
      if (lb[i]) g += '<line x1="' + X(i).toFixed(1) + '" x2="' + X(i).toFixed(1) + '" y1="' + T + '" y2="' + (T + chh) + '" class="gl"/><text x="' + X(i).toFixed(1) + '" y="' + (h - 6) + '" class="ax" text-anchor="' + (i === 0 ? 'start' : i === v.length - 1 ? 'end' : 'middle') + '">' + lb[i] + '</text>'; }
    if (base != null && base >= mn && base <= mx) g += '<line x1="' + L + '" x2="' + (w - R) + '" y1="' + Y(base).toFixed(1) + '" y2="' + Y(base).toFixed(1) + '" stroke="#ffb000" stroke-width="1.5" stroke-dasharray="6 6" opacity="0.8"/>';
    var hi = v.indexOf(Math.max.apply(null, v)), lo = v.indexOf(Math.min.apply(null, v));
    function mark(k, t, below) { var x = X(k), y = Y(v[k]), a = k === 0 ? 'start' : k === v.length - 1 ? 'end' : 'middle';
      return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="6" class="mk' + (below ? 'l' : 'h') + '"/><text x="' + x.toFixed(1) + '" y="' + (below ? y + 26 : y - 12).toFixed(1) + '" class="hl" text-anchor="' + a + '">' + t + ' ' + (r < 5 ? '$' + v[k].toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/, ',') : money(v[k])) + '</text>'; }
    return '<svg width="' + w + '" height="' + h + '">' + g + '<polygon fill="' + c + '" fill-opacity="0.10" points="' + L + ',' + (T + chh) + ' ' + p.join(' ') + ' ' + (w - R) + ',' + (T + chh) + '"/>' +
      '<polyline class="ln" fill="none" stroke="' + c + '" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" points="' + p.join(' ') + '"/>' +
      mark(hi, 'High', false) + (lo !== hi ? mark(lo, 'Low', true) : '') + '<circle class="pl" cx="' + X(v.length - 1).toFixed(1) + '" cy="' + Y(v[v.length - 1]).toFixed(1) + '" r="7" fill="' + c + '"/></svg>';
  }
  /* Any timestamp -> 'Oct 29, 8:00 PM ET' (drops the date when it is today). Zoned stamps are converted; bare ones are already ET. */
  var MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function etOff(ms) { var d = new Date(ms), y = d.getUTCFullYear(), m = new Date(Date.UTC(y, 2, 1)), n = new Date(Date.UTC(y, 10, 1));
    var s1 = Date.UTC(y, 2, 1 + (7 - m.getUTCDay()) % 7 + 7, 7), s2 = Date.UTC(y, 10, 1 + (7 - n.getUTCDay()) % 7, 6); return ms >= s1 && ms < s2 ? -4 : -5; }
  function ago(s) { if (!s) return '?'; var m = /^(\d{4})-(\d\d)-(\d\d)[T ](\d\d):(\d\d)/.exec(String(s)); if (!m) return String(s);
    var y = +m[1], mo = +m[2] - 1, d = +m[3], h = +m[4], mi = +m[5];
    if (/(Z|[+-]\d\d:?\d\d)$/.test(String(s))) { var ms = Date.parse(String(s).replace(' ', 'T')); if (!isNaN(ms)) { var e = new Date(ms + etOff(ms) * 3600000);
      y = e.getUTCFullYear(); mo = e.getUTCMonth(); d = e.getUTCDate(); h = e.getUTCHours(); mi = e.getUTCMinutes(); } }
    var nw = new Date(Date.now() + etOff(Date.now()) * 3600000), today = nw.getUTCFullYear() === y && nw.getUTCMonth() === mo && nw.getUTCDate() === d;
    return (today ? '' : MO[mo] + ' ' + d + ', ') + (h % 12 || 12) + ':' + (mi < 10 ? '0' : '') + mi + (h < 12 ? ' AM' : ' PM') + ' ET'; }
  /* Stock desk: open positions page 6 at a time and rotate every 8 s. */
  var PS = [], pg = 0, MAXR = 5, PER = 5, ptab = null;
  function drawPos() {
    if (!ptab) return; var n = Math.max(1, Math.ceil(PS.length / MAXR)); PER = Math.ceil(PS.length / n) || MAXR; pg = pg % n;
    var h = '<table><tr><th>Ticker</th><th>Qty</th><th>Entry</th><th>Value</th><th>P&amp;L</th><th>%</th></tr>';
    for (var i = pg * PER; i < PS.length && i < pg * PER + PER; i++) { var p = PS[i];
      h += '<tr><td>' + p.sym + '</td><td>' + p.qty + '</td><td>' + p.entry.toFixed(2) + '</td><td>' + money(p.entry * p.qty + p.upnl) + '</td><td class="' + ud(p.upnl) + '">' + money(p.upnl, true) + '</td><td class="' + ud(p.upnl) + '">' + pc(p.upnl, p.entry * p.qty) + '</td></tr>'; }
    ptab.innerHTML = h + '</table>' + (n > 1 ? '<div class="pgn">Page ' + (pg + 1) + ' of ' + n + '</div>' : '');
    ptab.className = 'pt'; setTimeout(function () { if (ptab) ptab.className = 'pt in'; }, 30);
  }
  setInterval(function () { if (PS.length > MAXR) { pg++; drawPos(); } }, 8000);
  function drawDesk(f, bj) {
    var v = f && f.vwap;
    if (!v) { desk.innerHTML = '<div class="mkh"><span>Stock paper desk</span></div><div class="off">Feed offline</div>'; ptab = null; return; }
    PS = (v.positions || []).slice().sort(function (a, b) { return b.upnl - a.upnl; }); var rec = v.record || {}, ex = 0;
    for (var i = 0; i < PS.length; i++) ex += PS[i].entry * PS[i].qty + PS[i].upnl;
    var cv = bj && bj.vwapCurve && bj.vwapCurve.length > 1 ? bj.vwapCurve : v.curve;
    desk.innerHTML = '<div class="mkh"><span>Stock desk \u00b7 paper money</span></div><div class="dn2">VWAP/EMA Crossover Stock Model</div>' +
      '<div class="kp"><div><i>Paper equity</i><b>' + money(v.equity) + '</b></div><div><i>Total P&amp;L</i><b class="' + ud(v.pnlTotal) + '">' + money(v.pnlTotal, true) + '</b></div>' +
      '<div><i>Today P&amp;L</i><b class="' + ud(v.pnlToday) + '">' + money(v.pnlToday, true) + '</b></div></div>' +
      '<div class="kp k2"><div><i>Return</i><b class="' + ud(v.pnlTotal) + '">' + pc(v.pnlTotal, v.start) + '</b></div><div><i>Record (W\u2013L)</i><b>' + (rec.wins || 0) + '\u2013' + (rec.losses || 0) + '</b></div>' +
      '<div><i>Open \u00b7 invested</i><b>' + PS.length + ' \u00b7 ' + money(ex) + '</b></div></div>' +
      '<div class="sub">Equity by trading day (start of day) \u00b7 start ' + money(v.start) + '</div><div class="eq">' + chart(cv, v.pnlTotal >= 0, 714, 236, v.start) + '</div>' +
      '<div class="sub">Open positions</div>';
    ptab = div('pt', desk); drawPos(); div('as', desk, 'Snapshot ' + ago(v.asOf) + ' \u00b7 TV checks every 60 s' + (PS.length > MAXR ? ' \u00b7 pages rotate 8 s' : ''));
  }
  /* Bosses: stock + crypto only, sorted by today's P/L (best on top, no-data last). */
  function cell(v, s, big) { return v == null ? '<td class="na">\u2013</td>' : '<td class="' + ud(v) + (big ? ' big' : '') + '">' + money(v, true) + '<em>' + pc(v, s) + '</em></td>'; }
  function cryptoDesk(f) { var ds = (f && f.desks) || []; for (var k = 0; k < ds.length; k++) if (ds[k].id === 'crypto' && typeof ds[k].pnlTotal === 'number') return ds[k]; return null; }
  function deskById(f, id) { var ds = (f && f.desks) || []; for (var k = 0; k < ds.length; k++) if (ds[k].id === id && typeof ds[k].pnlTotal === 'number') return ds[k]; return null; }
  function drawBosses(bj, f) {
    var rows = ((bj && bj.bosses) || []).slice(), cd = cryptoDesk(f), sd = deskById(f, 'stock'), vw = f && f.vwap;
    for (var i = 0; i < rows.length; i++) { var o = rows[i];
      if (o.name === 'Crypto CEO' && cd) rows[i] = {name: 'Crypto CEO', equity: cd.equity, start: cd.start, day: cd.pnlToday, week: cd.pnlWeek != null ? cd.pnlWeek : cd.pnlTotal, total: cd.pnlTotal, src: 'Mac \u00b7 5 min', live: 1};
      else if (o.name === 'VWAP/EMA Agent' && vw) rows[i] = {name: 'VWAP/EMA Agent', equity: vw.equity, start: vw.start, day: vw.pnlToday, week: o.week, total: vw.pnlTotal, src: 'snapshot ' + ago(vw.asOf), live: 1};
      else if (o.name === 'Stock Exchange Quant' && sd) rows[i] = {name: 'Stock Exchange Quant', equity: sd.equity, start: sd.start, day: sd.pnlToday, week: sd.pnlWeek, total: sd.pnlTotal, src: 'Mac \u00b7 5 min', live: 1};
      else if (o.name === 'Stock Exchange Quant') { o.src = 'snapshot ' + ago(o.asOf); o.live = 1; }
    }
    rows.sort(function (a, b) { var x = a.day == null ? (a.total == null ? -2e9 : -1e9) : a.day, y = b.day == null ? (b.total == null ? -2e9 : -1e9) : b.day; return y - x; });
    var h = '<div class="mkh"><span>Bosses \u00b7 live P/L \u00b7 best today on top</span><span class="cd">re-sorts every 60 s</span></div><table><tr><th></th><th>Equity</th><th>Today</th><th>7 days</th><th>Total</th></tr>';
    for (i = 0; i < rows.length; i++) { var r = rows[i];
      h += '<tr><td class="nm">' + (r.live ? '<span class="dot"></span>' : '<span class="dot off"></span>') + r.name + '<small>' + (r.src || '') + ' \u00b7 start ' + money(r.start) + '</small></td><td class="eqv">' + (r.equity == null ? '\u2013' : '$' + r.equity.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/, ',')) + '</td>' + cell(r.day, r.start) + cell(r.week, r.start) + cell(r.total, r.start, 1) + '</tr>'; }
    bp.innerHTML = h + '</table>';
  }
  function drawCrypto(f) {
    var d = cryptoDesk(f);
    if (!d) { cp.innerHTML = '<div class="mkh"><span>Crypto desk</span></div><div class="off">No crypto feed in floor.json</div>'; return; }
    cp.innerHTML = '<div class="mkh"><span>Crypto CEO \u00b7 Trend50</span></div>' +
      '<div class="cl"><b>$' + d.equity.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/, ',') + '</b><b class="' + ud(d.pnlTotal) + '">' + money(d.pnlTotal, true) + ' \u00b7 ' + pc(d.pnlTotal, d.start) + '</b></div>' +
      '<div class="eq">' + chart(f.crypto_curve || d.curve, d.pnlTotal >= 0, 480, 130) + '</div><div class="as">Last ' + (d.curve || []).length + ' checks \u00b7 last bar ' + ago(d.asOf) + '</div><div class="as">Mac feed every 5 min \u00b7 desk checks every 4 h</div>';
  }
  /* Weather: Open-Meteo (free, no key), Delray Beach from config.js, every 30 min. Rain chance is the headline. */
  var SUN = '<circle cx="24" cy="24" r="9" fill="#FFD60A"/><g stroke="#FFD60A" stroke-width="3" stroke-linecap="round"><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M10 38l4-4M34 14l4-4"/></g>',
      CLD = '<path d="M14 36h22a8 8 0 0 0 0-16 11 11 0 0 0-21-2 8 8 0 0 0-1 18z" fill="#C7CCD6"/>',
      RAIN = '<g stroke="#64D2FF" stroke-width="3" stroke-linecap="round"><path d="M16 40l-2 5M24 40l-2 5M32 40l-2 5"/></g>',
      BOLT = '<path d="M26 34l-6 8h5l-3 6 8-9h-5l3-5z" fill="#FFD60A"/>';
  function wcode(c, night) { // -> [word, svg]
    var cl = '<svg width="48" height="48" viewBox="0 0 48 48">';
    if (night && c <= 1) return [c ? 'Mostly clear' : 'Clear', cl + '<path d="M30 8a16 16 0 1 0 10 26A13 13 0 0 1 30 8z" fill="#E5E5EA"/></svg>'];
    if (c === 0 || c === 1) return [c ? 'Mostly sunny' : 'Sunny', cl + SUN + '</svg>'];
    if (c === 2) return ['Partly cloudy', cl + '<g transform="translate(-6,-8) scale(.8)">' + SUN + '</g>' + CLD + '</svg>'];
    if (c === 3 || c === 45 || c === 48) return [c === 3 ? 'Cloudy' : 'Fog', cl + CLD + '</svg>'];
    if (c >= 95) return ['Storms', cl + '<g transform="translate(0,-6)">' + CLD + '</g>' + BOLT + '</svg>'];
    if (c >= 51) return [c >= 80 ? 'Showers' : c <= 57 ? 'Drizzle' : 'Rain', cl + '<g transform="translate(0,-6)">' + CLD + '</g>' + RAIN + '</svg>'];
    return ['', cl + CLD + '</svg>'];
  }
  function weather() {
    get('https://api.open-meteo.com/v1/forecast?latitude=26.4615&longitude=-80.0728&current=temperature_2m,weather_code,is_day,precipitation_probability,wind_speed_10m&hourly=precipitation_probability&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York&forecast_days=3', function (t) {
      var j = json(t); if (!j || !j.current) { if (!wx.innerHTML) wx.innerHTML = '<div class="mkh"><span>Delray Beach</span></div><div class="off">Weather offline</div>'; return; }
      var c = j.current, d = j.daily, w = wcode(c.weather_code, c.is_day === 0), rp = d && d.precipitation_probability_max ? d.precipitation_probability_max[0] : c.precipitation_probability;
      var h = '<div class="mkh"><span>Delray Beach</span></div><div class="wrow"><span class="wi">' + w[1] + '</span><span class="wt">' + Math.round(c.temperature_2m) + '\u00b0</span><span class="wc">' + w[0] + '</span></div><div class="wr"><b>' + rp + '%</b> rain today</div>';
      if (j.hourly) { var hi = j.hourly.time.indexOf(c.time.slice(0, 13) + ':00'), nx = 0, at = -1;
        for (var k = hi; k >= 0 && k < hi + 6 && k < j.hourly.time.length; k++) if (j.hourly.precipitation_probability[k] > nx) { nx = j.hourly.precipitation_probability[k]; at = k; }
        if (hi >= 0) h += '<div class="wn">Next 6 h: ' + (nx ? 'up to <b>' + nx + '%</b> rain' : '<b>0%</b> rain') + '</div>'; }
      var nm = ['Today', 'Tmrw'];
      for (var i = 0; i < 3 && d && i < d.time.length; i++) h += '<div class="wf"><span>' + (nm[i] || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(d.time[i] + 'T12:00').getDay()]) + '</span><em>' + wcode(d.weather_code[i])[1].replace('width="48" height="48"', 'width="24" height="24"') + '</em><b>' + d.precipitation_probability_max[i] + '%</b>' + Math.round(d.temperature_2m_max[i]) + '\u00b0/' + Math.round(d.temperature_2m_min[i]) + '\u00b0</div>';
      wx.innerHTML = h + '<div class="as">Open-Meteo \u00b7 every 30 min</div>';
    });
  }
  var F = null, B = null;
  function redraw() { drawDesk(F, B); drawBosses(B, F); drawCrypto(F); }
  function feeds() {
    get(BASE + 'floor.json?t=' + Date.now(), function (t) { var j = json(t); if (j) F = j; redraw(); });
    get(BASE + 'bosses.json?t=' + Date.now(), function (t) { var j = json(t); if (j) B = j; redraw(); });
  }
  // News: newest first, three at a time; every 10 s the list moves up by one.
  var heads = [], at = 0;
  function decode(s) { var d = document.createElement('textarea'); d.innerHTML = s.replace(/<!\[CDATA\[|\]\]>/g, ''); return d.value.replace(/\s+/g, ' '); }
  function clock(t) { if (!t) return ''; var d = new Date(t), h = d.getHours(), m = d.getMinutes();
    return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? ' AM ET' : ' PM ET'); }
  function showNews() {
    if (!heads.length) return;
    nl.className = 'nl out';
    setTimeout(function () {
      var h = '';
      for (var i = 0; i < 2 && i < heads.length; i++) { var n = heads[(at + i) % heads.length];
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
  feeds(); news(); weather(); setInterval(weather, 1800000); setInterval(feeds, 60000); setInterval(news, 600000); setInterval(showNews, 10000);
  window.MarketsMock = function (h) { heads = h; at = 0; showNews(); };
})();
