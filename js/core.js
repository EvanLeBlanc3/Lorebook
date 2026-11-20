'use strict';
/* ============================================================
   LOREBOOK — core: utilities, config, database, sound
   ============================================================ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sleep = ms => new Promise(r => setTimeout(r, ms));
function hash(str) { let h = 2166136261; str = String(str); for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];

/* ---------- colour helpers ---------- */
function hex2rgb(h) { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgb2hex(r, g, b) { return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); }
function shade(h, amt) { return amt < 0 ? mix(h, '#000000', -amt) : mix(h, '#ffffff', amt); }
function lum(h) { const [r, g, b] = hex2rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; }
function textOn(h) { return lum(h) > .4 ? '#1b1208' : '#fff8e8'; }
function rgba(h, a) { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; }

/* ---------- dates ---------- */
const fmtDate = ts => new Date(ts).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const fmtDateLong = ts => new Date(ts).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const fmtTime = ts => new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
const fmtShort = ts => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const dayKey = ts => { const d = new Date(ts); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
function ago(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + ' min ago';
  if (s < 86400) return Math.floor(s / 3600) + ' hr ago';
  const d = Math.floor(s / 86400);
  return d === 1 ? 'yesterday' : d + ' days ago';
}

/* ---------- config (localStorage) ---------- */
const DEFAULT_CFG = {
  theme: 'grand', sound: true, vol: 0.7, ambient: false, enterSaves: false,
  wxMinutes: 30, loc: null, locAt: 0, welcomed: false,
  xp: 0, ach: {}, lastBackup: 0, nudgeDismissed: 0,
  simCond: 'live', simTime: 'live', sortDesc: false, wxCache: null, seen: {},
  shelfSort: 'custom', shelfMode: 'casual', shelfSeed: 1
};
let CFG;
try { CFG = Object.assign({}, DEFAULT_CFG, JSON.parse(localStorage.getItem('lorebook.cfg') || '{}')); } catch (e) { CFG = Object.assign({}, DEFAULT_CFG); }
function saveCfg() { try { localStorage.setItem('lorebook.cfg', JSON.stringify(CFG)); } catch (e) { } }

/* ---------- IndexedDB ---------- */
const DB = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('lorebook-db', 1);
      r.onupgradeneeded = e => {
        const d = e.target.result;
        d.createObjectStore('books', { keyPath: 'id' });
        d.createObjectStore('entries', { keyPath: 'id' }).createIndex('bookId', 'bookId');
        d.createObjectStore('photos', { keyPath: 'id' });
      };
      r.onsuccess = () => { this.db = r.result; res(); };
      r.onerror = () => rej(r.error);
    });
  },
  _t(store, mode, fn) {
    return new Promise((res, rej) => {
      const tx = this.db.transaction(store, mode);
      const st = tx.objectStore(store);
      let out;
      try { out = fn(st); } catch (e) { rej(e); return; }
      tx.oncomplete = () => res(out && out.result !== undefined ? out.result : undefined);
      tx.onerror = () => rej(tx.error);
      tx.onabort = () => rej(tx.error);
    });
  },
  all(store) { return this._t(store, 'readonly', s => s.getAll()); },
  get(store, key) { return this._t(store, 'readonly', s => s.get(key)); },
  put(store, val) { return this._t(store, 'readwrite', s => s.put(val)); },
  del(store, key) { return this._t(store, 'readwrite', s => s.delete(key)); },
  clear(store) { return this._t(store, 'readwrite', s => s.clear()); },
  putMany(store, arr) { return this._t(store, 'readwrite', s => { arr.forEach(v => s.put(v)); }); },
  delMany(store, keys) { return this._t(store, 'readwrite', s => { keys.forEach(k => s.delete(k)); }); }
};

/* ============================================================
   SOUND — everything is synthesised, no audio files needed
   ============================================================ */
