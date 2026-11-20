'use strict';
/* ============================================================
   LOREBOOK — UI: helpers, library shelf, book-opening stage, journal
   ============================================================ */

const S = { books: [], entries: [], cur: null, tab: 'pages', search: '', busy: false, view: 'boot', compose: null, libScroll: 0, libDirty: true, sky: null, fx: null, shelfQ: '' };
let ROT = 0;
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const bookById = id => S.books.find(b => b.id === id);
const entriesOf = id => S.entries.filter(e => e.bookId === id).sort((a, b) => a.createdAt - b.createdAt);
const entryById = id => S.entries.find(e => e.id === id);
function countMap() { const m = {}; S.entries.forEach(e => m[e.bookId] = (m[e.bookId] || 0) + 1); return m; }
const FW = () => $('#frame').offsetWidth, FH = () => $('#frame').offsetHeight;

/* ---------- coordinates (the frame may be rotated to keep the app portrait) ---------- */
function toFrame(cx, cy) {
  const f = $('#frame'), r = f.getBoundingClientRect(), mx = r.left + r.width / 2, my = r.top + r.height / 2;
  const dx = cx - mx, dy = cy - my, a = -(ROT || 0) * Math.PI / 180;
  return [f.offsetWidth / 2 + dx * Math.cos(a) - dy * Math.sin(a), f.offsetHeight / 2 + dx * Math.sin(a) + dy * Math.cos(a)];
}
function centerOf(elm) { const r = elm.getBoundingClientRect(); return toFrame(r.left + r.width / 2, r.top + r.height / 2); }

/* ---------- effects ---------- */
function burst(x, y, o = {}) {
  const fx = $('#fx'), n = o.n || 18, colors = o.colors || ['#ffd35a', '#fff6c0', '#ff7ac8', '#7ad8ff', '#9dff7a'], spread = o.spread || 90;
  for (let i = 0; i < n; i++) {
    const p = el('i', 'pt'); const s = 4 + Math.random() * (o.size || 7);
    p.style.cssText = `left:${x - s / 2}px;top:${y - s / 2}px;width:${s}px;height:${s}px;background:${pick(colors)};border-radius:${Math.random() < .4 ? '50%' : '2px'};box-shadow:0 0 6px currentColor`;
    fx.append(p);
    const ang = Math.random() * 6.283, d = spread * (.35 + Math.random() * .75), dx = Math.cos(ang) * d, dy = Math.sin(ang) * d - 30;
    p.animate([{ transform: 'translate(0,0) rotate(0) scale(1)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) rotate(${Math.random() * 540}deg) scale(1)`, opacity: 1, offset: .55 }, { transform: `translate(${dx * 1.1}px,${dy + 70}px) rotate(${Math.random() * 720}deg) scale(.2)`, opacity: 0 }],
      { duration: (o.life || 900) * (.7 + Math.random() * .6), easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => p.remove();
  }
}
function floatText(text, x, y) { const f = el('div', 'floater', esc(text)); f.style.left = x + 'px'; f.style.top = y + 'px'; $('#fx').append(f); setTimeout(() => f.remove(), 1400); }
function toast(html, o = {}) {
  const t = el('div', 'toast ' + (o.cls || ''), html); $('#toasts').append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 380); }, o.ms || 2400);
  return t;
}
function wipeTo(color, x, y) {
  const d = el('div', 'wipe-dot'), size = Math.hypot(FW(), FH()) * 2.2;
  d.style.cssText = `left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;background:radial-gradient(circle,${color} 0 38%,transparent 70%)`;
  $('#wipe').append(d);
  d.animate([{ transform: 'scale(0)', opacity: .95 }, { transform: 'scale(.9)', opacity: .95, offset: .5 }, { transform: 'scale(1.1)', opacity: 0 }], { duration: 950, easing: 'ease-out' }).onfinish = () => d.remove();
}

/* ---------- XP / achievements ---------- */
function updateHUD() {
  const l = lvlOf(CFG.xp), a = xpFor(l), b = xpFor(l + 1);
  $('#lvlNum').textContent = l; $('#lvlRank').textContent = rankOf(l);
  $('#xpFill').style.width = clamp((CFG.xp - a) / (b - a) * 100, 3, 100) + '%';
}
function addXP(n, at) {
  const before = lvlOf(CFG.xp); CFG.xp += n; saveCfg(); const after = lvlOf(CFG.xp); updateHUD();
  if (at) floatText('+' + n + ' XP', at[0], at[1]);
  if (after > before) setTimeout(() => { Snd.play('level'); toast(`<b>LEVEL UP!</b><br>Level ${after} — ${esc(rankOf(after))}`, { cls: 'lvl', ms: 3600 }); burst(FW() / 2, FH() * .28, { n: 46, spread: 190 }); }, 600);
  else Snd.play('coin');
}
const achQueue = []; let achBusy = false;
function unlock(id) {
  if (CFG.ach[id]) return; const a = ACH.find(x => x.id === id); if (!a) return;
  CFG.ach[id] = Date.now(); saveCfg(); CFG.xp += 25; saveCfg(); updateHUD();
  achQueue.push(a); if (!achBusy) runAch();
}
async function runAch() {
  achBusy = true;
  while (achQueue.length) {
    const a = achQueue.shift(); Snd.play('ach');
    toast(`<div class="ti">${ic(a.icon)}</div><div><small>Achievement unlocked</small><b>${esc(a.name)}</b><span>${esc(a.desc)} · +25 XP</span></div>`, { cls: 'ach', ms: 3200 });
    burst(FW() / 2, 120, { n: 22, spread: 120 });
    await sleep(3000);
  }
  achBusy = false;
}
function stats() {
  const ents = S.entries.filter(e => !e.demo), days = new Set(ents.map(e => dayKey(e.createdAt)));
  let streak = 0; const d = new Date(); if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) { streak++; d.setDate(d.getDate() - 1); }
  return { books: S.books.filter(b => !b.demo).length, entries: ents.length, photos: ents.filter(e => e.thumb).length, moments: ents.filter(e => e.star).length, boss: ents.filter(e => e.tag === 'boss').length, oops: ents.filter(e => e.tag === 'oops').length, streak, night: ents.some(e => new Date(e.createdAt).getHours() < 4) };
}
function checkAch() { const st = stats(); ACH.forEach(a => { if (a.test && !CFG.ach[a.id] && a.test(st)) unlock(a.id); }); }

