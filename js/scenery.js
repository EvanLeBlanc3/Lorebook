'use strict';
/* ============================================================
   LOREBOOK — per-theme scenery: what the little window looks out on,
   what flies by, and the particles floating around each room
   ============================================================ */

/* how each theme tints the real sky (the weather & time of day are still real) */
const WINCFG = {
  grand: {},
  arcade: { tint: '#9a2fe0', tint2: '#ff3df2', amt: .3 },
  haunted: { tint: '#2f6b5a', tint2: '#4a3b6a', amt: .32 },
  starship: { tint: '#07122c', tint2: '#14305c', amt: .6, stars: .95 },
  treehouse: { tint: '#7fcf6a', amt: .1 },
  dungeon: { tint: '#5a4a40', tint2: '#7a5a40', amt: .3 },
  cabin: { tint: '#a9c4e8', amt: .2 },
  pirate: { tint: '#2a8fb0', tint2: '#ffd9a0', amt: .12 },
  sakura: { tint: '#ffb3cf', tint2: '#ffd9e6', amt: .3 },
  tomb: { tint: '#f2c26b', tint2: '#ffdc94', amt: .36 },
  steampunk: { tint: '#b58a5a', tint2: '#d9b37a', amt: .42 }
};
const LANDBASE = { grand: '#34465c', arcade: '#2b2f5e', haunted: '#2a3a44', starship: '#46526a', treehouse: '#2f5a3a', dungeon: '#3c3c48', cabin: '#3a4a5a', pirate: '#2c4a5c', sakura: '#55704a', tomb: '#b98a4e', steampunk: '#4a3a30' };

