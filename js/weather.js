'use strict';
/* ============================================================
   LOREBOOK — weather data (Open-Meteo, no API key) + the little
   window renderer + ambient scene particles
   ============================================================ */

const SIM = {
  sunny: { code: 0, cloud: 5, wind: 6 }, partly: { code: 2, cloud: 55, wind: 12 }, cloudy: { code: 3, cloud: 100, wind: 14 },
  drizzle: { code: 53, cloud: 85, wind: 10 }, rain: { code: 63, cloud: 95, wind: 18 }, storm: { code: 95, cloud: 100, wind: 34 },
  snow: { code: 73, cloud: 90, wind: 8 }, fog: { code: 45, cloud: 80, wind: 3 }
};
const SIM_LABELS = { live: 'Live (real weather)', sunny: 'Sunny', partly: 'Partly cloudy', cloudy: 'Cloudy', drizzle: 'Drizzle', rain: 'Rain', storm: 'Thunderstorm', snow: 'Snow', fog: 'Fog' };
const SIMT_LABELS = { live: 'Live (real time)', dawn: 'Sunrise', day: 'Midday', dusk: 'Sunset', night: 'Midnight' };

const hm = s => { const t = String(s).split('T')[1] || '00:00'; const [h, m] = t.split(':').map(Number); return h * 60 + m; };