/* ---------- sheets & dialogs ---------- */
function openSheet({ title, icon, html = '', foot = null, onClose, cls = '', pin = null }) {
  const layer = $('#sheetLayer'), back = el('div', 'sheet-back'), sh = el('div', 'sheet ' + cls);
  sh.innerHTML = `<div class="sheet-grab"></div><div class="sheet-head"><h2>${icon ? ic(icon) : ''}<span>${esc(title)}</span></h2><button class="sheet-x" aria-label="Close">${ic('x')}</button></div>${pin ? `<div class="sheet-pin">${pin}</div>` : ''}<div class="sheet-body">${html}</div>${foot ? '<div class="sheet-foot"></div>' : ''}`;
  layer.append(back, sh);
  const api = { el: sh, body: $('.sheet-body', sh), foot: $('.sheet-foot', sh), closed: false };
  if (foot) api.foot.innerHTML = foot;
  api.close = () => {
    if (api.closed) return; api.closed = true; back.classList.remove('in'); sh.classList.remove('in'); sh.style.transform = '';
    setTimeout(() => { back.remove(); sh.remove(); }, 420); if (onClose) onClose();
  };
  // a tap that opened the sheet can leave a ghost click behind — ignore the backdrop for a moment
  const t0 = Date.now(); back.addEventListener('pointerdown', () => { if (Date.now() - t0 > 450) api.close(); });
  $('.sheet-x', sh).addEventListener('click', () => { Snd.play('tap'); api.close(); });
  // drag the handle down to dismiss
  let y0 = null, dy = 0;
  const grab = $('.sheet-grab', sh), head = $('.sheet-head', sh);
  [grab, head].forEach(g => {
    g.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; dy = 0; sh.style.transition = 'none'; }, { passive: true });
    g.addEventListener('touchmove', e => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); sh.style.transform = `translateY(${dy}px)`; }, { passive: true });
    g.addEventListener('touchend', () => { if (y0 == null) return; y0 = null; sh.style.transition = ''; if (dy > 90) api.close(); else sh.style.transform = ''; });
  });
  requestAnimationFrame(() => requestAnimationFrame(() => { back.classList.add('in'); sh.classList.add('in'); }));
  Snd.play('sheet');
  return api;
}
function dialog({ title, msg, buttons }) {
  return new Promise(res => {
    const layer = $('#sheetLayer'), back = el('div', 'dlg-back'), d = el('div', 'dlg');
    d.innerHTML = `<h3>${esc(title)}</h3><p>${msg}</p><div class="row2"></div>`;
    const row = $('.row2', d);
    const done = v => { back.classList.remove('in'); d.classList.remove('in'); setTimeout(() => { back.remove(); d.remove(); }, 300); res(v); };
    buttons.forEach(b => { const x = el('button', 'btn ' + (b.cls || ''), esc(b.label)); x.onclick = () => { Snd.play(b.cls === 'danger' ? 'del' : 'tap'); done(b.val); }; row.append(x); });
    const t0 = Date.now(); back.addEventListener('pointerdown', () => { if (Date.now() - t0 > 450) done(null); });
    layer.append(back, d); requestAnimationFrame(() => requestAnimationFrame(() => { back.classList.add('in'); d.classList.add('in'); }));
    Snd.play('soft');
  });
}
const ask = (title, msg, ok = 'OK', danger = false) => dialog({ title, msg, buttons: [{ label: 'Cancel', val: false, cls: 'ghost' }, { label: ok, val: true, cls: danger ? 'danger' : 'primary' }] });
function actionSheet(title, items, icon) {
  const sh = openSheet({ title, icon, html: items.map((a, i) => `<button class="act ${a.danger ? 'danger' : ''}" data-i="${i}">${ic(a.icon || 'star')}<span>${esc(a.label)}${a.sub ? `<small>${esc(a.sub)}</small>` : ''}</span></button>`).join('') });
  sh.body.addEventListener('click', e => { const b = e.target.closest('.act'); if (!b) return; const a = items[+b.dataset.i]; Snd.play('tap'); sh.close(); setTimeout(() => a.fn && a.fn(), 250); });
  return sh;
}

/* ---------- theme ---------- */
const SILL = {
  grand: '<svg viewBox="0 0 34 34"><g class="leaf"><path d="M17 20C9 18 7 10 8 4c7 1 11 7 9 16z" fill="#4f9a3a"/><path d="M17 20c7-1 11-8 9-16-7 1-11 7-9 16z" fill="#6bbf4c"/></g><path d="M9 21h16l-2 12H11z" fill="#b5653a"/></svg>',
  arcade: '<svg viewBox="0 0 34 34"><path d="M13 33V12a4 4 0 018 0v21z" fill="none" stroke="#9dff3a" stroke-width="2.5" style="filter:drop-shadow(0 0 4px #9dff3a)"/><path d="M13 22H8v-6M21 18h5v-5" fill="none" stroke="#9dff3a" stroke-width="2.5" style="filter:drop-shadow(0 0 4px #9dff3a)"/></svg>',
  haunted: '<svg viewBox="0 0 34 34"><ellipse cx="17" cy="22" rx="12" ry="10" fill="#ff8a1f"/><path d="M17 12c-3 0-2 20 0 20M10 14c-5 4-3 16 0 18M24 14c5 4 3 16 0 18" stroke="#c45f08" fill="none" stroke-width="1.5"/><path d="M10 20l3 3 2-3zM19 20l2 3 3-3zM12 28q5 3 10 0" fill="#2a1200" stroke="#2a1200" stroke-width="1.5"/><rect x="15" y="8" width="4" height="5" fill="#4f7a2a"/></svg>',
  starship: '',
  treehouse: '<svg viewBox="0 0 34 34"><rect x="14" y="20" width="7" height="13" rx="2" fill="#f1e6c8"/><path d="M5 22C5 11 29 11 29 22z" fill="#d6342f"/><circle cx="12" cy="18" r="2.4" fill="#fff"/><circle cx="21" cy="16" r="2" fill="#fff"/><circle cx="25" cy="20" r="1.5" fill="#fff"/></svg>',
  dungeon: '<svg viewBox="0 0 34 34"><path d="M17 8c-7 0-11 5-11 11 0 4 2 6 5 7.5V31h12v-4.5c3-1.5 5-3.5 5-7.5 0-6-4-11-11-11z" fill="#ece6d6" stroke="#8a8070" stroke-width="1.5"/><circle cx="12.5" cy="19" r="3" fill="#1b1612"/><circle cx="21.5" cy="19" r="3" fill="#1b1612"/></svg>',
  cabin: '<svg viewBox="0 0 34 34"><path class="steam" d="M12 12c-2-2 2-4 0-7M18 12c-2-2 2-4 0-7" stroke="#fff" stroke-opacity=".75" fill="none" stroke-width="1.6" stroke-linecap="round"/><path d="M7 14h18v10a5 5 0 01-5 5h-8a5 5 0 01-5-5z" fill="#c0392b"/><path d="M25 17h2a3 3 0 010 7h-2" stroke="#c0392b" stroke-width="2.4" fill="none"/><rect x="7" y="14" width="18" height="3" fill="#6b3a1e"/></svg>',
  pirate: '<svg viewBox="0 0 34 34"><path d="M14 4h6v6l3 4v17a2 2 0 01-2 2H13a2 2 0 01-2-2V14l3-4z" fill="#2f8f5a" fill-opacity=".85" stroke="#d8f5e2" stroke-width="1"/><rect x="15" y="1.5" width="4" height="4" fill="#a8733f"/><path d="M14 19h6v8h-6z" fill="#f4e7c1" transform="rotate(-8 17 23)"/></svg>',
  sakura: '<svg viewBox="0 0 34 34"><path d="M17 26c0-6 3-8 1-12" stroke="#5a3a28" stroke-width="2.4" fill="none"/><circle cx="17" cy="10" r="6" fill="#f9b8d0"/><circle cx="11" cy="14" r="4.5" fill="#ffd9e8"/><circle cx="23" cy="14" r="4.5" fill="#f9b8d0"/><path d="M9 26h16l-2 7H11z" fill="#7a2a2a"/></svg>',
  tomb: '<svg viewBox="0 0 34 34"><ellipse cx="17" cy="21" rx="9" ry="10" fill="#1a6b6b"/><path d="M17 11v20M9 18h16" stroke="#f0c050" stroke-width="1.5"/><circle cx="17" cy="10" r="4" fill="#f0c050"/><path d="M8 13l-5-4M26 13l5-4M8 27l-5 4M26 27l5 4" stroke="#f0c050" stroke-width="2"/></svg>',
  steampunk: '<svg viewBox="0 0 34 34"><rect x="14" y="2" width="6" height="5" fill="#6b4118"/><circle cx="17" cy="19" r="13" fill="#b8793a" stroke="#6b4118" stroke-width="2"/><circle cx="17" cy="19" r="10" fill="#f4e6c4"/><path d="M8 19h2M24 19h2M17 10v2M10.5 12.5l1.4 1.4M23.5 12.5l-1.4 1.4" stroke="#5a3a1a" stroke-width="1.2"/><path class="needle" d="M17 19L17 11" stroke="#b3242b" stroke-width="1.6" stroke-linecap="round"/><circle cx="17" cy="19" r="1.8" fill="#3a2410"/></svg>'
};
function applyTheme(id, animate, from) {
  if (!THEMES[id]) id = 'grand';
  const t = THEMES[id], f = $('#frame');
  const go = () => {
    Object.entries(t.v).forEach(([k, v]) => f.style.setProperty('--' + k, v));
    f.style.setProperty('--wall-pat', t.wall); f.style.setProperty('--wall-size', t.wallSize);
    f.dataset.theme = id; CFG.theme = id; saveCfg();
    if (S.sky) S.sky.setTheme(id); if (S.fx) S.fx.setTheme(id);
    $('#sillItem').innerHTML = SILL[id] || '';
    const m = $('meta[name=theme-color]'); if (m) m.content = t.swatch[0];
  };
  if (animate) { wipeTo(t.v.glow, from ? from[0] : FW() - 40, from ? from[1] : 60); setTimeout(go, 380); } else go();
}