Object.assign(SkyWindow.prototype, {
  landColor(dk, c) {
    const base = LANDBASE[this.theme] || '#34465c';
    return mix(mix(base, '#080a12', clamp(dk * 1.05, 0, 1)), '#4a4f58', c.clouds * .25 * (1 - dk));
  },

  buildLand() {
    const w = this.w, h = this.h, r = rng(hash(this.theme) + 5), th = this.theme;
    const L = this.land = { far: [], near: [], bld: [], graves: [], pines: [], peaks: [], trees: [], pyr: [], smk: {} };
    for (let x = 0; x <= w + 6; x += 6) {
      L.far.push([x, h * .66 + Math.sin(x * .05 + 1) * 5 + Math.sin(x * .13) * 3]);
      L.near.push([x, h * .78 + Math.sin(x * .07 + 3) * 4 + Math.sin(x * .19) * 2]);
    }
    if (th === 'arcade') { let x = -4; while (x < w) { const bw = 12 + r() * 16, bh = h * (.18 + r() * .34); L.bld.push({ x, w: bw, h: bh, hue: r() < .5 ? '#ff3df2' : '#22e5ff', seed: r() }); x += bw + 1; } }
    if (th === 'steampunk') { let x = -4; while (x < w) { const bw = 10 + r() * 16, bh = h * (.14 + r() * .3); L.bld.push({ x, w: bw, h: bh, ch: r() < .4, seed: r() }); x += bw + 1; } }
    if (th === 'haunted') for (let i = 0; i < 6; i++) L.graves.push({ x: 8 + r() * (w - 16), s: .7 + r() * .6, k: r() < .4 ? 'cross' : 'stone' });
    if (th === 'treehouse' || th === 'cabin') { for (let i = 0; i < (th === 'cabin' ? 16 : 18); i++) L.pines.push({ x: r() * w, s: .7 + r() * .8, d: r() < .5 ? 0 : 1 }); L.pines.sort((a, b) => a.d - b.d); }
    if (th === 'dungeon' || th === 'starship' || th === 'cabin') for (let x = -6; x <= w + 12; x += 12 + r() * 10) L.peaks.push([x, h * (.5 + r() * .16)]);
    if (th === 'sakura') [.1, .5, .9].forEach(fx => L.trees.push({ x: w * fx + (r() - .5) * 8, s: .9 + r() * .5, ph: r() * 6 }));
    if (th === 'tomb') L.pyr = [{ x: w * .3, s: 34 }, { x: w * .58, s: 24 }, { x: w * .08, s: 16 }];
  },

  fillPoly(pts, color, base) {
    const ctx = this.ctx; ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(pts[0][0], base);
    pts.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(pts[pts.length - 1][0], base); ctx.closePath(); ctx.fill();
  },
  pine(x, base, s, col) {
    const ctx = this.ctx; ctx.fillStyle = col;
    for (let i = 0; i < 3; i++) { const y = base - i * 8 * s, ww = (12 - i * 3) * s; ctx.beginPath(); ctx.moveTo(x - ww / 2, y); ctx.lineTo(x, y - 14 * s); ctx.lineTo(x + ww / 2, y); ctx.fill(); }
  },
  gear(x, y, r, teeth, rot, color) {
    const ctx = this.ctx; ctx.fillStyle = color; ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a = rot + i * 6.2832 / teeth, d = 6.2832 / teeth;
      [[0, .78], [.14, 1], [.4, 1], [.54, .78]].forEach(([o, k], j) => { const aa = a + o * d, px = x + Math.cos(aa) * r * k, py = y + Math.sin(aa) * r * k; (i || j) ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
    }
    ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(x, y, r * .28, 0, 6.2832); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
  },
  smoke(key, x, y, col, wind) {
    const L = this.land, dt = this.dt || .03, ctx = this.ctx;
    const a = L.smk[key] || (L.smk[key] = Array.from({ length: 7 }, (_, i) => ({ l: i / 7 })));
    for (const p of a) {
      p.l += dt * .22; if (p.l > 1) p.l -= 1;
      ctx.globalAlpha = (1 - p.l) * .5; ctx.fillStyle = col; ctx.beginPath();
      ctx.arc(x + p.l * (8 + wind * .6) + Math.sin(p.l * 7) * 2, y - p.l * 26, 1.8 + p.l * 5, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  drawLand(V, sk) {
    const dk = sk.dk, c = V.cond, col = this.landColor(dk, c), far = mix(col, sk.b, .42 * (1 - dk * .6)), lights = clamp(dk * 1.4 - .1, 0, 1);
    (LANDS[this.theme] || LANDS.grand).call(this, { V, sk, dk, c, col, far, lights });
    this.ctx.fillStyle = col; this.ctx.fillRect(0, this.h * .93, this.w, this.h * .07);
  },

  drawFlyers(V, sk, dt) {
    const { ctx, w, h } = this, th = this.theme, dk = sk.dk, c = V.cond;
    this.nextFly -= dt;
    if (!this.fly && this.nextFly <= 0) {
      this.nextFly = 14 + Math.random() * 22;
      const k = { grand: 'birds', treehouse: 'birds', cabin: 'birds', sakura: 'birds', tomb: 'birds', pirate: 'gull', haunted: 'bats', dungeon: 'dragon', starship: 'ufo', arcade: 'blimp', steampunk: 'airship' }[th];
      if ((k === 'birds' || k === 'gull') && dk > .6) return;
      if (c.precip && !['ufo', 'bats', 'airship'].includes(k)) return;
      this.fly = { k, x: -24, y: h * (.14 + Math.random() * .24), sp: 14 + Math.random() * 10, t: 0 };
    }
    const f = this.fly; if (!f) return;
    f.t += dt; f.x += f.sp * dt;
    const bob = Math.sin(f.t * 3) * 2, flap = Math.sin(f.t * 12), col = this.landColor(Math.max(dk, .4), c);
    ctx.save(); ctx.translate(f.x, f.y + bob); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.4;
    if (f.k === 'birds' || f.k === 'bats' || f.k === 'gull') {
      if (f.k === 'gull') ctx.strokeStyle = mix('#ffffff', '#566', dk);
      for (let i = 0; i < 3; i++) { const ox = i * 10, oy = (i % 2) * 5; ctx.beginPath(); ctx.moveTo(ox - 4, oy - 2 + flap * 2); ctx.quadraticCurveTo(ox - 2, oy - 3, ox, oy); ctx.quadraticCurveTo(ox + 2, oy - 3, ox + 4, oy - 2 + flap * 2); ctx.stroke(); if (f.k === 'bats') ctx.fillRect(ox - 1, oy - 1, 2, 3); }
    } else if (f.k === 'dragon') {
      ctx.beginPath(); ctx.ellipse(0, 0, 7, 2.2, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-3, -1); ctx.lineTo(-1, -9 - flap * 3); ctx.lineTo(3, -1); ctx.fill();
      ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(10, -1); ctx.lineTo(7, 1); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-7, 0); ctx.quadraticCurveTo(-12, 3, -14, 0); ctx.stroke();
      ctx.fillStyle = `rgba(255,150,60,${.5 + flap * .4})`; ctx.fillRect(10, -1, 2, 2);
    } else if (f.k === 'ufo') {
      ctx.fillStyle = '#9fb6d4'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 2.4, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(160,230,255,.8)'; ctx.beginPath(); ctx.arc(0, -1.5, 3.2, Math.PI, 0); ctx.fill();
      ctx.fillStyle = `rgba(255,230,120,${.5 + .5 * Math.sin(f.t * 9)})`; [-5, 0, 5].forEach(x => ctx.fillRect(x - .7, .6, 1.4, 1.4));
    } else if (f.k === 'blimp') {
      ctx.fillStyle = '#2a1650'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 4, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = `rgba(255,61,242,${.6 + .4 * Math.sin(f.t * 4)})`; ctx.fillRect(-6, -.8, 12, 1.6);
    } else if (f.k === 'airship') {
      ctx.fillStyle = mix('#c98a4a', '#2a1a10', dk * .7); ctx.beginPath(); ctx.ellipse(0, 0, 13, 5, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = mix('#7a4a22', '#150c06', dk * .7); ctx.fillRect(-4, 5.5, 8, 3); ctx.fillRect(-3, 4.5, 1, 2); ctx.fillRect(2, 4.5, 1, 2);
      ctx.strokeStyle = mix('#e8c88a', '#3a2a1a', dk * .7); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-8, -1); ctx.lineTo(8, -1); ctx.stroke();
      ctx.fillStyle = '#dcdcdc'; ctx.fillRect(-15, -.5 + Math.sin(f.t * 40) * 1.6, 1.6, 3); // propeller
      ctx.fillStyle = `rgba(255,220,140,${.4 + .5 * dk})`; ctx.fillRect(-1, 6.2, 2, 1.4);
    }
    ctx.restore();
    if (f.x > w + 30) this.fly = null;
  }
});

/* ---------- the views ---------- */
const LANDS = {
  grand({ col, far, lights }) {
    const { ctx, w, h, land: L } = this; this.fillPoly(L.far, far, h);
    const bx = w * .62, by = h * .7; ctx.fillStyle = col;
    ctx.fillRect(bx, by - 18, 22, 20); ctx.fillRect(bx - 8, by - 28, 8, 30); ctx.fillRect(bx + 22, by - 34, 9, 36);
    [[bx - 9, by - 28, 10], [bx + 21, by - 34, 11], [bx + 5, by - 18, 12]].forEach(([x, y, ww]) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + ww / 2, y - 10); ctx.lineTo(x + ww, y); ctx.fill(); });
    ctx.fillStyle = `rgba(255,210,110,${lights})`; [[bx + 4, by - 12], [bx + 13, by - 12], [bx - 5, by - 20], [bx + 25, by - 26]].forEach(([x, y]) => ctx.fillRect(x, y, 3, 4));
    ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx + 26.5, by - 44); ctx.lineTo(bx + 26.5, by - 52); ctx.stroke();
    ctx.fillStyle = mix('#d6342f', '#401010', lights * .6); ctx.beginPath(); ctx.moveTo(bx + 26.5, by - 52); ctx.lineTo(bx + 33 + Math.sin(this.t * 3) * 1.4, by - 49.5); ctx.lineTo(bx + 26.5, by - 47); ctx.fill();   // little flag
    this.fillPoly(L.near, col, h);
  },
  arcade({ col, far, lights }) {
    const { ctx, w, h, land: L } = this;
    this.fillPoly(L.far, mix(far, '#3a1470', .45), h);
    L.bld.forEach(b => {
      ctx.fillStyle = mix(col, '#1a0b3d', .4); ctx.fillRect(b.x, h * .8 - b.h, b.w, b.h + h * .2);
      ctx.fillStyle = rgba(b.hue, .15 + lights * .5);
      for (let yy = h * .8 - b.h + 4; yy < h * .78; yy += 6) for (let xx = b.x + 2; xx < b.x + b.w - 2; xx += 5) if (((xx * 7 + yy * 3 + b.seed * 100) | 0) % 3) ctx.fillRect(xx, yy, 2, 3);
      ctx.fillStyle = rgba(b.hue, .5 + lights * .5); ctx.fillRect(b.x, h * .8 - b.h - 1, b.w, 1.2);
    });
    const gy = h * .8, g = ctx.createLinearGradient(0, gy, 0, h); g.addColorStop(0, '#2a0f5a'); g.addColorStop(1, '#0b0420'); ctx.fillStyle = g; ctx.fillRect(0, gy, w, h - gy);
    ctx.strokeStyle = `rgba(255,61,242,${.28 + lights * .55})`; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = -8; i <= 8; i++) { ctx.moveTo(w / 2 + i * 3, gy); ctx.lineTo(w / 2 + i * w * .22, h); }
    const ph = (this.t * .45) % 1; for (let k = 0; k < 5; k++) { const f = (k + ph) / 5, y = gy + (h - gy) * f * f; ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
    ctx.fillStyle = `rgba(255,61,242,${.5 + .4 * Math.sin(this.t * 3)})`; ctx.fillRect(w * .12, h * .46, 18, 3);
    ctx.fillStyle = `rgba(34,229,255,${.5 + .4 * Math.sin(this.t * 3 + 2)})`; ctx.fillRect(w * .5, h * .38, 3, 14);
  },
  haunted({ col, far, lights }) {
    const { ctx, w, h, land: L } = this; this.fillPoly(L.far, far, h);
    const mx = w * .6, my = h * .73;       // crooked mansion
    ctx.fillStyle = col; ctx.fillRect(mx, my - 20, 30, 22); ctx.fillRect(mx + 4, my - 30, 8, 12); ctx.fillRect(mx + 20, my - 28, 7, 10);
    [[mx - 2, my - 20, 34], [mx + 3, my - 30, 10], [mx + 19, my - 28, 9]].forEach(([x, y, ww]) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + ww / 2, y - 10); ctx.lineTo(x + ww, y); ctx.fill(); });
    [[mx + 5, my - 12], [mx + 14, my - 12], [mx + 22, my - 12], [mx + 6, my - 25]].forEach(([x, y], i) => { ctx.fillStyle = `rgba(150,255,170,${(.12 + lights * .75) * (.55 + .45 * Math.sin(this.t * 2.3 + i * 1.7))})`; ctx.fillRect(x, y, 3, 4); });
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 2;
    const tx = w * .2, ty = h * .78; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx - 4, ty - 18, tx + 2, ty - 30); ctx.stroke();
    [[tx + 1, ty - 22, -12, -8], [tx, ty - 16, 11, -9], [tx + 2, ty - 30, 8, -10], [tx + 2, ty - 30, -9, -6]].forEach(([x, y, dx, dy]) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke(); });
    this.fillPoly(L.near, col, h);
    L.graves.forEach(g => { ctx.fillStyle = col; const y = h * .79 + Math.sin(g.x * .07 + 3) * 3; if (g.k === 'cross') { ctx.fillRect(g.x, y - 10 * g.s, 2, 11 * g.s); ctx.fillRect(g.x - 3, y - 7 * g.s, 8, 2); } else { ctx.beginPath(); ctx.moveTo(g.x - 3, y + 1); ctx.lineTo(g.x - 3, y - 6 * g.s); ctx.arc(g.x, y - 6 * g.s, 3, Math.PI, 0); ctx.lineTo(g.x + 3, y + 1); ctx.fill(); } });
  },
  starship({ col, far, lights }) {
    const { ctx, w, h, land: L } = this;
    this.fillPoly(L.peaks.flatMap((p, i) => i ? [[(p[0] + L.peaks[i - 1][0]) / 2, h * .8], p] : [p]), mix(far, '#8fa4c0', .25), h);
    this.fillPoly(L.near, col, h);
    ctx.fillStyle = shade(col, -.25); [[.2, .84, 9, 2.4], [.55, .88, 12, 3], [.82, .82, 7, 1.8]].forEach(([fx, fy, rx, ry]) => { ctx.beginPath(); ctx.ellipse(w * fx, h * fy, rx, ry, 0, 0, 6.283); ctx.fill(); });
    const ax = w * .3, ay = h * .78; ctx.strokeStyle = '#9fb6d4'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay - 20); ctx.moveTo(ax - 5, ay - 15); ctx.lineTo(ax + 5, ay - 15); ctx.stroke();
    ctx.fillStyle = `rgba(255,70,70,${.3 + .7 * (Math.sin(this.t * 4) > 0 ? 1 : 0)})`; ctx.beginPath(); ctx.arc(ax, ay - 21, 1.6, 0, 6.283); ctx.fill();
  },
  treehouse({ col, far, lights, sk }) {
    const { ctx, w, h, land: L } = this; this.fillPoly(L.far, far, h);
    L.pines.filter(p => p.d === 0).forEach(p => this.pine(p.x, h * .8, p.s, mix(col, sk.b, .25)));
    this.fillPoly(L.near, col, h);
    L.pines.filter(p => p.d === 1).forEach(p => this.pine(p.x, h * .86, p.s * 1.2, shade(col, -.15)));
    ctx.fillStyle = `rgba(255,200,90,${lights})`; ctx.fillRect(w * .34, h * .78, 4, 4);
  },
  dungeon({ col, far, lights }) {
    const { ctx, w, h, land: L } = this;
    this.fillPoly(L.peaks.flatMap((p, i) => i ? [[(p[0] + L.peaks[i - 1][0]) / 2, h * .8], p] : [p]), far, h);
    const tx = w * .7, ty = h * .76; ctx.fillStyle = mix(col, '#2a2a33', .3); ctx.fillRect(tx, ty - 26, 11, 28);
    ctx.beginPath(); ctx.moveTo(tx - 2, ty - 26); ctx.lineTo(tx + 5.5, ty - 38); ctx.lineTo(tx + 13, ty - 26); ctx.fill();
    ctx.fillStyle = `rgba(255,150,60,${(.3 + lights * .7) * (.8 + .2 * Math.sin(this.t * 7))})`; ctx.fillRect(tx + 4, ty - 18, 3, 5);
    this.fillPoly(L.near, col, h);
  },
  cabin({ col, far, lights, dk, c, sk }) {
    const { ctx, w, h, land: L } = this, snow = mix(mix('#eef4ff', '#1a2234', clamp(dk * .9, 0, 1)), '#9aa3b4', c.clouds * .3 * (1 - dk));
    this.fillPoly(L.peaks.flatMap((p, i) => i ? [[(p[0] + L.peaks[i - 1][0]) / 2, h * .78], p] : [p]), far, h);
    ctx.fillStyle = snow; L.peaks.forEach(p => { if (p[1] < h * .62) { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] - 4.5, p[1] + 6); ctx.lineTo(p[0] - 1, p[1] + 5); ctx.lineTo(p[0] + 1.5, p[1] + 7); ctx.lineTo(p[0] + 5, p[1] + 5); ctx.closePath(); ctx.fill(); } });
    L.pines.filter(p => p.d === 0).forEach(p => this.pine(p.x, h * .8, p.s, mix(col, '#1e3a2a', .5)));
    this.fillPoly(L.near, snow, h);
    const bx = w * .55, by = h * .79;      // the cabin itself
    ctx.fillStyle = mix('#6b4426', '#120a05', dk * .75); ctx.fillRect(bx, by - 14, 26, 14);
    ctx.fillStyle = mix('#4a2d17', '#0a0603', dk * .75); ctx.fillRect(bx + 18, by - 24, 5, 10);
    ctx.fillStyle = snow; ctx.beginPath(); ctx.moveTo(bx - 3, by - 14); ctx.lineTo(bx + 13, by - 25); ctx.lineTo(bx + 29, by - 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = mix('#6b4426', '#120a05', dk * .75); ctx.beginPath(); ctx.moveTo(bx - 1, by - 14); ctx.lineTo(bx + 13, by - 23); ctx.lineTo(bx + 27, by - 14); ctx.lineTo(bx + 25, by - 14); ctx.lineTo(bx + 13, by - 21); ctx.lineTo(bx + 1, by - 14); ctx.fill();
    ctx.fillStyle = `rgba(255,190,90,${.35 + lights * .65})`; ctx.fillRect(bx + 4, by - 10, 6, 5); ctx.fillRect(bx + 16, by - 10, 5, 8);
    this.smoke('cab', bx + 20.5, by - 24, mix('#ffffff', '#4a4f5a', dk * .8), 6);
    L.pines.filter(p => p.d === 1).forEach(p => this.pine(p.x, h * .9, p.s * 1.25, mix(col, '#0f2a1c', .55)));
  },
  pirate({ col, far, lights, dk, c, sk }) {
    const { ctx, w, h } = this, hz = h * .6;
    const sea = ctx.createLinearGradient(0, hz, 0, h);
    sea.addColorStop(0, mix(mix(sk.b, '#2a8fb0', .5), '#02101a', dk * .8)); sea.addColorStop(1, mix(mix('#0e4a66', '#4a5560', c.clouds * .3), '#01080e', dk * .85));
    ctx.fillStyle = sea; ctx.fillRect(0, hz, w, h - hz);
    ctx.strokeStyle = `rgba(255,255,255,${.1 + (1 - dk) * .1 + c.inten * .1})`; ctx.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      const y = hz + (i + .6) * (h - hz) / 7, amp = 1 + i * .45, ph = this.t * (.7 + i * .1) + i * 2; ctx.beginPath();
      for (let x = 0; x <= w; x += 4) { const yy = y + Math.sin(x * (.09 - i * .006) + ph) * amp; x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } ctx.stroke();
    }
    const ix = w * .82, iy = hz + 1;       // palm island
    ctx.fillStyle = mix('#2a3a2a', '#05080a', dk * .8); ctx.beginPath(); ctx.moveTo(ix - 18, iy); ctx.quadraticCurveTo(ix, iy - 10, ix + 20, iy); ctx.fill();
    ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ix + 2, iy - 5); ctx.quadraticCurveTo(ix + 4, iy - 14, ix + 1, iy - 20); ctx.stroke();
    [[-8, -3], [8, -3], [-6, 2], [7, 2]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.moveTo(ix + 1, iy - 20); ctx.quadraticCurveTo(ix + 1 + dx * .6, iy - 24 + dy, ix + 1 + dx, iy - 18 + dy * 2); ctx.stroke(); });
    const sx = ((this.t * 4) % (w + 90)) - 45, sy = hz + 1 + Math.sin(this.t * 1.6) * 1.2, hull = mix('#2a1c10', '#000', dk * .5), sail = mix('#f4ead0', '#2a3050', dk * .85);
    ctx.fillStyle = hull; ctx.beginPath(); ctx.moveTo(sx - 14, sy - 4); ctx.lineTo(sx + 14, sy - 4); ctx.lineTo(sx + 10, sy + 2); ctx.lineTo(sx - 10, sy + 2); ctx.closePath(); ctx.fill();
    ctx.fillRect(sx - .6, sy - 24, 1.2, 20); ctx.fillRect(sx + 7, sy - 18, 1, 14);
    ctx.fillStyle = sail; ctx.beginPath(); ctx.moveTo(sx - 9, sy - 21); ctx.lineTo(sx - 1, sy - 21); ctx.lineTo(sx - 1, sy - 8); ctx.quadraticCurveTo(sx - 5, sy - 6, sx - 9, sy - 8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(sx + 1, sy - 22); ctx.lineTo(sx + 11, sy - 18); ctx.lineTo(sx + 1, sy - 8); ctx.fill();
    ctx.fillStyle = `rgba(255,210,120,${lights})`; ctx.fillRect(sx + 9, sy - 4, 1.8, 1.8);
  },
  sakura({ col, far, lights, dk, c, sk }) {
    const { ctx, w, h, land: L } = this, fx = w * .32, base = h * .72;
    ctx.fillStyle = mix(far, '#8a7aaa', .35); ctx.beginPath(); ctx.moveTo(fx - 56, base); ctx.quadraticCurveTo(fx - 18, base - 20, fx - 8, h * .27); ctx.lineTo(fx + 8, h * .27); ctx.quadraticCurveTo(fx + 18, base - 20, fx + 56, base); ctx.closePath(); ctx.fill();
    ctx.fillStyle = mix('#ffffff', far, dk * .7); ctx.beginPath(); ctx.moveTo(fx - 8, h * .27); ctx.lineTo(fx + 8, h * .27); ctx.lineTo(fx + 13, h * .27 + 13); ctx.lineTo(fx + 6, h * .27 + 10); ctx.lineTo(fx, h * .27 + 16); ctx.lineTo(fx - 6, h * .27 + 10); ctx.lineTo(fx - 13, h * .27 + 13); ctx.closePath(); ctx.fill();
    this.fillPoly(L.far, mix(far, '#5a7a5a', .3), h);
    const tx = w * .74, ty = h * .74, red = mix('#d1381f', '#2a0a0a', dk * .7); ctx.fillStyle = red;     // torii
    ctx.fillRect(tx - 12, ty - 22, 3.2, 24); ctx.fillRect(tx + 9, ty - 22, 3.2, 24); ctx.fillRect(tx - 17, ty - 26, 34, 3.4); ctx.fillRect(tx - 14, ty - 19, 28, 2.4);
    ctx.fillStyle = mix('#222', '#000', dk); ctx.fillRect(tx - 19, ty - 28, 38, 2);
    this.fillPoly(L.near, col, h);
    L.trees.forEach(t => {
      const sw = Math.sin(this.t * .8 + t.ph) * 1.2, ty2 = h * .88, bloom = mix('#f9b8d0', '#6a3a5a', dk * .7), hi = mix('#ffd9e8', '#8a5a7a', dk * .7);
      ctx.strokeStyle = mix('#5a3a28', '#120a08', dk * .7); ctx.lineWidth = 3 * t.s; ctx.beginPath(); ctx.moveTo(t.x, ty2); ctx.quadraticCurveTo(t.x + 2, ty2 - 12 * t.s, t.x + sw, ty2 - 24 * t.s); ctx.stroke();
      [[0, -26, 11], [-9, -20, 8], [9, -20, 8.5], [-4, -31, 7], [5, -30, 7.5]].forEach(([dx, dy, r], i) => { ctx.fillStyle = i % 2 ? hi : bloom; ctx.beginPath(); ctx.arc(t.x + dx * t.s + sw, ty2 + dy * t.s, r * t.s, 0, 6.283); ctx.fill(); });
    });
  },
  tomb({ col, far, lights, dk, c, sk }) {
    const { ctx, w, h, land: L } = this, lit = mix('#ecc984', '#2a1c10', dk * .8), shd = mix('#b88a4e', '#140d06', dk * .85);
    this.fillPoly(L.far, mix(far, '#e8c27a', .3), h);
    L.pyr.forEach(p => {
      const base = h * .7 - (p.s < 20 ? 0 : 0), ax = p.x, ay = base - p.s;
      ctx.fillStyle = lit; ctx.beginPath(); ctx.moveTo(ax - p.s * .9, base); ctx.lineTo(ax, ay); ctx.lineTo(ax + 3, base); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shd; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + p.s * 1.05, base); ctx.lineTo(ax + 3, base); ctx.closePath(); ctx.fill();
    });
    this.fillPoly(L.near, mix(col, '#f2d08a', .12), h);
    ctx.fillStyle = mix(col, '#7a5a2a', .35); ctx.beginPath(); ctx.moveTo(0, h); for (let x = 0; x <= w; x += 6) ctx.lineTo(x, h * .86 + Math.sin(x * .06 + 2) * 4); ctx.lineTo(w, h); ctx.fill();
    const px = w * .82, py = h * .88, pc = mix('#3a5a2a', '#0a1208', dk * .8);     // palm
    ctx.strokeStyle = mix('#6a4a2a', '#100a06', dk * .8); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + 3, py - 14, px - 1, py - 26); ctx.stroke();
    ctx.strokeStyle = pc; ctx.lineWidth = 1.6; [[-12, 2], [12, 2], [-9, -5], [10, -5], [0, -8]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.moveTo(px - 1, py - 26); ctx.quadraticCurveTo(px - 1 + dx * .5, py - 31 + dy, px - 1 + dx, py - 22 + dy * 1.5); ctx.stroke(); });
    ctx.fillStyle = `rgba(255,255,255,${.05 * (1 - dk)})`; ctx.fillRect(0, h * .62, w, 6 + Math.sin(this.t * 1.4) * 2);   // heat shimmer
  },
  steampunk({ col, far, lights, dk, c, sk, V }) {
    const { ctx, w, h, land: L } = this, bcol = mix('#3a2a20', '#0a0806', clamp(dk * .8, 0, 1)), hz = h * .8;
    L.bld.forEach(b => {
      ctx.fillStyle = bcol; ctx.fillRect(b.x, hz - b.h, b.w, b.h + h * .2);
      if (b.ch) { ctx.fillRect(b.x + b.w * .6, hz - b.h - 9, 3, 10); this.smoke('b' + (b.x | 0), b.x + b.w * .6 + 1.5, hz - b.h - 9, mix('#cfc3b0', '#3a3530', dk * .8), V.wind); }
      ctx.fillStyle = `rgba(255,180,90,${.12 + lights * .6})`;
      for (let yy = hz - b.h + 4; yy < hz - 2; yy += 6) for (let xx = b.x + 2; xx < b.x + b.w - 2; xx += 5) if (((xx * 5 + yy * 7 + b.seed * 100) | 0) % 3 === 0) ctx.fillRect(xx, yy, 2, 3);
    });
    const kx = w * .3, ky = hz - 44;      // clock tower
    ctx.fillStyle = mix('#4a3626', '#0c0906', dk * .8); ctx.fillRect(kx - 8, ky, 16, 46); ctx.beginPath(); ctx.moveTo(kx - 10, ky); ctx.lineTo(kx, ky - 12); ctx.lineTo(kx + 10, ky); ctx.fill();
    ctx.fillStyle = mix('#f4e6c4', '#4a4030', dk * .7); ctx.beginPath(); ctx.arc(kx, ky + 11, 6, 0, 6.283); ctx.fill();
    const now = new Date(), mA = now.getMinutes() / 60 * 6.283 - 1.5708, hA = (now.getHours() % 12 + now.getMinutes() / 60) / 12 * 6.283 - 1.5708;
    ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(kx, ky + 11); ctx.lineTo(kx + Math.cos(mA) * 5, ky + 11 + Math.sin(mA) * 5); ctx.moveTo(kx, ky + 11); ctx.lineTo(kx + Math.cos(hA) * 3.2, ky + 11 + Math.sin(hA) * 3.2); ctx.stroke();
    this.fillPoly(L.near, col, h);
    this.gear(w * .88, h * .93, 20, 12, this.t * .3, mix('#6a4a32', '#1a110b', dk * .7));
    this.gear(w * .88 - 28, h * .96, 12, 9, -this.t * .45 + .3, mix('#7a5a3c', '#1a110b', dk * .7));
  }
};

