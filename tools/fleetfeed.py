#!/usr/bin/env python3
"""Fleet Wall feed for the TV (numbers only, no keys/account ids). Runs every 5 min from launchd.
A desk is ready only with a verified equity, a start/baseline, a P&L figure, real activity and >1 curve point."""
import json, os, subprocess, urllib.request, datetime as dt
REPO = os.environ.get('TVFEED_REPO') or os.path.expanduser('~/Downloads/tv-home'); OUT = os.path.join(REPO, 'floor.json')
STOCK = os.path.expanduser('~/financial-hub/stocks/current/runtime/status.json')
now = dt.datetime.now(dt.timezone.utc); et = now.astimezone(dt.timezone(dt.timedelta(hours=-4)))
def get(u):
    try: return json.load(urllib.request.urlopen(u, timeout=10))
    except Exception: return None
try: old = json.load(open(OUT))
except Exception: old = {}
TODAY = et.strftime('%Y-%m-%d'); OPENS = old.get('opens') or {}
def track(key, eq):  # first equity seen each ET day -> today and 7-day P&L (no new files, lives in floor.json)
    book = OPENS.setdefault(key, {}); book.setdefault(TODAY, eq)
    for k in sorted(book)[:-8]: del book[k]
    wk = (et - dt.timedelta(days=6)).strftime('%Y-%m-%d'); days = [k for k in sorted(book) if k >= wk]
    return round(eq - book[TODAY], 2), (round(eq - book[days[0]], 2) if len(days) > 1 else None)
desks, movers, trades = [], [], []
# VWAP/EMA desk: lives on the agent box (:8792); the Mac can't reach it, so keep the last verified snapshot.
v = old.get('vwap')
if v:
    desks.append({'id': 'vwap', 'name': 'VWAP/EMA', 'equity': v['equity'], 'start': v['start'], 'pnlToday': v['pnlToday'],
                  'pnlTotal': v['pnlTotal'], 'record': v['record'], 'curve': v['curve'], 'asOf': v.get('asOf') or old.get('asOf'),
                  'ready': bool(v['record'].get('trades')) and len(v['curve']) > 1})
    for p in v.get('positions') or []:
        if (p.get('upnl') or 0) > 0 and p.get('entry'):
            movers.append({'sym': p['sym'], 'desk': 'VWAP/EMA', 'pnl': round(p['upnl'], 2),
                           'pct': round(100.0 * p['upnl'] / (p['entry'] * p['qty']), 2)})
# Crypto desk (Trend50, $3,000): Crypto Hub on :8788.
c = get(os.environ.get('TVFEED_CRYPTO') or 'http://127.0.0.1:8788/api/trend50')
if c and isinstance(c.get('coins'), list) and c['coins']:
    eq = round(sum(x.get('equity', 0) for x in c['coins']), 2); start = c.get('capital') or 3000
    acted = c.get('realized') or c.get('unrealized') or any(x.get('qty') for x in c['coins'])
    cv = (old.get('crypto_curve') or [])[-48:]
    if not cv or cv[-1] != eq: cv = (cv + [eq])[-48:]
    cday, cwk = track('crypto', eq)
    desks.append({'id': 'crypto', 'name': 'Crypto Trend50', 'equity': eq, 'start': start, 'pnlToday': cday, 'pnlWeek': cwk,
                  'pnlTotal': round(eq - start, 2), 'record': None, 'curve': cv, 'asOf': c['coins'][0].get('bar'),
                  'ready': bool(acted) and len(cv) > 1 and abs(eq - start) >= 1})
    try:  # positions / closed / trade count for the TV desk card (fail soft)
        def f_(v):
            try: return None if v is None else float(v)
            except Exception: return None
        cp = []
        for x in c['coins']:
            q = f_(x.get('qty'))
            if not q: continue
            val, up = f_(x.get('position_usd')), f_(x.get('unrealized'))
            en = f_(x.get('entry') or x.get('entry_price') or x.get('avg_entry')); nw = f_(x.get('price') or x.get('last') or x.get('close'))
            if nw is None and val and q: nw = round(abs(val) / abs(q), 6)
            base = (en * abs(q)) if en else ((abs(val) - (up or 0)) if val is not None else None)
            cp.append({'sym': x.get('coin'), 'side': str(x.get('side') or ('long' if q > 0 else 'short')).title(), 'qty': round(abs(q), 6),
                       'value': None if val is None else round(abs(val), 2), 'entry': en, 'now': nw, 'stop': f_(x.get('stop_price')),
                       'pnl': None if up is None else round(up, 2), 'pct': round(100.0 * up / base, 2) if up is not None and base else None})
        ds = c.get('decisions') or []
        cl = [{'sym': d.get('coin'), 'ts': d.get('ts') or d.get('time'), 'pnl': f_(d.get('pnl') if d.get('pnl') is not None else d.get('realized'))}
              for d in ds if d.get('action') == 'CLOSE']
        cl = sorted(cl, key=lambda r: str(r['ts'] or ''))[-5:][::-1]
        nt = sum(1 for d in ds if d.get('action') in ('LONG', 'SHORT', 'CLOSE'))
        w = sum(1 for d in ds if d.get('action') == 'CLOSE' and (f_(d.get('pnl')) or 0) > 0); l = sum(1 for d in ds if d.get('action') == 'CLOSE' and (f_(d.get('pnl')) or 0) < 0)
        desks[-1].update({'positions': cp, 'closed': cl, 'trades': nt, 'record': {'wins': w, 'losses': l, 'trades': nt},
                          'cash': c.get('cash'), 'realized': c.get('realized'), 'unrealized': c.get('unrealized'), 'fees': c.get('fees')})
    except Exception: pass
    for x in c['coins']:
        if x.get('qty') and (x.get('unrealized') or 0) > 0 and x.get('position_usd'):
            movers.append({'sym': x['coin'], 'desk': 'Crypto', 'pnl': round(x['unrealized'], 2),
                           'pct': round(100.0 * x['unrealized'] / (x['position_usd'] - x['unrealized']), 2)})
    for d in c.get('decisions') or []:
        if d.get('action') in ('BUY', 'SELL') and d.get('ts'):
            trades.append({'ts': d['ts'], 'text': d['action'] + ' ' + d['coin'], 'desk': 'Crypto'})
    old_crypto = cv