/* ============================================================
   LIBRARY — props, sorting, search and the shelf layout engine
   ============================================================ */
function cogPath(cx, cy, ro, ri, n) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = i * 2 * Math.PI / n, s = 2 * Math.PI / n;
    [[0, ri], [.14, ro], [.4, ro], [.54, ri]].forEach(([o, r], j) => { d += (i || j ? 'L' : 'M') + (cx + Math.cos(a + o * s) * r).toFixed(1) + ' ' + (cy + Math.sin(a + o * s) * r).toFixed(1); });
  }
  return d + 'Z';
}
const PROP_SETS = {
  grand: ['candle', 'plant', 'crystal', 'potion', 'trophy'], arcade: ['console', 'trophy', 'crystal', 'potion', 'plant'], haunted: ['skull', 'candle', 'crystal', 'potion', 'plant'],
  starship: ['console', 'crystal', 'potion', 'trophy', 'plant'], treehouse: ['plant', 'candle', 'potion', 'crystal', 'trophy'], dungeon: ['candle', 'skull', 'trophy', 'potion', 'crystal'],
  cabin: ['lantern', 'mug', 'candle', 'plant', 'trophy'], pirate: ['chest', 'globe', 'lantern', 'skull', 'potion'], sakura: ['bonsai', 'lantern', 'potion', 'crystal', 'trophy'],
  tomb: ['urn', 'candle', 'skull', 'trophy', 'crystal'], steampunk: ['gear', 'globe', 'lantern', 'potion', 'console']
};
const PROPS = {
  candle: () => '<div class="prop candle" data-prop="candle"><i class="c-body"></i><i class="flame"></i><i class="c-dish"></i></div>',
  crystal: () => '<div class="prop crystal" data-prop="crystal"><i class="cb-ball"></i><i class="cb-base"></i></div>',
  plant: () => '<div class="prop" data-prop="plant"><svg viewBox="0 0 44 58"><g class="leaf"><path d="M22 36C10 34 6 22 8 12c10 2 16 10 14 24z" fill="#4f9a3a"/><path d="M22 36c10-2 16-12 14-24-10 2-16 10-14 24z" fill="#6bbf4c"/><path d="M22 38C20 26 20 16 22 6c3 10 3 20 0 32z" fill="#3f8230"/></g><path d="M12 38h20l-3 18H15z" fill="#b5653a"/><rect x="10" y="35" width="24" height="5" rx="2" fill="#cf7a48"/></svg></div>',
  potion: () => '<div class="prop" data-prop="potion"><svg viewBox="0 0 44 58"><path d="M17 6h10v3l-1 1v12l9 20c1 4-1 8-6 8H15c-5 0-7-4-6-8l9-20V10l-1-1z" fill="rgba(200,230,255,.22)" stroke="rgba(255,255,255,.7)" stroke-width="1.5"/><path d="M12 38l-3 10c-1 4 1 8 6 8h14c5 0 7-4 6-8l-3-10z" fill="var(--glow)" opacity=".9"/><circle class="bub" cx="18" cy="44" r="2" fill="#fff" opacity=".8"/><circle class="bub" style="animation-delay:.9s" cx="27" cy="46" r="1.5" fill="#fff"/><rect x="16" y="3" width="12" height="5" rx="2" fill="#8a5a2e"/></svg></div>',
  trophy: () => '<div class="prop" data-prop="trophy"><svg viewBox="0 0 44 58"><path d="M12 12h20v10c0 7-5 12-10 12s-10-5-10-12z" fill="#e6b422" stroke="#8a5d00" stroke-width="1.5"/><path d="M12 15H6c0 7 3 10 7 10M32 15h6c0 7-3 10-7 10" fill="none" stroke="#e6b422" stroke-width="2.5"/><rect x="19" y="34" width="6" height="9" fill="#c99700"/><rect x="12" y="43" width="20" height="9" rx="2" fill="#6b4a1a"/><path d="M17 17v8" stroke="#fff6c0" stroke-width="2" opacity=".7"/></svg></div>',
  console: () => '<div class="prop" data-prop="console"><svg viewBox="0 0 44 58"><rect x="4" y="30" width="36" height="24" rx="4" fill="#cfd3dc"/><rect x="8" y="36" width="20" height="4" rx="1" fill="#555c6b"/><rect x="8" y="44" width="10" height="5" rx="1" fill="#555c6b"/><circle cx="32" cy="44" r="4" fill="#d33"/><circle class="led" cx="33" cy="35" r="1.8" fill="#7dff9b"/><rect x="10" y="25" width="24" height="6" rx="1" fill="#2a2f3c"/></svg></div>',
  skull: () => '<div class="prop" data-prop="skull"><svg viewBox="0 0 44 58"><path d="M22 20c-9 0-14 6-14 14 0 5 2 8 6 10v6h16v-6c4-2 6-5 6-10 0-8-5-14-14-14z" fill="#ece6d6" stroke="#9a9080" stroke-width="1.5"/><circle cx="16" cy="34" r="4" fill="#1b1612"/><circle cx="28" cy="34" r="4" fill="#1b1612"/><path d="M22 38l-2 4h4z" fill="#1b1612"/><path d="M17 50v4M22 50v4M27 50v4" stroke="#9a9080" stroke-width="1.5"/></svg></div>',
  lantern: () => '<div class="prop" data-prop="lantern"><svg viewBox="0 0 44 58"><path d="M15 9c0-7 14-7 14 0" stroke="#7a5a2a" fill="none" stroke-width="2.5"/><rect x="12" y="9" width="20" height="4" rx="1" fill="#3a2a14"/><path d="M13 13h18l-2 30H15z" fill="rgba(255,200,100,.25)" stroke="#3a2a14" stroke-width="2"/><ellipse class="lf" cx="22" cy="33" rx="4.5" ry="7" fill="#ffd25a"/><ellipse cx="22" cy="35" rx="2" ry="3.5" fill="#fff6c8"/><rect x="11" y="43" width="22" height="6" rx="1" fill="#3a2a14"/></svg></div>',
  mug: () => '<div class="prop" data-prop="mug"><svg viewBox="0 0 44 58"><path class="steam" d="M16 24c-3-3 3-6 0-10M24 24c-3-3 3-6 0-10" stroke="#fff" stroke-opacity=".7" fill="none" stroke-width="2" stroke-linecap="round"/><path d="M9 28h24v16a7 7 0 01-7 7h-10a7 7 0 01-7-7z" fill="#c0392b"/><path d="M33 32h3a4 4 0 010 10h-3" stroke="#c0392b" stroke-width="3" fill="none"/><rect x="9" y="28" width="24" height="4" fill="#6b3a1e"/><circle cx="16" cy="40" r="2" fill="#fff" opacity=".7"/><circle cx="22" cy="43" r="1.6" fill="#fff" opacity=".7"/></svg></div>',
  chest: () => '<div class="prop" data-prop="chest"><svg viewBox="0 0 44 58"><path d="M5 34c0-9 7-15 17-15s17 6 17 15z" fill="#8a5a2e" stroke="#3a2410" stroke-width="1.5"/><rect x="5" y="34" width="34" height="17" rx="2" fill="#6b4220" stroke="#3a2410" stroke-width="1.5"/><path d="M13 21v30M31 21v30" stroke="#c9a24a" stroke-width="3"/><rect x="18" y="31" width="8" height="8" rx="1.5" fill="#e6b422" stroke="#8a5d00"/><circle cx="22" cy="35" r="1.4" fill="#3a2410"/><circle class="glint" cx="9" cy="27" r="1.6" fill="#fff6c0"/><circle class="glint" style="animation-delay:.8s" cx="34" cy="25" r="1.4" fill="#fff6c0"/></svg></div>',
  globe: () => '<div class="prop" data-prop="globe"><svg viewBox="0 0 44 58"><circle cx="22" cy="26" r="16" fill="#2f7a9a"/><path d="M12 20c4-4 8-3 9 1s-2 6-5 6-5 4-4 7M26 16c4-2 8 0 8 4s-4 4-6 6-1 5-4 5" fill="#6fa85a"/><ellipse cx="22" cy="26" rx="16" ry="5" fill="none" stroke="#fff" stroke-opacity=".25"/><ellipse cx="22" cy="26" rx="6" ry="16" fill="none" stroke="#fff" stroke-opacity=".25"/><path d="M8 12c-3 8-1 18 6 26" fill="none" stroke="#c9a24a" stroke-width="2.5"/><path d="M18 46h8l2 8H16z" fill="#6b4220"/><rect x="13" y="53" width="18" height="3.5" rx="1.5" fill="#4a2e14"/></svg></div>',
  bonsai: () => '<div class="prop" data-prop="bonsai"><svg viewBox="0 0 44 58"><path d="M22 46c0-9 6-11 3-18-1-3-4-5-2-9" stroke="#5a3a28" stroke-width="3.2" fill="none" stroke-linecap="round"/><g class="leaf"><circle cx="22" cy="14" r="9" fill="#f9b8d0"/><circle cx="12" cy="22" r="7" fill="#ffd9e8"/><circle cx="33" cy="22" r="7.5" fill="#f9b8d0"/><circle cx="26" cy="9" r="4" fill="#ffe8f0"/></g><path d="M11 46h22l-3 10H14z" fill="#7a3a2a"/><rect x="9" y="43" width="26" height="5" rx="2" fill="#9a4a36"/></svg></div>',
  urn: () => '<div class="prop" data-prop="urn"><svg viewBox="0 0 44 58"><path d="M17 8h10l-1 5c8 3 11 11 9 21-1 8-6 14-13 14s-12-6-13-14c-2-10 1-18 9-21z" fill="#c9a064" stroke="#5a4018" stroke-width="1.5"/><path d="M13 22h18M11 32h22" stroke="#1a6b6b" stroke-width="3"/><path d="M19 38l3-4 3 4zM20 44h4" stroke="#f0c050" stroke-width="1.6" fill="none"/><rect x="15" y="6" width="14" height="4" rx="1.5" fill="#f0c050" stroke="#5a4018"/><rect x="14" y="48" width="16" height="6" rx="1.5" fill="#8a6a38"/></svg></div>',
  gear: () => '<div class="prop" data-prop="gear"><svg viewBox="0 0 44 58"><g class="cogA"><path d="' + cogPath(17, 40, 15, 12, 10) + '" fill="#c07a3e" stroke="#4a2a12" stroke-width="1.5"/><circle cx="17" cy="40" r="4" fill="#2a1a0c"/></g><g class="cogB"><path d="' + cogPath(33, 22, 10, 7.5, 8) + '" fill="#e8a35e" stroke="#4a2a12" stroke-width="1.5"/><circle cx="33" cy="22" r="3" fill="#2a1a0c"/></g></svg></div>'
};
const PROP_QUIPS = {
  skull: ['Alas, poor save file…', 'I knew him, Horatio. He never backed up.'], console: ['Blow on the cartridge. Trust me.', 'Insert coin. Or don’t. Free spirit.'], trophy: ['Participation trophy: unlocked.', 'Shiny. Do not lick.'],
  plant: ['It’s a very real plant. Probably.'], potion: ['Tastes like blue. Do not drink.'], crystal: ['The crystal ball says: “Save more often.”', 'I see… a boss fight in your future.'], candle: ['Poof! …and it’s back.'],
  lantern: ['Still burning. Unlike your backlog.'], mug: ['Cocoa: +10 HP, +5 cozy.'], chest: ['It’s not a Mimic. …Probably.', 'Yarr! Your loot be safe.'], globe: ['Hidden zone discovered! (It’s Australia.)'],
  bonsai: ['Patience +1.'], urn: ['Do not open. The curse is mostly cosmetic.'], gear: ['Whirrr. Clank. Efficient.']
};

