/* Optional remote-only hook for new widgets. */
/* Screensaver dimmer: while the screensaver is on, dim 20% per hour (100 -> 80 -> 60 -> 40%), then hold at 40%. Plain ES5. */
(function () {
  var saver = document.getElementById('saver'); if (!saver) return;
  var dim = document.createElement('div');
  dim.id = 'saverdim';
  dim.style.cssText = 'position:absolute;left:0;top:0;width:1920px;height:1080px;background:#000;opacity:0;pointer-events:none;z-index:9;-webkit-transition:opacity 4s;transition:opacity 4s;';
  (document.getElementById('stage') || document.body).appendChild(dim);
  var since = 0, HOUR = 3600000;
  function tick() {
    var on = /(^|\s)on(\s|$)/.test(saver.className);
    var home = document.getElementById('home');
    if (!on) { since = 0; dim.style.opacity = '0'; if (home) home.style.webkitTransform = home.style.transform = ''; return; }
    if (!since) since = Date.now();
    var steps = Math.min(3, Math.floor((Date.now() - since) / HOUR));
    dim.style.opacity = String(steps * 0.2);   // brightness 1 - 0.2*steps, floor 40%
    // Burn-in guard: nudge the dashboard a few pixels every 2 minutes so nothing sits on the same pixels for hours.
    var k = Math.floor((Date.now() - since) / 120000) % 8, dx = [0, 6, 6, 0, -6, -6, 0, 6][k], dy = [0, 0, 6, 6, 6, 0, -6, -6][k];
    if (home) home.style.webkitTransform = home.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
  }
  setInterval(tick, 5000);
})();
