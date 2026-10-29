/* extra.js: car + car slideshow, movers ticker, screensaver Fleet Wall, dimmer and burn-in shift. Plain ES5. */
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
    var it = el('div', 'mvi', mv, html); setTimeout(function () { setClass(it, 'in', true); }, 50);
    var olds = mv.getElementsByTagName('div');
    for (var i = olds.length - 2; i >= 0; i--) { (function (o) { setClass(o, 'out', true); setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 900); })(olds[i]); }
  }
  setInterval(showMover, 6000);

  /* Fleet Wall: only desks with real, meaningful data. */
  var wall = el('div', '', stage); wall.id = 'wall';
  var wbg = el('div', 'wbg', wall), lb = el('div', 'lb', wall), panel = el('div', 'panel', wall), wclock = el('div', 'wclock', wall);
  var ready = [], pidx = 0, data = null;
  function dayInfo() { var s = Date.UTC(2026, 9, 28, 4), d = Math.floor((Date.now() - s) / 86400000) + 1, left = Math.ceil((Date.UTC(2026, 11, 1, 5) - Date.now()) / 86400000);
    return 'Day ' + Math.max(1, Math.min(32, d)) + ' of 32 \u00b7 Dec 1 decision in ' + Math.max(0, left) + ' days'; }
  function spark(c, up) {
    if (!c || c.length < 2) return ''; var mn = Math.min.apply(null, c), mx = Math.max.apply(null, c), r = mx - mn || 1, p = [];
    for (var i = 0; i < c.length; i++) p.push((i * 900 / (c.length - 1)).toFixed(1) + ',' + (190 - (c[i] - mn) / r * 180).toFixed(1));
    return '<svg viewBox="0 0 900 200" preserveAspectRatio="none"><polyline fill="none" stroke="' + (up ? '#30D158' : '#FF453A') + '" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" points="' + p.join(' ') + '"/></svg>';
  }
  function cls(v) { return v >= 0 ? 'up' : 'dn'; }
  function drawLB() {
    var rows = ready.slice().sort(function (a, b) { return b.pnlTotal - a.pnlTotal; }), h = '<div class="lbh"><span>Fleet leaderboard</span><span class="cd">' + dayInfo() + '</span></div>';
    for (var i = 0; i < rows.length; i++) h += '<div class="lbr"><span class="rk">' + (i + 1) + '</span><span class="nm">' + rows[i].name + '</span><span class="pv ' + cls(rows[i].pnlTotal) + '">' + money(rows[i].pnlTotal, true) + '</span></div>';
    lb.innerHTML = h;
  }
  function drawPanel() {
    if (!ready.length) return; var d = ready[pidx++ % ready.length], rec = d.record ? d.record.wins + '\u2013' + d.record.losses + ' \u00b7 ' + d.record.trades + ' trades' : '';
    panel.className = 'panel';
    panel.innerHTML = '<div class="pn">' + d.name + '</div><div class="big">' + money(d.equity) + '</div>'
      + '<div class="pl"><span class="' + cls(d.pnlTotal) + '">' + money(d.pnlTotal, true) + ' total</span>'
      + (d.pnlToday != null ? '<span class="' + cls(d.pnlToday) + '">' + money(d.pnlToday, true) + ' today</span>' : '') + '</div>'
      + '<div class="rec">' + rec + (d.asOf ? '<span class="as">as of ' + d.asOf + '</span>' : '') + '</div>' + spark(d.curve, d.pnlTotal >= 0);
    setTimeout(function () { panel.className = 'panel in'; }, 60);
  }
  function load() {
    getJSON('floor.json', function (d) {
      if (!d) return; data = d; var r = [], ds = d.desks || [];
      for (var i = 0; i < ds.length; i++) if (ds[i].ready === true && typeof ds[i].equity === 'number' && typeof ds[i].pnlTotal === 'number') r.push(ds[i]);
      ready = r; mvItems = (d.trades || []).concat(d.movers || []); if (ready.length) drawLB(); if (mv.style.display !== 'block') showMover();
    });
  }
  load(); setInterval(load, 60000); setInterval(function () { if (wallOn) drawPanel(); }, 20000);
  var wallOn = false;
  function setWall(on) {
    on = on && ready.length > 0;
    if (on && !wallOn) { drawLB(); drawPanel(); wbg.style.backgroundImage = 'url(' + BASE + 'car.png)'; }
    setClass(wbg, 'photo', on); wall.style.display = on ? 'block' : 'none'; wallOn = on;
  }

  /* Dimmer (20%/hour to 40%) + burn-in pixel shift, applied to the dashboard and the wall. */
  var dim = document.createElement('div'); dim.id = 'saverdim';
  dim.style.cssText = 'position:absolute;left:0;top:0;width:1920px;height:1080px;background:#000;opacity:0;pointer-events:none;z-index:9;-webkit-transition:opacity 4s;transition:opacity 4s;';
  stage.appendChild(dim);
  var since = 0, HOUR = 3600000;
  function tick() {
    var on = saver ? hasClass(saver, 'on') : false, home = document.getElementById('home'), t = '';
    try { setWall(on); } catch (e) { wall.style.display = 'none'; wallOn = false; }
    if (on) { var n = new Date(), h = n.getHours() % 12 || 12, m = n.getMinutes(); wclock.innerHTML = h + ':' + (m < 10 ? '0' : '') + m; }
    if (!on) { since = 0; dim.style.opacity = '0'; }
    else {
      if (!since) since = Date.now();
      dim.style.opacity = String(Math.min(3, Math.floor((Date.now() - since) / HOUR)) * 0.2);
      var k = Math.floor((Date.now() - since) / 120000) % 8; t = 'translate(' + [0, 6, 6, 0, -6, -6, 0, 6][k] + 'px,' + [0, 0, 6, 6, 6, 0, -6, -6][k] + 'px)';
    }
    if (home) home.style.webkitTransform = home.style.transform = t;
    lb.style.webkitTransform = lb.style.transform = panel.style.webkitTransform = panel.style.transform = wclock.style.webkitTransform = wclock.style.transform = t;
  }
  setInterval(tick, 2000);
})();