function pokeProp(p) {
  const kind = p.dataset.prop, [x, y] = centerOf(p);
  p.classList.remove('poke'); void p.offsetWidth; p.classList.add('poke');
  const q = pick(PROP_QUIPS[kind] || ['…']);
  if (kind === 'candle') { p.classList.toggle('out'); Snd.play('poof'); burst(x, y - 20, { n: 8, spread: 30, colors: ['#888', '#ccc'], size: 5 }); if (p.classList.contains('out')) setTimeout(() => p.classList.remove('out'), 2200); }
  else if (kind === 'crystal') { Snd.play('crystal'); burst(x, y - 8, { n: 16, spread: 60, colors: ['#fff', '#b8a0ff', '#7ad8ff'] }); }
  else if (kind === 'potion' || kind === 'mug') { Snd.play('bloop'); burst(x, y - 10, { n: 10, spread: 40, colors: ['#fff', '#aef'], size: 5 }); }
  else if (kind === 'trophy') { Snd.play('ding'); burst(x, y - 12, { n: 16, spread: 60, colors: ['#ffd35a', '#fff6c0'] }); }
  else if (kind === 'chest') { Snd.play('coin'); burst(x, y - 10, { n: 22, spread: 70, colors: ['#ffd35a', '#fff6c0', '#e6b422'] }); }
  else if (kind === 'plant' || kind === 'bonsai') { Snd.play('rustle'); burst(x, y - 20, { n: 7, spread: 50, colors: kind === 'bonsai' ? ['#f9b8d0', '#ffd9e8'] : ['#6bbf4c', '#4f9a3a'], size: 6 }); }
  else if (kind === 'gear' || kind === 'console') { Snd.play('clank'); }
  else if (kind === 'lantern') { Snd.play('poof'); burst(x, y - 10, { n: 8, spread: 36, colors: ['#ffd25a', '#fff'], size: 5 }); }
  else if (kind === 'globe') { Snd.play('whoosh'); }
  else if (kind === 'urn') { Snd.play('crystal'); burst(x, y - 14, { n: 12, spread: 50, colors: ['#f0c050', '#fff6c0'] }); }
  else { Snd.play('err'); }
  if (Math.random() < .6) toast(esc(q), { ms: 1900 });
}

/* ----- sorting ----- */
const SORTS = [
  ['custom', 'My order', 'The order you set by hand', 'edit'], ['recent', 'Recently written', 'Last entry first', 'clock'], ['az', 'Title A → Z', 'Alphabetical', 'type'],
  ['za', 'Title Z → A', 'Reverse alphabetical', 'type'], ['newest', 'Newest book first', 'By the day it was started', 'calendar'], ['oldest', 'Oldest book first', 'Your first journals on the left', 'calendar'],
  ['most', 'Most entries', 'Your longest chronicles first', 'hash'], ['platform', 'Platform', 'PC, Switch, PlayStation…', 'controller'], ['color', 'Rainbow', 'Sorted by cover colour', 'palette'], ['tall', 'Tallest first', 'Big books to little books', 'ruler']
];
const sortLabel = id => (SORTS.find(s => s[0] === id) || SORTS[0])[1];
function colorKey(hex) {
  const [r, g, b] = hex2rgb(hex).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, sv = mx ? d / mx : 0;
  if (sv < .22 || mx < .18) return 1000 + mx * 100;                 // blacks, greys & creams go at the end, dark → light
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360;
  return h + (1 - mx) * 2;
}
function shelfBooks() {
  const q = (S.shelfQ || '').trim().toLowerCase(), counts = countMap(), last = {}, noteOnly = new Set(), hits = new Set();
  S.entries.forEach(e => { if (!last[e.bookId] || e.createdAt > last[e.bookId]) last[e.bookId] = e.createdAt; });
  let list = [...S.books];
  if (q) {
    const inNotes = new Set(); S.entries.forEach(e => { if ((e.text || '').toLowerCase().includes(q)) inNotes.add(e.bookId); });
    list = list.filter(b => {
      if ((b.title || '').toLowerCase().includes(q) || (b.platform || '').toLowerCase().includes(q)) { hits.add(b.id); return true; }
      if (inNotes.has(b.id)) { noteOnly.add(b.id); return true; } return false;
    });
  }
  const act = b => Math.max(last[b.id] || 0, b.updatedAt || 0, b.createdAt || 0), t = b => (b.title || '').toLowerCase(), hgt = b => bookDims(b, counts[b.id] || 0).h;
  const by = {
    custom: (a, b) => a.order - b.order, recent: (a, b) => act(b) - act(a), az: (a, b) => t(a).localeCompare(t(b)), za: (a, b) => t(b).localeCompare(t(a)),
    newest: (a, b) => b.createdAt - a.createdAt, oldest: (a, b) => a.createdAt - b.createdAt, most: (a, b) => (counts[b.id] || 0) - (counts[a.id] || 0) || t(a).localeCompare(t(b)),
    platform: (a, b) => (a.platform || '').localeCompare(b.platform || '') || t(a).localeCompare(t(b)), color: (a, b) => colorKey(a.color) - colorKey(b.color), tall: (a, b) => hgt(b) - hgt(a) || t(a).localeCompare(t(b))
  };
  list.sort(by[CFG.shelfSort] || by.custom);
  return { list, counts, noteOnly, hits, q };
}

