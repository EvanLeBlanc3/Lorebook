'use strict';
/* ============================================================
   LOREBOOK — weather data (Open-Meteo, no API key) + the sky
   renderer for the little window. Theme-specific scenery lives
   in scenery.js.
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
   (landscape, flyers and landColor are supplied by scenery.js)
   ============================================================ */
class SkyWindow {
  constructor(cv) {
    this.cv = cv; this.ctx = cv.getContext('2d');
    this.theme = 'grand'; this.t = 0; this.dt = .03;
    this.flash = 0; this.nextBolt = 4; this.bolt = null;
    this.fly = null; this.nextFly = 6; this.drops = []; this.rain = []; this.snow = [];
    this.stars = []; this.clouds = []; this.cloudKey = '';
    this.moon = null; this.moonKey = '';
    this.onBolt = null;
    this.resize();
  }
  setTheme(t) { this.theme = t; this.fly = null; this.buildLand(); }
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

  frame(dt) {
    this.t += dt;
    const V = Wx.view(), c = V.cond, { w, h, ctx } = this;
    const sk = skyAt(V.m, V.sr, V.ss), WT = (typeof WINCFG !== 'undefined' && WINCFG[this.theme]) || {};
    if (WT.tint) { sk.t = mix(sk.t, WT.tint, WT.amt); sk.b = mix(sk.b, WT.tint2 || WT.tint, WT.amt * .9); }
    const dk = sk.dk; this.dt = dt;
    const gray = mix('#7d8696', '#10131f', dk), gm = clamp(c.clouds * .5 + c.inten * .25 + c.fog * .15, 0, .8);
    const top = mix(sk.t, gray, gm), bot = mix(sk.b, gray, gm * .85);
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    // stars
    const sa = Math.max(dk, WT.stars || 0) * (1 - c.clouds * .85) * (1 - c.fog * .6);
    if (sa > .03) for (const s of this.stars) { ctx.globalAlpha = sa * (.45 + .55 * Math.sin(this.t * 2 + s.p)); ctx.fillStyle = '#fff'; ctx.fillRect(s.x, s.y, s.s, s.s); }
    ctx.globalAlpha = 1;

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
