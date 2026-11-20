'use strict';
/* ============================================================
   LOREBOOK — boot, portrait lock layout, loops, wiring
   ============================================================ */

/* ---------- portrait lock ----------
   iOS ignores web-app orientation locks, so if the phone is turned sideways
   the whole app is counter-rotated to stay exactly as it is in portrait. */
function layout() {
  const f = $('#frame'), W = window.innerWidth, H = window.innerHeight, vv = window.visualViewport;
  const touch = matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 1;
  const land = touch && W > H, desktop = !touch && W > 520;
  const pr = getComputedStyle($('#probe'));
  const I = { t: parseFloat(pr.paddingTop) || 0, r: parseFloat(pr.paddingRight) || 0, b: parseFloat(pr.paddingBottom) || 0, l: parseFloat(pr.paddingLeft) || 0 };
  let w = W, h = H, left = 0, top = 0, rot = 0, st = I.t, sr = I.r, sb = I.b, sl = I.l;
  if (desktop) { w = Math.min(W, 440); left = (W - w) / 2; }
  if (land) {
    w = H; h = W; left = (W - w) / 2; top = (H - h) / 2;
    let o = typeof window.orientation === 'number' ? window.orientation : (screen.orientation ? ({ 90: -90, 270: 90 }[screen.orientation.angle] || 0) : 0);
    if (!o) o = 90;
    rot = -o;
    if (rot === -90) { st = I.l; sr = I.t; sb = I.r; sl = I.b; } else { st = I.r; sr = I.b; sb = I.l; sl = I.t; }
  } else if (vv && vv.height < H - 120) { h = vv.height; top = vv.offsetTop; sb = 0; }   // on-screen keyboard
  f.style.width = w + 'px'; f.style.height = h + 'px'; f.style.left = left + 'px'; f.style.top = top + 'px';
  f.style.transform = rot ? `rotate(${rot}deg)` : '';
  f.style.setProperty('--st', st + 'px'); f.style.setProperty('--sr', sr + 'px'); f.style.setProperty('--sb', sb + 'px'); f.style.setProperty('--sl', sl + 'px');
  f.classList.toggle('desktop', desktop);
  const widthChanged = S.lastW !== w; S.lastW = w; ROT = rot;
  if (widthChanged) {
    clearTimeout(S.rz); S.rz = setTimeout(() => {
      if (S.sky) S.sky.resize(); if (S.fx) S.fx.resize();
      if (S.view === 'library') renderLibrary({ quiet: true }); else S.libDirty = true;
    }, 120);
  }
}

/* ---------- ambient weather sound ---------- */
function skyKind() { const c = Wx.view().cond; return c.storm ? 'storm' : c.precip === 'rain' ? 'rain' : (c.precip === 'snow' || c.fog > .5) ? 'wind' : 'none'; }
function updateAmbient() { if (S.view === 'library' && !document.hidden && CFG.ambient && CFG.sound && Snd.ctx) Amb.set(skyKind()); else Amb.set('none'); }
const pauseAmbient = () => Amb.set('none');
const resumeAmbient = () => updateAmbient();
function updateSoundBtn() { $('#btnSound').innerHTML = ic(CFG.sound ? 'speaker' : 'mute'); }

/* ---------- main animation loop (library scene only) ---------- */
let lastT = performance.now(), accT = 0;
function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min(.1, (t - lastT) / 1000); lastT = t; accT += dt;
  if (accT < 1 / 32) return; const step = accT; accT = 0;
  if (document.hidden || S.view !== 'library') return;
  if (S.sky) S.sky.frame(step); if (S.fx) S.fx.frame(step);
}

/* ---------- library entry ---------- */
let greetTimer = null, idleTimer = null;
function startGreeting() {
  const g = $('#greet'); let i = Math.floor(Math.random() * GREETINGS.length);
  const set = () => { g.style.animation = 'none'; void g.offsetWidth; g.style.animation = ''; g.textContent = GREETINGS[i++ % GREETINGS.length]; };
  set(); clearInterval(greetTimer); greetTimer = setInterval(() => { if (S.view === 'library') set(); }, 9000);
  clearInterval(idleTimer);
  idleTimer = setInterval(() => {
    if (S.view !== 'library' || S.busy || document.hidden) return;
    const all = $$('#rows .sp:not(.sp-new)'); if (!all.length) return; const sp = pick(all);
    sp.classList.add('idle'); setTimeout(() => sp.classList.remove('idle'), 900);
  }, 6500);
}
function enterLibrary() {
  S.view = 'library'; $('#library').classList.remove('hidden');
  layout(); if (S.sky) S.sky.resize(); if (S.fx) S.fx.resize();
  renderLibrary(); renderNudge(); updateHUD(); startGreeting(); updateAmbient();
}

