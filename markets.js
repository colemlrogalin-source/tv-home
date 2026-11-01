/* v10: Samsung TV (Tizen) gets the new Home; every other browser runs the unchanged live code below. */
var __TV = /Tizen/i.test(navigator.userAgent); if (__TV) document.documentElement.className += ' tv';
if (!__TV) /* Right column + left boards. DESK (the stock paper desk's format: equity, total/today P&L, record, open positions, equity line)
   and BOSSES (each boss: day, 7 days, total, $ and % of starting balance) from floor.json + bosses.json on GitHub Pages;
   NEWS (CNBC / MarketWatch RSS every 10 min, 3 at a time, rotating). Plain ES5; everything fails silently. */
(function () {
  var BASE = window.DASH_BASE && window.DASH_REMOTE !== false ? window.DASH_BASE : '';
  var FEEDS = [['CNBC', 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114'],
               ['CNBC', 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664'],
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
  var desk = div('mkp desk', col), bp = div('mkp bosses', col), wx = div('mkp wx', col);
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
      '<div class="sub">Equity by trading day (start of day)</div><div class="eq">' + chart(cv, v.pnlTotal >= 0, 714, 236, v.start) + '</div>' +
      '<div class="sub">Open positions</div>';
    ptab = div('pt', desk); drawPos(); div('as', desk, 'Snapshot ' + ago(v.asOf) + ' \u00b7 TV checks every 60 s' + (PS.length > MAXR ? ' \u00b7 pages rotate 8 s' : ''));
  }
  /* Bosses: stock + crypto only, sorted by today's P/L (best on top, no-data last). */
  function cell(v, s, big) { return v == null ? '<td class="na">\u2013</td>' : '<td class="' + ud(v) + (big ? ' big' : '') + '">' + money(v, true) + '<em>' + pc(v, s) + '</em></td>'; }
  function cryptoDesk(f) { var ds = (f && f.desks) || []; for (var k = 0; k < ds.length; k++) if (ds[k].id === 'crypto' && typeof ds[k].pnlTotal === 'number') return ds[k]; return null; }
  function deskById(f, id) { var ds = (f && f.desks) || []; for (var k = 0; k < ds.length; k++) if (ds[k].id === id && typeof ds[k].pnlTotal === 'number') return ds[k]; return null; }
  // Crypto has no chart panel any more: its row says whether it has traded (floor.json trades list, last 24 h).
  function cryptoNote(f, d) { var n = 0, t = (f && f.trades) || [];
    for (var k = 0; k < t.length; k++) if (t[k].desk === 'Crypto') n++;
    return 'Mac \u00b7 5 min' + (n ? ' \u00b7 ' + n + ' trade' + (n > 1 ? 's' : '') + ' in 24 h' : ' \u00b7 no trades in 24 h'); }
  function drawBosses(bj, f) {
    var rows = ((bj && bj.bosses) || []).slice(), cd = cryptoDesk(f), sd = deskById(f, 'stock'), vw = f && f.vwap;
    for (var i = 0; i < rows.length; i++) { var o = rows[i];
      if (o.name === 'Crypto CEO' && cd) rows[i] = {name: 'Crypto CEO', equity: cd.equity, start: cd.start, day: cd.pnlToday, week: cd.pnlWeek != null ? cd.pnlWeek : cd.pnlTotal, total: cd.pnlTotal, src: cryptoNote(f, cd), live: 1};
      else if (o.name === 'VWAP/EMA Agent' && vw) rows[i] = {name: 'VWAP/EMA Agent', equity: vw.equity, start: vw.start, day: vw.pnlToday, week: o.week, total: vw.pnlTotal, src: 'snapshot ' + ago(vw.asOf), live: 1};
      else if (o.name === 'Stock Exchange Quant' && sd) rows[i] = {name: 'Stock Exchange Quant', equity: sd.equity, start: sd.start, day: sd.pnlToday, week: sd.pnlWeek, total: sd.pnlTotal, src: 'Mac \u00b7 5 min', live: 1};
      else if (o.name === 'Stock Exchange Quant') { o.src = 'snapshot ' + ago(o.asOf); o.live = 1; }
      else if (o.asOf && !o.src) { o.src = (o.note ? o.note + ' \u00b7 ' : '') + ago(o.asOf); o.live = 1; }
    }
    rows.sort(function (a, b) { var x = a.day == null ? (a.total == null ? -2e9 : -1e9) : a.day, y = b.day == null ? (b.total == null ? -2e9 : -1e9) : b.day; return y - x; });
    var h = '<div class="mkh"><span>Bosses \u00b7 live P/L \u00b7 best today on top</span><span class="cd">re-sorts every 60 s</span></div><table><tr><th></th><th>Today</th><th>7 days</th><th>Total</th></tr>';
    for (i = 0; i < rows.length; i++) { var r = rows[i];
      h += '<tr><td class="nm">' + (r.live ? '<span class="dot"></span>' : '<span class="dot off"></span>') + r.name + '<small>' + (r.equity == null ? '' : 'Equity $' + r.equity.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/, ',') + ' \u00b7 ') + (r.src || '') + '</small></td>' + cell(r.day, r.start) + cell(r.week, r.start) + cell(r.total, r.start, 1) + '</tr>'; }
    bp.innerHTML = h + '</table>';
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
  function redraw() { drawDesk(F, B); drawBosses(B, F); }
  function feeds() {
    get(BASE + 'floor.json?t=' + Date.now(), function (t) { var j = json(t); if (j) F = j; redraw(); });
    get(BASE + 'bosses.json?t=' + Date.now(), function (t) { var j = json(t); if (j) B = j; redraw(); });
  }
  // News: newest first, three at a time; every 10 s the list moves up by one.
  var heads = [], at = 0;
  function decode(s) { var d = document.createElement('textarea'); d.innerHTML = s.replace(/<!\[CDATA\[|\]\]>/g, ''); return d.value.replace(/\s+/g, ' '); }
  function clock(t) { if (!t) return ''; var d = new Date(t), h = d.getHours(), m = d.getMinutes();
    return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? ' AM ET' : ' PM ET'); }
  var NPER = 4; function esc(x) { return String(x || '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function showNews() {
    if (!heads.length) return;
    nl.className = 'nl out';
    setTimeout(function () {
      var h = '';
      var pages = Math.ceil(heads.length / NPER), p = at % pages;
      for (var i = p * NPER; i < p * NPER + NPER && i < heads.length; i++) { var n = heads[i];
        h += '<div class="n"><div class="nt">' + esc(n.title) + '</div><div class="nd"><b>' + n.src + (n.t ? ' \u00b7 ' + clock(n.t) : '') + '</b> ' + esc(n.desc) + '</div></div>'; }
      nl.innerHTML = h; nl.className = 'nl'; np.querySelector('.cd').innerHTML = 'CNBC \u00b7 MarketWatch RSS \u00b7 page ' + (p + 1) + '/' + pages; at = (p + 1) % pages;
    }, lite() ? 0 : 400);
  }
  function news() {
    var got = [], left = FEEDS.length, seen = {};
    FEEDS.forEach(function (f) {
      get(f[1], function (t) {
        if (t) { var items = t.split('<item');
          for (var i = 1; i < items.length && i <= 8; i++) {
            var m = /<title>([\s\S]*?)<\/title>/.exec(items[i]), d = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(items[i]);
            var ds = /<description>([\s\S]*?)<\/description>/.exec(items[i]), ti = m && decode(m[1]);
            if (m && !seen[ti]) { seen[ti] = 1; got.push({title: ti, desc: ds ? decode(ds[1]).replace(/<[^>]*>/g, '').trim() : '', src: f[0], t: d ? Date.parse(d[1]) || 0 : 0}); }
          } }
        if (--left === 0 && got.length) { got.sort(function (a, b) { return b.t - a.t; }); heads = got.slice(0, 2 * NPER); at = 0; showNews(); }
      });
    });
  }
  feeds(); news(); weather(); setInterval(weather, 1800000); setInterval(feeds, 60000); setInterval(news, 600000); setInterval(showNews, 15000);
  window.MarketsMock = function (h) { heads = h; at = 0; showNews(); };
})();

if (__TV) /* Right column + left boards. DESK (the stock paper desk's format: equity, total/today P&L, record, open positions, equity line)
   and BOSSES (each boss: day, 7 days, total, $ and % of starting balance) from floor.json + bosses.json on GitHub Pages;
   NEWS (CNBC / MarketWatch RSS every 10 min, 3 at a time, rotating). Plain ES5; everything fails silently. */
(function () {
  var BASE = window.DASH_BASE && window.DASH_REMOTE !== false ? window.DASH_BASE : '';
  var FEEDS = [['CNBC', 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114'],
               ['CNBC', 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664'],
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
  var desk = div('mkp desk', col), bp = div('mkp bosses', col), wx = div('mkp wx', col);
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
  function etMs(s) { var m = /^(\d{4})-(\d\d)-(\d\d)[T ](\d\d):(\d\d)/.exec(String(s)); if (!m) return 0; var u = Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5]); return u - etOff(u) * 3600000; }
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
      h += '<tr><td>' + p.sym + '</td><td>' + (Math.round(p.qty * 100) / 100) + '</td><td>' + p.entry.toFixed(2) + '</td><td>' + money(p.entry * p.qty + p.upnl) + '</td><td class="' + ud(p.upnl) + '">' + money(p.upnl, true) + '</td><td class="' + ud(p.upnl) + '">' + pc(p.upnl, p.entry * p.qty) + '</td></tr>'; }
    ptab.innerHTML = h + '</table>' + (n > 1 ? '<div class="pgn">Page ' + (pg + 1) + ' of ' + n + '</div>' : '');
    ptab.className = 'pt'; setTimeout(function () { if (ptab) ptab.className = 'pt in'; }, 30);
  }
  setInterval(function () { if (PS.length > MAXR) { pg++; drawPos(); } }, 8000);
  function drawDesk(f, bj) {
    var v = (bj && bj.vwap_live) || (f && f.vwap);   // v9: live stock-lab book first
    if (!v) { desk.innerHTML = '<div class="mkh"><span>Stock paper desk</span></div><div class="off">Feed offline</div>'; ptab = null; return; }
    PS = (v.positions || []).slice().sort(function (a, b) { return b.upnl - a.upnl; }); var rec = v.record || {}, ex = 0;
    for (var i = 0; i < PS.length; i++) ex += PS[i].entry * PS[i].qty + PS[i].upnl;
    var cv = bj && bj.vwapCurve && bj.vwapCurve.length > 1 ? bj.vwapCurve : v.curve;
    desk.innerHTML = '<div class="mkh"><span>Stock desk \u00b7 paper money</span></div><div class="dn2">VWAP/EMA Crossover Stock Model</div>' +
      '<div class="kp"><div><i>Paper equity</i><b>' + money(v.equity) + '</b></div><div><i>Total P&amp;L</i><b class="' + ud(v.pnlTotal) + '">' + money(v.pnlTotal, true) + '</b></div>' +
      '<div><i>Today P&amp;L</i><b class="' + ud(v.pnlToday) + '">' + money(v.pnlToday, true) + '</b></div></div>' +
      '<div class="kp k2"><div><i>Return</i><b class="' + ud(v.pnlTotal) + '">' + pc(v.pnlTotal, v.start) + '</b></div><div><i>Record (W\u2013L)</i><b>' + (rec.wins || 0) + '\u2013' + (rec.losses || 0) + '</b></div>' +
      '<div><i>Open \u00b7 invested</i><b>' + PS.length + ' \u00b7 ' + money(ex) + '</b></div></div>' +
      '<div class="sub">Equity by trading day (start of day)</div><div class="eq">' + chart(cv, v.pnlTotal >= 0, 714, 236, v.start) + '</div>' +
      '<div class="sub">Open positions</div>';
    ptab = div('pt', desk); drawPos(); div('as', desk, (v.src ? 'Live ' + v.src + ' \u00b7 ' : 'Snapshot ') + ago(v.asOf) + ' \u00b7 TV checks every 60 s' + (PS.length > MAXR ? ' \u00b7 pages rotate 8 s' : ''));
  }
  /* Bosses: stock + crypto only, sorted by today's P/L (best on top, no-data last). */
  function cell(v, s, big) { return v == null ? '<td class="na">\u2013</td>' : '<td class="' + ud(v) + (big ? ' big' : '') + '">' + money(v, true) + '<em>' + pc(v, s) + '</em></td>'; }
  function cryptoDesk(f) { var ds = (f && f.desks) || []; for (var k = 0; k < ds.length; k++) if (ds[k].id === 'crypto' && typeof ds[k].pnlTotal === 'number') return ds[k]; return null; }
  function deskById(f, id) { var ds = (f && f.desks) || []; for (var k = 0; k < ds.length; k++) if (ds[k].id === id && typeof ds[k].pnlTotal === 'number') return ds[k]; return null; }
  // Crypto has no chart panel any more: its row says whether it has traded (floor.json trades list, last 24 h).
  function cryptoNote(f, d) { var n = 0, t = (f && f.trades) || [];
    for (var k = 0; k < t.length; k++) if (t[k].desk === 'Crypto') n++;
    return 'Mac \u00b7 5 min' + (n ? ' \u00b7 ' + n + ' trade' + (n > 1 ? 's' : '') + ' in 24 h' : ' \u00b7 no trades in 24 h'); }
  function drawBosses(bj, f) {
    var rows = ((bj && bj.bosses) || []).slice(), cd = cryptoDesk(f), sd = deskById(f, 'stock'), vw = (bj && bj.vwap_live) || (f && f.vwap), sl = bj && bj.sports_live;
    for (var i = 0; i < rows.length; i++) { var o = rows[i];
      if (o.name === 'Crypto CEO' && cd) rows[i] = {name: 'Crypto CEO', equity: cd.equity, start: cd.start, day: cd.pnlToday, week: cd.pnlWeek != null ? cd.pnlWeek : cd.pnlTotal, total: cd.pnlTotal, src: cryptoNote(f, cd), live: 1};
      else if (o.name === 'VWAP/EMA Agent' && vw) rows[i] = {name: 'VWAP/EMA Agent', equity: vw.equity, start: vw.start, day: vw.pnlToday, week: vw.pnlWeek != null ? vw.pnlWeek : o.week, total: vw.pnlTotal, src: 'snapshot ' + ago(vw.asOf), live: 1};
      else if (o.name === 'Sports Quant' && sl) rows[i] = {name: 'Sports Quant', equity: sl.equity, start: sl.start, day: sl.pnlToday, week: o.week, total: sl.pnlTotal, src: 'Kalshi sync \u00b7 ' + ago(sl.asOf), live: 1};
      else if (o.name === 'Stock Exchange Quant' && sd) rows[i] = {name: 'Stock Exchange Quant', equity: sd.equity, start: sd.start, day: sd.pnlToday, week: sd.pnlWeek, total: sd.pnlTotal, src: 'Mac \u00b7 5 min', live: 1};
      else if (o.name === 'Stock Exchange Quant') { o.src = 'snapshot ' + ago(o.asOf); o.live = 1; }
      else if (o.asOf && !o.src) { o.src = (o.note ? o.note + ' \u00b7 ' : '') + ago(o.asOf); o.live = 1; }
    }
    // v10: extra rows (Kalshi Desk, Overnight Research) and row notes from bosses.json; grey dot when > 2 h old.
    var xr = (bj && bj.extra_rows) || [], nt = (bj && bj.row_notes) || {};
    for (i = 0; i < xr.length; i++) { var x = xr[i], age = x.asOf ? (Date.now() - etMs(x.asOf)) / 3600000 : 99;
      rows.push({name: x.name, equity: x.equity, start: x.start, day: x.day, week: x.week, total: x.total, src: (x.note ? x.note + ' \u00b7 ' : '') + ago(x.asOf), live: age < 2 ? 1 : 0}); }
    for (i = 0; i < rows.length; i++) if (nt[rows[i].name]) rows[i].src = nt[rows[i].name] + ' \u00b7 ' + (rows[i].src || '');
    rows.sort(function (a, b) { var x = a.day == null ? (a.total == null ? -2e9 : -1e9) : a.day, y = b.day == null ? (b.total == null ? -2e9 : -1e9) : b.day; return y - x; });
    var h = '<div class="mkh"><span>Bosses \u00b7 live P/L \u00b7 best today on top</span><span class="cd">re-sorts every 60 s</span></div><table><tr><th></th><th>' + (closedET() ? 'Last session' : 'Today') + '</th><th>7 days</th><th>Total</th></tr>';
    for (i = 0; i < rows.length; i++) { var r = rows[i];
      h += '<tr><td class="nm">' + (r.live ? '<span class="dot"></span>' : '<span class="dot off"></span>') + r.name + '<small>' + (r.equity == null ? '' : 'Equity $' + r.equity.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/, ',') + ' \u00b7 ') + (r.src || '') + '</small></td>' + cell(r.day, r.start) + cell(r.week, r.start) + cell(r.total, r.start, 1) + '</tr>'; }
    bp.innerHTML = h + '</table>';
    fleet(rows);
  }
  /* v8: US market closed on weekends (ET) -> Today columns read 'Last session'. */
  function closedET() { var d = new Date(Date.now() + etOff(Date.now()) * 3600000); var w = d.getUTCDay(); return w === 0 || w === 6; }
  /* v8: fleet overview beside the clock (sums of the boss rows above; '\u2013' when missing). */
  var fl = div('fleet', document.body);
  function sum(rows, k) { var t = null; for (var i = 0; i < rows.length; i++) if (typeof rows[i][k] === 'number') t = (t || 0) + rows[i][k]; return t; }
  function fleet(rows) {
    if (!rows.length) return; var eq = sum(rows, 'equity'), b = null, w = null;
    for (var i = 0; i < rows.length; i++) if (typeof rows[i].day === 'number') { if (!b || rows[i].day > b.day) b = rows[i]; if (!w || rows[i].day < w.day) w = rows[i]; }
    function k(l, v, c) { return '<div class="fk"><i>' + l + '</i><b class="' + (c ? ud(v) : '') + '">' + (v == null ? '\u2013' : money(v, c)) + '</b></div>'; }
    fl.innerHTML = '<div class="fh">Fleet overview \u00b7 ' + rows.length + ' bosses<span class="sw"></span></div>' + k('Equity', eq) + k(closedET() ? 'Last session' : 'Today', sum(rows, 'day'), 1) + k('7 days', sum(rows, 'week'), 1) + k('All time', sum(rows, 'total'), 1) +
      '<div class="fb">Best today <em>' + (b ? b.name + ' <span class="' + ud(b.day) + '">' + money(b.day, true) + '</span>' : '\u2013') + '</em> \u00b7 Worst <em>' + (w ? w.name + ' <span class="' + ud(w.day) + '">' + money(w.day, true) + '</span>' : '\u2013') + '</em></div>';
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
  function redraw() { drawDesk(F, B); drawBosses(B, F); }
  function feeds() {
    get(BASE + 'floor.json?t=' + Date.now(), function (t) { var j = json(t); if (j) F = j; redraw(); });
    get(BASE + 'bosses.json?t=' + Date.now(), function (t) { var j = json(t); if (j) B = j; redraw(); });
  }
  // News: newest first, three at a time; every 10 s the list moves up by one.
  var heads = [], at = 0;
  function decode(s) { var d = document.createElement('textarea'); d.innerHTML = s.replace(/<!\[CDATA\[|\]\]>/g, ''); return d.value.replace(/\s+/g, ' '); }
  function clock(t) { if (!t) return ''; var d = new Date(t), h = d.getHours(), m = d.getMinutes();
    return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? ' AM ET' : ' PM ET'); }
  var NPER = 4; function esc(x) { return String(x || '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  /* v8: headlines wider than their line roll once across, ticker style (CSS animation, distance set here). */
  function roll() { var t = nl.querySelectorAll('.nt'); for (var i = 0; i < t.length; i++) { var sp = t[i].firstChild, d = sp.offsetWidth - t[i].clientWidth;
    if (d > 4) { var tm = Math.min(10, d / 50 + 3) + 's linear 2s'; sp.style.display = 'inline-block'; sp.style.webkitTransition = '-webkit-transform ' + tm; sp.style.transition = 'transform ' + tm;
      (function (e, x) { setTimeout(function () { e.style.webkitTransform = e.style.transform = 'translateX(' + x + 'px)'; }, 50); })(sp, -d); } } }
  function showNews() {
    if (!heads.length) return;
    nl.className = 'nl out';
    setTimeout(function () {
      var h = '';
      var pages = Math.ceil(heads.length / NPER), p = at % pages;
      for (var i = p * NPER; i < p * NPER + NPER && i < heads.length; i++) { var n = heads[i];
        h += '<div class="n"><div class="nt"><span>' + esc(n.title) + '</span></div><div class="nd"><b>' + n.src + (n.t ? ' \u00b7 ' + clock(n.t) : '') + '</b> ' + esc(n.desc) + '</div></div>'; }
      nl.innerHTML = h; nl.className = 'nl'; roll(); np.querySelector('.cd').innerHTML = 'CNBC \u00b7 MarketWatch RSS \u00b7 page ' + (p + 1) + '/' + pages; at = (p + 1) % pages;
    }, lite() ? 0 : 400);
  }
  function news() {
    var got = [], left = FEEDS.length, seen = {};
    FEEDS.forEach(function (f) {
      get(f[1], function (t) {
        if (t) { var items = t.split('<item');
          for (var i = 1; i < items.length && i <= 8; i++) {
            var m = /<title>([\s\S]*?)<\/title>/.exec(items[i]), d = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(items[i]);
            var ds = /<description>([\s\S]*?)<\/description>/.exec(items[i]), ti = m && decode(m[1]);
            if (m && !seen[ti]) { seen[ti] = 1; got.push({title: ti, desc: ds ? decode(ds[1]).replace(/<[^>]*>/g, '').trim() : '', src: f[0], t: d ? Date.parse(d[1]) || 0 : 0}); }
          } }
        if (--left === 0 && got.length) { got.sort(function (a, b) { return b.t - a.t; }); heads = got.slice(0, 2 * NPER); at = 0; showNews(); }
      });
    });
  }
  feeds(); news(); weather(); setInterval(weather, 1800000); setInterval(feeds, 60000); setInterval(news, 600000); setInterval(showNews, 15000);
  window.MarketsMock = function (h) { heads = h; at = 0; showNews(); };
})();
if (__TV) /* v10 TV grid (Tizen only): race strip + 6 desk cards. Data: bosses.json tv10/extra rows (box feed) + floor.json crypto (Mac). Real data only, '\u2013' when missing. */
(function () {
  var BASE = window.DASH_BASE && window.DASH_REMOTE !== false ? window.DASH_BASE : '', B = null, F = null, root = document.createElement('div'); root.id = 'g10'; document.body.appendChild(root);
  function get(u, cb) { var x = new XMLHttpRequest(); x.open('GET', u, true); x.timeout = 20000; x.onload = function () { try { cb(x.status === 200 ? JSON.parse(x.responseText) : null); } catch (e) { cb(null); } }; x.onerror = x.ontimeout = function () { cb(null); }; x.send(); }
  function n(v) { return typeof v === 'number' && !isNaN(v); }
  function m(v, sg) { if (!n(v)) return '\u2013'; var a = Math.abs(v), s = a >= 1000 ? Math.round(a).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : a.toFixed(2); return (sg ? (v >= 0 ? '+' : '\u2212') : v < 0 ? '\u2212' : '') + '$' + s; }
  function pc(v, b) { return n(v) && b ? (v >= 0 ? '+' : '\u2212') + Math.abs(v / b * 100).toFixed(1) + '%' : '\u2013'; }
  function c(v) { return !n(v) ? '' : v > 0 ? 'up' : v < 0 ? 'dn' : ''; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function k(l, v, cl) { return '<div class="k"><i>' + l + '</i><b class="' + (cl || '') + '">' + v + '</b></div>'; }
  function pill(t, cl) { return '<span class="pl ' + (cl || '') + '">' + t + '</span>'; }
  /* line chart: series [[vals, colour]], optional base line value, zero-centred ruler for Kalshi */
  function chart(ser, w, h, base, ruler) {
    var all = [], i, j; for (i = 0; i < ser.length; i++) all = all.concat(ser[i][0]); if (base != null) all.push(base); if (all.length < 2) return '<div class="na">\u2013</div>';
    var mn = Math.min.apply(null, all), mx = Math.max.apply(null, all); if (ruler) { var a = Math.max(Math.abs(mn), Math.abs(mx)) || 1; mn = -a; mx = a; } var r = mx - mn || 1;
    function Y(v) { return (h - 6 - (v - mn) / r * (h - 12)).toFixed(1); }
    var s = '<svg width="' + w + '" height="' + h + '">';
    if (base != null) s += '<line x1="0" x2="' + w + '" y1="' + Y(base) + '" y2="' + Y(base) + '" class="bl"/>';
    if (ruler) for (j = 0; j <= 10; j++) s += '<line x1="0" x2="' + (j % 5 ? 5 : 10) + '" y1="' + (6 + j * (h - 12) / 10).toFixed(1) + '" y2="' + (6 + j * (h - 12) / 10).toFixed(1) + '" class="tk"/>';
    for (i = 0; i < ser.length; i++) { var v = ser[i][0], p = []; if (v.length < 2) continue;
      for (j = 0; j < v.length; j++) p.push((j * (w - 8) / (v.length - 1) + 4).toFixed(1) + ',' + Y(v[j]));
      s += '<polyline class="ln' + (i ? '' : ' draw') + '" points="' + p.join(' ') + '" stroke="' + ser[i][1] + '"/>';
      if (ruler) for (j = 0; j < v.length; j++) s += '<circle cx="' + p[j].split(',')[0] + '" cy="' + p[j].split(',')[1] + '" r="4" fill="' + ((j ? v[j] - v[j - 1] : v[0]) >= 0 ? '#00D395' : '#FF7A6B') + '"/>'; }
    return s + '</svg>';
  }
  function card(id, title, pills, body) { return '<div class="dk ' + id + '"><div class="ch"><span>' + title + '</span><span>' + pills + '</span></div>' + body + '</div>'; }
  function etNow() { var d = new Date(), u = d.getTime(), y = d.getUTCFullYear(), a = new Date(Date.UTC(y, 2, 1)), b = new Date(Date.UTC(y, 10, 1));
    var s1 = Date.UTC(y, 2, 1 + (7 - a.getUTCDay()) % 7 + 7, 7), s2 = Date.UTC(y, 10, 1 + (7 - b.getUTCDay()) % 7, 6); return new Date(u + (u >= s1 && u < s2 ? -4 : -5) * 3600000); }
  function ageH(s) { var q = /^(\d{4})-(\d\d)-(\d\d)[T ](\d\d):(\d\d)/.exec(String(s || '')); if (!q) return 99; var e = etNow(); return (Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate(), e.getUTCHours(), e.getUTCMinutes()) - Date.UTC(+q[1], q[2] - 1, +q[3], +q[4], +q[5])) / 3600000; }
  function asof(s) { var q = /^(\d{4})-(\d\d)-(\d\d)[T ](\d\d):(\d\d)/.exec(String(s || '')); if (!q) return '\u2013'; var h = +q[4], ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return +q[2] + '/' + +q[3] + ' ' + h + ':' + q[5] + ' ' + ap + ' ET'; }
  function crypto() { var d = (F && F.desks) || []; for (var i = 0; i < d.length; i++) if (d[i].id === 'crypto') return d[i]; return null; }
  function nextCheck() { var e = etNow(), t = [[9, 15], [10, 15], [11, 30], [18, 30]], now = e.getUTCHours() * 60 + e.getUTCMinutes(); for (var i = 0; i < t.length; i++) { var x = t[i][0] * 60 + t[i][1]; if (x > now) return [x - now, t[i]]; } return [24 * 60 - now + 555, t[0]]; }
  function draw() {
    var t = (B && B.tv10) || {}, h = '', e = etNow(), closed = e.getUTCDay() === 0 || e.getUTCDay() === 6 || e.getUTCHours() * 60 + e.getUTCMinutes() < 570 || e.getUTCHours() >= 16;
    /* Race to Dec 1 */
    var race = [], v = t.vwap, q = t.sxq, sp = t.sports, kd = t.kalshi, cr = crypto(), ov = t.overnight;
    function rc(nm, eq, st) { if (n(eq) && st) race.push([nm, (eq - st) / st * 100]); }
    if (v) rc('VWAP/EMA', v.equity, v.start); if (q) rc('Stock Quant', q.equity, q.start); if (sp) rc('Sports', sp.equity, sp.start);
    if (kd) rc('Kalshi', kd.equity, kd.start); if (cr) rc('Crypto', cr.equity, cr.start); if (ov) rc('Overnight', ov.equity, ov.start);
    race.sort(function (a, b) { return b[1] - a[1]; });
    var dl = Math.ceil((Date.UTC(2026, 11, 1, 5) - Date.now()) / 86400000), rh = '<div class="rt"><b>Race to Dec 1</b><i>' + (dl > 0 ? dl + ' days left' : 'finished') + '</i></div>';
    for (var i = 0; i < race.length; i++) rh += '<div class="rr"><i>' + (i + 1) + '</i>' + race[i][0] + ' <b class="' + c(race[i][1]) + '">' + (race[i][1] >= 0 ? '+' : '\u2212') + Math.abs(race[i][1]).toFixed(1) + '%</b></div>';
    h += '<div id="race">' + rh + '</div>';
    /* VWAP/EMA */
    if (v) { var cv = v.curve || [], pk = Math.max.apply(null, cv.concat([v.equity])), ddp = pk ? (v.equity - pk) / pk * 100 : null, tdp = v.start ? v.pnlToday / v.start * 100 : null, rec = v.record || {};
      h += card('vw', 'VWAP/EMA Agent', pill(v.market_open ? 'Market open' : 'Market closed') + (v.auto ? pill('Auto', 'on') : '') + (v.halted ? pill('Kill switch', 'bad') : ''),
        '<div class="hero">' + m(v.equity) + ' <em class="' + c(v.pnlTotal) + '">' + m(v.pnlTotal, 1) + ' \u00b7 ' + pc(v.pnlTotal, v.start) + '</em></div>' +
        chart([[cv, '#38bdf8']], 395, 120, v.start) + '<div class="lg"><span style="color:#38bdf8">\u2014 equity</span> vs $10k start</div>' +
        '<div class="row">' + k('Today', m(v.pnlToday, 1), c(v.pnlToday)) + k('Record', (rec.wins || 0) + '\u2013' + (rec.losses || 0)) + k('Open', (v.positions || []).length) + '</div>' +
        '<div class="rb"><i>Today ' + (n(tdp) ? tdp.toFixed(1) : '\u2013') + '% of \u22123% stop</i><s><u style="width:' + Math.min(100, Math.abs(Math.min(0, tdp || 0)) / 3 * 100) + '%"></u></s>' +
        '<i>Drawdown ' + (n(ddp) ? ddp.toFixed(1) : '\u2013') + '% of \u22128% kill</i><s><u style="width:' + Math.min(100, Math.abs(Math.min(0, ddp || 0)) / 8 * 100) + '%"></u></s></div>' +
        '<div class="chips">' + (v.chips || []).map(function (x) { return '<span>' + esc(x[0]) + ' <i>' + esc(x[1]) + '</i> <b class="' + c(x[2]) + '">' + (x[2] >= 0 ? '+' : '\u2212') + Math.abs(x[2]).toFixed(1) + '%</b></span>'; }).join('') + '</div>' +
        '<div class="ao">Live ' + asof(v.asOf) + '</div>'); }
    /* Stock Exchange Quant */
    if (q) { var bn = q.bench || {}, last = function (a) { return a && a.length ? a[a.length - 1] : null; }, sc = '';
      ['SPY', 'QQQ', 'VTI'].forEach(function (s) { var d = n(last(bn[s])) ? q.equity - last(bn[s]) : null; sc += k('vs ' + s, m(d, 1), c(d)); });
      var tp = ''; (q.tape || []).forEach(function (x) { var a = n(x[2]) ? Math.min(1, Math.abs(x[2]) / 5) * 0.6 + 0.3 : 0.2;
        tp += '<span class="ht" style="background:' + (n(x[2]) && x[2] < 0 ? 'rgba(255,93,74,' : 'rgba(124,255,107,') + a.toFixed(2) + ')">' + esc(x[0]) + '<b>' + (n(x[2]) ? (x[2] >= 0 ? '+' : '\u2212') + Math.abs(x[2]).toFixed(1) + '%' : '\u2013') + '</b></span>'; });
      var al = q.alloc || [], at = 0; al.forEach(function (x) { if (n(x)) at += x; });
      var ab = at ? '<div class="al"><s><u style="width:' + (al[0] / at * 100).toFixed(1) + '%;background:#ffb000"></u><u style="width:' + (al[1] / at * 100).toFixed(1) + '%;background:#7CFF6B"></u><u style="width:' + (al[2] / at * 100).toFixed(1) + '%;background:rgba(245,245,247,0.35)"></u></s><i>ETF ' + Math.round(al[0] / at * 100) + '% \u00b7 Stocks ' + Math.round(al[1] / at * 100) + '% \u00b7 Cash ' + Math.round(al[2] / at * 100) + '% \u00b7 target 60/40</i></div>' : '';
      h += card('sq', 'Stock Exchange Quant', pill(closed ? 'Market closed' : 'Market open'),
        '<div class="hero">' + m(q.equity) + ' <em class="' + c(q.total) + '">' + m(q.total, 1) + ' \u00b7 ' + pc(q.total, q.start) + '</em></div>' +
        chart([[q.curve || [], '#7CFF6B'], [bn.SPY || [], 'rgba(245,245,247,0.55)'], [bn.QQQ || [], 'rgba(100,160,255,0.55)'], [bn.VTI || [], 'rgba(255,176,0,0.5)']], 395, 110, q.start) +
        '<div class="lg"><span style="color:#7CFF6B">\u2014 desk</span> <span>\u2014 SPY</span> <span style="color:#64a0ff">\u2014 QQQ</span> <span style="color:#ffb000">\u2014 VTI</span> from $10k</div>' +
        '<div class="row">' + sc + '</div><div class="lg">Benchmarks: equity-curve-10k.json \u00b7 from ' + esc(q.benchFrom ? +q.benchFrom.slice(5, 7) + '/' + +q.benchFrom.slice(8) : '\u2013') + '</div><div class="row">' + k('Record', q.wins + '\u2013' + q.losses) + k('Open', q.open) + k('From peak', n(q.dd) ? q.dd.toFixed(1) + '%' : '\u2013', c(q.dd)) + '</div>' +
        ab + '<div class="tape"><div>' + tp + tp + '</div></div>'); }
    /* Sports Quant */
    if (sp) { var bd = sp.board || [], b0 = bd.length ? bd[Math.floor(Date.now() / 60000) % bd.length] : null, g = sp.grok || [];
      h += card('sp', 'Sports Quant', '',
        '<div class="hero sb">' + m(sp.equity) + ' <em class="' + c(sp.equity - sp.start) + '">' + m(sp.equity - sp.start, 1) + ' \u00b7 ' + pc(sp.equity - sp.start, sp.start) + '</em></div>' +
        chart([[sp.curve || [], '#30D158']], 395, 90, 0) + '<div class="lg"><span style="color:#30D158">\u2014 Grok P&amp;L</span> since 10/20</div>' +
        '<div class="lg">Kalshi balance \u00b7 at mark \u00b7 ' + asof(sp.balAsOf) + '</div>' +
        '<div class="row">' + k('Desk today', m(sp.desk_today, 1), c(sp.desk_today)) + k('Grok today', m(sp.grok_today, 1), c(sp.grok_today)) + k('Grok picks since 10/20', m(g[0], 1) + ' \u00b7 ' + (g[1] || 0) + '\u2013' + (g[2] || 0), c(g[0])) + '</div>' +
        '<div class="sw">' + (b0 ? '<i>Sweat ' + (bd.indexOf(b0) + 1) + '/' + bd.length + '</i> ' + esc(b0.l.replace(/\s*\(.*$/, '').slice(0, 26)) + '<br><b>' + esc(b0.s || 'not started') + (b0.c ? ' \u00b7 ' + esc(b0.c) : '') + '</b> <em class="' + c(b0.u) + '">' + esc(b0.st || '') + ' ' + m(b0.u, 1) + '</em>' : '<i>No open Grok bets</i>') + '</div>' +
        '<div class="roi">' + (sp.roi || []).map(function (x) { return '<span>' + esc(x[0]) + ' <b class="' + c(x[1]) + '">' + (x[1] >= 0 ? '+' : '\u2212') + Math.abs(x[1]).toFixed(0) + '%</b></span>'; }).join('') + '</div>' +
        '<div class="ao">ROI by sport \u00b7 sports feed ' + asof(sp.asOf) + '</div>'); }
    /* Kalshi Desk */
    if (kd) { var st = ageH(kd.asOf) > 2, ob = (kd.bets || [])[0];
      h += card('kd', 'Kalshi Desk', st ? pill('Paused', 'off') : pill('Live', 'on'),
        '<div class="hero">' + m(kd.equity) + ' <em class="' + c(kd.total) + '">' + m(kd.total, 1) + ' \u00b7 ' + pc(kd.total, kd.start) + '</em></div>' +
        '<div class="lg">At mark \u00b7 Realized <b class="' + c(kd.realized) + '">' + m(kd.realized, 1) + '</b></div>' + chart([[kd.cum || [], 'rgba(245,245,247,0.8)']], 395, 90, 0, 1) + '<div class="lg">Cumulative settled P&amp;L, centred on $0 \u00b7 dot per settlement</div>' +
        '<div class="row">' + k('Win rate', kd.wins + '\u2013' + (kd.n - kd.wins)) + k('7 days', m(kd.week, 1), c(kd.week)) + k('Open', (kd.bets || []).length) + '</div>' +
        '<div class="sw">' + (ob ? '<i>Open</i> ' + esc(ob.t) + '<br>Paid <b>' + Math.round(ob.paid * 100) + '\u00a2</b> \u00b7 market now <b class="' + c(ob.now - ob.paid) + '">' + Math.round(ob.now * 100) + '\u00a2</b>' : '<i>No open bets</i>') + '</div>' + bars(kd.pm) +
        '<div class="lg">Won ' + kd.wins + '/' + kd.n + ' settled \u00b7 as of ' + asof(kd.asOf) + '</div>'); }
    /* Crypto CEO */
    if (cr) { var ps = cr.positions || [], tl = '', nc = nextCheck(), ang = (1 - nc[0] / 360) * 100;
      for (i = 0; i < ps.length; i++) { var p = ps[i], dist = n(p.stop) && n(p.now) ? Math.abs(p.stop - p.now) / p.now * 100 : null;
        tl += '<div class="ct ' + (/short/i.test(p.side) ? 'sh' : 'lo') + '"><b>' + esc(p.sym) + '</b><i>' + esc(p.side) + '</i><em class="' + c(p.pnl) + '">' + m(p.pnl, 1) + '</em><i>stop ' + (n(dist) ? dist.toFixed(0) + '% away' : '\u2013') + '</i></div>'; }
      var hh = Math.floor(nc[0] / 60), mm = nc[0] % 60, C = 2 * Math.PI * 26;
      h += card('cr', 'Crypto CEO', '',
        '<div class="hero">' + m(cr.equity) + ' <em class="' + c(cr.pnlTotal) + '">' + m(cr.pnlTotal, 1) + ' \u00b7 ' + pc(cr.pnlTotal, cr.start) + '</em></div>' +
        '<div class="tiles">' + (tl || '<div class="na">No open positions</div>') + '</div>' +
        '<div class="row">' + k('Today', m(cr.pnlToday, 1), c(cr.pnlToday)) + k('Trades \u00b7 fees', (n(cr.trades) ? cr.trades : '\u2013') + ' \u00b7 ' + (n(cr.fees) ? m(cr.fees) : '\u2013')) +
        '<div class="k ring"><svg width="64" height="64"><circle cx="32" cy="32" r="26" class="rg"/><circle cx="32" cy="32" r="26" class="rf" stroke-dasharray="' + (C * Math.max(0, Math.min(1, ang / 100))).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 32 32)"/></svg><i>Next ' + nc[1][0] % 12 + ':' + (nc[1][1] < 10 ? '0' : '') + nc[1][1] + (nc[1][0] >= 12 ? ' PM' : ' AM') + '</i><b>' + (hh ? hh + 'h ' : '') + mm + 'm</b></div></div>' +
        '<div class="ao">Mac feed ' + esc(F.updated || '\u2013') + '</div>'); }
    /* Overnight team */
    if (ov) { var pl = ''; (ov.nights || []).forEach(function (x) { pl += '<div class="nt"><i>' + esc(x[0]) + '</i><b>' + (x[1] == null ? '\u2013' : x[1] + ' survivor' + (x[1] === 1 ? '' : 's')) + '</b> <em>' + (x[2] ? '\u00b7 pitched' : '\u00b7 not pitched') + '</em></div>'; });
      h += card('ov', 'Overnight Research', '',
        '<div class="hero">' + m(ov.equity) + ' <em class="' + c(ov.total) + '">' + m(ov.total, 1) + ' \u00b7 ' + pc(ov.total, ov.start) + '</em></div>' +
        '<div class="call">Tonight\u2019s call <b>' + esc(ov.call) + '</b> <i>' + esc(ov.cycle) + '</i></div>' +
        '<div class="pipe">Scout \u2192 Analyst \u2192 Builder \u2192 Brief</div>' + pl +
        '<div class="row">' + k('Record', ov.wins + '\u2013' + ov.losses, ov.losses > ov.wins ? 'dn' : '') + k('P&amp;L', m(ov.total, 1), c(ov.total)) + '</div>' +
        '<div class="sw">' + (ov.brief ? '<i>Latest brief</i> ' + esc(ov.brief) : '<i>No brief</i>') + '</div>' +
        '<div class="ao">As of ' + asof(ov.asOf) + '</div>'); }
    if (h !== root.__h) { root.__h = h; root.innerHTML = h; pulse(); }   // redraw (and replay draw-ins) only when the data changes
  }
  /* glow on any number that changed since the last refresh (keyed by card + position) */
  var last = {};
  function pulse() { var el = root.querySelectorAll('b, .hero'); for (var i = 0; i < el.length; i++) { var p = el[i].parentNode, key = (p.className || '') + i, t = el[i].textContent;
      if (last[key] != null && last[key] !== t) el[i].className += ' pz'; last[key] = t; } }
  function bars(pm) { if (!pm) return ''; var mx = 0, h = '<div class="pmb">'; pm.forEach(function (x) { if (n(x[1])) mx = Math.max(mx, Math.abs(x[1])); });
    pm.forEach(function (x) { h += '<div><i>' + x[0] + '</i><s><u class="' + (n(x[1]) && x[1] < 0 ? 'neg' : '') + '" style="width:' + (n(x[1]) && mx ? Math.abs(x[1]) / mx * 100 : 0).toFixed(0) + '%"></u></s><b class="' + c(x[1]) + '">' + m(x[1], 1) + '</b></div>'; }); return h + '</div>'; }
  setInterval(function () { var d = root.querySelectorAll('.draw'); for (var i = 0; i < d.length; i++) { var s = d[i]; s.setAttribute('class', 'ln'); (function (x) { setTimeout(function () { x.setAttribute('class', 'ln draw'); }, 60); })(s); } }, 30000);   // slow 30 s redraw of each chart line
  function load() { get(BASE + 'bosses.json?t=' + Date.now(), function (j) { if (j) B = j; get(BASE + 'floor.json?t=' + Date.now(), function (f) { if (f) F = f; draw(); }); }); }
  load(); setInterval(load, 60000);
})();