/* ----- arrangement: standing, leaning and lying flat ----- */
function bookMode(b) {
  const m = CFG.shelfMode || 'casual'; if (m === 'tidy') return 'S';
  const r = hash(b.id + ':' + (CFG.shelfSeed || 1)) % 100, cut = m === 'messy' ? [40, 72] : [62, 82];
  return r < cut[0] ? 'S' : r < cut[1] ? 'L' : 'F';
}
function buildUnits(list, counts) {
  const items = list.map(b => { const n = counts[b.id] || 0; return { b, n, d: bookDims(b, n) }; }), U = []; let i = 0;
  const leanOf = it => { const ang = 8 + (hash(it.b.id + 'a') % 7); return { ang, gap: Math.round(it.d.h * Math.sin(ang * Math.PI / 180)) }; };
  while (i < items.length) {
    const it = items[i], mode = bookMode(it.b);
    if (mode === 'F') {
      const grp = [it]; let tall = it.d.w + 2; i++;
      while (i < items.length && bookMode(items[i].b) === 'F' && grp.length < 3 && tall + items[i].d.w + 4 <= 168) { grp.push(items[i]); tall += items[i].d.w + 4; i++; }
      U.push({ k: 'stack', items: grp, w: Math.max(...grp.map(g => g.d.h)) + 12 }); continue;
    }
    if (mode === 'L') {
      const prev = U[U.length - 1], nx = items[i + 1], { ang, gap } = leanOf(it);
      if (prev && prev.k === 'stand' && prev.item.d.h >= it.d.h * .92) {          // lean back against the book on the left
        U.pop(); U.push({ k: 'lean', dir: 'L', sup: prev.item, lean: it, ang, gap, w: prev.item.d.w + 4 + gap + it.d.w + 4 }); i++; continue;
      }
      if (nx && bookMode(nx.b) === 'S' && nx.d.h >= it.d.h * .92) {                // lean forward against the book on the right
        U.push({ k: 'lean', dir: 'R', sup: nx, lean: it, ang, gap, w: it.d.w + 4 + gap + nx.d.w + 4 }); i += 2; continue;
      }
    }
    U.push({ k: 'stand', item: it, w: it.d.w + 4 }); i++;
  }
  return U;
}
function libAvail() { return Math.max(200, $('#rows').clientWidth - 8); }
function renderLibrary(o = {}) {
  const rows = $('#rows'); if (!rows.clientWidth) { S.libDirty = true; return; }
  S.libDirty = false;
  const { list, counts, noteOnly, hits, q } = shelfBooks(), avail = libAvail();
  rows.classList.toggle('quiet', !!o.quiet);
  const U = buildUnits(list, counts); let idx = 0;
  const sp = it => spineHTML(it.b, it.n).replace('style="', `style="--i:${idx++};`);
  const items = U.map(u => {
    if (u.k === 'stand') return { html: sp(u.item), w: u.w };
    if (u.k === 'lean') {
      const d = u.lean.d, st = u.dir === 'L' ? `margin-left:${u.gap}px;transform-origin:0 100%;transform:rotate(${-u.ang}deg)` : `margin-right:${u.gap}px;transform-origin:100% 100%;transform:rotate(${u.ang}deg)`;
      const leaner = `<div class="bk lean" style="width:${d.w + 2}px;height:${d.h}px;${st}">${sp(u.lean)}</div>`;
      return { html: u.dir === 'L' ? sp(u.sup) + leaner : leaner + sp(u.sup), w: u.w };
    }
    const flats = u.items.map(it => {
      const tk = it.d.w + 2, off = hash(it.b.id + 'o') % 10, rot = ((hash(it.b.id + 'r') % 100) / 100 - .5) * 1.4;
      return `<div class="bk flat" style="width:${it.d.h}px;height:${tk}px;margin-left:${off}px;transform:rotate(${rot.toFixed(2)}deg)"><div class="rot" style="--tk:${tk}px;width:${tk}px;height:${it.d.h}px">${sp(it)}</div></div>`;
    }).join('');
    return { html: `<div class="stack" style="width:${u.w}px">${flats}</div>`, w: u.w };
  });
  items.push({ html: `<div class="sp sp-new" data-new="1" style="--i:${idx}">${ic('plus')}<span>NEW QUEST</span></div>`, w: 64 });
  const R = [{ items: [], used: 0 }];
  for (const it of items) { const r = R[R.length - 1]; if (r.used + it.w > avail && r.items.length) R.push({ items: [it], used: it.w }); else { r.items.push(it); r.used += it.w; } }
  while (R.length < 3) R.push({ items: [], used: 0 });
  const set = PROP_SETS[CFG.theme] || PROP_SETS.grand;
  R.forEach((r, i) => { if (avail - r.used >= 52) r.prop = set[(i + (hash(CFG.theme) % 3)) % set.length]; });
  rows.innerHTML = R.map(r => `<div class="row"><div class="sb">${r.items.map(i => i.html).join('')}${r.prop ? PROPS[r.prop]() : ''}</div><div class="plank"></div></div>`).join('');
  const first = $('.sb', rows);
  if (!S.books.length) first.insertAdjacentHTML('beforeend', '<div class="hint">Tap the glowing book to start your first journal!</div>');
  else if (q && !list.length) first.insertAdjacentHTML('beforeend', `<div class="empty-msg">No books match “${esc(S.shelfQ.trim())}”.<br>The shelf shrugs.</div>`);
  if (q) { hits.forEach(id => { const e = $(`.sp[data-id="${id}"]`, rows); if (e) e.classList.add('hit'); }); noteOnly.forEach(id => { const e = $(`.sp[data-id="${id}"]`, rows); if (e) e.classList.add('hit', 'hit-note'); }); }
  S.rowsKey = avail; updateShelfInfo(list.length, noteOnly.size, q);
}
function updateShelfInfo(n, inNotes, q) {
  const parts = [q ? `${n} of ${S.books.length} book${S.books.length === 1 ? '' : 's'}` : `${n} book${n === 1 ? '' : 's'}`];
  if (q && inNotes) parts.push(`${inNotes} found in notes`);
  parts.push(CFG.shelfSort === 'custom' ? 'my order' : sortLabel(CFG.shelfSort).toLowerCase());
  const m = CFG.shelfMode || 'casual'; if (m !== 'casual') parts.push(m);
  $('#shelfInfo').textContent = parts.join(' · ');
}
function initShelfBar() {
  $('#sbIc').innerHTML = ic('search'); $('#shelfQx').innerHTML = ic('x'); $('#shelfSort').innerHTML = ic('sort') + '<span>Sort</span>';
  const q = $('#shelfQ');
  q.addEventListener('input', () => { S.shelfQ = q.value; $('#shelfQx').classList.toggle('hidden', !q.value); renderLibrary({ quiet: true }); });
  q.addEventListener('keydown', e => { if (e.key === 'Enter') q.blur(); });
  $('#shelfQx').onclick = () => { q.value = ''; S.shelfQ = ''; $('#shelfQx').classList.add('hidden'); renderLibrary({ quiet: true }); Snd.play('tap'); };
  $('#shelfSort').onclick = () => { Snd.play('tap'); openShelfOptions(); };
}
function clearShelfSearch() { S.shelfQ = ''; const q = $('#shelfQ'); if (q) q.value = ''; $('#shelfQx').classList.add('hidden'); }