/* ---------- boot ---------- */
async function init() {
  const boot = $('#boot'), t0 = Date.now();
  try {
    layout();
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => document.addEventListener(ev, e => e.preventDefault()));
    ['pointerdown', 'touchend', 'click'].forEach(ev => document.addEventListener(ev, () => Snd.resume(), { passive: true, capture: true }));
    window.addEventListener('resize', () => { layout(); setTimeout(layout, 150); });
    window.addEventListener('orientationchange', () => { [60, 250, 600].forEach(d => setTimeout(layout, d)); });
    if (window.visualViewport) { visualViewport.addEventListener('resize', layout); visualViewport.addEventListener('scroll', layout); }
    window.addEventListener('scroll', () => { if (window.scrollY || window.scrollX) window.scrollTo(0, 0); });

    await DB.open();
    S.books = await DB.all('books'); S.entries = await DB.all('entries');
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });

    // build the scene (library sits under the boot splash)
    $('#library').classList.remove('hidden');
    S.sky = new SkyWindow($('#winCv')); S.fx = new SceneFX($('#fxcv'));
    S.sky.onBolt = () => { const w = $('#win'); w.classList.remove('bolt'); void w.offsetWidth; w.classList.add('bolt'); if (CFG.ambient && CFG.sound) setTimeout(() => Snd.play('thunder'), 600 + Math.random() * 900); };
    applyTheme(CFG.theme, false);
    $('#btnTheme').innerHTML = ic('palette'); $('#btnSettings').insertAdjacentHTML('afterbegin', ic('gear')); updateSoundBtn();
    $('#btnTrophy').onclick = () => { Snd.play('tap'); openTrophies(); };
    $('#btnTheme').onclick = () => { Snd.play('tap'); openThemes(); };
    $('#btnSettings').onclick = () => { Snd.play('tap'); openSettings(); };
    $('#btnSound').onclick = () => { CFG.sound = !CFG.sound; saveCfg(); updateSoundBtn(); if (CFG.sound) { Snd.resume(); Snd.play('chip'); } updateAmbient(); };
    $('#fileImport').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) importBackup(f); });
    initLibraryEvents(); initShelfBar(); initJournalEvents(); updateHUD();

    // weather: use the cache straight away, then refresh in the background
    Wx.refresh().then(() => updateAmbient());
    setInterval(async () => { if (!document.hidden && await Wx.refresh()) updateAmbient(); }, 60000);
    window.addEventListener('online', () => Wx.refresh(true));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { Amb.set('none'); return; }
      layout(); Wx.refresh().then(() => updateAmbient()); updateAmbient();
    });
    requestAnimationFrame(loop);

    // location is re-checked every 30 days
    if (CFG.loc && Date.now() - (CFG.locAt || 0) > 30 * 864e5) {
      if (CFG.loc.src === 'gps') Wx.geolocate().then(l => { Wx.setLoc(l); Wx.refresh(true); }).catch(() => { CFG.locAt = Date.now() - 29 * 864e5; saveCfg(); });
      else { CFG.locAt = Date.now(); saveCfg(); }
    }

    await sleep(Math.max(0, 1700 - (Date.now() - t0)));
    if (!CFG.welcomed) showWelcome(); else enterLibrary();
    boot.classList.add('out'); setTimeout(() => boot.remove(), 600);
    setTimeout(() => { const r = screenCheck(true); if (r.res.some(x => !x[0])) toast('Screen check found something odd — see Settings › Screen checker.', { ms: 3500 }); }, 1500);
  } catch (err) {
    console.error(err);
    $('.boot-sub').textContent = 'Something went wrong starting Lorebook: ' + (err && err.message || err);
  }
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
}
document.addEventListener('DOMContentLoaded', init);
