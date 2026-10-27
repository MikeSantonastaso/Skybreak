// Skybreak asset library: procedural textures, paint schemes, materials and every aircraft model.
// It is loaded before the game script. Call SkyAssets(THREE) once to build it, then
// setEnvMap() when the sky is ready so the paint picks up reflections.
window.SkyAssets = function (THREE) {
  'use strict';
  const TILE = 8; // metres of airframe covered by one paint texture tile
  const SIZE = 512;
  let envMap = null;

  // ---------- helpers ----------
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; }
  const hashStr = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const css = n => '#' + new THREE.Color(n).getHexString();
  const shade = (n, k) => '#' + new THREE.Color(n).multiplyScalar(k).getHexString();
  function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }
  // draw something nine times so it wraps cleanly across the tile edges
  function wrapped(fn) { for (const dx of [-SIZE, 0, SIZE]) for (const dy of [-SIZE, 0, SIZE]) fn(dx, dy); }
  function tex(c, repeat) {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
    if (repeat) t.repeat.set(repeat, repeat);
    return t;
  }

  // ---------- paint patterns ----------
  const PATTERNS = {
    solid(g, c, r) {
      g.fillStyle = css(c[0]); g.fillRect(0, 0, SIZE, SIZE);
      for (let i = 0; i < 30; i++) { const x = r() * SIZE, y = r() * SIZE, rad = 30 + r() * 90; wrapped((dx, dy) => { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)'; g.beginPath(); g.ellipse(x + dx, y + dy, rad, rad * 0.6, r() * 3, 0, Math.PI * 2); g.fill(); }); }
    },
    twotone(g, c, r) {
      PATTERNS.solid(g, c, r);
      for (let i = 0; i < 7; i++) {
        const x = r() * SIZE, y = r() * SIZE, rx = 60 + r() * 120, ry = 40 + r() * 80, a = r() * 3;
        wrapped((dx, dy) => { g.fillStyle = css(c[1]); g.beginPath(); g.ellipse(x + dx, y + dy, rx, ry, a, 0, Math.PI * 2); g.fill(); });
      }
    },
    blotch(g, c, r) {
      g.fillStyle = css(c[0]); g.fillRect(0, 0, SIZE, SIZE);
      for (const [col, n] of [[c[1], 16], [c[2], 10]]) for (let i = 0; i < n; i++) {
        const x = r() * SIZE, y = r() * SIZE, pts = [];
        for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, rad = 30 + r() * 55; pts.push([Math.cos(a) * rad * 1.5, Math.sin(a) * rad]); }
        wrapped((dx, dy) => { g.fillStyle = css(col); g.beginPath(); pts.forEach(([px, py], k) => k ? g.lineTo(x + dx + px, y + dy + py) : g.moveTo(x + dx + px, y + dy + py)); g.closePath(); g.fill(); });
      }
    },
    splinter(g, c, r) {
      g.fillStyle = css(c[0]); g.fillRect(0, 0, SIZE, SIZE);
      for (const [col, n] of [[c[1], 14], [c[2], 9]]) for (let i = 0; i < n; i++) {
        const x = r() * SIZE, y = r() * SIZE, pts = [];
        const k = 3 + Math.floor(r() * 3);
        for (let j = 0; j < k; j++) pts.push([(r() - 0.5) * 220, (r() - 0.5) * 120]);
        wrapped((dx, dy) => { g.fillStyle = css(col); g.beginPath(); pts.forEach(([px, py], j) => j ? g.lineTo(x + dx + px, y + dy + py) : g.moveTo(x + dx + px, y + dy + py)); g.closePath(); g.fill(); });
      }
    },
    digital(g, c, r) {
      g.fillStyle = css(c[0]); g.fillRect(0, 0, SIZE, SIZE);
      const cell = 16, n = SIZE / cell;
      // blobby clusters from a few seeds, drawn on a pixel grid
      for (const [col, seeds, rad] of [[c[1], 22, 3.2], [c[2], 14, 2.4]]) {
        const pts = Array.from({ length: seeds }, () => [r() * n, r() * n]);
        g.fillStyle = css(col);
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          for (const [px, py] of pts) {
            let ddx = Math.abs(i - px), ddy = Math.abs(j - py); ddx = Math.min(ddx, n - ddx); ddy = Math.min(ddy, n - ddy);
            if (ddx * ddx + ddy * ddy * 2 < rad * rad * (0.6 + r() * 0.8)) { g.fillRect(i * cell, j * cell, cell, cell); break; }
          }
        }
      }
    },
    stripes(g, c, r) {
      g.fillStyle = css(c[0]); g.fillRect(0, 0, SIZE, SIZE);
      g.fillStyle = css(c[1]);
      for (let i = 0; i < 9; i++) {
        const y0 = i * SIZE / 9 + r() * 20, w = 14 + r() * 22;
        wrapped((dx, dy) => {
          g.beginPath(); g.moveTo(dx, y0 + dy);
          for (let x = 0; x <= SIZE; x += 32) g.lineTo(x + dx, y0 + dy + Math.sin(x * 0.02 + i) * 18);
          for (let x = SIZE; x >= 0; x -= 32) g.lineTo(x + dx, y0 + dy + w * (0.4 + 0.6 * Math.abs(Math.sin(x * 0.013 + i * 2))) + Math.sin(x * 0.02 + i) * 18);
          g.closePath(); g.fill();
        });
      }
    },
    metal(g, c, r) {
      g.fillStyle = css(c[0]); g.fillRect(0, 0, SIZE, SIZE);
      for (let y = 0; y < SIZE; y += 64) for (let x = 0; x < SIZE; x += 96) {
        const k = 0.88 + r() * 0.2; g.fillStyle = shade(c[0], k); g.fillRect(x, y, 96, 64);
        const gr = g.createLinearGradient(x, y, x + 96, y); gr.addColorStop(0, 'rgba(255,255,255,0.08)'); gr.addColorStop(1, 'rgba(0,0,0,0.06)'); g.fillStyle = gr; g.fillRect(x, y, 96, 64);
      }
    },
  };
  function panelLines(g, r, strength) {
    g.lineWidth = 1.4;
    let y = 0;
    while (y < SIZE) {
      const h = 50 + Math.floor(r() * 70);
      g.strokeStyle = `rgba(0,0,0,${0.32 * strength})`; g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(SIZE, y + 0.5); g.stroke();
      let x = Math.floor(r() * 60);
      while (x < SIZE) { g.beginPath(); g.moveTo(x + 0.5, y); g.lineTo(x + 0.5, Math.min(y + h, SIZE)); g.stroke(); x += 60 + Math.floor(r() * 110); }
      // rivet rows
      g.fillStyle = `rgba(0,0,0,${0.16 * strength})`;
      if (r() < 0.5) for (let rx = 4; rx < SIZE; rx += 7) g.fillRect(rx, y + 4, 1.5, 1.5);
      // access panels
      if (r() < 0.6) { const px = r() * (SIZE - 50), pw = 18 + r() * 34, ph = 12 + r() * 22; g.strokeRect(px + 0.5, y + 10.5, pw, ph); }
      y += h;
    }
    // light grime and wear
    for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${0.05 * strength})` : `rgba(255,255,255,${0.035 * strength})`; g.fillRect(r() * SIZE, r() * SIZE, 1 + r() * 3, 1 + r() * 2); }
  }
  // returns a canvas for a paint scheme: pattern, then panel lines and grime on top
  function paintCanvas(p) {
    const c = makeCanvas(SIZE), g = c.getContext('2d'), r = rng(hashStr(p.pattern + p.c.join(',')));
    (PATTERNS[p.pattern] || PATTERNS.solid)(g, p.c, r);
    panelLines(g, r, p.lines == null ? 1 : p.lines);
    return c;
  }

  // ---------- skins ----------
  // c = [base, second, third]; accent paints fin tips and stripes. unlock: price in credits, or a feat.
  const SKINS = [
    { id: 'factory', name: 'Factory paint', desc: 'The jet’s standard scheme.', pattern: 'twotone', price: 0 },
    { id: 'ghost', name: 'Ghost grey', desc: 'Low-visibility greys with faint markings.', pattern: 'twotone', c: [0x8d959c, 0x7b838a, 0x6d747a], accent: 0x5d646a, price: 600 },
    { id: 'desert', name: 'Desert splinter', desc: 'Sand and brown splinter camouflage.', pattern: 'splinter', c: [0xc9ad7f, 0x8f6a43, 0x6b5a3c], accent: 0x6b4a2a, price: 900 },
    { id: 'arctic', name: 'Arctic blotch', desc: 'Winter whites. Earned by downing the Bear bomber.', pattern: 'blotch', c: [0xe7ecef, 0xa9b4bb, 0x6f7a82], accent: 0xc8102e, unlock: { kind: 'boss', loc: 'arctic' } },
    { id: 'pacific', name: 'Pacific blue', desc: 'Ocean blues. Earned by downing the Mainstay.', pattern: 'blotch', c: [0x6f8fae, 0x46607e, 0x9db3c7], accent: 0xf0c419, unlock: { kind: 'boss', loc: 'ocean' } },
    { id: 'midnight', name: 'Black ops', desc: 'Matte black with blood-red trim.', pattern: 'solid', c: [0x1d2023, 0x15171a, 0x2a2e33], accent: 0xb3121e, rough: 0.8, price: 2000 },
    { id: 'urban', name: 'Urban digital', desc: 'Pixel camo. Earned by downing the Blackjack.', pattern: 'digital', c: [0x9aa0a6, 0x5f666d, 0x2f3439], accent: 0xff7a1a, unlock: { kind: 'boss', loc: 'city' } },
    { id: 'tiger', name: 'Tiger meet', desc: 'Orange and black stripes for the squadron show.', pattern: 'stripes', c: [0xe8862a, 0x1a1a1a, 0x1a1a1a], accent: 0x1a1a1a, price: 3000 },
    { id: 'sunset', name: 'Canyon sunset', desc: 'Red rock splinter. Earned by downing the drone mothership.', pattern: 'splinter', c: [0xc8693a, 0x7e2f1a, 0xe2b07a], accent: 0x2b1810, unlock: { kind: 'boss', loc: 'canyon' } },
    { id: 'bare', name: 'Bare metal', desc: 'Polished aluminium. Earned with 250 kills.', pattern: 'metal', c: [0xc4c8cc, 0xa9adb1, 0xd7dadd], accent: 0x1f3a93, metal: 0.85, rough: 0.28, unlock: { kind: 'kills', n: 250 } },
    { id: 'ace', name: 'Red baron', desc: 'Crimson ace scheme. Earned with 750 kills.', pattern: 'twotone', c: [0xa3161f, 0x7d1018, 0x1a1a1a], accent: 0x111111, unlock: { kind: 'kills', n: 750 } },
    { id: 'gold', name: 'Gold standard', desc: 'Mirror gold. Earned by downing any boss at heat 5.', pattern: 'metal', c: [0xd4a83a, 0xb88d2a, 0xe8c45a], accent: 0x1a1a1a, metal: 0.95, rough: 0.22, lines: 0.5, unlock: { kind: 'heat', lvl: 5 } },
  ];
  const SKIN_BY_ID = Object.fromEntries(SKINS.map(s => [s.id, s]));
  // enemy factions get their own paint per airframe
  const ENEMY_PAINT = {
    mig21: { pattern: 'metal', c: [0xa9ada6, 0x969a92, 0xb7bbb4], accent: 0xb3261e, metal: 0.6, rough: 0.4 },
    mig29: { pattern: 'splinter', c: [0xc2ad84, 0x8a6b45, 0x6e7458], accent: 0x6b4a2a },
    su27: { pattern: 'blotch', c: [0x9fb5c8, 0x6d8aa6, 0xc2d0db], accent: 0x3f5f80 },
    su35: { pattern: 'digital', c: [0x6f8292, 0x4c5d6b, 0x36434e], accent: 0x2b3a44 },
    su57: { pattern: 'digital', c: [0x7d8a93, 0x5c6870, 0xa3adb3], accent: 0x9fb6c4 },
    ace: { pattern: 'stripes', c: [0x2a2d31, 0xa3161f, 0xa3161f], accent: 0xc8102e, repaint: true },
    // enemy variants: each reads at a glance, whatever airframe it flies
    fast: { pattern: 'twotone', c: [0xd9dde0, 0xb9c1c8, 0xd9dde0], accent: 0xf2c230, repaint: true },
    heavy: { pattern: 'blotch', c: [0x5a6340, 0x3f4630, 0x6f7650], accent: 0x23261a, rough: 0.85, repaint: true },
    ghost: { pattern: 'solid', c: [0x1b1e22, 0x16181b, 0x22262b], accent: 0x2b3036, rough: 0.95, repaint: true },
    hunter: { pattern: 'splinter', c: [0x8f8676, 0x5e5649, 0xb3a88f], accent: 0xff6a1a, repaint: true },
  };
  // the paint a skin resolves to on a given plane (factory paint uses the plane's own colours)
  function resolvePaint(skin, livery) {
    const s = typeof skin === 'string' ? SKIN_BY_ID[skin] || SKINS[0] : skin;
    if (s.id === 'factory') return { pattern: 'twotone', c: [livery[0], new THREE.Color(livery[0]).multiplyScalar(0.9).getHex(), livery[0]], accent: livery[1] };
    return s;
  }

  // ---------- materials ----------
  const matCache = {};
  const textureCache = {};
  function paintTexture(p) {
    const key = p.pattern + p.c.join(',') + (p.lines == null ? '' : p.lines);
    return textureCache[key] || (textureCache[key] = tex(paintCanvas(p)));
  }
  function std(o) { const m = new THREE.MeshStandardMaterial(o); if (envMap) m.envMap = envMap; allStd.push(m); return m; }
  const allStd = [];
  function materialsFor(p) {
    const key = p.pattern + p.c.join(',') + p.accent + (p.metal || 0);
    if (matCache[key]) return matCache[key];
    const map = paintTexture(p);
    const metal = p.metal == null ? 0.35 : p.metal, rough = p.rough == null ? 0.55 : p.rough;
    const m = {
      body: std({ map, metalness: metal, roughness: rough }),
      wing: std({ map, color: 0xeeeeee, metalness: metal, roughness: rough + 0.05 }),
      trim: std({ color: p.accent, metalness: Math.min(metal, 0.5), roughness: 0.5 }),
      radome: std({ color: 0x3a3e42, metalness: 0.2, roughness: 0.65 }),
      dark: std({ color: 0x2a2d30, metalness: 0.4, roughness: 0.6 }),
      metal: std({ color: 0x5a5e62, metalness: 0.9, roughness: 0.35 }),
      inlet: new THREE.MeshBasicMaterial({ color: 0x0b0c0d }),
      msl: std({ color: 0xe8e8e2, metalness: 0.3, roughness: 0.45 }),
    };
    return (matCache[key] = m);
  }
  const glassCache = {};
  function glassMat(tint) {
    const k = tint || 0x26323c;
    return glassCache[k] || (glassCache[k] = std({ color: k, metalness: 0.9, roughness: 0.06, transparent: true, opacity: 0.86 }));
  }
  function setEnvMap(t) { envMap = t; for (const m of allStd) { m.envMap = t; m.envMapIntensity = 1.0; m.needsUpdate = true; } }

  // ---------- geometry helpers ----------
  function cyl(front, rear, len, seg) { const g = new THREE.CylinderGeometry(front, rear, len, seg || 10); g.rotateX(-Math.PI / 2); return g; }
  function scaleUV(g, su, sv) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return g; }
  // profile is [[z, radius], ...] from nose to tail; UVs are rescaled to metres so paint keeps one scale
  function latheGeo(profile, seg, sx, sy) {
    const pts = profile.slice().reverse().map(([z, r]) => new THREE.Vector2(Math.max(r, 0.001), -z));
    const g = new THREE.LatheGeometry(pts, seg || 16);
    const rmax = Math.max(...profile.map(p => p[1])), len = Math.abs(profile[profile.length - 1][0] - profile[0][0]);
    scaleUV(g, 2 * Math.PI * rmax * Math.max(sx || 1, sy || 1) / TILE, len / TILE);
    g.rotateX(-Math.PI / 2);
    g.rotateZ(Math.PI / (seg || 16));
    g.scale(sx || 1, sy || 1, 1);
    return g;
  }
  // a flat planform from [[x, z], ...] on the right side; mirror flips it to the left
  function planGeo(poly, thick, mirror) {
    const pts = mirror ? poly.map(([x, z]) => [-x, z]).reverse() : poly;
    const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    const g = new THREE.ExtrudeGeometry(s, { depth: thick * 0.5, bevelEnabled: true, bevelThickness: thick * 0.25, bevelSize: Math.min(0.06, thick * 0.4), bevelSegments: 1 });
    scaleUV(g, 1 / TILE, 1 / TILE);
    g.rotateX(Math.PI / 2); g.translate(0, thick * 0.25, 0);
    return g;
  }
  // a vertical surface from [[z, y], ...]
  function finGeo(poly, thick) {
    const s = new THREE.Shape(); s.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) s.lineTo(poly[i][0], poly[i][1]);
    const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false });
    scaleUV(g, 1 / TILE, 1 / TILE);
    g.rotateY(-Math.PI / 2); g.translate(thick / 2, 0, 0);
    return g;
  }
  // keep the part of a [[z, y]] polygon above (or below) a height, for coloured fin caps
  function clipY(poly, y0, above) {
    const out = [], inside = p => above ? p[1] >= y0 : p[1] <= y0;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      if (inside(a)) out.push(a);
      if (inside(a) !== inside(b)) { const t = (y0 - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * t, y0]); }
    }
    return out;
  }

  // ---------- jets: built to scale in metres, nose toward -Z ----------
  const JETS = {
    f5: { fus: [[-7.4, 0], [-6.6, 0.22], [-5.4, 0.45], [-4.2, 0.62], [-3, 0.74], [-1, 0.82], [3, 0.82], [5.6, 0.72], [6.9, 0.62]], fusS: [1.2, 0.9], radome: 2,
      intakes: [{ x: 0.95, y: 0, z: -1.6, w: 0.5, h: 0.75, d: 2.6 }],
      wing: { poly: [[0.6, -1.2], [4.1, 1.5], [4.1, 2.3], [0.6, 3.0]], y: -0.25, thick: 0.18 },
      lex: { poly: [[0.55, -4.0], [1.05, -1.2], [0.55, -1.2]], y: -0.1, thick: 0.1 },
      stab: { poly: [[0.6, 4.7], [2.7, 6.3], [2.7, 6.9], [0.6, 7.0]], y: 0, thick: 0.12, dihedral: 0 },
      fins: [{ x: 0, y: 0.55, poly: [[3.3, 0], [5.6, 2.6], [6.5, 2.6], [6.9, 0]], thick: 0.14 }],
      canopy: { z: -3.6, y: 0.62, sx: 0.48, sy: 0.46, sz: 1.5 }, nozzles: [{ x: 0.38, y: 0, z: 6.9, r: 0.34, len: 0.5 }],
      tip: [4.1, -0.25, 2], missiles: [[4.2, -0.15, 1.6]] },
    f16: { fus: [[-7.6, 0], [-6.8, 0.3], [-5.6, 0.58], [-4.2, 0.78], [-2, 0.88], [2, 0.88], [5.2, 0.8], [6.8, 0.62], [7.4, 0.56]], fusS: [1.05, 1], radome: 3,
      intakes: [{ x: 0, y: -0.95, z: -1.2, w: 1.15, h: 0.78, d: 3.4 }],
      wing: { poly: [[0.8, -1.4], [4.7, 2.3], [4.7, 3.1], [0.8, 4.0]], y: -0.1, thick: 0.2 },
      lex: { poly: [[0.6, -4.6], [0.95, -4.6], [1.4, -1.4], [0.6, -1.4]], y: -0.05, thick: 0.12 },
      stab: { poly: [[0.7, 4.6], [3.0, 6.6], [3.0, 7.3], [0.7, 7.5]], y: -0.1, thick: 0.12, dihedral: -0.18 },
      fins: [{ x: 0, y: 0.7, poly: [[3.0, 0], [5.6, 3.6], [6.6, 3.6], [6.9, 0]], thick: 0.15 }],
      canopy: { z: -4.2, y: 0.78, sx: 0.55, sy: 0.55, sz: 1.8, tint: 0x8a6a2a }, nozzles: [{ x: 0, y: 0, z: 7.4, r: 0.55, len: 0.7 }],
      tip: [4.8, -0.1, 2.7], missiles: [[4.8, -0.1, 2.2], [3.4, -0.35, 1.4]] },
    f14: { fus: [[-9.6, 0], [-8.6, 0.38], [-7.2, 0.72], [-5.6, 0.95], [-3.5, 1.0], [-1, 0.9], [3, 0.6], [7, 0.45], [9.2, 0.3]], fusS: [1.05, 1], radome: 2,
      nacelles: [{ x: 1.75, y: -0.15, z0: -3.6, z1: 8.4, r: 0.78, sx: 1.05, sy: 1 }],
      intakes: [{ x: 1.75, y: -0.05, z: -3.4, w: 1.25, h: 1.1, d: 1.6 }],
      lex: { poly: [[0.6, -6.5], [2.9, -1.4], [3.0, 1.8], [0.6, 2.2]], y: 0.15, thick: 0.4 },
      swing: { pivot: [2.8, 0.1, -0.2], poly: [[0, -0.9], [7.6, 0.4], [7.6, 1.4], [0, 2.6]], thick: 0.2, fwd: 0.35, back: 1.15 },
      stab: { poly: [[1.6, 5.0], [4.6, 7.6], [4.6, 8.5], [1.8, 9.0]], y: 0, thick: 0.14, dihedral: 0 },
      fins: [{ x: 1.9, y: 0.55, poly: [[3.8, 0], [6.6, 3.2], [7.6, 3.2], [8.2, 0]], thick: 0.16, cant: 0.1 }],
      canopy: { z: -5.9, y: 0.95, sx: 0.55, sy: 0.5, sz: 2.4 }, nozzles: [{ x: 1.75, y: -0.15, z: 8.5, r: 0.62, len: 0.6 }],
      tip: [6.5, 0.1, 3], missiles: [[0.7, -0.75, -2], [0.7, -0.75, 2.5], [3.1, -0.4, 0.5]] },
    f18: { fus: [[-9.0, 0], [-8.2, 0.34], [-6.8, 0.66], [-5.2, 0.86], [-3, 0.95], [1, 0.95], [5, 0.85], [8.2, 0.7], [8.9, 0.62]], fusS: [1.25, 0.95], radome: 2,
      intakes: [{ x: 1.05, y: -0.45, z: -2.2, w: 0.75, h: 0.85, d: 2.8 }],
      wing: { poly: [[1.1, -1.4], [6.8, 1.6], [6.8, 2.7], [1.1, 4.2]], y: -0.05, thick: 0.22 },
      lex: { poly: [[0.7, -6.6], [1.25, -4.5], [1.7, -1.4], [0.7, -1.4]], y: 0.1, thick: 0.14 },
      stab: { poly: [[0.9, 5.6], [3.5, 7.6], [3.5, 8.4], [0.9, 8.9]], y: -0.1, thick: 0.13, dihedral: -0.04 },
      fins: [{ x: 1.15, y: 0.5, poly: [[2.8, 0], [5.4, 3.1], [6.4, 3.1], [7.0, 0]], thick: 0.15, cant: 0.36 }],
      canopy: { z: -5.6, y: 0.82, sx: 0.55, sy: 0.52, sz: 2.0 }, nozzles: [{ x: 0.58, y: 0, z: 8.9, r: 0.48, len: 0.6 }],
      tip: [6.9, -0.05, 2.2], missiles: [[6.9, -0.05, 2.0], [4.6, -0.35, 1.2], [2.8, -0.45, 0.5]] },
    f35: { fus: [[-7.9, 0], [-7.1, 0.38], [-5.8, 0.72], [-4.2, 0.95], [-2, 1.05], [2.5, 1.05], [5.6, 0.9], [7.4, 0.7], [7.9, 0.65]], fusS: [1.45, 0.9], seg: 8, radome: 2,
      intakes: [{ x: 1.3, y: 0, z: -2.7, w: 0.75, h: 1.0, d: 2.4 }],
      wing: { poly: [[1.3, -1.0], [6.5, 2.4], [6.5, 3.4], [1.3, 4.8]], y: -0.05, thick: 0.24 },
      stab: { poly: [[1.0, 5.2], [3.5, 6.9], [3.5, 7.6], [1.0, 8.0]], y: -0.05, thick: 0.13, dihedral: 0 },
      fins: [{ x: 1.35, y: 0.55, poly: [[3.3, 0], [5.4, 2.5], [6.4, 2.5], [6.9, 0]], thick: 0.15, cant: 0.42 }],
      canopy: { z: -4.3, y: 0.85, sx: 0.6, sy: 0.55, sz: 1.9, tint: 0x8a6a2a }, nozzles: [{ x: 0, y: 0, z: 7.9, r: 0.66, len: 0.7 }],
      tip: [6.5, -0.05, 3], missiles: [] },
    mig21: { fus: [[-7.3, 0.42], [-6.2, 0.55], [-4, 0.7], [-1, 0.75], [3, 0.72], [6.4, 0.6], [7.2, 0.55]], fusS: [1, 1], cone: { z: -7.3, r: 0.3, len: 1.1 },
      wing: { poly: [[0.5, -1.4], [3.6, 3.4], [3.6, 3.8], [0.5, 3.9]], y: -0.1, thick: 0.15 },
      stab: { poly: [[0.5, 4.9], [2.3, 6.3], [2.3, 6.7], [0.5, 6.9]], y: 0, thick: 0.1, dihedral: 0 },
      fins: [{ x: 0, y: 0.6, poly: [[2.2, 0], [5.6, 2.7], [6.4, 2.7], [6.9, 0]], thick: 0.14 }],
      canopy: { z: -3.6, y: 0.6, sx: 0.42, sy: 0.4, sz: 1.3 }, nozzles: [{ x: 0, y: 0, z: 7.2, r: 0.5, len: 0.5 }],
      tip: [3.6, -0.1, 3.6], missiles: [[2.4, -0.3, 1.8]] },
    mig29: { fus: [[-8.6, 0], [-7.8, 0.32], [-6.4, 0.6], [-4.4, 0.78], [-2, 0.72], [2, 0.55], [6, 0.35], [8.2, 0.25]], fusS: [1.1, 1], radome: 2,
      nacelles: [{ x: 1.15, y: -0.45, z0: -2.6, z1: 7.6, r: 0.62, sx: 1, sy: 1 }],
      intakes: [{ x: 1.15, y: -0.55, z: -2.6, w: 0.95, h: 0.8, d: 1.4 }],
      lex: { poly: [[0.6, -6.4], [1.9, -1.0], [1.9, 2.5], [0.6, 3]], y: 0.05, thick: 0.25 },
      wing: { poly: [[1.7, -0.9], [5.7, 2.4], [5.7, 3.2], [1.7, 4.6]], y: 0, thick: 0.2 },
      stab: { poly: [[1.6, 5.6], [4.0, 7.4], [4.0, 8.0], [1.6, 8.3]], y: -0.1, thick: 0.13, dihedral: 0 },
      fins: [{ x: 1.4, y: 0.3, poly: [[3.6, 0], [6.0, 3.0], [6.9, 3.0], [7.4, 0]], thick: 0.15, cant: 0.12 }],
      canopy: { z: -5.3, y: 0.72, sx: 0.48, sy: 0.46, sz: 1.6 }, nozzles: [{ x: 1.15, y: -0.45, z: 7.7, r: 0.52, len: 0.5 }],
      tip: [5.7, 0, 2.8], missiles: [[4.6, -0.3, 1.8], [3.2, -0.35, 1.0]] },
    su27: { fus: [[-10.6, 0], [-9.6, 0.38], [-8, 0.72], [-5.8, 0.92], [-3, 0.85], [2, 0.6], [7, 0.4], [10.4, 0.25]], fusS: [1.1, 1], radome: 2,
      nacelles: [{ x: 1.45, y: -0.55, z0: -3.4, z1: 8.6, r: 0.72, sx: 1, sy: 1 }],
      intakes: [{ x: 1.45, y: -0.65, z: -3.4, w: 1.1, h: 0.95, d: 1.6 }],
      lex: { poly: [[0.7, -8.0], [2.3, -1.6], [2.3, 3], [0.7, 3.4]], y: 0.05, thick: 0.28 },
      wing: { poly: [[2.1, -1.5], [7.3, 2.8], [7.3, 3.7], [2.1, 5.2]], y: 0, thick: 0.22 },
      stab: { poly: [[2.0, 6.4], [4.9, 8.4], [4.9, 9.1], [2.0, 9.4]], y: -0.1, thick: 0.14, dihedral: 0 },
      fins: [{ x: 2.2, y: 0.2, poly: [[4.4, 0], [7.0, 3.5], [8.0, 3.5], [8.5, 0]], thick: 0.16, cant: 0.05 }],
      canopy: { z: -6.4, y: 0.88, sx: 0.55, sy: 0.52, sz: 1.9 }, nozzles: [{ x: 1.45, y: -0.55, z: 8.7, r: 0.6, len: 0.6 }],
      tip: [7.4, 0, 3.4], missiles: [[7.4, 0, 3.0], [5.2, -0.3, 2.0], [3.4, -0.4, 1.2]] },
    su57: { fus: [[-10, 0], [-9, 0.4], [-7.4, 0.78], [-5.4, 0.95], [-2, 0.85], [3, 0.6], [8, 0.4], [10.2, 0.3]], fusS: [1.4, 0.85], seg: 8, radome: 2,
      nacelles: [{ x: 1.7, y: -0.4, z0: -3.6, z1: 9, r: 0.72, sx: 1.15, sy: 0.9 }],
      intakes: [{ x: 1.7, y: -0.5, z: -3.6, w: 1.2, h: 0.9, d: 1.6 }],
      lex: { poly: [[0.8, -7.4], [2.4, -3.0], [2.6, 0.2], [0.8, 0.4]], y: 0.05, thick: 0.3 },
      wing: { poly: [[2.4, -0.8], [7.2, 3.4], [7.2, 4.4], [2.4, 6.0]], y: 0, thick: 0.22 },
      stab: { poly: [[2.5, 6.6], [4.8, 8.2], [4.8, 9.0], [2.5, 9.6]], y: -0.05, thick: 0.13, dihedral: 0 },
      fins: [{ x: 2.3, y: 0.3, poly: [[4.8, 0], [6.6, 2.4], [7.4, 2.4], [8.0, 0]], thick: 0.15, cant: 0.48 }],
      canopy: { z: -6.0, y: 0.82, sx: 0.55, sy: 0.5, sz: 1.9, tint: 0x8a6a2a }, nozzles: [{ x: 1.7, y: -0.4, z: 9.1, r: 0.6, len: 0.6 }],
      tip: [7.3, 0, 4], missiles: [] },
  };
  // the Su-35 is a Flanker with canards
  JETS.su35 = Object.assign({}, JETS.su27, { canard: { poly: [[1.0, -6.4], [3.2, -5.2], [3.2, -4.6], [1.0, -4.4]], y: 0.35, thick: 0.1 } });

  const flameIn = new THREE.MeshBasicMaterial({ color: 0xfff1c8, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const flameOut = new THREE.MeshBasicMaterial({ color: 0xff8a3a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  const nozzleGlow = new THREE.MeshBasicMaterial({ color: 0xff9a4a });
  const navR = new THREE.MeshBasicMaterial({ color: 0xff3b3b }), navG = new THREE.MeshBasicMaterial({ color: 0x3cff6a });

  function buildJet(spec, M) {
    const g = new THREE.Group();
    const add = (geo, m, x, y, z, parent) => { const me = new THREE.Mesh(geo, m); me.position.set(x || 0, y || 0, z || 0); me.castShadow = true; me.receiveShadow = true; (parent || g).add(me); return me; };
    const both = (x, f) => { f(x, 1); if (x) f(-x, -1); };
    const fs = spec.fusS, seg = spec.seg || 18;
    if (spec.radome) {
      const cut = spec.radome;
      add(latheGeo(spec.fus.slice(0, cut + 1), seg, fs[0], fs[1]), M.radome);
      add(latheGeo(spec.fus.slice(cut), seg, fs[0], fs[1]), M.body);
    } else add(latheGeo(spec.fus, seg, fs[0], fs[1]), M.body);
    if (spec.cone) { add(new THREE.ConeGeometry(spec.cone.r, spec.cone.len, 12).rotateX(-Math.PI / 2), M.dark, 0, 0, spec.cone.z + 0.1); add(new THREE.CircleGeometry(spec.fus[0][1] * 0.95, 14), M.inlet, 0, 0, spec.fus[0][0] + 0.25).rotation.y = Math.PI; }
    for (const n of spec.nacelles || []) both(n.x, x => { const m = add(scaleUV(cyl(n.r, n.r * 0.9, n.z1 - n.z0, 16), 2 * Math.PI * n.r / TILE, (n.z1 - n.z0) / TILE), M.body, x, n.y, (n.z0 + n.z1) / 2); m.scale.set(n.sx, n.sy, 1); });
    for (const it of spec.intakes || []) both(it.x, x => {
      add(new THREE.BoxGeometry(it.w, it.h, it.d), M.body, x, it.y, it.z + it.d / 2);
      add(new THREE.PlaneGeometry(it.w * 0.86, it.h * 0.8), M.inlet, x, it.y, it.z - 0.01).rotation.y = Math.PI;
    });
    for (const key of ['wing', 'lex', 'canard']) {
      const s = spec[key]; if (!s) continue;
      [false, true].forEach(mir => add(planGeo(s.poly, s.thick, mir), key === 'wing' ? M.wing : M.body, 0, s.y, 0));
    }
    if (spec.stab) [false, true].forEach(mir => { const m = add(planGeo(spec.stab.poly, spec.stab.thick, mir), M.wing, 0, spec.stab.y, 0); m.rotation.z = (mir ? -1 : 1) * (spec.stab.dihedral || 0); });
    if (spec.swing) {
      const sw = spec.swing;
      [1, -1].forEach(side => {
        const piv = new THREE.Group(); piv.name = side > 0 ? 'swingR' : 'swingL';
        piv.position.set(sw.pivot[0] * side, sw.pivot[1], sw.pivot[2]);
        add(planGeo(sw.poly, sw.thick, side < 0), M.wing, 0, 0, 0, piv);
        add(new THREE.SphereGeometry(0.12, 6, 4), side > 0 ? navG : navR, side * 7.6, 0, 0.6, piv);
        piv.userData.side = side; piv.userData.fwd = sw.fwd; piv.userData.back = sw.back;
        piv.rotation.y = -side * sw.fwd;
        g.add(piv);
      });
    }
    for (const f of spec.fins || []) {
      const top = Math.max(...f.poly.map(p => p[1])), lo = clipY(f.poly, top * 0.72, false), hi = clipY(f.poly, top * 0.72, true);
      both(f.x, (x, side) => {
        const fg = new THREE.Group(); fg.position.set(x, f.y, 0); fg.rotation.z = -side * (f.cant || 0);
        add(finGeo(lo, f.thick), M.body, 0, 0, 0, fg); add(finGeo(hi, f.thick), M.trim, 0, 0, 0, fg);
        g.add(fg);
      });
    }
    const cp = spec.canopy;
    const can = add(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), glassMat(cp.tint), 0, cp.y - 0.12, cp.z); can.scale.set(cp.sx, cp.sy, cp.sz);
    add(new THREE.BoxGeometry(cp.sx * 1.9, 0.12, 0.12), M.dark, 0, cp.y - 0.08, cp.z - cp.sz * 0.6);
    for (const nz of spec.nozzles) both(nz.x, x => {
      add(cyl(nz.r * 1.02, nz.r * 0.9, nz.len, 16), M.metal, x, nz.y, nz.z + nz.len / 2 - 0.1);
      add(new THREE.CircleGeometry(nz.r * 0.8, 16), nozzleGlow, x, nz.y, nz.z + nz.len - 0.2).castShadow = false;
      [[flameIn, 0.62, 3.2], [flameOut, 0.85, 5]].forEach(([m, rk, len]) => {
        const fl = add(new THREE.ConeGeometry(nz.r * rk, len, 12, 1, true).rotateX(Math.PI / 2).translate(0, 0, len / 2), m, x, nz.y, nz.z + nz.len - 0.15);
        fl.name = 'flame'; fl.castShadow = false; fl.receiveShadow = false;
      });
    });
    if (spec.tip && !spec.swing) both(spec.tip[0], (x, side) => add(new THREE.SphereGeometry(0.11, 6, 4), side > 0 ? navG : navR, x, spec.tip[1], spec.tip[2]));
    (spec.missiles || []).forEach(m => both(m[0], x => {
      const ms = new THREE.Group(); ms.name = 'msl'; ms.position.set(x, m[1], m[2]);
      add(cyl(0.09, 0.09, 2.9, 8), M.msl, 0, -0.12, 0, ms);
      add(new THREE.ConeGeometry(0.09, 0.3, 8).rotateX(-Math.PI / 2), M.dark, 0, -0.12, -1.6, ms);
      add(new THREE.BoxGeometry(0.42, 0.02, 0.3), M.msl, 0, -0.12, 1.2, ms);
      g.add(ms);
    }));
    return g;
  }

  // ---------- bosses: full size, about 40 m long ----------
  const BOSS_TURRETS = [[0, 2.6, -4], [0, -2.5, 2], [0, 0.8, 15.5], [0, -0.9, -14]];
  function buildBoss(kind, color, accent) {
    const g = new THREE.Group();
    const M = materialsFor({ pattern: kind === 'wing' ? 'solid' : 'twotone', c: [color, new THREE.Color(color).multiplyScalar(0.88).getHex(), color], accent });
    const body = M.body, wingM = M.wing, trim = M.trim, dark = M.dark;
    const add = (geo, m, x, y, z, parent) => { const me = new THREE.Mesh(geo, m); me.position.set(x || 0, y || 0, z || 0); me.castShadow = true; me.receiveShadow = true; (parent || g).add(me); return me; };
    const pair = (poly, thick, y, m) => [false, true].forEach(mir => add(planGeo(poly, thick, mir), m || wingM, 0, y, 0));
    const glowMat = new THREE.MeshBasicMaterial({ color: kind === 'wing' ? accent : 0xffa040, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    const glow = new THREE.Group(); glow.name = 'glow';
    const flame = (geo, x, y, z) => { const e = add(geo, glowMat, x, y, z, glow); e.name = 'flame'; e.castShadow = false; };
    const prop = (x, y, z) => {
      const pr = new THREE.Group(); pr.name = 'prop'; pr.position.set(x, y, z);
      for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.8, 0.08), dark); b.position.y = 1.3; const h = new THREE.Group(); h.rotation.z = i * Math.PI / 2; h.add(b); pr.add(h); }
      g.add(pr);
    };
    if (kind === 'wing') {
      pair([[0, -16], [26, 5], [24, 7.5], [15, 3.5], [10, 7.5], [0, 4]], 1.8, 0, body);
      add(latheGeo([[-16, 0], [-12, 1.6], [-6, 2.8], [2, 3], [8, 2], [11, 1]], 10, 1.6, 0.8), body, 0, 0.6, 0);
      add(new THREE.BoxGeometry(46, 0.5, 0.8), trim, 0, 0.2, 7.2);
      [-4, -1.4, 1.4, 4].forEach(x => flame(new THREE.ConeGeometry(0.9, 6, 8).rotateX(Math.PI / 2).translate(0, 0, 3), x, 0.8, 10));
      add(new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), glassMat(), 0, 2.6, -8).scale.set(1.4, 0.8, 2.6);
    } else {
      const prof = kind === 'blackjack'
        ? [[-24, 0], [-21, 1.2], [-16, 2.2], [-8, 2.6], [8, 2.4], [16, 1.8], [22, 1.2]]
        : [[-20, 0], [-18.5, 1.5], [-15, 2.4], [-8, 2.7], [8, 2.6], [15, 1.9], [20, 0.9]];
      add(latheGeo(prof, 18, 1, 1.05), body);
      add(new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), glassMat(), 0, 1.6, kind === 'blackjack' ? -17 : -15).scale.set(1.5, 0.9, 2.4);
      if (kind === 'bear') {
        pair([[1.8, -5], [25, 5.5], [25, 7.5], [1.8, 3]], 0.7, 0.6);
        pair([[1.2, 13], [8, 17], [8, 18.5], [1.2, 19]], 0.35, 1.0);
        add(finGeo([[11, 0], [17, 7.5], [19.5, 7.5], [20.5, 0]], 0.5), body, 0, 1.6, 0);
        add(finGeo([[15.5, 5.2], [17.1, 7.3], [19.6, 7.3], [20.3, 5.2]], 0.55), trim, 0, 1.6, 0);
        [7, 14].forEach(x => [1, -1].forEach(s => { add(cyl(1.0, 0.8, 7, 12), body, s * x, 0.3, -3.4 + x * 0.42); prop(s * x, 0.3, -7.2 + x * 0.42); }));
      } else if (kind === 'gunship') {
        add(new THREE.BoxGeometry(5.6, 1.4, 7), body, 0, 2.2, -2);
        pair([[2, -3.4], [21, -2.2], [21, 0.8], [2, 2.2]], 0.7, 2.6);
        pair([[1, 14.5], [8, 16.5], [8, 18], [1, 19]], 0.35, 2.0);
        add(finGeo([[12, 0], [16.5, 8], [19, 8], [20, 0]], 0.5), body, 0, 2.2, 0);
        add(finGeo([[15.4, 6], [16.5, 8], [19, 8], [19.6, 6]], 0.55), trim, 0, 2.2, 0);
        [6.5, 13].forEach(x => [1, -1].forEach(s => { add(cyl(0.9, 0.75, 6, 12), body, s * x, 2.3, -2.2); prop(s * x, 2.3, -5.4); }));
      } else if (kind === 'awacs') {
        pair([[2, -4.5], [24, 4], [24, 6.2], [2, 3.5]], 0.8, 2.3);
        pair([[1, 15.5], [8, 18.5], [8, 20], [1, 20.5]], 0.35, 9.0);
        add(finGeo([[12, 0], [17, 7.4], [19.5, 7.4], [20.5, 0]], 0.55), body, 0, 2.2, 0);
        [7.5, 14].forEach(x => [1, -1].forEach(s => {
          add(cyl(0.95, 0.8, 5.5, 12), body, s * x, 0.6, -2 + x * 0.33);
          flame(new THREE.ConeGeometry(0.6, 3, 8).rotateX(Math.PI / 2).translate(0, 0, 1.5), s * x, 0.6, 0.8 + x * 0.33);
        }));
        [-1.6, 1.6].forEach(x => { const st = add(new THREE.BoxGeometry(0.4, 3.4, 1.8), body, x, 4, 4); st.rotation.z = x > 0 ? -0.25 : 0.25; });
        const dome = new THREE.Group(); dome.name = 'dome'; dome.position.set(0, 6, 4);
        add(new THREE.CylinderGeometry(5.6, 5.6, 1.1, 28), wingM, 0, 0, 0, dome);
        add(new THREE.BoxGeometry(11.4, 1.16, 1.0), trim, 0, 0, 0, dome);
        g.add(dome);
      } else {
        pair([[2.2, -9], [7, -1.5], [7, 5], [2.2, 7]], 1.0, 0.2, body);
        pair([[6.6, -1.8], [23, 9.5], [23, 11], [6.6, 4]], 0.5, 0.25);
        pair([[1.2, 16], [8.5, 20], [8.5, 21.5], [1.2, 22]], 0.35, 6.4);
        add(finGeo([[13, 0], [18.5, 6.8], [21.5, 6.8], [22.5, 0]], 0.6), body, 0, 1.6, 0);
        [2.6, 5.2].forEach(x => [1, -1].forEach(s => {
          add(cyl(1.0, 0.95, 9, 12), body, s * x, -1.8, 6);
          flame(new THREE.ConeGeometry(0.75, 4, 8).rotateX(Math.PI / 2).translate(0, 0, 2), s * x, -1.8, 10.5);
        }));
        add(new THREE.BoxGeometry(0.4, 0.3, 30), trim, 0, 2.5, -2);
      }
    }
    BOSS_TURRETS.forEach(t => { add(new THREE.SphereGeometry(0.9, 10, 8), dark, t[0], t[1], t[2]); add(cyl(0.12, 0.12, 2.2, 6), dark, t[0], t[1], t[2] - 1.2); });
    g.add(glow);
    return g;
  }

  // ---------- mesh factory ----------
  const templates = {};
  function collectParts(m) {
    const u = m.userData;
    u.props = []; u.flames = []; u.msl = []; u.swing = []; u.dome = null;
    m.traverse(o => {
      if (o.name === 'prop') u.props.push(o);
      else if (o.name === 'flame') u.flames.push(o);
      else if (o.name === 'msl') u.msl.push(o);
      else if (o.name === 'swingR' || o.name === 'swingL') u.swing.push(o);
      else if (o.name === 'dome') u.dome = o;
    });
    return m;
  }
  // ---------- imported models ----------
  // A detailed model (a glTF scene) can stand in for any jet. It is turned nose to -Z, scaled to the built
  // model's length and centred on it; the engine flames, nav lights and missiles still come from the spec.
  const custom = {};
  function useModel(id, root, opt) {
    custom[id] = { root, opt: opt || {} };
    for (const k in templates) if (k.split('|')[0] === id) delete templates[k];
  }
  function jetParts(spec, M, stores) {
    const full = buildJet(spec, M), g = new THREE.Group();
    for (const o of full.children.slice()) if (o.name === 'flame' || (o.name === 'msl' && stores) || o.material === navR || o.material === navG || o.material === nozzleGlow) g.add(o);
    return g;
  }
  // ---------- repainting imported models ----------
  // A scheme is painted straight onto the model: the pattern is projected from three sides in the jet's own
  // space, then the model's texture is laid back over it as fine detail (panel lines, rivets, stains, shading)
  // with its broad colours taken out. Dark parts and strongly coloured markings keep their original colour.
  const SKIP_PARTS = /glass|canopy|cockpit|pilot|seat|hud|screen|light|lamp|engine|nozzle|exhaust|tire|tyre|wheel|gold/i;
  function isSkin(m) {
    if (m.transparent || SKIP_PARTS.test(m.name)) return false;
    if (m.map) return true;
    const c = m.color; return c.r + c.g + c.b > 0.6;
  }
  // detail (0 to 1) sets how much of the model's own surface detail shows through the new paint
  function repaintMaterial(m, p, toJet, detail) {
    const u = {
      paintMap: { value: paintTexture({ ...p, lines: 0 }) },
      paintScale: { value: 1 / TILE },
      paintMat: { value: toJet.clone() },
      paintDetail: { value: detail == null ? 1 : detail },
    };
    m.color.set(0xffffff);
    if (p.metal != null) { m.metalness = p.metal; m.metalnessMap = null; }
    if (p.rough != null) { m.roughness = p.rough; m.roughnessMap = null; }
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = 'uniform mat4 paintMat; varying vec3 vPaintPos; varying vec3 vPaintN;\n' + sh.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\n vPaintPos = (paintMat * vec4(transformed, 1.0)).xyz; vPaintN = mat3(paintMat) * objectNormal;');
      sh.fragmentShader = 'uniform sampler2D paintMap; uniform float paintScale; uniform float paintDetail; varying vec3 vPaintPos; varying vec3 vPaintN;\n' + sh.fragmentShader.replace('#include <map_fragment>', `
        #ifdef USE_MAP
          vec4 orig = mapTexelToLinear(texture2D(map, vUv));
          vec3 broad = mapTexelToLinear(texture2D(map, vUv, 3.5)).rgb;
        #else
          vec4 orig = vec4(1.0); vec3 broad = vec3(1.0);
        #endif
        const vec3 LUMA = vec3(0.299, 0.587, 0.114);
        float lum = dot(orig.rgb, LUMA);
        float detail = mix(1.0, clamp(lum / max(dot(broad, LUMA), 0.02), 0.55, 1.3), paintDetail);
        vec3 nw = pow(abs(normalize(vPaintN)), vec3(4.0)); nw /= nw.x + nw.y + nw.z;
        vec3 q = vPaintPos * paintScale;
        vec3 paint = texture2D(paintMap, q.zy).rgb * nw.x + texture2D(paintMap, q.xz).rgb * nw.y + texture2D(paintMap, q.xy).rgb * nw.z;
        paint *= 0.85;
        float hi = max(max(orig.r, orig.g), orig.b), sat = (hi - min(min(orig.r, orig.g), orig.b)) / max(hi, 0.001);
        float keep = max(smoothstep(0.45, 0.7, sat) * smoothstep(0.04, 0.12, hi), 1.0 - smoothstep(0.008, 0.025, lum));
        diffuseColor *= vec4(mix(paint * detail, orig.rgb, keep), orig.a);
      `);
    };
    m.customProgramCacheKey = () => 'repaint';
    m.needsUpdate = true;
  }
  // the vertex furthest out to the right, in the jet's own space
  function wingtip(holder) {
    holder.updateMatrixWorld(true);
    const v = new THREE.Vector3(), best = new THREE.Vector3(-Infinity, 0, 0);
    holder.traverse(o => {
      if (!o.isMesh) return;
      const pos = o.geometry.attributes.position, a = pos.array;
      // compressed models store positions as normalized integers
      const k = !pos.normalized ? 1 : a instanceof Int16Array ? 1 / 32767 : a instanceof Uint16Array ? 1 / 65535 : a instanceof Int8Array ? 1 / 127 : 1 / 255;
      for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).multiplyScalar(k).applyMatrix4(o.matrixWorld); if (v.x > best.x) best.copy(v); }
    });
    return [best.x - 0.12, best.y, best.z];
  }
  function buildCustom(id, p, repaint) {
    const { root, opt } = custom[id], spec = JETS[id];
    const holder = new THREE.Group(), body = root.clone(true);
    holder.add(body);
    holder.rotation.set(opt.rotX || 0, opt.rotY || 0, opt.rotZ || 0);
    holder.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(holder);
    const z0 = spec.fus[0][0], z1 = spec.fus[spec.fus.length - 1][0];
    holder.scale.setScalar((opt.length || z1 - z0) / Math.max(box.max.z - box.min.z, 1e-4));
    holder.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(holder);
    holder.position.set(-(box.min.x + box.max.x) / 2, -(box.min.y + box.max.y) / 2 + (opt.y || 0), (z0 + z1) / 2 - (box.min.z + box.max.z) / 2);
    holder.updateMatrixWorld(true);
    body.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = o.receiveShadow = true;
      const mats = [].concat(o.material).map(m => {
        const c = m.clone();
        if (c.isMeshStandardMaterial) { if (envMap) c.envMap = envMap; allStd.push(c); }
        if (repaint && c.isMeshStandardMaterial && isSkin(c)) repaintMaterial(c, p, o.matrixWorld, opt.detail);
        return c;
      });
      o.material = mats.length === 1 ? mats[0] : mats;
    });
    const g = new THREE.Group();
    // flames sit on the model's own nozzles (opt.nozzles, same form as the spec), nav lights on its real wingtips;
    // a model that carries its own missiles and tanks skips the built-in ones
    g.add(holder, jetParts({ ...spec, nozzles: opt.nozzles || spec.nozzles, tip: wingtip(holder) }, materialsFor(p), opt.stores !== false));
    return g;
  }

  // paint: a skin id or object for player jets, or an ENEMY_PAINT key
  function planeMesh(model, paint, livery) {
    const p = typeof paint === 'string' && ENEMY_PAINT[paint] ? ENEMY_PAINT[paint] : resolvePaint(paint || 'factory', livery || [0x9aa3ad, 0x2c3e66]);
    const key = model + '|' + p.pattern + p.c.join(',') + p.accent;
    if (!templates[key]) {
      // an imported model keeps its own paint for factory and enemy schemes; skins and the ace and variant schemes repaint it
      const own = !paint || paint === 'factory' || (typeof paint === 'string' && ENEMY_PAINT[paint] && !ENEMY_PAINT[paint].repaint);
      templates[key] = custom[model] ? buildCustom(model, p, !own) : buildJet(JETS[model], materialsFor(p));
    }
    return collectParts(templates[key].clone(true));
  }
  function bossMesh(kind, color, accent) {
    const key = 'boss' + kind + color;
    if (!templates[key]) templates[key] = buildBoss(kind, color, accent);
    return collectParts(templates[key].clone(true));
  }
  // a small swatch image of a skin for menus
  function swatch(skin, livery, w) {
    const p = resolvePaint(skin, livery);
    const src = paintCanvas(p), c = makeCanvas(w || 96, Math.round((w || 96) * 0.6)), g = c.getContext('2d');
    g.drawImage(src, 0, 0, SIZE * 0.6, SIZE * 0.36, 0, 0, c.width, c.height);
    g.fillStyle = css(p.accent); g.fillRect(c.width - 18, 0, 18, c.height);
    return c.toDataURL();
  }

  // ---------- world textures ----------
  function noiseCanvas(n, lo, hi, seed, blobs) {
    const c = makeCanvas(n), g = c.getContext('2d'), r = rng(seed), img = g.createImageData(n, n);
    for (let i = 0; i < n * n; i++) { const v = Math.round((lo + r() * (hi - lo)) * 255); img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0);
    // softer larger features over the grain
    for (let i = 0; i < (blobs || 0); i++) { const x = r() * n, y = r() * n, rad = 4 + r() * n * 0.12; const k = r() < 0.5 ? 0 : 255; g.fillStyle = `rgba(${k},${k},${k},0.05)`; for (const dx of [-n, 0, n]) for (const dy of [-n, 0, n]) { g.beginPath(); g.arc(x + dx, y + dy, rad, 0, Math.PI * 2); g.fill(); } }
    return c;
  }
  const detail = tex(noiseCanvas(256, 0.9, 1.0, 7, 120));
  // a tiling normal map for water, from a sum of waves
  function waterNormalCanvas(n) {
    const h = new Float32Array(n * n), r = rng(11);
    const waves = Array.from({ length: 14 }, () => ({ kx: Math.round((r() - 0.5) * 16), ky: Math.round((r() - 0.5) * 16), a: 0.4 + r(), p: r() * 6.28 }));
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { let v = 0; for (const w of waves) v += w.a * Math.sin((w.kx * x + w.ky * y) / n * Math.PI * 2 + w.p); h[y * n + x] = v; }
    const c = makeCanvas(n), g = c.getContext('2d'), img = g.createImageData(n, n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const dx = h[y * n + (x + 1) % n] - h[y * n + (x - 1 + n) % n], dy = h[((y + 1) % n) * n + x] - h[((y - 1 + n) % n) * n + x];
      const nx = -dx * 0.6, ny = -dy * 0.6, nz = 1, l = Math.hypot(nx, ny, nz), i = (y * n + x) * 4;
      img.data[i] = (nx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (ny / l * 0.5 + 0.5) * 255; img.data[i + 2] = (nz / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  }
  const waterNormal = tex(waterNormalCanvas(256));
  function puffCanvas(n, seed, hard) {
    const c = makeCanvas(n), g = c.getContext('2d'), r = rng(seed);
    for (let i = 0; i < 26; i++) {
      const a = r() * 6.28, d = r() * n * 0.22, x = n / 2 + Math.cos(a) * d, y = n / 2 + Math.sin(a) * d * 0.8, rad = n * (0.12 + r() * 0.16);
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, `rgba(255,255,255,${hard ? 0.5 : 0.32})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
    }
    return c;
  }
  const cloud = new THREE.CanvasTexture(puffCanvas(128, 3, false));
  const smoke = new THREE.CanvasTexture(puffCanvas(64, 5, true));

  return { TILE, SKINS, SKIN_BY_ID, ENEMY_PAINT, JETS, BOSS_TURRETS, planeMesh, bossMesh, useModel, hasModel: id => !!custom[id], swatch, setEnvMap, cyl, glassMat, textures: { detail, waterNormal, cloud, smoke } };
};