const Snd = {
  ctx: null, master: null, noise: null, unlocked: false,
  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = CFG.vol;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 2, b = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = b;
    } catch (e) { this.ctx = null; }
  },
  resume() {
    this.init();
    if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => { });
    if (this.ctx && !this.unlocked) { try { const b = this.ctx.createBuffer(1, 1, 22050), s = this.ctx.createBufferSource(); s.buffer = b; s.connect(this.ctx.destination); s.start(0); this.unlocked = true; } catch (e) { } }   // iOS unlock trick
  },
  setVol(v) { CFG.vol = v; if (this.master) this.master.gain.value = v; },
  tone(f, d, o = {}) {
    if (!this.ctx || !CFG.sound) return;
    const c = this.ctx, t = c.currentTime + (o.at || 0);
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + d);
    if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib; lg.gain.value = f * .03; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + d + .1); }
    const v = o.vol ?? .15;
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.atk || .006));
    g.gain.exponentialRampToValueAtTime(.0001, t + d);
    osc.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + d + .05);
  },
  nz(d, o = {}) {
    if (!this.ctx || !CFG.sound) return;
    const c = this.ctx, t = c.currentTime + (o.at || 0);
    const s = c.createBufferSource(); s.buffer = this.noise; s.loop = true;
    const f = c.createBiquadFilter(); f.type = o.type || 'bandpass';
    f.frequency.setValueAtTime(o.f0 || 1000, t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + d);
    f.Q.value = o.q || 1;
    const g = c.createGain(); const v = o.vol ?? .15;
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.atk || .01));
    g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t, Math.random()); s.stop(t + d + .05);
  },
  play(name) {
    if (!CFG.sound) return;
    this.resume();
    if (!this.ctx) return;
    const S = this.snd[name]; if (S) S.call(this);
  },
  snd: {
    tap() { this.tone(660, .05, { vol: .09 }); this.tone(990, .05, { vol: .06, at: .04 }); },
    chip() { this.tone(520, .07, { type: 'triangle', vol: .14 }); this.tone(780, .08, { type: 'triangle', vol: .1, at: .05 }); },
    soft() { this.tone(440, .06, { type: 'sine', vol: .12 }); },
    sheet() { this.nz(.22, { f0: 300, f1: 1400, vol: .06, q: .7 }); this.tone(330, .1, { type: 'triangle', vol: .06 }); },
    pull() { this.nz(.2, { type: 'highpass', f0: 400, f1: 1600, vol: .1 }); this.tone(110, .12, { type: 'sine', vol: .25, to: 60 }); },
    open() {
      this.tone(90, .55, { type: 'sawtooth', vol: .05, to: 170, vib: 14 });
      for (let i = 0; i < 5; i++) this.nz(.07, { f0: 2400 + i * 300, f1: 5000, q: 2, vol: .06, at: .15 + i * .07 });
      this.tone(196, .5, { type: 'triangle', vol: .08, at: .5 }); this.tone(294, .6, { type: 'triangle', vol: .07, at: .56 });
    },
    close() { this.tone(80, .18, { type: 'sine', vol: .3, to: 40 }); this.nz(.12, { type: 'lowpass', f0: 600, f1: 120, vol: .25 }); },
    save() {
      for (let i = 0; i < 4; i++) this.nz(.07, { f0: 3200 - i * 300, f1: 2000, q: 3, vol: .07, at: i * .06 });
      this.tone(130, .16, { type: 'sine', vol: .35, to: 45, at: .3 }); this.nz(.1, { type: 'lowpass', f0: 900, f1: 100, vol: .3, at: .3 });
      this.tone(988, .09, { vol: .12, at: .42 }); this.tone(1319, .3, { vol: .12, at: .5 });
    },
    coin() { this.tone(988, .08, { vol: .1 }); this.tone(1319, .28, { vol: .1, at: .07 }); },
    photo() { this.nz(.03, { f0: 4000, vol: .2 }); this.nz(.04, { f0: 2500, vol: .2, at: .07 }); this.tone(1800, .05, { vol: .06, at: .02 }); },
    ach() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, .18, { vol: .12, at: i * .1 })); this.tone(1047, .6, { type: 'triangle', vol: .12, at: .4 }); this.tone(1319, .6, { type: 'triangle', vol: .1, at: .4 }); },
    level() { [392, 440, 494, 523, 587, 659, 784, 1047].forEach((f, i) => this.tone(f, .12, { vol: .11, at: i * .07 })); this.tone(1047, .7, { type: 'triangle', vol: .14, at: .6 }); },
    newbook() { for (let i = 0; i < 7; i++) this.tone(1200 + Math.random() * 2200, .12, { type: 'triangle', vol: .08, at: i * .05 }); this.tone(262, .5, { type: 'triangle', vol: .1 }); this.tone(392, .5, { type: 'triangle', vol: .1, at: .08 }); this.tone(523, .6, { type: 'triangle', vol: .1, at: .16 }); },
    del() { this.tone(420, .28, { vol: .12, to: 90 }); this.nz(.2, { type: 'lowpass', f0: 1500, f1: 200, vol: .12 }); },
    err() { this.tone(160, .12, { type: 'sawtooth', vol: .12 }); this.tone(130, .18, { type: 'sawtooth', vol: .12, at: .13 }); },
    theme() { this.nz(.5, { f0: 300, f1: 4000, vol: .08, q: .5 }); [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, .3, { type: 'triangle', vol: .08, at: .12 + i * .06 })); },
    bloop() { this.tone(260, .12, { type: 'sine', vol: .2, to: 640 }); this.tone(340, .1, { type: 'sine', vol: .15, to: 760, at: .12 }); },
    crystal() { this.tone(880, .7, { type: 'sine', vol: .12, vib: 6 }); this.tone(1320, .7, { type: 'sine', vol: .08, at: .06, vib: 7 }); },
    ding() { this.tone(1568, .5, { type: 'triangle', vol: .12 }); this.tone(2093, .6, { type: 'triangle', vol: .08, at: .05 }); },
    rustle() { for (let i = 0; i < 4; i++) this.nz(.08, { f0: 3000 + i * 400, q: 1.5, vol: .08, at: i * .05 }); },
    poof() { this.nz(.25, { type: 'lowpass', f0: 2500, f1: 200, vol: .2 }); },
    whoosh() { this.nz(.45, { f0: 300, f1: 1800, vol: .1, q: .6 }); },
    thunder() { this.nz(1.6, { type: 'lowpass', f0: 380, f1: 60, vol: .5, atk: .15 }); this.nz(1.0, { type: 'lowpass', f0: 200, f1: 50, vol: .4, at: .3, atk: .2 }); },
    star() { this.tone(1046, .08, { type: 'triangle', vol: .12 }); this.tone(1568, .16, { type: 'triangle', vol: .12, at: .06 }); },
    wing() { this.nz(.2, { f0: 600, f1: 1500, vol: .08 }); },
    clank() { this.tone(180, .1, { type: 'square', vol: .1, to: 120 }); this.tone(1200, .08, { type: 'triangle', vol: .08, at: .02 }); this.nz(.06, { f0: 3000, vol: .1 }); },
    shuffle() { for (let i = 0; i < 6; i++) this.nz(.05, { f0: 700 + i * 250, f1: 2200, q: 1.5, vol: .07, at: i * .045 }); this.tone(240, .08, { type: 'sine', vol: .12, at: .28 }); }
  }
};