else: old_crypto = old.get('crypto_curve')
# Stock desk (Opening BelLee): Alpaca paper via the Financial Hub runtime. No verified start/baseline yet -> not ready.
try:
    s = json.load(open(STOCK))
    for p in s['account']['positions']:
        pl = float(p.get('unrealized_intraday_pl') or 0); pc = float(p.get('unrealized_intraday_plpc') or 0)
        if pl > 0: movers.append({'sym': p['symbol'], 'desk': 'Stock', 'pnl': round(pl, 2), 'pct': round(pc * 100, 2)})
    for l in s.get('ledger') or []:
        if l.get('state') == 'terminal' and '"filled"' in str(l.get('detail')):
            trades.append({'ts': l['timestamp'], 'text': l['signal']['action'].replace('LONG', 'BUY') + ' ' + l['signal']['symbol'], 'desk': 'Stock'})
    seq = float(s['account']['equity']); SEQ_START = 40000.0  # Cole's stated starting balance (Oct 30)
    sday = round(sum(float(p.get('unrealized_intraday_pl') or 0) for p in s['account']['positions']), 2); _, swk = track('stock', seq)
    desks.append({'id': 'stock', 'name': 'Stock Exchange Quant', 'equity': round(seq, 2), 'start': SEQ_START, 'pnlToday': sday, 'pnlWeek': swk,
                  'pnlTotal': round(seq - SEQ_START, 2), 'positions': len(s['account']['positions']), 'asOf': s.get('timestamp'), 'ready': True})
except Exception: desks.append({'id': 'stock', 'name': 'Opening BelLee', 'ready': False, 'why': 'source unreadable'})
desks.append({'id': 'kalshi', 'name': 'Kalshi', 'ready': False, 'why': 'on agent box, no start/W-L feed reachable from Mac'})
desks.append({'id': 'sports', 'name': 'Sports', 'ready': False, 'why': 'on agent box, not reachable from Mac'})
cut = (now - dt.timedelta(hours=6)).isoformat()
trades = sorted([t for t in trades if t['ts'] >= cut], key=lambda t: t['ts'])[-6:]
movers = sorted(movers, key=lambda m: -m['pct'])[:10]
snap = {'asOf': old.get('asOf'), 'vwap': v, 'desks': desks, 'movers': movers, 'trades': trades, 'crypto_curve': old_crypto, 'opens': OPENS}
new = json.dumps(snap, separators=(',', ':'))
old.pop('updated', None)
if new != json.dumps(old, separators=(',', ':')):
    snap['updated'] = et.strftime('%Y-%m-%d %I:%M %p ET')
    open(OUT, 'w').write(json.dumps(snap, separators=(',', ':')))
    g = ['git', '-C', REPO]
    if os.environ.get('TVFEED_NOPUSH'): raise SystemExit
    subprocess.call(g + ['add', 'floor.json']); subprocess.call(g + ['commit', '-qm', 'feed: fleet floor.json'])
    subprocess.call(g + ['pull', '-q', '--rebase']); subprocess.call(g + ['push', '-q'])