let lp = null;
function initLibraryEvents() {
  const rows = $('#rows');
  rows.addEventListener('pointerdown', e => {
    const sp = e.target.closest('.sp'); if (!sp) return;
    lp = { sp, x: e.clientX, y: e.clientY, long: false, moved: false };
    if (!sp.dataset.new) lp.t = setTimeout(() => { if (!lp) return; lp.long = true; Snd.play('chip'); bookMenu(sp.dataset.id); }, 520);
  });
  rows.addEventListener('pointermove', e => { if (lp && (Math.abs(e.clientX - lp.x) > 9 || Math.abs(e.clientY - lp.y) > 9)) { lp.moved = true; clearTimeout(lp.t); } });
  const end = e => {
    if (!lp) return; clearTimeout(lp.t); const L = lp; lp = null;
    if (e.type === 'pointercancel' || L.long || L.moved) return;
    if (L.sp.dataset.new) newBook(L.sp); else openBook(L.sp.dataset.id, L.sp);
  };
  rows.addEventListener('pointerup', end); rows.addEventListener('pointercancel', end);
  rows.addEventListener('contextmenu', e => e.preventDefault());
  rows.addEventListener('click', e => { const p = e.target.closest('.prop'); if (p) pokeProp(p); });
  $('#sillItem').addEventListener('click', () => { const s = $('#sillItem'); s.classList.remove('poke'); void s.offsetWidth; s.classList.add('poke'); Snd.play('rustle'); const [x, y] = centerOf(s); burst(x, y, { n: 8, spread: 40, colors: ['#9dff7a', '#fff'] }); });
  $('#win').addEventListener('click', () => { const w = $('#win'); w.classList.toggle('closed'); Snd.play('whoosh'); });
  $('#libScroll').addEventListener('scroll', () => { S.libScroll = $('#libScroll').scrollTop; }, { passive: true });
}

function bookMenu(id) {
  const b = bookById(id); if (!b) return;
  const sorted = [...S.books].sort((x, y) => x.order - y.order), i = sorted.findIndex(x => x.id === id);
  const items = [
    { icon: 'book', label: 'Open journal', fn: () => { const sp = $(`.sp[data-id="${id}"]`); if (sp) openBook(id, sp); } },
    { icon: 'palette', label: 'Customize book', fn: () => openCustomize(id) }
  ];
  if (CFG.shelfSort === 'custom') {
    if (i > 0) items.push({ icon: 'back', label: 'Move left on shelf', fn: () => moveBook(id, -1) });
    if (i < sorted.length - 1) items.push({ icon: 'forward', label: 'Move right on shelf', fn: () => moveBook(id, 1) });
  } else items.push({ icon: 'sort', label: 'Arrange by hand…', sub: 'Switch the shelf to “My order” so you can move books', fn: () => { CFG.shelfSort = 'custom'; saveCfg(); renderLibrary(); toast('Shelf is back in your own order.'); } });
  items.push({ icon: 'trash', label: 'Burn this book', sub: 'Deletes the journal and every entry', danger: true, fn: () => deleteBook(id) });
  actionSheet(b.title || 'Book', items, 'book');
}
async function moveBook(id, dir) {
  const sorted = [...S.books].sort((x, y) => x.order - y.order), i = sorted.findIndex(x => x.id === id), j = i + dir; if (j < 0 || j >= sorted.length) return;
  const a = sorted[i], b = sorted[j]; [a.order, b.order] = [b.order, a.order];
  await DB.putMany('books', [a, b]); renderLibrary({ quiet: true }); Snd.play('chip');
  const sp = $(`.sp[data-id="${id}"]`); if (sp) { sp.classList.add('idle'); setTimeout(() => sp.classList.remove('idle'), 900); }
}
async function deleteBook(id) {
  const b = bookById(id); if (!b) return;
  const n = S.entries.filter(e => e.bookId === id).length;
  const ok = await ask('Burn “' + (b.title || 'Untitled') + '”?', `This permanently deletes the book${n ? ` and its ${n} entr${n === 1 ? 'y' : 'ies'}` : ''}. The shelf will be sad. So will you, probably.`, 'Burn it', true);
  if (!ok) return;
  const ids = S.entries.filter(e => e.bookId === id).map(e => e.id);
  await DB.delMany('entries', ids); await DB.delMany('photos', ids); await DB.del('books', id);
  S.entries = S.entries.filter(e => e.bookId !== id); S.books = S.books.filter(x => x.id !== id);
  Snd.play('del'); if (S.view === 'journal' && S.cur === id) closeJournal(true);
  renderLibrary({ quiet: true }); toast('Book burned. Marshmallows optional.');
}

/* ============================================================
   OPENING A BOOK (the 3D stage) → JOURNAL
   ============================================================ */
async function openBook(id, spEl) {
  if (S.busy) return; const b = bookById(id); if (!b) return; S.busy = true;
  const n = S.entries.filter(e => e.bookId === id).length;
  Snd.play('pull'); if (spEl) spEl.classList.add('pulled');
  const st = $('#stage'); st.className = ''; st.classList.remove('hidden', 'show', 'fade');
  st.innerHTML = `<div class="b3-glow"></div><div class="b3"><div class="b3-page"><span>${esc(b.title)}</span></div><div class="b3-cover"><div class="b3-front">${coverHTML(b, n)}</div><div class="b3-in"></div></div></div>`;
  const b3 = $('.b3', st), cover = $('.b3-cover', st), glow = $('.b3-glow', st);
  let dx = 0, dy = 0, sx = .18, sy = .4;
  if (spEl) { const [cx, cy] = centerOf(spEl); dx = cx - FW() / 2; dy = cy - FH() / 2; sx = Math.max(.12, spEl.offsetWidth / 264); sy = Math.max(.2, spEl.offsetHeight / 360); }
  requestAnimationFrame(() => st.classList.add('show'));
  await sleep(120);
  b3.animate([{ transform: `translate(${dx}px,${dy}px) scale(${sx},${sy}) rotateY(78deg)` }, { transform: 'translate(0,0) scale(1.04) rotateY(-8deg)', offset: .75 }, { transform: 'translate(0,0) scale(1) rotateY(0)' }], { duration: 760, easing: 'cubic-bezier(.3,.9,.3,1)', fill: 'forwards' });
  await sleep(840);
  glow.classList.add('on'); Snd.play('open');
  b3.animate([{ transform: 'translate(0,0)' }, { transform: 'translateX(52px)' }], { duration: 1000, easing: 'ease-in-out', fill: 'forwards' });
  cover.style.transform = 'rotateY(-172deg)';
  const [bx, by] = [FW() / 2 + 40, FH() / 2];
  setTimeout(() => burst(bx, by, { n: 26, spread: 130, colors: [b.trim, '#fff6c0', '#ffd35a', '#fff'] }), 380);
  await sleep(900);
  showJournal(b);
  st.classList.add('fade'); await sleep(380);
  st.className = 'hidden'; st.innerHTML = '';
  $('#library').classList.add('hidden');
  if (spEl) spEl.classList.remove('pulled');
  S.busy = false;
}