const Wx = {
  data: CFG.wxCache || null,
  status: 'idle',
  geolocate() {
    return new Promise((res, rej) => {
      if (!navigator.geolocation) return rej(new Error('Geolocation is not available here.'));
      navigator.geolocation.getCurrentPosition(
        p => res({ lat: +p.coords.latitude.toFixed(3), lon: +p.coords.longitude.toFixed(3), name: 'Current location', src: 'gps' }),
        e => rej(new Error(e.code === 1 ? 'Location permission was denied.' : 'Could not get your location.')),
        { timeout: 12000, maximumAge: 600000 });
    });
  },
  async searchCity(q) {
    const r = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(q) + '&count=5&language=en&format=json');
    const j = await r.json();
    return (j.results || []).map(x => ({ lat: +x.latitude.toFixed(3), lon: +x.longitude.toFixed(3), name: [x.name, x.admin1, x.country_code].filter(Boolean).join(', '), src: 'city' }));
  },
  setLoc(loc) { CFG.loc = loc; CFG.locAt = Date.now(); this.data = null; CFG.wxCache = null; saveCfg(); },
  async refresh(force) {
    const loc = CFG.loc; if (!loc) return false;
    if (!force && this.data && Date.now() - this.data.at < CFG.wxMinutes * 60000) return false;
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=weather_code,cloud_cover,wind_speed_10m,is_day&daily=sunrise,sunset&timezone=auto&forecast_days=1&wind_speed_unit=kmh`;
      const r = await fetch(url); if (!r.ok) throw new Error('bad');
      const j = await r.json();
      this.data = { code: j.current.weather_code, cloud: j.current.cloud_cover, wind: j.current.wind_speed_10m, sr: hm(j.daily.sunrise[0]), ss: hm(j.daily.sunset[0]), off: j.utc_offset_seconds, at: Date.now() };
      CFG.wxCache = this.data; saveCfg();
      this.status = 'ok';
      return true;
    } catch (e) { this.status = 'offline'; return false; }
  },
  /** the current "view" of the sky: minute-of-day, sunrise/sunset and the weather condition */
  view() {
    const d = this.data;
    let sr = d ? d.sr : 390, ss = d ? d.ss : 1110, m;
    if (d && d.off != null) { const t = new Date(Date.now() + d.off * 1000); m = t.getUTCHours() * 60 + t.getUTCMinutes() + t.getUTCSeconds() / 60; }
    else { const n = new Date(); m = n.getHours() * 60 + n.getMinutes() + n.getSeconds() / 60; }
    if (CFG.simTime !== 'live') m = { dawn: sr + 12, day: (sr + ss) / 2, dusk: ss - 8, night: 90 }[CFG.simTime];
    let code = d ? d.code : 1, cloud = d ? d.cloud : 25, wind = d ? d.wind : 8;
    if (CFG.simCond !== 'live' && SIM[CFG.simCond]) { const s = SIM[CFG.simCond]; code = s.code; cloud = s.cloud; wind = s.wind; }
    return { m, sr, ss, wind, cond: condFrom(code, cloud) };
  }
};

function condFrom(code, cloud) {
  const c = { clouds: clamp((cloud ?? 20) / 100, 0, 1), precip: null, inten: 0, fog: 0, storm: false };
  if (code === 0) c.clouds = Math.min(c.clouds, .12);
  else if (code === 1) c.clouds = clamp(c.clouds, .15, .4);
  else if (code === 2) c.clouds = clamp(c.clouds, .4, .65);
  else if (code === 3) c.clouds = Math.max(c.clouds, .9);
  if (code === 45 || code === 48) { c.fog = .8; c.clouds = Math.max(c.clouds, .6); }
  if (code >= 51 && code <= 57) { c.precip = 'rain'; c.inten = .3; c.clouds = Math.max(c.clouds, .8); }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) { c.precip = 'rain'; c.inten = (code === 65 || code === 82) ? 1 : (code === 63 || code === 81) ? .7 : .5; c.clouds = Math.max(c.clouds, .85); }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) { c.precip = 'snow'; c.inten = (code === 75 || code === 86) ? 1 : code === 73 ? .7 : .45; c.clouds = Math.max(c.clouds, .85); }
  if (code >= 95) { c.precip = 'rain'; c.inten = .95; c.storm = true; c.clouds = 1; }
  return c;
}

/* ---------- sky palette ---------- */
const SKY = {
  night: { t: '#070b24', b: '#1c2a5c', dk: 1 }, pre: { t: '#2b2a66', b: '#ff9a7a', dk: .55 }, morn: { t: '#5fb4ff', b: '#ffe0b0', dk: .05 },
  day: { t: '#3a96f0', b: '#b5e3ff', dk: 0 }, gold: { t: '#4a7fd0', b: '#ffc88a', dk: .05 }, dusk: { t: '#35286e', b: '#ff6f5a', dk: .35 }, twi: { t: '#141a4a', b: '#5a3a7a', dk: .75 }
};
function skyAt(m, sr, ss) {
  const kf = [[sr - 90, 'night'], [sr - 30, 'pre'], [sr + 30, 'morn'], [sr + 110, 'day'], [ss - 110, 'day'], [ss - 35, 'gold'], [ss + 5, 'dusk'], [ss + 50, 'twi'], [ss + 100, 'night']];
  if (m <= kf[0][0] || m >= kf[kf.length - 1][0]) return { ...SKY.night };
  for (let i = 0; i < kf.length - 1; i++) {
    if (m < kf[i + 1][0]) {
      const t = (m - kf[i][0]) / (kf[i + 1][0] - kf[i][0]), a = SKY[kf[i][1]], b = SKY[kf[i + 1][1]];
      return { t: mix(a.t, b.t, t), b: mix(a.b, b.b, t), dk: lerp(a.dk, b.dk, t) };
    }
  }
  return { ...SKY.night };
}
function moonPhase() { const days = Date.now() / 86400000 - 10962.76; return ((days / 29.530588) % 1 + 1) % 1; }

/* ============================================================
   SkyWindow — the weather/time-of-day canvas inside the window
   ============================================================ */
class SkyWindow {
  constructor(cv) {
    this.cv = cv; this.ctx = cv.getContext('2d');
    this.theme = 'grand'; this.t = 0;
    this.flash = 0; this.nextBolt = 4; this.bolt = null;
    this.fly = null; this.nextFly = 6; this.drops = []; this.rain = []; this.snow = [];
    this.stars = []; this.clouds = []; this.cloudKey = '';
    this.moon = null; this.moonKey = '';
    this.onBolt = null;
    this.resize();
  }
  setTheme(t) { this.theme = t; this.buildLand(); }
  resize() {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(20, this.cv.clientWidth); this.h = Math.max(20, this.cv.clientHeight);
    this.cv.width = this.w * d; this.cv.height = this.h * d;
    this.ctx.setTransform(d, 0, 0, d, 0, 0);
    const r = rng(77);
    this.stars = Array.from({ length: 46 }, () => ({ x: r() * this.w, y: r() * this.h * .7, s: .5 + r() * 1.3, p: r() * 6.28 }));
    this.drops = Array.from({ length: 8 }, () => ({ x: r() * this.w, y: r() * this.h, r: 1.2 + r() * 1.8, v: .1 + r() * .35 }));
    this.cloudKey = '';
    this.buildLand();
  }
  seedClouds(n) {
    const r = rng(1234 + n);
    this.clouds = Array.from({ length: n }, () => ({ x: r() * (this.w + 60) - 30, y: this.h * (.06 + r() * .42), r: 7 + r() * 9, sp: .08 + r() * .16, a: .55 + r() * .4 }));
  }
  buildLand() {
    const w = this.w, h = this.h, r = rng(hash(this.theme) + 5);
    const L = this.land = { far: [], near: [], bld: [], graves: [], pines: [], towers: [] };
    for (let x = 0; x <= w + 6; x += 6) { L.far.push([x, h * .66 + Math.sin(x * .05 + 1) * 5 + Math.sin(x * .13) * 3]); L.near.push([x, h * .78 + Math.sin(x * .07 + 3) * 4 + Math.sin(x * .19) * 2]); }
    if (this.theme === 'arcade') { let x = -4; while (x < w) { const bw = 12 + r() * 16, bh = h * (.18 + r() * .34); L.bld.push({ x, w: bw, h: bh, hue: r() < .5 ? '#ff3df2' : '#22e5ff', seed: r() }); x += bw + 1; } }
    if (this.theme === 'haunted') { for (let i = 0; i < 6; i++) L.graves.push({ x: 8 + r() * (w - 16), s: .7 + r() * .6, k: r() < .4 ? 'cross' : 'stone' }); }
    if (this.theme === 'treehouse') { for (let i = 0; i < 18; i++) L.pines.push({ x: r() * w, s: .7 + r() * .8, d: r() < .5 ? 0 : 1 }); L.pines.sort((a, b) => a.d - b.d); }
    if (this.theme === 'dungeon' || this.theme === 'starship') { L.peaks = []; for (let x = -6; x <= w + 12; x += 12 + r() * 10) L.peaks.push([x, h * (.58 + r() * .12)]); }
  }
  landColor(dk, c) { return mix(mix('#34465c', '#080a12', clamp(dk * 1.05, 0, 1)), '#4a4f58', c.clouds * .25 * (1 - dk)); }

  frame(dt) {
    this.t += dt;
    const V = Wx.view(), c = V.cond, { w, h, ctx } = this;
    const sk = skyAt(V.m, V.sr, V.ss), dk = sk.dk;
    const gray = mix('#7d8696', '#10131f', dk), gm = clamp(c.clouds * .5 + c.inten * .25 + c.fog * .15, 0, .8);
    const top = mix(sk.t, gray, gm), bot = mix(sk.b, gray, gm * .85);
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    // stars
    const sa = dk * (1 - c.clouds * .85) * (1 - c.fog * .6);
    if (sa > .03) for (const s of this.stars) { ctx.globalAlpha = sa * (.45 + .55 * Math.sin(this.t * 2 + s.p)); ctx.fillStyle = '#fff'; ctx.fillRect(s.x, s.y, s.s, s.s); }
    ctx.globalAlpha = 1;

    // theme sky object (starship planet)
    if (this.theme === 'starship') this.drawPlanet(dk);

    // sun / moon
    const day = V.m > V.sr - 15 && V.m < V.ss + 15;
    if (day) {
      const p = clamp((V.m - V.sr) / (V.ss - V.sr), 0, 1), x = w * (.14 + .72 * p), y = h * (.62 - .5 * Math.sin(Math.PI * p));
      const low = 1 - Math.sin(Math.PI * p), col = mix('#fff6c0', '#ff8a3d', clamp(low * 1.3 - .1, 0, 1)), vis = 1 - c.clouds * .7 - c.fog * .2;
      const gl = ctx.createRadialGradient(x, y, 0, x, y, 34); gl.addColorStop(0, rgba(col, .6 * vis)); gl.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = gl; ctx.fillRect(x - 36, y - 36, 72, 72);
      ctx.globalAlpha = clamp(vis + .2, 0, 1); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1;
    } else {
      const nl = 1440 - (V.ss - V.sr), mm = V.m >= V.ss ? V.m - V.ss : V.m + 1440 - V.ss, p = clamp(mm / nl, 0, 1);
      const x = w * (.14 + .72 * p), y = h * (.6 - .46 * Math.sin(Math.PI * p));
      this.drawMoon(x, y, 9, 1 - c.clouds * .55 - c.fog * .3);
    }

    this.drawClouds(V, sk, dt);
    this.drawLand(V, sk);
    this.drawFlyers(V, sk, dt);
    if (c.fog > 0) this.drawFog(c, dk);
    this.drawPrecip(V, c, dt);
    this.drawGlass(c, dt);
    if (c.storm) this.drawStorm(dt);
  }

  drawMoon(x, y, r, vis) {
    const ph = moonPhase(), key = ph.toFixed(2);
    if (this.moonKey !== key) {
      const s = document.createElement('canvas'); s.width = s.height = 64; const q = s.getContext('2d');
      q.fillStyle = '#f6f2d4'; q.beginPath(); q.arc(32, 32, 24, 0, 6.283); q.fill();
      q.fillStyle = 'rgba(0,0,0,.08)'; [[24, 26, 5], [38, 36, 6], [30, 42, 3]].forEach(c => { q.beginPath(); q.arc(c[0], c[1], c[2], 0, 6.283); q.fill(); });
      const illum = (1 - Math.cos(ph * 6.283)) / 2, dx = (ph < .5 ? -1 : 1) * 48 * illum;
      q.globalCompositeOperation = 'destination-out'; q.beginPath(); q.arc(32 + dx, 32, 24.5, 0, 6.283); q.fill();
      this.moon = s; this.moonKey = key;
    }
    const gl = this.ctx.createRadialGradient(x, y, 0, x, y, 30); gl.addColorStop(0, `rgba(220,230,255,${.28 * vis})`); gl.addColorStop(1, 'rgba(220,230,255,0)');
    this.ctx.fillStyle = gl; this.ctx.fillRect(x - 32, y - 32, 64, 64);
    this.ctx.globalAlpha = clamp(vis, 0, 1); this.ctx.drawImage(this.moon, x - r, y - r, r * 2, r * 2); this.ctx.globalAlpha = 1;
  }
  drawPlanet(dk) {
    const { ctx, w, h } = this, x = w * .7, y = h * .3, a = .55 + dk * .4;
    ctx.save(); ctx.globalAlpha = a;
    const g = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, 17); g.addColorStop(0, '#ffd9a0'); g.addColorStop(1, '#a8506a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 14, 0, 6.283); ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,200,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, 25, 6, -.35, 0, 6.283); ctx.stroke();
    ctx.restore();
  }
  drawClouds(V, sk, dt) {
    const c = V.cond, n = Math.round(c.clouds < .12 ? 1 : 2 + c.clouds * 7), key = n + '|' + this.w;
    if (key !== this.cloudKey) { this.seedClouds(n); this.cloudKey = key; }
    const dk = sk.dk, ctx = this.ctx;
    let col = mix('#ffffff', '#8b93a3', clamp(c.clouds * .5 + c.inten * .5, 0, .85));
    col = mix(col, '#1a2040', dk * .78);
    const warm = clamp(1 - Math.abs(dk - .3) / .3, 0, 1) * .4; col = mix(col, '#ffb48a', warm * (1 - c.inten));
    const shadow = shade(col, -.18), speed = 1 + V.wind / 14;
    for (const cl of this.clouds) {
      cl.x += cl.sp * speed * dt * 8; if (cl.x > this.w + 40) cl.x = -50;
      ctx.globalAlpha = cl.a * (c.clouds < .12 ? .5 : 1);
      const r = cl.r;
      [[0, 3, 1, shadow], [-r * .9, 2, .75, shadow], [r * .9, 3, .8, shadow], [0, 0, 1, col], [-r * .9, 1, .72, col], [r * .95, 1.5, .78, col], [r * .3, -r * .35, .7, col]].forEach(([ox, oy, k, cc]) => {
        ctx.fillStyle = cc; ctx.beginPath(); ctx.arc(cl.x + ox, cl.y + oy, r * k, 0, 6.283); ctx.fill();
      });
    }
    ctx.globalAlpha = 1;
  }
  drawLand(V, sk) {
    const { ctx, w, h, land: L } = this, dk = sk.dk, c = V.cond, th = this.theme;
    const col = this.landColor(dk, c), far = mix(col, sk.b, .42 * (1 - dk * .6)), lights = clamp(dk * 1.4 - .1, 0, 1);
    const poly = (pts, color, base) => { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(pts[0][0], base); pts.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(pts[pts.length - 1][0], base); ctx.closePath(); ctx.fill(); };
    if (th === 'dungeon' || th === 'starship') {
      poly(L.peaks.flatMap((p, i) => i ? [[(p[0] + L.peaks[i - 1][0]) / 2, h * .8], p] : [p]), far, h);
    } else poly(L.far, far, h);

    if (th === 'grand') {           // castle on the hill
      ctx.fillStyle = col; const bx = w * .62, by = h * .7;
      ctx.fillRect(bx, by - 18, 22, 20); ctx.fillRect(bx - 8, by - 28, 8, 30); ctx.fillRect(bx + 22, by - 34, 9, 36);
      [[bx - 9, by - 28, 10], [bx + 21, by - 34, 11], [bx + 5, by - 18, 12]].forEach(([x, y, ww]) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + ww / 2, y - 10); ctx.lineTo(x + ww, y); ctx.fill(); });
      ctx.fillStyle = `rgba(255,210,110,${lights})`; [[bx + 4, by - 12], [bx + 13, by - 12], [bx - 5, by - 20], [bx + 25, by - 26]].forEach(([x, y]) => ctx.fillRect(x, y, 3, 4));
    }
    if (th === 'arcade') {
      L.bld.forEach(b => {
        ctx.fillStyle = mix(col, '#1a0b3d', .4); ctx.fillRect(b.x, h * .8 - b.h, b.w, b.h + h * .2);
        ctx.fillStyle = rgba(b.hue, .15 + lights * .5);
        for (let yy = h * .8 - b.h + 4; yy < h * .78; yy += 6) for (let xx = b.x + 2; xx < b.x + b.w - 2; xx += 5) if (((xx * 7 + yy * 3 + b.seed * 100) | 0) % 3) ctx.fillRect(xx, yy, 2, 3);
        ctx.fillStyle = rgba(b.hue, .5 + lights * .5); ctx.fillRect(b.x, h * .8 - b.h - 1, b.w, 1.2);
      });
      if (lights > .1) { ctx.fillStyle = `rgba(255,61,242,${.5 + .4 * Math.sin(this.t * 3)})`; ctx.fillRect(w * .12, h * .46, 18, 3); ctx.fillStyle = `rgba(34,229,255,${.5 + .4 * Math.sin(this.t * 3 + 2)})`; ctx.fillRect(w * .5, h * .38, 3, 14); }
    }
    if (th === 'haunted') {
      ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 2;
      const tx = w * .2, ty = h * .78; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx - 4, ty - 18, tx + 2, ty - 30); ctx.stroke();
      [[tx + 1, ty - 22, -12, -8], [tx, ty - 16, 11, -9], [tx + 2, ty - 30, 8, -10], [tx + 2, ty - 30, -9, -6]].forEach(([x, y, dx, dy]) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke(); });
    }
    if (th === 'treehouse') {
      L.pines.filter(p => p.d === 0).forEach(p => this.pine(p.x, h * .8, p.s, mix(col, sk.b, .25)));
    }
    if (th === 'dungeon') {
      const tx = w * .7, ty = h * .76; ctx.fillStyle = mix(col, '#2a2a33', .3); ctx.fillRect(tx, ty - 26, 11, 28);
      ctx.beginPath(); ctx.moveTo(tx - 2, ty - 26); ctx.lineTo(tx + 5.5, ty - 38); ctx.lineTo(tx + 13, ty - 26); ctx.fill();
      ctx.fillStyle = `rgba(255,150,60,${.3 + lights * .7})`; ctx.fillRect(tx + 4, ty - 18, 3, 5);
    }
    poly(L.near, col, h);
    if (th === 'haunted') L.graves.forEach(g => { ctx.fillStyle = col; const y = h * .79 + Math.sin(g.x * .07 + 3) * 3; if (g.k === 'cross') { ctx.fillRect(g.x, y - 10 * g.s, 2, 11 * g.s); ctx.fillRect(g.x - 3, y - 7 * g.s, 8, 2); } else { ctx.beginPath(); ctx.moveTo(g.x - 3, y + 1); ctx.lineTo(g.x - 3, y - 6 * g.s); ctx.arc(g.x, y - 6 * g.s, 3, Math.PI, 0); ctx.lineTo(g.x + 3, y + 1); ctx.fill(); } });
    if (th === 'treehouse') {
      L.pines.filter(p => p.d === 1).forEach(p => this.pine(p.x, h * .86, p.s * 1.2, shade(col, -.15)));
      ctx.fillStyle = `rgba(255,200,90,${lights})`; ctx.fillRect(w * .34, h * .78, 4, 4);
    }
    // ground fill below near hills
    ctx.fillStyle = col; ctx.fillRect(0, h * .9, w, h * .1);
  }
  pine(x, base, s, col) {
    const ctx = this.ctx; ctx.fillStyle = col;
    for (let i = 0; i < 3; i++) { const y = base - i * 8 * s, ww = (12 - i * 3) * s; ctx.beginPath(); ctx.moveTo(x - ww / 2, y); ctx.lineTo(x, y - 14 * s); ctx.lineTo(x + ww / 2, y); ctx.fill(); }
  }
  drawFlyers(V, sk, dt) {
    const { ctx, w, h } = this, th = this.theme, dk = sk.dk, c = V.cond;
    this.nextFly -= dt;
    if (!this.fly && this.nextFly <= 0) {
      this.nextFly = 14 + Math.random() * 22;
      const kinds = { grand: dk < .5 ? 'birds' : 'owl', treehouse: 'birds', haunted: 'bats', dungeon: 'dragon', starship: 'ufo', arcade: 'blimp' };
      const k = kinds[th]; if (k === 'birds' && dk > .6) return; if (k === 'owl') return;
      if (c.precip && k !== 'ufo' && k !== 'bats') return;
      this.fly = { k, x: -20, y: h * (.18 + Math.random() * .25), sp: 14 + Math.random() * 10, t: 0 };
    }
    const f = this.fly; if (!f) return;
    f.t += dt; f.x += f.sp * dt;
    const bob = Math.sin(f.t * 3) * 2, flap = Math.sin(f.t * 12), col = this.landColor(Math.max(dk, .4), c);
    ctx.save(); ctx.translate(f.x, f.y + bob); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.4;
    if (f.k === 'birds' || f.k === 'bats') {
      for (let i = 0; i < (f.k === 'bats' ? 3 : 3); i++) { const ox = i * 10, oy = (i % 2) * 5; ctx.beginPath(); ctx.moveTo(ox - 4, oy - 2 + flap * 2); ctx.quadraticCurveTo(ox - 2, oy - 3, ox, oy); ctx.quadraticCurveTo(ox + 2, oy - 3, ox + 4, oy - 2 + flap * 2); ctx.stroke(); if (f.k === 'bats') ctx.fillRect(ox - 1, oy - 1, 2, 3); }
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
    }
    ctx.restore();
    if (f.x > w + 30) this.fly = null;
  }
  drawFog(c, dk) {
    const { ctx, w, h } = this, base = mix('#e6eaf0', '#2a3045', dk * .85);
    for (let i = 0; i < 4; i++) {
      const y = h * (.45 + i * .14) + Math.sin(this.t * .4 + i) * 3, x = Math.sin(this.t * .15 + i * 2) * 14;
      const g = ctx.createLinearGradient(0, y - 18, 0, y + 18); g.addColorStop(0, rgba(base, 0)); g.addColorStop(.5, rgba(base, c.fog * .38)); g.addColorStop(1, rgba(base, 0));
      ctx.fillStyle = g; ctx.fillRect(x - 20, y - 18, w + 40, 36);
    }
    ctx.fillStyle = rgba(base, c.fog * .2); ctx.fillRect(0, 0, w, h);
  }
  drawPrecip(V, c, dt) {
    const { ctx, w, h } = this;
    if (!c.precip) { this.rain.length = 0; this.snow.length = 0; return; }
    const want = Math.round(14 + c.inten * (c.precip === 'rain' ? 90 : 60));
    const lean = clamp(V.wind / 40, 0, .8);
    if (c.precip === 'rain') {
      this.snow.length = 0;
      while (this.rain.length < want) this.rain.push({ x: Math.random() * (w + 30), y: Math.random() * h, v: 150 + Math.random() * 90, l: 5 + Math.random() * 6 });
      this.rain.length = want;
      ctx.strokeStyle = 'rgba(190,215,255,.55)'; ctx.lineWidth = 1; ctx.beginPath();
      for (const p of this.rain) { p.y += p.v * dt * (.6 + c.inten * .6); p.x -= p.v * dt * lean * .6; if (p.y > h) { p.y = -10; p.x = Math.random() * (w + 30); } ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.l * lean * .6, p.y - p.l); }
      ctx.stroke();
    } else {
      this.rain.length = 0;
      while (this.snow.length < want) this.snow.push({ x: Math.random() * w, y: Math.random() * h, r: .8 + Math.random() * 1.8, v: 14 + Math.random() * 18, ph: Math.random() * 6 });
      this.snow.length = want;
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      for (const p of this.snow) { p.y += p.v * dt; p.x += Math.sin(this.t * 1.5 + p.ph) * 8 * dt - V.wind * dt * .3; if (p.y > h) { p.y = -4; p.x = Math.random() * w; } if (p.x < -3) p.x = w + 3; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }
    }
  }
  drawGlass(c, dt) {
    const { ctx, w, h } = this;
    if (c.precip === 'rain') {
      for (const d of this.drops) {
        d.y += d.v * dt * 12 * c.inten; if (d.y > h + 4) { d.y = -4; d.x = Math.random() * w; }
        ctx.fillStyle = 'rgba(210,230,255,.28)'; ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r * .7, d.r, 0, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(d.x - d.r * .3, d.y - d.r * .5, 1, 1);
      }
    }
    if (c.precip === 'snow') {
      [[0, h], [w, h]].forEach(([x, y]) => { const g = ctx.createRadialGradient(x, y, 0, x, y, 52); g.addColorStop(0, 'rgba(235,245,255,.7)'); g.addColorStop(1, 'rgba(235,245,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - 52, y - 52, 104, 104); });
    }
  }
  drawStorm(dt) {
    const { ctx, w, h } = this;
    this.nextBolt -= dt;
    if (this.nextBolt <= 0) {
      this.nextBolt = 3 + Math.random() * 6; this.flash = 1;
      let x = w * (.2 + Math.random() * .6), y = 0; const pts = [[x, y]];
      while (y < h * .66) { y += 8 + Math.random() * 9; x += (Math.random() - .5) * 18; pts.push([x, y]); }
      this.bolt = pts;
      if (this.onBolt) this.onBolt();
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(235,240,255,${this.flash * .5})`; ctx.fillRect(0, 0, w, h);
      if (this.bolt && this.flash > .4) {
        ctx.strokeStyle = `rgba(255,255,255,${this.flash})`; ctx.lineWidth = 2; ctx.shadowColor = '#bcd4ff'; ctx.shadowBlur = 8;
        ctx.beginPath(); this.bolt.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.shadowBlur = 0;
      }
      this.flash = Math.max(0, this.flash - dt * 3.2);
    }
  }
}

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
    const n = { grand: 46, arcade: 34, haunted: 18, starship: 70, treehouse: 26, dungeon: 44 }[th] || 30;
    this.p = Array.from({ length: n }, (_, i) => ({
      x: r() * w, y: r() * h, s: .6 + r() * 1.8, v: 4 + r() * 12, ph: r() * 6.28, hue: r(), a: .3 + r() * .6, rot: r() * 6.28, k: i % 7 === 0 ? 1 : 0
    }));
  }
  frame(dt) {
    this.t += dt;
    const { ctx, w, h, t, theme: th } = this;
    ctx.clearRect(0, 0, w, h);
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
      }
    }
    if (th === 'starship') {
      this.nextShoot -= dt;
      if (this.nextShoot <= 0 && !this.shoot) { this.shoot = { x: Math.random() * w * .8 + w * .2, y: Math.random() * h * .4, l: 0 }; this.nextShoot = 7 + Math.random() * 9; }
      if (this.shoot) { const s = this.shoot; s.l += dt * 3; s.x -= dt * 260; s.y += dt * 120; const g = ctx.createLinearGradient(s.x, s.y, s.x + 60, s.y - 28); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + 60, s.y - 28); ctx.stroke(); if (s.l > 1.4) this.shoot = null; }
    }
  }
}
