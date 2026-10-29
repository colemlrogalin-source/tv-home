/* Trading Floor (custom): a compact VWAP/EMA desk line in the stocks panel header, from the sanitized snapshot JSON at
   CONFIG.floorUrl (numbers only). Shows "Feed offline" when there's no URL or it can't be reached. Plain ES5. */
(function () {
  var FEED = (window.CONFIG || {}).floorUrl || '';
  function money(v) { var s = Math.abs(v).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ','); return (v < 0 ? '-$' : '$') + s; }
  function render(d) {
    var el = document.getElementById('floorrow'); if (!el) return;
    if (!d || !d.vwap) { el.innerHTML = 'VWAP/EMA desk · <span class="off">Feed offline</span>'; return; }
    var v = d.vwap, t = v.pnlToday || 0;
    el.innerHTML = 'VWAP/EMA <b>' + money(v.equity) + '</b> <span class="' + (t >= 0 ? 'up' : 'dn') + '">' + (t >= 0 ? '+' : '') +
      money(t) + '</span> · ' + (v.positions || []).length + ' pos';
  }
  function refresh() {
    if (!FEED) return render(null);
    var x = new XMLHttpRequest();
    x.open('GET', FEED + (FEED.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now(), true); x.timeout = 15000;
    x.onload = function () { var j = null; try { j = x.status === 200 ? JSON.parse(x.responseText) : null; } catch (e) {} render(j); };
    x.onerror = x.ontimeout = function () { render(null); }; x.send();
  }
  window.FloorRefresh = refresh;
  setTimeout(refresh, 0); setInterval(refresh, 60000);
})();
