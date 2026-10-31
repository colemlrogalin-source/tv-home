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

/* v6 (Oct 30): app row + YouTube. Ships via GitHub Pages, no reinstall.
   - YouTube tile -> TizenTube inside TizenBrew (app control 'module' = @foxreis/tizentube, the same call TizenTube's own
     service makes; TizenBrew reads it in WebSocketClient.js). Falls back to Samsung's YouTube when TizenBrew isn't installed.
   - Shelf: drops Netflix, Disney+, Apple TV, Alexa; adds ESPN (Samsung id 3201708014618, ESPN+ lives inside it) if installed.
     Applied once per version (fmtv.shelfFix), so later edits made on the TV stick. */
(function () {
  if (!window.TV || !window.Prefs || !window.tizen || !tizen.application) return;
  var DROP = /netflix|disney|apple ?tv|aria-video|alexa/i, ESPN = /^espn|3201708014618/i, YT = /youtube(?!.*kids)|111299001912/i;
  var brew = null;
  try {
    tizen.application.getAppsInfo(function (all) {
      for (var i = 0; i < all.length; i++) if (/\.(TizenBrewStandalone|TizenTubeStandalone)$/.test(all[i].id)) { brew = all[i].id; if (/TizenTube/.test(brew)) break; }
    }, function () {});
  } catch (e) {}
  var launch0 = TV.launch;
  TV.launch = function (id, params, done) {
    if (brew && YT.test(id) && !/kids/i.test(id)) {
      try {
        tizen.application.launchAppControl(new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/view', null, null, null,
          [new tizen.ApplicationControlData('module', [JSON.stringify({moduleName: '@foxreis/tizentube', moduleType: 'npm', args: ''})])]),
          brew, function () { if (done) done(true); }, function () { launch0(id, params, done); });
        return;
      } catch (e) {}
    }
    launch0(id, params, done);
  };
  var VER = 'v6';
  try { if (localStorage.getItem('fmtv.shelfFix') === VER) return; } catch (e) { return; }
  TV.apps(function (list) {
    var byId = {}, i, ids = [], cur = Prefs.shelf();
    for (i = 0; i < list.length; i++) byId[list[i].id] = list[i];
    function bad(id) { var a = byId[id]; return !a || DROP.test(id) || DROP.test(a.title || ''); }
    if (cur && cur.length) { for (i = 0; i < cur.length; i++) if (!bad(cur[i])) ids.push(cur[i]); }
    else {
      var ORDER = [/youtube/i, /prime video|amazon/i, /^(hbo )?max$|hbo max/i, /hulu/i, /paramount/i, /peacock/i, /nfl/i, /globoplay/i, /jellyfin/i, /spotify/i];
      for (var o = 0; o < ORDER.length; o++) for (i = 0; i < list.length; i++)
        if (ORDER[o].test(list[i].title || '') && !bad(list[i].id) && ids.indexOf(list[i].id) < 0 && !/kids/i.test(list[i].title)) { ids.push(list[i].id); break; }
    }
    for (i = 0; i < list.length; i++) if ((ESPN.test(list[i].title || '') || ESPN.test(list[i].id)) && ids.indexOf(list[i].id) < 0) { ids.splice(Math.min(1, ids.length), 0, list[i].id); break; }
    try { localStorage.setItem('fmtv.shelfFix', VER); } catch (e) {}
    if (ids.length && JSON.stringify(ids) !== JSON.stringify(cur || [])) { Prefs.set('shelf', ids); location.reload(); }
  });
})();
/* full8 glass dashboard (Home / EMA / Sports Edge) on top of the app; add ?classic to the page URL for the old look. */
(function () {
  if (/classic/.test(location.search) || window.__glass) return;
  var s = document.createElement('script'); s.src = (window.DASH_BASE && window.DASH_REMOTE !== false ? window.DASH_BASE : '') + 'glass.js?v=' + Date.now();
  document.body.appendChild(s);
})();