/* ---------- ambient weather sound (optional) ---------- */
const Amb = {
  kind: 'none', src: null, g: null, lfo: null, timer: null,
  set(kind) {
    if (!CFG.ambient || !CFG.sound || !Snd.ctx) kind = 'none';
    if (kind === this.kind) return;
    this.stop();
    this.kind = kind;
    if (kind === 'none') return;
    const c = Snd.ctx;
    const src = c.createBufferSource(); src.buffer = Snd.noise; src.loop = true;
    const f = c.createBiquadFilter(), g = c.createGain(); g.gain.value = 0;
    let target;
    if (kind === 'rain' || kind === 'storm') { f.type = 'bandpass'; f.frequency.value = kind === 'storm' ? 2600 : 4000; f.Q.value = .4; target = kind === 'storm' ? .1 : .05; }
    else { f.type = 'lowpass'; f.frequency.value = 480; target = .05; const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = .18; lg.gain.value = .03; l.connect(lg); lg.connect(g.gain); l.start(); this.lfo = l; }
    src.connect(f); f.connect(g); g.connect(Snd.master);
    src.start();
    g.gain.linearRampToValueAtTime(target, c.currentTime + 1.5);
    this.src = src; this.g = g;
    if (kind === 'storm') this.timer = setInterval(() => Snd.play('thunder'), 11000 + Math.random() * 9000);
  },
  stop() {
    clearInterval(this.timer);
    try { if (this.g) this.g.gain.linearRampToValueAtTime(0, Snd.ctx.currentTime + .4); const s = this.src, l = this.lfo; setTimeout(() => { try { s && s.stop(); l && l.stop(); } catch (e) { } }, 500); } catch (e) { }
    this.src = this.g = this.lfo = null; this.kind = 'none';
  }
};
