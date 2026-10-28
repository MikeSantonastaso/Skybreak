// Skybreak's daily sortie leaderboard: a tiny dependency-free HTTP service.
//   GET  /daily/YYYY-MM-DD   -> { day, top: [{ name, score, wave, kills, bosses, plane }] }
//   POST /daily/YYYY-MM-DD   { name, wave, kills, bosses, plane } -> { day, rank, top }
// Each callsign keeps its best score per day. The score is worked out here from the wave, kills and bosses.
// Scores come from players' browsers, so this keeps honest friends honest; it is not cheat-proof.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');

const PORT = +process.env.PORT || 9100, HOST = process.env.HOST || '127.0.0.1';
const DIR = process.env.STATE_DIRECTORY || path.join(__dirname, 'data');
const FILE = path.join(DIR, 'scores.json');
const KEEP_DAYS = 30, TOP = 20, MAX_PER_DAY = 2000;

fs.mkdirSync(DIR, { recursive: true });
let days = {};
try { days = JSON.parse(fs.readFileSync(FILE, 'utf8')) || {}; } catch (e) { days = {}; }
let saveT = null;
function save() {
  if (saveT) return;
  saveT = setTimeout(() => {
    saveT = null;
    const keys = Object.keys(days).sort();
    keys.slice(0, -KEEP_DAYS).forEach(k => delete days[k]);
    const tmp = FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(days));
    fs.renameSync(tmp, FILE);
  }, 500);
}

const utcDay = offset => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
const int = (v, max) => (Number.isFinite(+v) ? Math.max(0, Math.min(max, Math.floor(+v))) : 0);
const clean = (t, n) => String(t || '').replace(/[\u0000-\u001f<>"'`\\]/g, '').trim().slice(0, n);
const ranked = day => Object.values(days[day] || {}).sort((a, b) => b.score - a.score || a.at - b.at);
const top = day => ranked(day).slice(0, TOP).map(({ name, score, wave, kills, bosses, plane }) => ({ name, score, wave, kills, bosses, plane }));

// a few posts a minute per address is plenty for a human
const hits = new Map();
function limited(ip) {
  const now = Date.now(), h = (hits.get(ip) || []).filter(t => now - t < 60000);
  h.push(now); hits.set(ip, h);
  if (hits.size > 5000) hits.clear();
  return h.length > 12;
}

function send(res, code, body) {
  res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'cache-control': 'no-store' });
  res.end(code === 204 ? '' : JSON.stringify(body));
}

http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/' || url.pathname === '/health') return send(res, 200, { ok: true, service: 'skybreak-board' });
  const m = url.pathname.match(/^\/daily\/(\d{4}-\d{2}-\d{2})$/);
  if (!m) return send(res, 404, { error: 'not found' });
  const day = m[1];
  if (req.method === 'GET') return send(res, 200, { day, top: top(day) });
  if (req.method !== 'POST') return send(res, 405, { error: 'method' });
  // only today's sortie (and yesterday's, for runs that cross midnight UTC) takes scores
  if (day !== utcDay(0) && day !== utcDay(-1)) return send(res, 400, { error: 'that sortie is closed' });
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (limited(ip)) return send(res, 429, { error: 'slow down' });
  let raw = '';
  req.on('data', c => { raw += c; if (raw.length > 2048) req.destroy(); });
  req.on('end', () => {
    let b;
    try { b = JSON.parse(raw); } catch (e) { return send(res, 400, { error: 'bad json' }); }
    const name = clean(b.name, 16) || 'Pilot', wave = int(b.wave, 500), kills = int(b.kills, 50000), bosses = int(b.bosses, 100);
    // a wave holds at most a few dozen enemies, so cap kills against waves
    if (kills > (wave + 1) * 60) return send(res, 400, { error: 'implausible' });
    const score = wave * 1000 + kills * 25 + bosses * 500;
    const list = days[day] || (days[day] = {}), key = name.toLowerCase(), prev = list[key];
    if (!prev && Object.keys(list).length >= MAX_PER_DAY) return send(res, 503, { error: 'board full' });
    if (!prev || score > prev.score) { list[key] = { name, score, wave, kills, bosses, plane: clean(b.plane, 16), at: Date.now() }; save(); }
    const rank = ranked(day).findIndex(r => r.name.toLowerCase() === key) + 1;
    send(res, 200, { day, rank, top: top(day) });
  });
}).listen(PORT, HOST, () => console.log('skybreak-board on ' + HOST + ':' + PORT + ', data in ' + FILE));
