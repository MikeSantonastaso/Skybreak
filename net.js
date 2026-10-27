// Skybreak online co-op transport: a star of WebRTC data channels through PeerJS.
// The host's browser holds the room. Guests connect only to the host, and the host relays what each guest says to the others.
// The public PeerJS broker only introduces the browsers; game traffic goes peer to peer (or through PeerJS's TURN relay when NAT blocks a direct path).
// Add ?peer=host:port to the page URL to use your own peerjs-server instead (plain ws on localhost, wss elsewhere).
window.SkyNet = (function () {
  'use strict';
  const PEERJS_URLS = ['https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'];
  const PREFIX = 'skybreak-v1-';
  const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O, so a code read aloud can't be misheard
  const MAX = 4;

  let loading = null;
  function loadPeerJs() {
    if (window.Peer) return Promise.resolve();
    if (loading) return loading;
    loading = PEERJS_URLS.reduce((p, url) => p.catch(() => new Promise((ok, fail) => {
      const s = document.createElement('script'); s.src = url; s.async = true;
      s.onload = () => (window.Peer ? ok() : fail(new Error('PeerJS did not load')));
      s.onerror = () => { s.remove(); fail(new Error('Could not load PeerJS from ' + url)); };
      document.head.appendChild(s);
    })), Promise.reject(new Error('start')));
    loading.catch(() => { loading = null; });
    return loading;
  }
  function peerOptions() {
    const o = { debug: 1 };
    const q = new URLSearchParams(location.search).get('peer');
    if (q) {
      const [host, port] = q.split(':');
      o.host = host; o.port = +port || 443; o.path = '/';
      o.secure = !/^(localhost|127\.|192\.168\.|10\.)/.test(host);
      o.key = 'peerjs';
    }
    return o;
  }
  const newCode = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  const cleanCode = c => String(c || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);

  // h: { message(from, msg), roster(list), status(text), closed(reason) }
  return function create(h) {
    let peer = null, isHost = false, me = -1, code = '', hostConn = null, closed = true;
    const conns = new Map(); // host only: slot -> DataConnection
    const seen = new Map(); // host only: slot -> last time we heard from it
    let hostSeen = 0;
    const TIMEOUT = 8000; // a closed tab can take a long while to drop its channel, so we also go by silence
    let roster = []; // [{ slot, name, info, ping }]
    let pingT = null;

    const status = t => h.status && h.status(t);
    const pushRoster = () => {
      roster.sort((a, b) => a.slot - b.slot);
      if (isHost) broadcast({ t: 'roster', list: roster });
      h.roster && h.roster(roster.slice());
    };
    function broadcast(msg, except) {
      for (const [slot, c] of conns) if (slot !== except && c.open) { try { c.send(msg); } catch (e) {} }
    }
    function deliver(msg) { try { h.message(msg.f, msg); } catch (e) { console.error('[net] handler', msg && msg.t, e); } }

    function shut(reason) {
      if (closed) return;
      closed = true;
      clearInterval(pingT); pingT = null;
      for (const c of conns.values()) { try { c.close(); } catch (e) {} }
      conns.clear();
      if (hostConn) { try { hostConn.close(); } catch (e) {} hostConn = null; }
      if (peer) { try { peer.destroy(); } catch (e) {} peer = null; }
      roster = []; me = -1; isHost = false; code = '';
      h.closed && h.closed(reason || '');
    }

    function startPeer(id) {
      return loadPeerJs().then(() => new Promise((ok, fail) => {
        const p = new window.Peer(id, peerOptions());
        let opened = false;
        p.on('open', () => { opened = true; ok(p); });
        p.on('error', err => {
          if (!opened) { try { p.destroy(); } catch (e) {} fail(err); return; }
          // after we're up, a failed connect to the host shows up here as peer-unavailable
          if (!isHost && err.type === 'peer-unavailable') shut('No room with that code. Check it and try again.');
          else if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') status('Lost the matchmaking server. Players already in the room stay connected.');
          else console.warn('[net]', err.type, err);
        });
        p.on('disconnected', () => { if (!closed && p && !p.destroyed) { try { p.reconnect(); } catch (e) {} } });
      }));
    }

    function host(name, info) {
      if (!closed) return Promise.resolve(code);
      closed = false; isHost = true; me = 0;
      const tryOpen = n => {
        code = newCode();
        status('Opening a room…');
        return startPeer(PREFIX + code).catch(err => {
          if (err && err.type === 'unavailable-id' && n < 4) return tryOpen(n + 1);
          throw err;
        });
      };
      return tryOpen(0).then(p => {
        if (closed) { p.destroy(); throw new Error('cancelled'); }
        peer = p;
        roster = [{ slot: 0, name, info, ping: 0 }];
        p.on('connection', c => {
          c.on('open', () => {
            if (closed || conns.size >= MAX - 1) { c.send({ t: 'full' }); setTimeout(() => c.close(), 300); return; }
            let slot = 1; while (conns.has(slot)) slot++;
            conns.set(slot, c); seen.set(slot, performance.now());
            const md = c.metadata || {};
            roster.push({ slot, name: String(md.name || 'Pilot ' + (slot + 1)).slice(0, 16), info: md.info || {}, ping: 0 });
            c.send({ t: 'welcome', slot, code });
            pushRoster();
            deliver({ t: 'join', f: slot });
          });
          c.on('data', m => {
            if (!m || typeof m !== 'object') return;
            const slot = [...conns].find(([, x]) => x === c);
            if (!slot) return;
            m.f = slot[0]; seen.set(m.f, performance.now());
            if (m.t === 'pong') { const r = roster.find(x => x.slot === m.f); if (r) { r.ping = Math.round(performance.now() - m.at); } return; }
            if (m.t === 'info') { const r = roster.find(x => x.slot === m.f); if (r) { r.info = m.info || {}; pushRoster(); } return; }
            // forward to the other guests unless it's addressed to the host alone
            if (m.to == null) broadcast(m, m.f);
            else if (m.to !== 0) { const t = conns.get(m.to); if (t && t.open) t.send(m); return; }
            deliver(m);
          });
          const gone = () => {
            const slot = [...conns].find(([, x]) => x === c);
            if (!slot) return;
            conns.delete(slot[0]); seen.delete(slot[0]);
            try { c.close(); } catch (e) {}
            roster = roster.filter(r => r.slot !== slot[0]);
            pushRoster();
            deliver({ t: 'leave', f: slot[0] });
          };
          c.skyGone = gone; c.on('close', gone); c.on('error', gone);
        });
        pingT = setInterval(() => {
          const now = performance.now();
          for (const [slot, c] of conns) if (now - (seen.get(slot) || now) > TIMEOUT) c.skyGone && c.skyGone();
          broadcast({ t: 'ping', at: now });
          if (roster.length > 1) pushRoster();
        }, 2000);
        status('');
        pushRoster();
        return code;
      }).catch(err => { shut(); throw friendly(err); });
    }

    function join(c0, name, info) {
      const c1 = cleanCode(c0);
      if (c1.length !== 4) return Promise.reject(new Error('Room codes are four letters.'));
      if (!closed) shut();
      closed = false; isHost = false; code = c1;
      status('Finding room ' + c1 + '…');
      return startPeer(undefined).then(p => new Promise((ok, fail) => {
        if (closed) { p.destroy(); fail(new Error('cancelled')); return; }
        peer = p;
        const conn = p.connect(PREFIX + c1, { reliable: true, serialization: 'json', metadata: { name, info } });
        hostConn = conn;
        let welcomed = false;
        const to = setTimeout(() => { if (!welcomed) { fail(new Error('The room did not answer. The host may be behind a strict firewall, or the code is wrong.')); shut(); } }, 15000);
        conn.on('data', m => {
          if (!m || typeof m !== 'object') return;
          hostSeen = performance.now();
          if (m.t === 'welcome') {
            welcomed = true; clearTimeout(to); me = m.slot; status(''); ok(c1);
            pingT = setInterval(() => { if (performance.now() - hostSeen > TIMEOUT) shut('Lost the connection to the host.'); }, 2000);
            return;
          }
          if (m.t === 'full') { clearTimeout(to); fail(new Error('That room is full (four pilots).')); shut(); return; }
          if (m.t === 'ping') { conn.send({ t: 'pong', at: m.at }); return; }
          if (m.t === 'roster') { roster = m.list; h.roster && h.roster(roster.slice()); return; }
          if (m.f == null) m.f = 0;
          deliver(m);
        });
        conn.on('close', () => { clearTimeout(to); if (!welcomed) fail(new Error('Could not reach that room.')); shut(welcomed ? 'The host closed the room.' : ''); });
        conn.on('error', () => {});
      })).catch(err => { shut(); throw friendly(err); });
    }

    function friendly(err) {
      const t = err && err.type;
      if (t === 'browser-incompatible') return new Error('This browser does not support WebRTC.');
      if (t === 'network' || t === 'server-error' || t === 'socket-error' || t === 'socket-closed') return new Error('Could not reach the matchmaking server (0.peerjs.com). Check your connection or firewall.');
      if (t === 'peer-unavailable') return new Error('No room with that code.');
      return err instanceof Error ? err : new Error(String(err));
    }

    function send(msg, to) {
      if (closed) return;
      msg.f = me;
      if (to != null) msg.to = to; else delete msg.to;
      if (isHost) {
        if (to == null) broadcast(msg);
        else { const c = conns.get(to); if (c && c.open) c.send(msg); }
      } else if (hostConn && hostConn.open) hostConn.send(msg);
    }
    function setInfo(info) {
      const r = roster.find(x => x.slot === me); if (r) r.info = info;
      if (isHost) pushRoster(); else send({ t: 'info', info }, 0);
    }

    return {
      host, join, send, setInfo, leave: () => shut(''),
      get active() { return !closed && me >= 0; },
      get connecting() { return !closed && me < 0; },
      get isHost() { return isHost && !closed; },
      get slot() { return me; },
      get code() { return code; },
      get roster() { return roster.slice(); },
      get count() { return Math.max(1, roster.length); },
    };
  };
})();
