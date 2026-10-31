/* glass.js: browser copy of the Roku full8 dashboard (Home, EMA full, Sports Edge).
   bosses.json.glass is the exact draw list the box's Roku renderer made (every 5 min); this page only paints it.
   Keys: Down Home > EMA > Sports, Up steps back, Back/Esc home, Left/Right switch desk on Home. Tabs at the top (move the mouse). */
(function () {
  if (window.__glass) return; window.__glass = 1;
  var BASE = (window.DASH_BASE && window.DASH_REMOTE !== false) ? window.DASH_BASE : (window.GLASS_BASE || '');
  var PAGES = ['home', 'ema', 'sports'], page = 'home', desk = 0, G = null, built = {};
  var css = document.createElement('style');
  css.textContent = "@font-face{font-family:GD;src:url('" + BASE + "Inter-ExtraBold.ttf') format('truetype');font-weight:800}" +
    "#gd{position:fixed;left:0;top:0;width:100vw;height:100vh;background:#111;z-index:2147483000;overflow:hidden;cursor:default}" +
    "#gd .st{position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0;font-family:GD,Inter,sans-serif;font-weight:800}" +
    "#gd .pg{position:absolute;left:0;top:0;width:1920px;height:1080px;background-size:1920px 1080px;display:none}" +
    "#gd .pg.on{display:block}#gd .t{position:absolute;white-space:pre;line-height:normal}#gd .r{position:absolute}" +
    "#gd svg{position:absolute;left:0;top:0}" +
    "#gd .tabs{position:absolute;left:760px;top:0;width:400px;height:34px;display:flex;gap:6px;justify-content:center;opacity:0;transition:opacity .3s;z-index:5}" +
    "#gd .tabs.show{opacity:1}#gd .tabs div{padding:4px 14px;font-size:17px;color:#F5F5F5;background:rgba(98,103,110,.92);border:1px solid rgba(255,255,255,.35);border-top:0;border-radius:0 0 10px 10px;cursor:pointer}" +
    "#gd .tabs div.on{color:#F2C46B}#gd .msg{position:absolute;left:0;top:500px;width:1920px;text-align:center;color:#F5F5F5;font-size:32px}";
  document.head.appendChild(css);
  var root = document.createElement('div'); root.id = 'gd'; var st = document.createElement('div'); st.className = 'st'; root.appendChild(st);
  var tabs = document.createElement('div'); tabs.className = 'tabs'; st.appendChild(tabs);
  [['home', 'HOME'], ['ema', 'EMA'], ['sports', 'SPORTS EDGE']].forEach(function (p) {
    var t = document.createElement('div'); t.textContent = p[1]; t.setAttribute('data-p', p[0]);
    t.onclick = function () { go(p[0]); }; tabs.appendChild(t);
  });
  var msg = document.createElement('div'); msg.className = 'msg'; msg.textContent = 'Loading dashboard…'; st.appendChild(msg);
  (document.body || document.documentElement).appendChild(root);
  function fit() { var s = Math.min(innerWidth / 1920, innerHeight / 1080); st.style.transform = 'translate(' + (innerWidth - 1920 * s) / 2 + 'px,' + (innerHeight - 1080 * s) / 2 + 'px) scale(' + s + ')'; }
  addEventListener('resize', fit); fit();
  var hide; function showTabs() { tabs.className = 'tabs show'; clearTimeout(hide); hide = setTimeout(function () { tabs.className = 'tabs'; }, 3500); }
  root.addEventListener('mousemove', showTabs);
  function key(o) { return o.page + ':' + (o.page === 'home' ? o.desk : ''); }
  function paint(ops, cls) {
    var pg = document.createElement('div'), h = [], svg = '', nxt = ''; pg.className = 'pg ' + cls;
    for (var i = 0; i < ops.length; i++) {
      var o = ops[i];
      if (o[0] === 'bg') pg.style.backgroundImage = "url('" + BASE + (o[1] === 'bg.png' ? 'gd_home.jpg' : 'gd_full.jpg') + "?v=8')";
      else if (o[0] === 'r') h.push('<div class="r" style="left:' + o[1] + 'px;top:' + o[2] + 'px;width:' + o[3] + 'px;height:' + o[4] + 'px;background:' + o[5] + '"></div>');
      else if (o[0] === 't') {
        var tag = '';
        if (o[4] === 72 && o[1] === 944 && o[2] === 14) tag = ' data-c="hm"';
        else if (o[1] === 944 && o[2] === 104 && o[4] === 26) tag = ' data-c="date"';
        else if (o[2] === 10 && /^\d{1,2}:\d\d [AP]M ET$/.test(o[3])) tag = ' data-c="et"';
        else if (cls === 'p-sports' && o[2] === 10 && /^(NEXT SCAN|UPD) /.test(o[3])) { if (/^NEXT/.test(o[3])) nxt = o[3]; continue; }
        h.push('<div class="t"' + tag + ' style="left:' + o[1] + 'px;top:' + o[2] + 'px;font-size:' + o[4] + 'px;color:' + o[5] + '">' +
          String(o[3]).replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</div>');
      } else if (o[0] === 'l') svg += '<polyline fill="none" stroke-linejoin="round" stroke-linecap="round" stroke="' + o[2] + '" stroke-width="' + o[3] + '" points="' + o[1].join(' ') + '"/>';
    }
    if (cls === 'p-sports') h.push('<div class="t" style="left:1150px;top:10px;font-size:19px;color:#F5F5F5">' + nxt + ' · <span style="color:#F2C46B">Updated ' + String(G.made || '').replace(/^\S+ /, '') + '</span></div>');
    pg.innerHTML = h.join('') + '<svg width="1920" height="1080">' + svg + '</svg>';
    return pg;
  }
  function show() {
    if (!G) return; msg.style.display = 'none';
    var k = key({ page: page, desk: desk }), ops = page === 'home' ? G.home[desk % G.home.length] : G[page];
    if (!ops) { msg.style.display = 'block'; msg.textContent = 'No ' + page + ' data yet'; }
    if (!built[k] && ops) { built[k] = paint(ops, 'p-' + page); st.insertBefore(built[k], tabs); }
    for (var b in built) built[b].className = built[b].className.replace(/ on\b/, '') + (b === k ? ' on' : '');
    var ts = tabs.children; for (var i = 0; i < ts.length; i++) ts[i].className = ts[i].getAttribute('data-p') === page ? 'on' : '';
    tick();
  }
  function go(p) { page = p; show(); }
  function tick() {
    var d = new Date(), h = d.getHours() % 12 || 12, m = ('0' + d.getMinutes()).slice(-2), ap = d.getHours() < 12 ? 'AM' : 'PM';
    var D = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var q = st.querySelectorAll('[data-c]');
    for (var i = 0; i < q.length; i++) {
      var c = q[i].getAttribute('data-c'), e = q[i]; if (!e.offsetWidth) continue;
      if (c === 'hm') e.textContent = h + ':' + m;
      else if (c === 'date') e.textContent = D[d.getDay()] + ', ' + M[d.getMonth()] + ' ' + d.getDate();
      else if (c === 'et') { if (!e.dataset.r) { e.dataset.r = parseFloat(e.style.left) + e.offsetWidth; } e.textContent = h + ':' + m + ' ' + ap + ' ET'; e.style.left = (e.dataset.r - e.offsetWidth) + 'px'; }
    }
  }
  setInterval(tick, 10000);
  function load() {
    var x = new XMLHttpRequest();
    x.onload = function () {
      try { var b = JSON.parse(x.responseText), g = typeof b.glass === 'string' ? JSON.parse(b.glass) : b.glass; if (g && g.home) { if (!G || g.made !== G.made) { G = g; for (var k in built) built[k].parentNode.removeChild(built[k]); built = {}; } show(); } else if (!G) msg.textContent = 'Dashboard data not published yet'; } catch (e) {}
    };
    x.open('GET', BASE + 'bosses.json?t=' + Date.now()); x.send();
  }
  load(); setInterval(load, 45000);   // bosses.json re-fetched every 45 s (cache-busted)
  window.addEventListener('keydown', function (e) {
    var k = e.keyCode, i = PAGES.indexOf(page), used = true;
    if (k === 40) { if (i < 2) go(PAGES[i + 1]); }
    else if (k === 38) { if (i > 0) go(PAGES[i - 1]); }
    else if (k === 37 || k === 39) { if (page === 'home' && G) { desk = (desk + (k === 39 ? 1 : G.home.length - 1)) % G.home.length; show(); } }
    else if ((k === 27 || k === 8 || k === 10009 || k === 461) && page !== 'home') go('home');
    else used = false;
    if (used) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  window.GlassGo = go;
})();
