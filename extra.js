/* extra.js: car + car slideshow, movers ticker, dimmer and burn-in shift. Plain ES5. */
(function () {
  var BASE = window.DASH_BASE && window.DASH_REMOTE !== false ? window.DASH_BASE : '';
  var stage = document.getElementById('stage') || document.body, saver = document.getElementById('saver');
  var top = document.getElementById('top') || document.getElementById('home') || stage, sky = document.getElementById('sky');
  function el(tag, cls, parent, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; }
  function getJSON(path, cb) {
    var x = new XMLHttpRequest();
    x.onreadystatechange = function () { if (x.readyState !== 4) return; var d = null; if (x.status >= 200 && x.status < 300) { try { d = JSON.parse(x.responseText); } catch (e) {} } cb(d); };
    x.open('GET', BASE + path + (path.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now(), true); x.timeout = 15000; x.send();
  }
  function hasClass(e, c) { return (' ' + e.className + ' ').indexOf(' ' + c + ' ') >= 0; }
  function setClass(e, c, on) { var h = hasClass(e, c); if (on && !h) e.className += ' ' + c; if (!on && h) e.className = (' ' + e.className + ' ').replace(' ' + c + ' ', ' ').replace(/^\s+|\s+$/g, ''); }
  function money(v, sign) { var n = Math.abs(v), s = n >= 1000 ? Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : n.toFixed(2); return (sign ? (v >= 0 ? '+' : '\u2212') : (v < 0 ? '\u2212' : '')) + '$' + s; }
  try { if (window.CONFIG && CONFIG.tmdbKey) setClass(document.body, 'tmdb', true); } catch (e) {}

  /* Car hero: true aspect, inside margins. */
  if (sky) el('div', '', sky).id = 'car';
  var photos = [];

  /* Movers: positions in profit (P&L / % only, never balances) plus trades just executed, from real desk data. */
  var mv = el('div', '', top); mv.id = 'movers'; var mvItems = [], mi = 0;
  function showMover() {
    if (!mvItems.length) { mv.style.display = 'none'; return; }
    mv.style.display = 'block'; var m = mvItems[mi++ % mvItems.length];
    var html = m.text ? '<span class="tag">Just traded</span><b>' + m.text + '</b><span class="d">' + m.desk + '</span>'
      : '<span class="tag">Mover</span><b>' + m.sym + '</b><span class="g">+' + m.pct.toFixed(2) + '%</span><span class="g">' + money(m.pnl, true) + '</span><span class="d">' + m.desk + '</span>';
    mv.innerHTML = '';  /* one item only: stacked fading items overlapped on the TV */
    var it = el('div', 'mvi', mv, html); setTimeout(function () { setClass(it, 'in', true); }, 50);
  }
  setInterval(showMover, 6000);

  /* Movers feed (floor.json). */
  function load() { getJSON('floor.json', function (d) { if (!d) return; mvItems = (d.trades || []).concat(d.movers || []); if (mv.style.display !== 'block') showMover(); }); }
  load(); setInterval(load, 60000);

  /* Dimmer (20%/hour to 40%) + burn-in pixel shift, applied to the dashboard. */
  var dim = document.createElement('div'); dim.id = 'saverdim';
  dim.style.cssText = 'position:absolute;left:0;top:0;width:1920px;height:1080px;background:#000;opacity:0;pointer-events:none;z-index:9;-webkit-transition:opacity 4s;transition:opacity 4s;';
  stage.appendChild(dim);
  var since = 0, HOUR = 3600000;
  function tick() {
    var on = saver ? hasClass(saver, 'on') : false, home = document.getElementById('home'), t = '';
    if (!on) { since = 0; dim.style.opacity = '0'; }
    else {
      if (!since) since = Date.now();
      dim.style.opacity = String(Math.min(3, Math.floor((Date.now() - since) / HOUR)) * 0.2);
      var k = Math.floor((Date.now() - since) / 120000) % 8; t = 'translate(' + [0, 6, 6, 0, -6, -6, 0, 6][k] + 'px,' + [0, 0, 6, 6, 6, 0, -6, -6][k] + 'px)';
    }
    if (home) home.style.webkitTransform = home.style.transform = t;
  }
  setInterval(tick, 2000);
})();