/* ---------- journal ---------- */
function resetCompose() {
  S.compose = { tag: 'note', star: false, photo: null, thumb: null, editId: null, photoChanged: false };
  const ta = $('#cmpText'); ta.value = ''; autoGrow(ta); renderComposer();
}
function autoGrow(ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 130) + 'px'; $('#cmpCount').textContent = ta.value.length > 200 ? ta.value.length + '/4000' : ''; }
function renderComposer() {
  const c = S.compose;
  $('#cmpTags').innerHTML = Object.entries(TAGS).map(([k, t]) => `<button class="tagchip ${c.tag === k ? 'on' : ''}" data-tag="${k}" style="--tc:${t.col}">${ic(t.icon)}${t.name}</button>`).join('');
  $('#cmpStar').classList.toggle('on', c.star);
  const ph = $('#cmpPhoto'); ph.classList.toggle('hidden', !c.thumb); if (c.thumb) $('img', ph).src = c.thumb;
  $('#cmpEdit').classList.toggle('hidden', !c.editId);
  $('#cmpSave b').textContent = c.editId ? 'Save changes' : 'Inscribe';
}
function applyBookToJournal(b) {
  const j = $('#journal');
  j.dataset.style = b.style; j.style.setProperty('--bfont', fontStack(b.font)); j.style.setProperty('--btrim', b.trim);
  $('#jTitle').textContent = b.title || 'Untitled';
  $('#jTitle').style.fontFamily = fontStack(b.font);
}
function showJournal(b) {
  S.cur = b.id; S.view = 'journal'; S.tab = 'pages'; S.search = '';
  $('#jSearch').classList.add('hidden'); $('#jSearchIn').value = '';
  applyBookToJournal(b); resetCompose(); setTab('pages', true);
  const j = $('#journal'); j.classList.remove('hidden', 'leave');
  renderPages({ anim: true, jump: true }); pauseAmbient();
}
function closeJournal(skipAnim) {
  if (S.view !== 'journal') return; const id = S.cur;
  S.view = 'library'; S.cur = null;
  $('#library').classList.remove('hidden'); $('#libScroll').scrollTop = S.libScroll;
  renderLibrary({ quiet: true });
  $('#libScroll').scrollTop = S.libScroll;
  const j = $('#journal');
  if (!skipAnim) { Snd.play('close'); j.classList.add('leave'); setTimeout(() => j.classList.add('hidden'), 320); } else j.classList.add('hidden');
  const sp = $(`.sp[data-id="${id}"]`); if (sp) { sp.classList.add('idle'); setTimeout(() => sp.classList.remove('idle'), 900); }
  resumeAmbient(); renderNudge();
}
function setTab(tab, silent) {
  S.tab = tab; $('#jSeg').classList.toggle('g', tab === 'gallery');
  $$('#jSeg button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  $('#pages').classList.toggle('hidden', tab !== 'pages'); $('#gallery').classList.toggle('hidden', tab !== 'gallery');
  if (tab === 'gallery') renderGallery();
  if (!silent) Snd.play('chip');
}
function renderPages(o = {}) {
  const b = bookById(S.cur); if (!b) return;
  const all = entriesOf(S.cur), q = S.search.trim().toLowerCase();
  const numbered = all.map((e, i) => ({ e, n: i + 1 }));
  let list = q ? numbered.filter(x => (x.e.text || '').toLowerCase().includes(q) || TAGS[x.e.tag]?.name.toLowerCase().includes(q)) : numbered;
  if (CFG.sortDesc) list = [...list].reverse();
  const pg = $('#pages');
  pg.classList.toggle('anim', !!o.anim);
  const photos = all.filter(e => e.thumb).length;
  $('#jMeta').innerHTML = `${all.length} entr${all.length === 1 ? 'y' : 'ies'} · ${photos} pic${photos === 1 ? '' : 's'}<br>${all.length ? 'last ' + ago(all[all.length - 1].createdAt) : 'brand new'}`;
  if (!list.length) {
    pg.innerHTML = `<div class="j-empty">${ic('quill')}<div>${q ? 'No entries match that search. The page shrugs.' : 'A blank page awaits, adventurer.<br>Write your first note below!'}</div></div>`;
    return;
  }
  let html = '', last = null, idx = 0;
  for (const { e, n } of list) {
    const dk = dayKey(e.createdAt);
    if (dk !== last) { html += `<div class="day">${esc(fmtDateLong(e.createdAt))}</div>`; last = dk; }
    const t = TAGS[e.tag] || TAGS.note, rot = ((hash(e.id) % 100) / 100 - .5) * 1.1, prot = ((hash(e.id + 'p') % 100) / 100 - .5) * 5;
    html += `<article class="entry ${e.star ? 'star' : ''}" data-id="${e.id}" style="--tagc:${t.col};--rot:${rot.toFixed(2)}deg;--prot:${prot.toFixed(2)}deg;--i:${idx++}">
      <span class="e-seal">${ic(t.icon)}</span>
      <div class="e-head"><div class="e-stamp"><b>${esc(fmtDate(e.createdAt))}</b>${esc(fmtTime(e.createdAt))}</div><div class="e-meta"><span class="e-tag">${ic(t.icon)}${t.name}</span><span>Entry #${n}</span></div></div>
      ${e.text ? `<div class="e-text">${esc(e.text)}</div>` : ''}
      ${e.thumb ? `<figure class="e-photo" data-photo="${e.id}"><i class="tape"></i><img src="${e.thumb}" alt="Screenshot" loading="lazy"><figcaption>${esc(fmtShort(e.createdAt))}</figcaption></figure>` : ''}
      ${e.star ? `<div class="e-starflag">${ic('star', 'fill')} SPECIAL MOMENT</div>` : ''}
      <div class="e-foot"><span>${e.editedAt ? 'edited ' + esc(fmtShort(e.editedAt)) + ' · ' + esc(fmtTime(e.editedAt)) : ''}</span><button class="e-more" data-more="${e.id}" aria-label="Entry options">${ic('dots')}</button></div>
    </article>`;
  }
  pg.innerHTML = html;
  if (o.jump) { pg.style.scrollBehavior = 'auto'; pg.scrollTop = CFG.sortDesc ? 0 : pg.scrollHeight; setTimeout(() => pg.style.scrollBehavior = '', 50); }
}
function renderGallery() {
  const g = $('#gallery'), list = entriesOf(S.cur).filter(e => e.thumb);
  if (!list.length) { g.innerHTML = `<div class="j-empty" style="grid-column:1/-1">${ic('camera')}<div>No pictures yet.<br>Snap a screenshot of your best moments with the camera button below.</div></div>`; return; }
  g.innerHTML = [...list].reverse().map(e => `<figure class="g-item ${e.star ? 'm' : ''}" data-photo="${e.id}" style="--prot:${(((hash(e.id + 'g') % 100) / 100 - .5) * 6).toFixed(1)}deg"><img src="${e.thumb}" alt="" loading="lazy"><small>${esc(fmtShort(e.createdAt))} · ${esc(fmtTime(e.createdAt))}</small></figure>`).join('');
}

/* ---------- photos ---------- */
async function loadImg(file) {
  const url = URL.createObjectURL(file), img = new Image(); img.src = url;
  try { await img.decode(); } catch (e) { await new Promise((res, rej) => { img.onload = res; img.onerror = rej; }); }
  img._url = url; return img;
}
function resizeTo(img, max, q) {
  const w0 = img.naturalWidth || img.width, h0 = img.naturalHeight || img.height, s = Math.min(1, max / Math.max(w0, h0));
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w0 * s)); c.height = Math.max(1, Math.round(h0 * s));
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', q);
}
async function processPhoto(file, full = 1600, thumb = 420) {
  const img = await loadImg(file); const r = { full: resizeTo(img, full, .82), thumb: resizeTo(img, thumb, .78) }; URL.revokeObjectURL(img._url); return r;
}
async function openLightbox(entryId) {
  const e = entryById(entryId); if (!e) return; const box = $('#lightbox'); Snd.play('photo');
  const rec = await DB.get('photos', entryId).catch(() => null), src = (rec && rec.data) || e.thumb, t = TAGS[e.tag] || TAGS.note;
  box.classList.remove('hidden');
  box.innerHTML = `<div class="lb-top"><button class="j-btn" id="lbX">${ic('x')}</button><button class="j-btn" id="lbSave">${ic('download')}</button></div><div class="lb-img"><img src="${src}" alt="Screenshot"></div><div class="lb-cap"><small>${esc(fmtDate(e.createdAt))} · ${esc(fmtTime(e.createdAt))} · ${esc(t.name)}</small>${esc(e.text || '')}</div>`;
  $('#lbX').onclick = () => { Snd.play('tap'); box.classList.add('hidden'); box.innerHTML = ''; };
  $('#lbSave').onclick = () => { Snd.play('tap'); shareFile(src, `Lorebook-${dayKey(e.createdAt)}-${e.id.slice(-4)}.jpg`, 'image/jpeg'); };
}
async function shareFile(srcOrBlob, name, type) {
  const blob = typeof srcOrBlob === 'string' ? await (await fetch(srcOrBlob)).blob() : srcOrBlob;
  const f = new File([blob], name, { type });
  if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f] }); return true; } catch (e) { if (e.name === 'AbortError') return false; } }
  downloadBlob(blob, name); return true;
}
function downloadBlob(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}