/* ============================================================
   SceneFX — ambient particles over the library wall
   ============================================================ */
class SceneFX {
  constructor(cv) { this.cv = cv; this.ctx = cv.getContext('2d'); this.theme = 'grand'; this.t = 0; this.p = []; this.shoot = null; this.nextShoot = 6; this.resize(); }
  resize() {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    this.w = this.cv.clientWidth || 390; this.h = this.cv.clientHeight || 844;
    this.cv.width = this.w * d; this.cv.height = this.h * d; this.ctx.setTransform(d, 0, 0, d, 0, 0);
    this.build();
  }
  setTheme(t) { this.theme = t; this.build(); }
  build() {
    const { w, h } = this, r = Math.random, th = this.theme;
    const n = { grand: 46, arcade: 34, haunted: 18, starship: 70, treehouse: 26, dungeon: 44, cabin: 40, pirate: 34, sakura: 34, tomb: 42, steampunk: 20 }[th] || 30;
    this.p = Array.from({ length: n }, (_, i) => ({ x: r() * w, y: r() * h, s: .6 + r() * 1.8, v: 4 + r() * 12, ph: r() * 6.28, hue: r(), a: .3 + r() * .6, rot: r() * 6.28, k: i % 7 === 0 ? 1 : 0, l: r() }));
  }
  frame(dt) {
    this.t += dt;
    const { ctx, w, h, t, theme: th } = this;
    ctx.clearRect(0, 0, w, h);
    if (th === 'cabin') { const g = ctx.createRadialGradient(0, h, 10, 0, h, h * .8); g.addColorStop(0, `rgba(255,140,40,${.1 + .035 * Math.sin(t * 7) + .02 * Math.sin(t * 11)})`); g.addColorStop(1, 'rgba(255,140,40,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
    if (th === 'pirate') { const x = w * .1 + Math.sin(t * .8) * 24, g = ctx.createRadialGradient(x, 0, 4, x, 0, h * .55); g.addColorStop(0, 'rgba(255,200,100,.16)'); g.addColorStop(1, 'rgba(255,200,100,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
    if (th === 'tomb') [0, w].forEach((x, i) => { const g = ctx.createRadialGradient(x, h * .35, 4, x, h * .35, h * .4); g.addColorStop(0, `rgba(255,150,50,${.15 + .04 * Math.sin(t * 8 + i * 2)})`); g.addColorStop(1, 'rgba(255,150,50,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
    for (const p of this.p) {
      if (th === 'grand') {
        p.y -= p.v * dt * .5; p.x += Math.sin(t * .6 + p.ph) * 6 * dt; if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
        const a = p.a * (.5 + .5 * Math.sin(t * 1.4 + p.ph)); ctx.fillStyle = `rgba(255,214,140,${a * .75})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * .9, 0, 6.283); ctx.fill();
        if (p.k) { ctx.strokeStyle = `rgba(255,236,180,${a})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x - 4, p.y); ctx.lineTo(p.x + 4, p.y); ctx.moveTo(p.x, p.y - 4); ctx.lineTo(p.x, p.y + 4); ctx.stroke(); }
      } else if (th === 'arcade') {
        p.y -= p.v * dt * 1.4; p.rot += dt; if (p.y < -8) { p.y = h + 8; p.x = Math.random() * w; }
        const cols = ['#ff3df2', '#22e5ff', '#9dff3a', '#ffd23d']; ctx.fillStyle = cols[Math.floor(p.hue * 4)]; ctx.globalAlpha = p.a * (.6 + .4 * Math.sin(t * 3 + p.ph));
        const s = 2 + p.s * 1.6; ctx.fillRect(Math.round(p.x / 2) * 2, Math.round(p.y / 2) * 2, s, s); ctx.globalAlpha = 1;
      } else if (th === 'haunted') {
        p.x += Math.sin(t * .5 + p.ph) * 10 * dt + 3 * dt; p.y += Math.cos(t * .4 + p.ph) * 7 * dt - 2 * dt; if (p.x > w + 20) p.x = -20; if (p.y < -20) p.y = h + 10; if (p.y > h + 20) p.y = -10;
        const r = 9 + p.s * 7, g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r), a = .22 * (.5 + .5 * Math.sin(t + p.ph));
        const c = p.hue < .5 ? '125,255,155' : '180,140,255'; g.addColorStop(0, `rgba(${c},${a * 2})`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      } else if (th === 'starship') {
        const a = p.a * (.4 + .6 * Math.sin(t * 2 + p.ph)); ctx.fillStyle = `rgba(190,235,255,${a})`; ctx.fillRect(p.x, p.y, p.s * .8, p.s * .8);
        p.x -= p.v * dt * .3; if (p.x < 0) p.x = w;
      } else if (th === 'treehouse') {
        if (p.k) { p.y += p.v * dt * .8; p.x += Math.sin(t + p.ph) * 14 * dt; p.rot += dt * 1.5; if (p.y > h + 8) { p.y = -8; p.x = Math.random() * w; } ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = `rgba(${p.hue < .5 ? '150,200,70' : '220,170,60'},.7)`; ctx.beginPath(); ctx.ellipse(0, 0, 4, 2, 0, 0, 6.283); ctx.fill(); ctx.restore(); }
        else { p.x += Math.sin(t * .7 + p.ph) * 12 * dt; p.y += Math.cos(t * .6 + p.ph * 2) * 9 * dt; if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10; if (p.y < -10) p.y = h; if (p.y > h + 10) p.y = -10; const a = Math.max(0, Math.sin(t * 1.6 + p.ph)); const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 9); g.addColorStop(0, `rgba(230,255,120,${a * .9})`); g.addColorStop(1, 'rgba(230,255,120,0)'); ctx.fillStyle = g; ctx.fillRect(p.x - 9, p.y - 9, 18, 18); }
      } else if (th === 'dungeon') {
        p.y -= p.v * dt * 1.2; p.x += Math.sin(t * 1.2 + p.ph) * 10 * dt; if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
        const a = p.a * (.4 + .6 * Math.abs(Math.sin(t * 2.5 + p.ph))); ctx.fillStyle = `rgba(255,${120 + p.hue * 90 | 0},40,${a})`; ctx.fillRect(p.x, p.y, p.s, p.s);
      } else if (th === 'cabin') {       // fireplace embers + a few drifting snow-dust motes
        if (p.k) { p.y += p.v * dt * .6; p.x += Math.sin(t * .8 + p.ph) * 8 * dt; if (p.y > h + 4) { p.y = -4; p.x = Math.random() * w; } ctx.fillStyle = `rgba(255,255,255,${p.a * .5})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * .8, 0, 6.283); ctx.fill(); }
        else { p.y -= p.v * dt * .9; p.x += Math.sin(t * 1.1 + p.ph) * 9 * dt; if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w * .6; } const a = p.a * (.5 + .5 * Math.sin(t * 3 + p.ph)); ctx.fillStyle = `rgba(255,${150 + p.hue * 60 | 0},60,${a})`; ctx.fillRect(p.x, p.y, p.s, p.s); }
      } else if (th === 'pirate') {      // golden dust in the lantern light + sea spray
        p.x += Math.sin(t * .4 + p.ph) * 8 * dt + 2 * dt; p.y += Math.cos(t * .5 + p.ph) * 6 * dt - 1.5 * dt; if (p.x > w + 6) p.x = -6; if (p.y < -6) p.y = h + 6; if (p.y > h + 6) p.y = -6;
        const a = p.a * (.4 + .6 * Math.sin(t * 1.3 + p.ph)); ctx.fillStyle = p.k ? `rgba(200,235,255,${a * .6})` : `rgba(255,215,130,${a * .7})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (p.k ? .7 : .9), 0, 6.283); ctx.fill();
      } else if (th === 'sakura') {      // falling petals
        p.y += (12 + p.v * 1.3) * dt; p.x += Math.sin(t * 1.2 + p.ph) * 18 * dt + 6 * dt; p.rot += dt * (1 + p.hue * 2);
        if (p.y > h + 8) { p.y = -8; p.x = Math.random() * w; } if (p.x > w + 8) p.x = -8;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, .6 + .4 * Math.sin(t * 2 + p.ph)); ctx.fillStyle = `rgba(${p.hue < .5 ? '255,190,214' : '255,222,235'},${.55 + p.a * .4})`;
        ctx.beginPath(); ctx.ellipse(0, 0, 2.6 + p.s, 1.6 + p.s * .5, 0, 0, 6.283); ctx.fill(); ctx.restore();
      } else if (th === 'tomb') {        // blowing sand + golden glints
        if (p.k) { const a = Math.max(0, Math.sin(t * 2 + p.ph)); ctx.strokeStyle = `rgba(255,224,130,${a})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x - 3, p.y); ctx.lineTo(p.x + 3, p.y); ctx.moveTo(p.x, p.y - 3); ctx.lineTo(p.x, p.y + 3); ctx.stroke(); }
        else { p.x += (18 + p.v * 2) * dt; p.y += Math.sin(t * 1.5 + p.ph) * 6 * dt; if (p.x > w + 4) { p.x = -4; p.y = Math.random() * h; } ctx.fillStyle = `rgba(232,196,128,${p.a * .55})`; ctx.fillRect(p.x, p.y, p.s * 1.2, p.s * .7); }
      } else if (th === 'steampunk') {    // rising steam
        p.l += dt * .1; if (p.l >= 1) { p.l = 0; p.x = Math.random() * w; p.y = h * (.55 + Math.random() * .45); }
        p.y -= (8 + p.v) * dt; p.x += Math.sin(t * .6 + p.ph) * 5 * dt;
        const r = 8 + p.l * 34, a = Math.sin(p.l * Math.PI) * .13, g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); g.addColorStop(0, `rgba(235,225,205,${a})`); g.addColorStop(1, 'rgba(235,225,205,0)'); ctx.fillStyle = g; ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
        if (p.k) { ctx.fillStyle = `rgba(255,190,100,${.4 + .4 * Math.sin(t * 5 + p.ph)})`; ctx.fillRect(p.x, p.y, 1.4, 1.4); }
      }
    }
    if (th === 'starship') {
      this.nextShoot -= dt;
      if (this.nextShoot <= 0 && !this.shoot) { this.shoot = { x: Math.random() * w * .8 + w * .2, y: Math.random() * h * .4, l: 0 }; this.nextShoot = 7 + Math.random() * 9; }
      if (this.shoot) { const s = this.shoot; s.l += dt * 3; s.x -= dt * 260; s.y += dt * 120; const g = ctx.createLinearGradient(s.x, s.y, s.x + 60, s.y - 28); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + 60, s.y - 28); ctx.stroke(); if (s.l > 1.4) this.shoot = null; }
    }
  }
}
