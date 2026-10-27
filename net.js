
window.SkyNet = (function () {
  'use strict';

  const PEERJS_URLS = [
    'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js',
    'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'
  ];

  const PREFIX = 'skybreak-v1-';
  const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const MAX = 4;

  let loading = null;

  function loadPeerJs() {
    if (window.Peer) return Promise.resolve();
    if (loading) return loading;

    loading = PEERJS_URLS.reduce((p, url) =>
      p.catch(() => new Promise((ok, fail) => {
        const s = document.createElement('script');
        s.src = url;
        s.async = true;

        s.onload = () => window.Peer
          ? ok()
          : fail(new Error('PeerJS did not load'));

        s.onerror = () => {
          s.remove();
          fail(new Error('Could not load PeerJS from ' + url));
        };

        document.head.appendChild(s);
      })),
      Promise.reject(new Error('start'))
    );

    loading.catch(() => { loading = null; });
    return loading;
  }

  // Metered TURN/STUN servers.
  // Replace the placeholders with your Metered credentials.
  const ICE_SERVERS = [
    {
      urls: 'stun:stun.relay.metered.ca:80'
    },
    {
      urls: 'turn:standard.relay.metered.ca:80',
      username: 'c6ce3f47153847e4d67403d5',
      credential: 'XjxE+HzAWijpfmpH'
    },
    {
      urls: 'turn:standard.relay.metered.ca:80?transport=tcp',
      username: 'c6ce3f47153847e4d67403d5',
      credential: 'XjxE+HzAWijpfmpH'
    },
    {
      urls: 'turn:standard.relay.metered.ca:443',
      username: 'c6ce3f47153847e4d67403d5',
      credential: 'XjxE+HzAWijpfmpH'
    },
    {
      urls: 'turns:standard.relay.metered.ca:443?transport=tcp',
      username: 'c6ce3f47153847e4d67403d5',
      credential: 'XjxE+HzAWijpfmpH'
    }
  ];

  function peerOptions() {
    const options = {
      debug: 2,
      config: {
        iceServers: ICE_SERVERS,
        iceTransportPolicy: 'all'
      }
    };

    const custom = new URLSearchParams(location.search).get('peer');

    if (custom) {
      const [host, port] = custom.split(':');

      options.host = host;
      options.port = Number(port) || 443;
      options.path = '/';
      options.secure = !/^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(host);
      options.key = 'peerjs';
    }

    return options;
  }

  const newCode = () =>
    Array.from(
      { length: 4 },
      () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
    ).join('');

  const cleanCode = c =>
    String(c || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);

  return function create(h) {
    let peer = null;
    let isHost = false;
    let me = -1;
    let code = '';
    let hostConn = null;
    let closed = true;

    const conns = new Map();
    const seen = new Map();

    let hostSeen = 0;
    const TIMEOUT = 15000;
    let roster = [];
    let pingT = null;

    const status = t => h.status && h.status(t);

    const pushRoster = () => {
      roster.sort((a, b) => a.slot - b.slot);

      if (isHost) {
        broadcast({ t: 'roster', list: roster });
      }

      if (h.roster) h.roster(roster.slice());
    };

    function broadcast(msg, except) {
      for (const [slot, c] of conns) {
        if (slot !== except && c.open) {
          try {
            c.send(msg);
          } catch (e) {
            console.warn('[net] Broadcast failed:', e);
          }
        }
      }
    }

    function deliver(msg) {
      try {
        h.message(msg.f, msg);
      } catch (e) {
        console.error('[net] Message handler failed:', e);
      }
    }

    function shut(reason) {
      if (closed) return;

      closed = true;
      clearInterval(pingT);
      pingT = null;

      for (const c of conns.values()) {
        try { c.close(); } catch (e) {}
      }

      conns.clear();
      seen.clear();

      if (hostConn) {
        try { hostConn.close(); } catch (e) {}
        hostConn = null;
      }

      if (peer) {
        try { peer.destroy(); } catch (e) {}
        peer = null;
      }

      roster = [];
      me = -1;
      isHost = false;
      code = '';

      if (h.closed) h.closed(reason || '');
    }

    function startPeer(id) {
      return loadPeerJs().then(() => new Promise((resolve, reject) => {
        const p = new window.Peer(id, peerOptions());
        let opened = false;

        p.on('open', () => {
          opened = true;
          resolve(p);
        });

        p.on('error', err => {
          console.error('[net] PeerJS error:', err.type, err);

          if (!opened) {
            try { p.destroy(); } catch (e) {}
            reject(err);
            return;
          }

          if (!isHost && err.type === 'peer-unavailable') {
            shut('No room with that code. Check it and try again.');
          } else if (
            ['network', 'server-error', 'socket-error', 'socket-closed']
              .includes(err.type)
          ) {
            status('Matchmaking connection interrupted. Reconnecting…');
          }
        });

        p.on('disconnected', () => {
          setTimeout(() => {
            if (!closed && !p.destroyed && p.disconnected) {
              try {
                p.reconnect();
              } catch (e) {
                console.warn('[net] Reconnect failed:', e);
              }
            }
          }, 3000);
        });
      }));
    }

    function host(name, info) {
      if (!closed) return Promise.resolve(code);

      closed = false;
      isHost = true;
      me = 0;

      const tryOpen = n => {
        code = newCode();
        status('Opening a room…');

        return startPeer(PREFIX + code).catch(err => {
          if (err && err.type === 'unavailable-id' && n < 4) {
            return tryOpen(n + 1);
          }
          throw err;
        });
      };

      return tryOpen(0).then(p => {
        if (closed) {
          p.destroy();
          throw new Error('Room creation cancelled.');
        }

        peer = p;
        roster = [{ slot: 0, name, info, ping: 0 }];

        p.on('connection', c => {
          let slot = null;
          let accepted = false;

          c.on('open', () => {
            if (closed || conns.size >= MAX - 1) {
              try { c.send({ t: 'full' }); } catch (e) {}
              setTimeout(() => c.close(), 300);
              return;
            }

            slot = 1;
            while (conns.has(slot)) slot++;

            conns.set(slot, c);
            seen.set(slot, performance.now());
            accepted = true;

            const md = c.metadata || {};

            roster.push({
              slot,
              name: String(md.name || 'Pilot ' + (slot + 1)).slice(0, 16),
              info: md.info || {},
              ping: 0
            });

            c.send({ t: 'welcome', slot, code });
            pushRoster();
            deliver({ t: 'join', f: slot });
          });

          c.on('data', m => {
            if (!m || typeof m !== 'object' || !accepted) return;

            m.f = slot;
            seen.set(slot, performance.now());

            if (m.t === 'pong') {
              const r = roster.find(x => x.slot === slot);
              if (r) r.ping = Math.round(performance.now() - m.at);
              return;
            }

            if (m.t === 'info') {
              const r = roster.find(x => x.slot === slot);
              if (r) {
                r.info = m.info || {};
                pushRoster();
              }
              return;
            }

            if (m.to == null) {
              broadcast(m, slot);
            } else if (m.to !== 0) {
              const target = conns.get(m.to);
              if (target && target.open) target.send(m);
              return;
            }

            deliver(m);
          });

          const gone = () => {
            if (!accepted || !conns.has(slot)) return;

            accepted = false;
            conns.delete(slot);
            seen.delete(slot);

            try { c.close(); } catch (e) {}

            roster = roster.filter(r => r.slot !== slot);
            pushRoster();
            deliver({ t: 'leave', f: slot });
          };

          c.on('close', gone);
          c.on('error', err => {
            console.error('[net] Guest connection error:', err);
            gone();
          });
        });

        pingT = setInterval(() => {
          const now = performance.now();

          for (const [slot, c] of conns) {
            if (now - (seen.get(slot) || now) > TIMEOUT) {
              if (c.open) {
                try { c.send({ t: 'ping', at: now }); } catch (e) {}
              } else {
                conns.delete(slot);
                seen.delete(slot);
              }
            }
          }

          broadcast({ t: 'ping', at: now });

          if (roster.length > 1) pushRoster();
        }, 3000);

        status('');
        pushRoster();
        return code;
      }).catch(err => {
        shut();
        throw friendly(err);
      });
    }

    function join(c0, name, info) {
      const c1 = cleanCode(c0);

      if (c1.length !== 4) {
        return Promise.reject(new Error('Room codes are four letters.'));
      }

      if (!closed) shut();

      closed = false;
      isHost = false;
      code = c1;

      status('Finding room ' + c1 + '…');

      return startPeer(undefined).then(p => new Promise((resolve, reject) => {
        if (closed) {
          p.destroy();
          reject(new Error('Connection cancelled.'));
          return;
        }

        peer = p;

        const conn = p.connect(PREFIX + c1, {
          reliable: true,
          serialization: 'json',
          metadata: { name, info }
        });

        hostConn = conn;

        let welcomed = false;

        const timeout = setTimeout(() => {
          if (!welcomed) {
            reject(new Error(
              'The room did not answer. Check the room code, host connection, and TURN configuration.'
            ));
            shut();
          }
        }, 25000);

        conn.on('open', () => {
          status('Connected to matchmaking. Waiting for host…');
        });

        conn.on('data', m => {
          if (!m || typeof m !== 'object') return;

          hostSeen = performance.now();

          if (m.t === 'welcome') {
            welcomed = true;
            clearTimeout(timeout);
            me = m.slot;
            status('');
            resolve(c1);

            pingT = setInterval(() => {
              if (performance.now() - hostSeen > TIMEOUT) {
                shut('Lost the connection to the host.');
              }
            }, 3000);

            return;
          }

          if (m.t === 'full') {
            clearTimeout(timeout);
            reject(new Error('That room is full (four pilots).'));
            shut();
            return;
          }

          if (m.t === 'ping') {
            try { conn.send({ t: 'pong', at: m.at }); } catch (e) {}
            return;
          }

          if (m.t === 'roster') {
            roster = m.list || [];
            if (h.roster) h.roster(roster.slice());
            return;
          }

          if (m.f == null) m.f = 0;
          deliver(m);
        });

        conn.on('close', () => {
          clearTimeout(timeout);

          if (!welcomed) {
            reject(new Error('Could not reach that room.'));
          }

          shut(welcomed ? 'The host closed the room.' : '');
        });

        conn.on('error', err => {
          console.error('[net] Guest data connection error:', err);
        });
      })).catch(err => {
        shut();
        throw friendly(err);
      });
    }

    function friendly(err) {
      const t = err && err.type;

      if (t === 'browser-incompatible') {
        return new Error('This browser does not support WebRTC.');
      }

      if (
        ['network', 'server-error', 'socket-error', 'socket-closed']
          .includes(t)
      ) {
        return new Error(
          'Could not reach the PeerJS matchmaking server. Check your connection or firewall.'
        );
      }

      if (t === 'peer-unavailable') {
        return new Error('No room with that code. Check it and try again.');
      }

      return err instanceof Error ? err : new Error(String(err));
    }

    function send(msg, to) {
      if (closed) return;

      msg.f = me;

      if (to != null) msg.to = to;
      else delete msg.to;

      if (isHost) {
        if (to == null) {
          broadcast(msg);
        } else {
          const c = conns.get(to);
          if (c && c.open) c.send(msg);
        }
      } else if (hostConn && hostConn.open) {
        hostConn.send(msg);
      }
    }

    function setInfo(info) {
      const r = roster.find(x => x.slot === me);
      if (r) r.info = info;

      if (isHost) pushRoster();
      else send({ t: 'info', info }, 0);
    }

    return {
      host,
      join,
      send,
      setInfo,
      leave: () => shut(''),

      get active() {
        return !closed && me >= 0;
      },

      get connecting() {
        return !closed && me < 0;
      },

      get isHost() {
        return isHost && !closed;
      },

      get slot() {
        return me;
      },

      get code() {
        return code;
      },

      get roster() {
        return roster.slice();
      },

      get count() {
        return Math.max(1, roster.length);
      }
    };
  };
})();