/* ---------- saving entries ---------- */
async function submitEntry() {
  const ta = $('#cmpText'), text = ta.value.trim(), c = S.compose, b = bookById(S.cur); if (!b) return;
  if (!text && !c.thumb) { Snd.play('err'); const bar = $('.cmp-bar'); bar.classList.remove('shake'); void bar.offsetWidth; bar.classList.add('shake'); toast('Write something (or snap a picture) first!', { ms: 1800 }); return; }
  const now = Date.now(), btn = $('#cmpSave'); btn.classList.add('go'); setTimeout(() => btn.classList.remove('go'), 500);
  if (c.editId) {
    const e = entryById(c.editId); e.text = text; e.tag = c.tag; e.star = c.star; e.editedAt = now;
    if (c.photoChanged) { if (c.photo) { e.thumb = c.thumb; await DB.put('photos', { id: e.id, data: c.photo }); } else { e.thumb = null; await DB.del('photos', e.id); } }
    await DB.put('entries', e); Snd.play('save'); resetCompose(); renderPages(); if (S.tab === 'gallery') renderGallery(); toast('Entry updated', { ms: 1600 }); return;
  }
  const e = { id: uid(), bookId: S.cur, text, tag: c.tag, star: c.star, thumb: c.thumb || null, createdAt: now };
  await DB.put('entries', e); if (c.photo) await DB.put('photos', { id: e.id, data: c.photo });
  S.entries.push(e); b.updatedAt = now; DB.put('books', b);
  const hadPhoto = !!c.thumb, star = c.star; resetCompose();
  if (S.tab !== 'pages') setTab('pages', true);
  renderPages(); const card = $(`.entry[data-id="${e.id}"]`);
  if (card) {
    card.classList.add('new');
    const pg = $('#pages'); pg.style.scrollBehavior = 'smooth'; if (CFG.sortDesc) pg.scrollTop = 0; else pg.scrollTop = pg.scrollHeight + 500;
    setTimeout(() => { const [x, y] = centerOf(card); burst(x, y, { n: 24, spread: 110, colors: star ? ['#ffd35a', '#fff6c0', '#ffe27a'] : [b.trim, '#fff6c0', '#ffd35a', '#7ad8ff'] }); }, 420);
  }
  Snd.play('save'); if (hadPhoto) setTimeout(() => Snd.play('photo'), 120);
  const [bx, by] = centerOf(btn); addXP(10 + (hadPhoto ? 15 : 0) + (star ? 5 : 0) + (e.tag === 'boss' ? 5 : 0), [bx, by - 30]);
  if (star) setTimeout(() => Snd.play('star'), 300);
  setTimeout(checkAch, 900);
}
function entryMenu(id) {
  const e = entryById(id); if (!e) return;
  actionSheet('Entry options', [
    { icon: 'edit', label: 'Edit entry', fn: () => startEdit(id) },
    { icon: 'star', label: e.star ? 'Remove special-moment star' : 'Mark as special moment', fn: async () => { e.star = !e.star; await DB.put('entries', e); Snd.play(e.star ? 'star' : 'chip'); renderPages(); if (e.star) { unlock('moment'); } } },
    ...(e.thumb ? [{ icon: 'image', label: 'View picture', fn: () => openLightbox(id) }] : []),
    { icon: 'trash', label: 'Delete entry', danger: true, fn: async () => { if (await ask('Delete this entry?', 'This note will be erased from the book. No undo button. We checked.', 'Delete', true)) { await DB.del('entries', id); await DB.del('photos', id); S.entries = S.entries.filter(x => x.id !== id); Snd.play('del'); renderPages(); if (S.tab === 'gallery') renderGallery(); } } }
  ], 'quill');
}
function startEdit(id) {
  const e = entryById(id); if (!e) return;
  S.compose = { tag: e.tag, star: !!e.star, photo: null, thumb: e.thumb || null, editId: id, photoChanged: false };
  const ta = $('#cmpText'); ta.value = e.text || ''; autoGrow(ta); renderComposer(); ta.focus(); Snd.play('chip');
}

function initJournalEvents() {
  $('#jBack').innerHTML = ic('back'); $('#jMenu').innerHTML = ic('dots');
  $('#cmpCam').innerHTML = ic('camera'); $('#cmpPic').innerHTML = ic('image'); $('#cmpStar').innerHTML = ic('star'); $('#cmpSave .qi').innerHTML = ic('quill'); $('#cmpPhotoX').innerHTML = ic('x');
  $('#jBack').onclick = () => closeJournal();
  $('#jMenu').onclick = () => {
    const b = bookById(S.cur); if (!b) return;
    actionSheet(b.title, [
      { icon: 'palette', label: 'Customize this book', fn: () => openCustomize(b.id) },
      { icon: 'search', label: 'Search entries', fn: () => { const s = $('#jSearch'); s.classList.toggle('hidden'); if (!s.classList.contains('hidden')) $('#jSearchIn').focus(); else { S.search = ''; $('#jSearchIn').value = ''; renderPages(); } } },
      { icon: 'sort', label: CFG.sortDesc ? 'Show oldest entries first' : 'Show newest entries first', fn: () => { CFG.sortDesc = !CFG.sortDesc; saveCfg(); renderPages({ jump: true }); } },
      { icon: 'trash', label: 'Burn this book', danger: true, fn: () => deleteBook(b.id) }
    ], 'book');
  };
  $('#jSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTab(b.dataset.tab); });
  $('#jSearchIn').addEventListener('input', e => { S.search = e.target.value; renderPages(); });
  $('#pages').addEventListener('click', e => {
    const m = e.target.closest('[data-more]'); if (m) { Snd.play('tap'); entryMenu(m.dataset.more); return; }
    const p = e.target.closest('[data-photo]'); if (p) openLightbox(p.dataset.photo);
  });
  $('#gallery').addEventListener('click', e => { const p = e.target.closest('[data-photo]'); if (p) openLightbox(p.dataset.photo); });
  $('#cmpTags').addEventListener('click', e => { const t = e.target.closest('[data-tag]'); if (!t) return; S.compose.tag = t.dataset.tag; Snd.play('chip'); renderComposer(); });
  const ta = $('#cmpText');
  ta.addEventListener('input', () => autoGrow(ta));
  ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && CFG.enterSaves) { e.preventDefault(); submitEntry(); } });
  ta.addEventListener('blur', () => setTimeout(() => window.scrollTo(0, 0), 50));
  $('#cmpStar').onclick = () => { S.compose.star = !S.compose.star; Snd.play(S.compose.star ? 'star' : 'chip'); renderComposer(); if (S.compose.star) { const [x, y] = centerOf($('#cmpStar')); burst(x, y, { n: 10, spread: 50, colors: ['#ffd35a', '#fff'] }); } };
  $('#cmpCam').onclick = () => { Snd.play('tap'); $('#fileCam').click(); };
  $('#cmpPic').onclick = () => { Snd.play('tap'); $('#filePic').click(); };
  const onFile = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { const p = await processPhoto(f); S.compose.photo = p.full; S.compose.thumb = p.thumb; S.compose.photoChanged = true; Snd.play('photo'); renderComposer(); const [x, y] = centerOf($('#cmpPhoto')); burst(x, y, { n: 10, spread: 50 }); }
    catch (err) { Snd.play('err'); toast('Could not read that picture.'); }
  };
  $('#fileCam').addEventListener('change', onFile); $('#filePic').addEventListener('change', onFile);
  $('#cmpPhotoX').onclick = () => { S.compose.photo = null; S.compose.thumb = null; S.compose.photoChanged = true; Snd.play('del'); renderComposer(); };
  $('#cmpCancel').onclick = () => { Snd.play('tap'); resetCompose(); };
  $('#cmpSave').onclick = submitEntry;
}
