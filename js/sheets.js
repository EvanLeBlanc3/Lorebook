'use strict';
/* ============================================================
   LOREBOOK — sheets: customizer, themes, shelf options, settings,
   trophies, backup / restore, demo books, screen checker, welcome
   ============================================================ */

function shakeEl(e) { e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake'); }

/* ---------- new / customize book ---------- */
function newBook() { Snd.play('chip'); openCustomize(null); }

function openCustomize(bookId) {
  const orig = bookId ? bookById(bookId) : null, isNew = !orig;
  const d = isNew ? randomBookLook(newBookDraft()) : JSON.parse(JSON.stringify(orig));
  const n = orig ? S.entries.filter(e => e.bookId === orig.id).length : 0;
  const chip = (k, v, label, sub, style) => `<button class="chip" data-k="${k}" data-v="${v}" ${style ? `style="${style}"` : ''}>${label}${sub ? `<small>${sub}</small>` : ''}</button>`;
  const html = `
    <div class="sec">Game title</div>
    <input class="field" id="cTitle" maxlength="60" placeholder="e.g. Elden Ring" autocomplete="off" value="${esc(d.title)}">
    <div class="sec">Platform</div>
    <div class="chips">${Object.keys(PLATFORMS).map(p => chip('platform', p, p)).join('')}</div>
    <div class="sec">Book type</div>
    <div class="chips">${STYLES.map(s => chip('style', s.id, s.name, s.blurb)).join('')}</div>
    <div class="sec">Cover colour</div>
    <div class="swatches">${COVER_SWATCHES.map(c => `<button class="swatch" data-k="color" data-v="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}<span class="swatch custom" id="swCoverC"><input type="color" id="cColor" value="${d.color}"></span></div>
    <div class="sec">Trim &amp; accent colour</div>
    <div class="swatches">${TRIM_SWATCHES.map(c => `<button class="swatch" data-k="trim" data-v="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}<span class="swatch custom" id="swTrimC"><input type="color" id="cTrim" value="${d.trim}"></span></div>
    <div class="sec">Title font</div>
    <div class="fontchips">${FONTS.map(f => `<button class="chip" data-k="font" data-v="${f.id}" style="font-family:${f.stack}">${f.name}</button>`).join('')}</div>
    <div class="sec">Emblem</div>
    <div class="emblems">${EMBLEMS.map(e => `<button class="emb" data-k="emblem" data-v="${e}" aria-label="${e}">${ic(e)}</button>`).join('')}</div>
    <div class="sec">Cover pattern</div>
    <div class="pats">${PATTERNS.map(p => `<button class="pat" data-k="pattern" data-v="${p}" style="--pp:${patUrl(p, '#ffffff')}">${p === 'none' ? 'None' : ''}</button>`).join('')}</div>
    <div class="sec">Height</div>
    <div class="chips">${chip('size', 'short', 'Short')}${chip('size', 'medium', 'Medium')}${chip('size', 'tall', 'Tall')}</div>
    <div class="sec">Thickness</div>
    <div class="chips">${chip('thick', 'slim', 'Slim')}${chip('thick', 'normal', 'Normal')}${chip('thick', 'thick', 'Chonky')}</div>
    <div class="sec">Special effect</div>
    <div class="chips">${EFFECTS.map(f => chip('effect', f.id, f.name)).join('')}</div>
    <div class="sec">Cover picture <span style="letter-spacing:0;text-transform:none;font-weight:600">(replaces the emblem)</span></div>
    <div class="cover-pic"><button class="btn small" id="cPic">${ic('image')} Choose picture</button><button class="btn small ghost ${d.cover ? '' : 'hidden'}" id="cPicX">${ic('x')} Remove</button><input type="file" id="cFile" accept="image/*" hidden></div>`;
  const foot = `${isNew ? '' : `<button class="btn danger small" id="cDel" style="flex:0 0 auto;min-height:46px" aria-label="Delete book">${ic('trash')}</button>`}<button class="btn ghost" id="cCancel">Cancel</button><button class="btn primary" id="cSave">${isNew ? 'Create book' : 'Save changes'}</button>`;
  // the preview lives in the sheet's pinned area, so it never scrolls away while you tweak the options below it
  const sh = openSheet({ title: isNew ? 'New Quest Journal' : 'Customize Book', icon: isNew ? 'sparkle' : 'palette', html, foot, cls: 'tall', pin: '<div class="cust-preview" id="cp"></div>' });
  const B = sh.body, cp = $('#cp', sh.el);
  const paint = () => {
    cp.innerHTML = `<button class="dice" id="cDice" aria-label="Randomize look">${ic('dice')}</button>${coverHTML(d, n)}${spineHTML(d, n)}`;
    $$('[data-k]', B).forEach(x => x.classList.toggle('on', String(d[x.dataset.k]) === x.dataset.v));
    $('#swCoverC', B).classList.toggle('on', !COVER_SWATCHES.includes(d.color)); $('#swTrimC', B).classList.toggle('on', !TRIM_SWATCHES.includes(d.trim));
    $('#cColor', B).value = d.color; $('#cTrim', B).value = d.trim;
    $('#cPicX', B).classList.toggle('hidden', !d.cover);
  };
  paint();
  sh.el.addEventListener('click', e => {
    const t = e.target.closest('[data-k]'); if (t) { d[t.dataset.k] = t.dataset.v; Snd.play('chip'); paint(); return; }
    if (e.target.closest('#cDice')) { randomBookLook(d); Snd.play('newbook'); paint(); }
  });
  $('#cTitle', B).addEventListener('input', e => { d.title = e.target.value; paint(); });
  $('#cColor', B).addEventListener('input', e => { d.color = e.target.value; paint(); });
  $('#cTrim', B).addEventListener('input', e => { d.trim = e.target.value; paint(); });
  $('#cPic', B).onclick = () => { Snd.play('tap'); $('#cFile', B).click(); };
  $('#cFile', B).addEventListener('change', async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; try { const img = await loadImg(f); d.cover = resizeTo(img, 520, .85); URL.revokeObjectURL(img._url); Snd.play('photo'); paint(); } catch (err) { Snd.play('err'); toast('Could not read that picture.'); } });
  $('#cPicX', B).onclick = () => { d.cover = null; Snd.play('del'); paint(); };
  $('#cCancel', sh.el).onclick = () => { Snd.play('tap'); sh.close(); };
  if (!isNew) $('#cDel', sh.el).onclick = () => { sh.close(); setTimeout(() => deleteBook(orig.id), 350); };
  $('#cSave', sh.el).onclick = async () => {
    d.title = d.title.trim();
    if (!d.title) { Snd.play('err'); shakeEl($('#cTitle', B)); toast('Name your game first, adventurer!', { ms: 1800 }); $('#cTitle', B).focus(); return; }
    if (isNew) {
      d.order = Date.now(); d.createdAt = Date.now(); S.books.push(d); await DB.put('books', d); clearShelfSearch();
      sh.close(); renderLibrary({ quiet: true }); Snd.play('newbook');
      const sp = $(`.sp[data-id="${d.id}"]`);
      if (sp) { sp.classList.add('dropin'); sp.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(() => { const [x, y] = centerOf(sp); burst(x, y, { n: 30, spread: 120, colors: [d.trim, '#fff6c0', '#ffd35a', '#ff7ac8', '#7ad8ff'] }); }, 650); }
      addXP(20, [FW() / 2, FH() / 2]); setTimeout(checkAch, 900);
    } else {
      Object.assign(orig, d, { updatedAt: Date.now() }); await DB.put('books', orig); sh.close();
      if (S.view === 'journal' && S.cur === orig.id) applyBookToJournal(orig);
      renderLibrary({ quiet: true }); Snd.play('newbook'); unlock('custom');
      const sp = $(`.sp[data-id="${orig.id}"]`); if (sp) { sp.classList.add('idle'); setTimeout(() => { const [x, y] = centerOf(sp); burst(x, y, { n: 16, spread: 80, colors: [orig.trim, '#fff'] }); }, 100); }
    }
  };
}

/* ---------- sort & arrange the shelf ---------- */
function openShelfOptions() {
  const rowsHtml = () => SORTS.map(([id, name, sub, icon]) => `<button class="act sortrow ${CFG.shelfSort === id ? 'on' : ''}" data-sort="${id}">${ic(icon)}<span>${esc(name)}<small>${esc(sub)}</small></span>${CFG.shelfSort === id ? ic('check', 'tick') : ''}</button>`).join('');
  const modes = [['tidy', 'Tidy', 'All upright'], ['casual', 'Casual', 'Some lean or lie flat'], ['messy', 'Messy', 'A bookworm’s chaos']];
  const sh = openSheet({
    title: 'Sort & Arrange', icon: 'sort',
    html: `<div class="sec">Sort the shelf</div><div id="soList">${rowsHtml()}</div>
      <div class="sec">How the books sit</div>
      <div class="chips" id="soModes">${modes.map(([id, n, s]) => `<button class="chip ${CFG.shelfMode === id ? 'on' : ''}" data-mode="${id}">${n}<small>${s}</small></button>`).join('')}</div>
      <div style="margin-top:14px"><button class="btn small" id="soShuffle">${ic('shuffle')} Reshuffle the mess</button></div>
      <p class="dim" style="margin:14px 0 0;line-height:1.45">Leaning and lying-flat are just for looks — every book stays tappable, searchable and sortable. Hold a book to open its menu.</p>`
  });
  const relist = () => { $('#soList', sh.body).innerHTML = rowsHtml(); };
  sh.body.addEventListener('click', e => {
    const r = e.target.closest('[data-sort]');
    if (r) { CFG.shelfSort = r.dataset.sort; saveCfg(); relist(); Snd.play('shuffle'); renderLibrary(); unlock('tidy'); return; }
    const m = e.target.closest('[data-mode]');
    if (m) { CFG.shelfMode = m.dataset.mode; saveCfg(); $$('[data-mode]', sh.body).forEach(x => x.classList.toggle('on', x === m)); Snd.play('shuffle'); renderLibrary(); return; }
    if (e.target.closest('#soShuffle')) { CFG.shelfSeed = (CFG.shelfSeed || 1) + 1; saveCfg(); if (CFG.shelfMode === 'tidy') { CFG.shelfMode = 'casual'; saveCfg(); $$('[data-mode]', sh.body).forEach(x => x.classList.toggle('on', x.dataset.mode === 'casual')); } Snd.play('shuffle'); renderLibrary(); }
  });
}

/* ---------- theme picker ---------- */
function openThemes() {
  const sh = openSheet({
    title: 'Library Theme', icon: 'palette',
    html: `<p class="dim" style="margin:0 0 14px">Pick the room your books live in. The window changes to match.</p><div class="th-grid">${Object.entries(THEMES).map(([id, t]) => `<button class="th-card ${CFG.theme === id ? 'on' : ''}" data-t="${id}"><div class="th-prev" style="background:linear-gradient(180deg,${t.swatch[0]},${mix(t.swatch[0], '#000000', .55)})">${ic(t.icon)}<b style="background:${t.swatch[2]};box-shadow:0 0 14px ${t.swatch[2]}"></b><i style="background:${t.swatch[1]}"></i></div><h4>${esc(t.name)}</h4><p>${esc(t.blurb)}</p></button>`).join('')}</div>`
  });
  sh.body.addEventListener('click', e => {
    const c = e.target.closest('.th-card'); if (!c || c.dataset.t === CFG.theme) return;
    const [x, y] = centerOf(c); Snd.play('theme'); applyTheme(c.dataset.t, true, [x, y]);
    $$('.th-card', sh.body).forEach(k => k.classList.toggle('on', k === c));
    setTimeout(() => { renderLibrary({ quiet: true }); }, 450); unlock('theme');
  });
}

/* ---------- trophies ---------- */
function openTrophies() {
  const l = lvlOf(CFG.xp), a = xpFor(l), b = xpFor(l + 1), st = stats(), got = ACH.filter(x => CFG.ach[x.id]).length;
  openSheet({
    title: 'Trophy Room', icon: 'trophy',
    html: `<div class="tr-head"><div class="tr-badge">${l}</div><div style="flex:1"><h3>${esc(rankOf(l))}</h3><p>${CFG.xp} XP · ${b - CFG.xp} to level ${l + 1}</p><i class="xpbar"><u style="width:${clamp((CFG.xp - a) / (b - a) * 100, 3, 100)}%"></u></i></div></div>
    <div class="stats"><div class="stat"><b>${st.books}</b><small>Books</small></div><div class="stat"><b>${st.entries}</b><small>Entries</small></div><div class="stat"><b>${st.photos}</b><small>Pictures</small></div><div class="stat"><b>${st.streak}</b><small>Day streak</small></div></div>
    <div class="sec">Achievements <span>${got} / ${ACH.length}</span></div>
    <div class="ach-grid">${ACH.map(x => `<div class="ach ${CFG.ach[x.id] ? 'got' : ''}">${ic(x.icon)}<div><b>${esc(x.name)}</b><small>${esc(x.desc)}</small></div></div>`).join('')}</div>`
  });
}

/* ---------- location helpers ---------- */
function citySearchUI(box, onPick) {
  box.innerHTML = `<div style="display:flex;gap:8px"><input class="field" placeholder="City name…" autocomplete="off" enterkeyhint="search"><button class="btn small primary">Find</button></div><div class="city-list" style="margin-top:8px"></div>`;
  const inp = $('input', box), list = $('.city-list', box); let res = [];
  const go = async () => {
    const q = inp.value.trim(); if (!q) return; Snd.play('tap'); list.innerHTML = '<div class="dim">Consulting the atlas…</div>';
    try { res = await Wx.searchCity(q); list.innerHTML = res.length ? res.map((c, i) => `<button data-i="${i}">${ic('pin')}<span>${esc(c.name)}</span></button>`).join('') : '<div class="dim">No such place. Try another spelling?</div>'; }
    catch (e) { list.innerHTML = '<div class="err">Couldn’t reach the atlas. Check your connection.</div>'; }
  };
  $('button', box).onclick = go; inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  list.addEventListener('click', e => { const b = e.target.closest('button'); if (b) onPick(res[+b.dataset.i]); });
}
async function setLocation(loc) {
  Wx.setLoc(loc); unlock('where'); const ok = await Wx.refresh(true); Snd.play('theme'); updateAmbient(); return ok;
}
async function useGps() { const loc = await Wx.geolocate(); await setLocation(loc); return loc; }

/* ---------- backup / restore ---------- */
async function buildBackup() {
  const [books, entries, photos] = await Promise.all([DB.all('books'), DB.all('entries'), DB.all('photos')]);
  const pm = {}; photos.forEach(p => pm[p.id] = p.data); entries.forEach(e => { if (pm[e.id]) e.photo = pm[e.id]; });
  const data = { app: 'Lorebook', version: 1, exportedAt: new Date().toISOString(), profile: { xp: CFG.xp, ach: CFG.ach, theme: CFG.theme }, books, entries };
  const json = JSON.stringify(data);
  return { blob: new Blob([json], { type: 'application/json' }), books: books.length, entries: entries.length, photos: photos.length, size: json.length };
}
async function importBackup(file) {
  let data; try { data = JSON.parse(await file.text()); } catch (e) { Snd.play('err'); toast('That file isn’t valid JSON.'); return; }
  if (!data || data.app !== 'Lorebook' || !Array.isArray(data.books) || !Array.isArray(data.entries)) { Snd.play('err'); toast('That doesn’t look like a Lorebook backup.'); return; }
  const mode = await dialog({
    title: 'Restore backup?', msg: `This backup holds <b>${data.books.length}</b> book${data.books.length === 1 ? '' : 's'} and <b>${data.entries.length}</b> entr${data.entries.length === 1 ? 'y' : 'ies'}${data.exportedAt ? ` (made ${esc(new Date(data.exportedAt).toLocaleDateString())})` : ''}.<br><br><b>Merge</b> keeps your current books and adds these. <b>Replace</b> wipes everything first.`,
    buttons: [{ label: 'Cancel', val: null, cls: 'ghost' }, { label: 'Merge', val: 'merge' }, { label: 'Replace', val: 'replace', cls: 'danger' }]
  });
  if (!mode) return;
  if (mode === 'replace') { await DB.clear('books'); await DB.clear('entries'); await DB.clear('photos'); }
  const photos = [], entries = data.entries.map(e => { const c = { ...e }; if (c.photo) { photos.push({ id: c.id, data: c.photo }); delete c.photo; } return c; });
  await DB.putMany('books', data.books); await DB.putMany('entries', entries); if (photos.length) await DB.putMany('photos', photos);
  if (data.profile) { CFG.xp = Math.max(mode === 'replace' ? 0 : CFG.xp, data.profile.xp || 0); CFG.ach = Object.assign(mode === 'replace' ? {} : CFG.ach, data.profile.ach || {}); saveCfg(); }
  S.books = await DB.all('books'); S.entries = await DB.all('entries'); updateHUD(); renderLibrary({ quiet: true });
  Snd.play('newbook'); toast(`Restored ${data.books.length} books & ${data.entries.length} entries!`, { ms: 3000 });
}

/* ---------- demo books ---------- */
function makeShot(i) {
  const pal = [['#1b2a5c', '#6a4fa3', '#e8b44a'], ['#3a96f0', '#b5e3ff', '#fff3b0'], ['#2b1a3a', '#c2410c', '#ffd35a'], ['#0f2f2f', '#1f8f6a', '#c8ffd9'], ['#240a3d', '#ff3df2', '#22e5ff'], ['#3a2a18', '#d98c3a', '#ffe9b0']][i % 6];
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]); x.fillStyle = g; x.fillRect(0, 0, w, h);
    const r = rng(i * 99 + 5); x.fillStyle = 'rgba(255,255,255,.8)'; for (let k = 0; k < 40; k++) x.fillRect(r() * w, r() * h * .5, w / 160, w / 160);
    x.fillStyle = pal[2]; x.beginPath(); x.arc(w * (.3 + r() * .4), h * .28, h * .1, 0, 6.283); x.fill();
    [.62, .74, .86].forEach((yy, j) => { x.fillStyle = ['#00000055', '#00000088', '#000000bb'][j]; x.beginPath(); x.moveTo(0, h); let px = 0; while (px <= w) { x.lineTo(px, h * yy - Math.abs(Math.sin(px * .01 + j * 2 + i)) * h * .12); px += w / 24; } x.lineTo(w, h); x.fill(); });
    x.fillStyle = '#ff4d6d'; for (let k = 0; k < 3; k++) { const hx = w * .04 + k * w * .05, hy = h * .06, s = w * .014; x.fillRect(hx, hy, s * 3, s * 3); }
    return c; };
  return { full: mk(640, 400).toDataURL('image/jpeg', .8), thumb: mk(320, 200).toDataURL('image/jpeg', .75) };
}
const DEMO_BOOKS = [
  { title: 'Hollow Knight', platform: 'PC', style: 'tome', color: '#1d2a4d', trim: '#c0c7d1', font: 'copper', emblem: 'shield', pattern: 'runes', size: 'tall', thick: 'normal', effect: 'foil',
    e: [['Finally beat the False Knight. My thumbs have filed a formal complaint.', 'boss', 0], ['Found a bench in the Forgotten Crossroads. Sat for a solid five minutes. 10/10 bench.', 'note', 0], ['Cracked wall behind the Greenpath lantern. ALWAYS check the cracked walls.', 'secret', 1], ['Got the Mothwing Cloak. Dashing at everything like I own the place.', 'loot', 2]] },
  { title: 'Tears of the Kingdom', platform: 'Switch', style: 'grimoire', color: '#2f6b2a', trim: '#e3b341', font: 'papyrus', emblem: 'key', pattern: 'scales', size: 'tall', thick: 'thick', effect: 'glow',
    e: [['Built a flying machine. It flew for 4 seconds. Both are records.', 'hype', 3], ['Zonai device count: many. Common sense count: negative.', 'note', 0], ['Reached the Depths and immediately regretted every choice.', 'oops', 0], ['Lightroot unlocked. The map is finally making sense.', 'quest', 0]] },
  { title: 'Stardew Valley', platform: 'PC', style: 'paperback', color: '#f5e6c8', trim: '#2f8f4b', font: 'marker', emblem: 'tree', pattern: 'dots', size: 'medium', thick: 'slim', effect: 'none',
    e: [['Spring 12: planted 40 parsnips. Spring 13: forgot to water them. Farmers, am I right.', 'note', 0], ['Gave Abigail an amethyst. She loved it. I am now a legend.', 'hype', 1], ['A chicken followed me for 3 whole days. We are a family now.', 'note', 0]] },
  { title: 'Halo Infinite', platform: 'Xbox', style: 'gamecase', color: '#4b5563', trim: '#22e5ff', font: 'futura', emblem: 'bolt', pattern: 'circuit', size: 'medium', thick: 'normal', effect: 'sparkle',
    e: [['Grappleshot to a Banished Brute’s face. Peak gaming.', 'boss', 4], ['Found a Skull hidden above the second outpost. Hidden in plain sight.', 'secret', 0], ['Warthog flip #12. Not on purpose. Mostly.', 'oops', 0]] },
  { title: 'Pokémon Emerald', platform: 'Retro', style: 'cartridge', color: '#0f766e', trim: '#ffffff', font: 'arcade', emblem: 'star', pattern: 'pixels', size: 'medium', thick: 'normal', effect: 'sparkle',
    e: [['Caught a Ralts at last. The cheerful little goblin is mine now.', 'loot', 5], ['Wallace’s Gym: Suspiciously Fabulous. I respect it.', 'boss', 0], ['Blew on the cartridge. Game worked. Science.', 'note', 0]] },
  { title: 'Cyberpunk 2077', platform: 'PC', style: 'datapad', color: '#111827', trim: '#ff4fd8', font: 'terminal', emblem: 'bolt', pattern: 'circuit', size: 'medium', thick: 'slim', effect: 'glow',
    e: [['Night City at sunset hits different. Photo mode: abused.', 'hype', 1], ['Skipped the main quest for 6 hours. Zero regrets, 40 new jackets.', 'quest', 0], ['Johnny Silverhand has opinions. Johnny Silverhand is in my head.', 'note', 0]] },
  { title: 'Sea of Thieves', platform: 'Xbox', style: 'tome', color: '#0f4c5c', trim: '#e8b84a', font: 'papyrus', emblem: 'map', pattern: 'waves', size: 'medium', thick: 'normal', effect: 'none',
    e: [['Sunk our own ship with a cannonball. In our defence, the cannon was very tempting.', 'oops', 2], ['Found the Sunken Treasure! Four buckets of gold and one very smug parrot.', 'loot', 0]] },
  { title: 'Animal Crossing', platform: 'Switch', style: 'paperback', color: '#84cc16', trim: '#ffffff', font: 'marker', emblem: 'heart', pattern: 'dots', size: 'short', thick: 'slim', effect: 'none',
    e: [['Paid off my house loan. Tom Nook now regards me as an equal.', 'hype', 0], ['Caught a coelacanth. Immediate celebration dance.', 'loot', 1]] }
];
async function summonDemo() {
  const now = Date.now(); let order = now, k = 0;
  for (const D of DEMO_BOOKS) {
    const b = { ...newBookDraft(), ...D, demo: true, order: order++, createdAt: now - k * 3 * 86400000 }; delete b.e; await DB.put('books', b); S.books.push(b);
    let j = 0;
    for (const [text, tag, shot] of D.e) {
      const e = { id: uid(), bookId: b.id, text, tag, star: j === 0 && k % 2 === 0, thumb: null, createdAt: now - (D.e.length - j) * 86400000 * (1 + k % 2) - (9 + (j * 3 + k) % 12) * 3600000, demo: true };
      if (shot > 0 || (k + j) % 3 === 0) { const s = makeShot(k + j); e.thumb = s.thumb; await DB.put('photos', { id: e.id, data: s.full }); }
      await DB.put('entries', e); S.entries.push(e); j++;
    }
    k++;
  }
  renderLibrary({ quiet: false }); Snd.play('newbook');
}
async function removeDemo() {
  const bs = S.books.filter(b => b.demo).map(b => b.id), es = S.entries.filter(e => bs.includes(e.bookId) || e.demo).map(e => e.id);
  await DB.delMany('books', bs); await DB.delMany('entries', es); await DB.delMany('photos', es);
  S.books = S.books.filter(b => !b.demo); S.entries = S.entries.filter(e => !es.includes(e.id)); renderLibrary({ quiet: true }); Snd.play('del');
}

/* ---------- screen checker ---------- */
function screenCheck(autoFix = true) {
  const run = () => {
    const f = $('#frame'), r = f.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight, vv = window.visualViewport, probe = getComputedStyle($('#probe')), out = [];
    const kb = vv && vv.height < H - 120;
    out.push([Math.abs(r.left) <= 1 && Math.abs(r.right - W) <= 1, 'Left & right sides touch the screen edges', `${r.left.toFixed(1)} px / ${(W - r.right).toFixed(1)} px gap`]);
    out.push([kb || (Math.abs(r.top) <= 1 && Math.abs(r.bottom - H) <= 1), 'Top & bottom reach the screen edges', `${r.top.toFixed(1)} px / ${(H - r.bottom).toFixed(1)} px gap`]);
    const hud = S.view === 'journal' ? $('.j-top') : $('.hud');
    if (hud && ROT === 0) { const need = parseFloat(probe.paddingTop) || 0, top = hud.getBoundingClientRect().top; out.push([top >= need - 0.5, 'Title row clears the notch / Dynamic Island', `starts ${top.toFixed(0)} px, safe area ${need.toFixed(0)} px`]); }
    out.push([!vv || Math.abs(vv.scale - 1) < .02, 'Page is not zoomed', vv ? `scale ${vv.scale.toFixed(2)}` : 'n/a']);
    const wide = $$('.hud,.sign,.win-wrap,.case,.j-top,.j-book').filter(x => x.offsetParent !== null).find(x => { const q = x.getBoundingClientRect(); return q.width && (q.left < -1 || q.right > W + 1) && ROT === 0; });
    out.push([!wide, 'Nothing is cut off on the left or right', wide ? 'overflow: .' + wide.className.split(' ')[0] : 'all visible']);
    out.push([!document.scrollingElement || document.scrollingElement.scrollLeft === 0, 'No sideways wobble', '']);
    out.push([true, ROT === 0 ? 'Orientation: portrait (locked)' : 'Phone is sideways — app is counter-rotated to stay upright', '']);
    return out;
  };
  let res = run(), fixed = false;
  if (autoFix && res.some(x => !x[0])) { layout(); window.scrollTo(0, 0); fixed = true; res = run(); }
  return { res, fixed };
}
function renderCheck(box) {
  const { res, fixed } = screenCheck(true);
  box.innerHTML = `<div class="check">${res.map(([ok, label, det]) => `<div class="${ok ? 'good' : 'bad'}">${ic(ok ? 'check' : 'x')}<span>${esc(label)}${det ? `<br><span class="dim">${esc(det)}</span>` : ''}</span></div>`).join('')}</div>${fixed ? '<p class="dim" style="margin:10px 0 0">I nudged the layout back into place while checking.</p>' : ''}`;
  return res.every(x => x[0]);
}

/* ---------- settings ---------- */
const REF_OPTS = [[5, 'Every 5 minutes'], [30, 'Every 30 minutes'], [60, 'Every hour'], [43200, 'Every 30 days']];
function locLabel() {
  const l = CFG.loc; if (!l) return '<b>No location set.</b><small>The window shows a calm default sky until you pick a place.</small>';
  const next = new Date((CFG.locAt || Date.now()) + 30 * 864e5).toLocaleDateString();
  return `<b>${esc(l.name)}</b><small>${l.lat}, ${l.lon} · next location check ${esc(next)}${Wx.data ? ` · sky updated ${esc(ago(Wx.data.at))}` : ''}</small>`;
}
function openSettings() {
  const tgl = (id, on) => `<button class="toggle ${on ? 'on' : ''}" id="${id}" role="switch" aria-checked="${on}"></button>`;
  const hasDemo = S.books.some(b => b.demo);
  const html = `
    <div class="sec">Sound</div>
    <div class="set-row"><div>Sound effects<small>Page turns, inscribing, coins &amp; fanfares</small></div>${tgl('sSound', CFG.sound)}</div>
    <div class="set-col"><div>Volume</div><input type="range" id="sVol" min="0" max="1" step="0.05" value="${CFG.vol}"></div>
    <div class="set-row"><div>Weather ambience<small>Soft rain, wind &amp; thunder drifting in from the window</small></div>${tgl('sAmb', CFG.ambient)}</div>
    <div class="set-row"><div>Return key saves<small>Press Return to inscribe instead of starting a new line</small></div>${tgl('sEnter', CFG.enterSaves)}</div>

    <div class="sec">Window &amp; location</div>
    <div class="set-col"><div id="sLoc">${locLabel()}</div>
      <div class="chips"><button class="btn small" id="sGps">${ic('pin')} Use my location</button><button class="btn small ghost" id="sCity">Search a city</button></div>
      <div id="sCityBox"></div><div id="sLocMsg" class="dim"></div></div>
    <div class="set-col"><div>Sky refresh<small>How often the window re-checks the real weather &amp; time of day</small></div>
      <select class="field" id="sRef">${REF_OPTS.map(([m, l]) => `<option value="${m}" ${CFG.wxMinutes === m ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <button class="btn small ghost" id="sNow" style="justify-self:start">Refresh sky now</button></div>
    <div class="set-col"><div>Preview the window<small>Pretend it’s some other weather or time — handy for admiring the animations</small></div>
      <select class="field" id="sSim">${Object.entries(SIM_LABELS).map(([k, l]) => `<option value="${k}" ${CFG.simCond === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <select class="field" id="sSimT">${Object.entries(SIMT_LABELS).map(([k, l]) => `<option value="${k}" ${CFG.simTime === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>

    <div class="sec">Backup &amp; restore</div>
    <div class="set-col"><div>Export your whole library<small id="sBkInfo">${CFG.lastBackup ? 'Last backup: ' + esc(new Date(CFG.lastBackup).toLocaleString()) : 'No backup yet — your books live only on this phone.'}</small></div>
      <div class="chips"><button class="btn small primary" id="sBackup">${ic('download')} Create backup</button><button class="btn small" id="sRestore">${ic('upload')} Restore</button></div><div id="sBkOut"></div></div>

    <div class="sec">Display</div>
    <div class="set-col"><div>Screen checker<small>Makes sure nothing is blurred, clipped, or hiding behind the Dynamic Island, and that both sides touch the screen edges.</small></div>
      <button class="btn small" id="sChk" style="justify-self:start">Run screen check</button><div id="sChkOut"></div></div>

    <div class="sec">Playground</div>
    <div class="set-col"><div>Demo library<small>Fills the shelf with eight sample books (every type) so you can see the shelf arrangements. Demo books don’t count toward achievements.</small></div>
      <div class="chips"><button class="btn small" id="sDemo">Summon demo books</button><button class="btn small ghost ${hasDemo ? '' : 'hidden'}" id="sDemoX">Remove demo books</button></div></div>

    <div class="sec">Danger zone</div>
    <div class="set-col"><button class="btn danger small" id="sReset" style="justify-self:start">${ic('trash')} Erase everything</button></div>
    <p class="dim" style="text-align:center;margin:22px 0 0">Lorebook v1.1 · all data stays on this device</p>`;
  const sh = openSheet({ title: 'Settings', icon: 'gear', html });
  const B = sh.body, $b = s => $(s, B);
  const tog = (id, key, after) => $b(id).onclick = () => { CFG[key] = !CFG[key]; $b(id).classList.toggle('on', CFG[key]); $b(id).setAttribute('aria-checked', CFG[key]); saveCfg(); Snd.play('chip'); after && after(); };
  tog('#sSound', 'sound', () => { updateSoundBtn(); updateAmbient(); });
  tog('#sAmb', 'ambient', () => { Snd.resume(); updateAmbient(); });
  tog('#sEnter', 'enterSaves');
  $b('#sVol').addEventListener('input', e => Snd.setVol(+e.target.value)); $b('#sVol').addEventListener('change', () => Snd.play('coin'));
  const relabel = () => { $b('#sLoc').innerHTML = locLabel(); };
  $b('#sGps').onclick = async () => { const m = $b('#sLocMsg'); m.className = 'dim'; m.textContent = 'Asking your phone where you are…'; try { await useGps(); m.className = 'ok'; m.textContent = 'Got it! The window now looks outside your actual window.'; relabel(); } catch (e) { m.className = 'err'; m.textContent = e.message + ' You can search for a city instead.'; Snd.play('err'); } };
  $b('#sCity').onclick = () => { const bx = $b('#sCityBox'); if (bx.innerHTML) { bx.innerHTML = ''; return; } citySearchUI(bx, async c => { const m = $b('#sLocMsg'); m.className = 'dim'; m.textContent = 'Looking out the window…'; await setLocation(c); bx.innerHTML = ''; m.className = 'ok'; m.textContent = 'Location set to ' + c.name + '.'; relabel(); }); };
  $b('#sRef').onchange = e => { CFG.wxMinutes = +e.target.value; saveCfg(); Snd.play('chip'); };
  $b('#sNow').onclick = async () => { Snd.play('tap'); const ok = await Wx.refresh(true); toast(CFG.loc ? (ok ? 'Sky refreshed' : 'Couldn’t reach the weather service.') : 'Set a location first.'); relabel(); updateAmbient(); };
  $b('#sSim').onchange = e => { CFG.simCond = e.target.value; saveCfg(); Snd.play('chip'); updateAmbient(); };
  $b('#sSimT').onchange = e => { CFG.simTime = e.target.value; saveCfg(); Snd.play('chip'); };
  $b('#sBackup').onclick = async () => {
    const out = $b('#sBkOut'); out.innerHTML = '<p class="dim">Forging the backup scroll…</p>'; Snd.play('tap');
    try {
      const bk = await buildBackup(), name = `Lorebook-Backup-${new Date().toISOString().slice(0, 10)}.json`, mb = (bk.size / 1048576).toFixed(1);
      out.innerHTML = `<p class="ok">Backup ready: ${bk.books} book${bk.books === 1 ? '' : 's'}, ${bk.entries} entr${bk.entries === 1 ? 'y' : 'ies'}, ${bk.photos} picture${bk.photos === 1 ? '' : 's'} (${mb} MB).</p><div class="chips"><button class="btn small primary" id="bkShare">${ic('upload')} Save / Share file</button><button class="btn small" id="bkDl">${ic('download')} Download</button></div><p class="dim">Tip: choose “Save to Files” in the share sheet, or AirDrop it to yourself.</p>`;
      const done = () => { CFG.lastBackup = Date.now(); CFG.nudgeDismissed = 0; saveCfg(); $b('#sBkInfo').textContent = 'Last backup: ' + new Date(CFG.lastBackup).toLocaleString(); renderNudge(); unlock('backup'); };
      $b('#bkShare').onclick = async () => { if (await shareFile(bk.blob, name, 'application/json')) done(); };
      $b('#bkDl').onclick = () => { downloadBlob(bk.blob, name); done(); };
    } catch (e) { out.innerHTML = '<p class="err">Something went wrong building the backup.</p>'; Snd.play('err'); }
  };
  $b('#sRestore').onclick = () => { Snd.play('tap'); $('#fileImport').click(); };
  $b('#sChk').onclick = () => { Snd.play('tap'); const ok = renderCheck($b('#sChkOut')); Snd.play(ok ? 'ach' : 'err'); };
  $b('#sDemo').onclick = async () => { if (S.books.some(b => b.demo)) { toast('Demo books are already on the shelf.'); return; } await summonDemo(); $b('#sDemoX').classList.remove('hidden'); toast('Eight demo books summoned!', { ms: 2200 }); };
  $b('#sDemoX').onclick = async () => { await removeDemo(); $b('#sDemoX').classList.add('hidden'); toast('Demo books vanished in a puff.'); };
  $b('#sReset').onclick = async () => {
    if (!await ask('Erase everything?', 'Every book, entry, picture, and achievement on this device will be deleted. Make a backup first if you might want them back!', 'Erase it all', true)) return;
    await DB.clear('books'); await DB.clear('entries'); await DB.clear('photos'); localStorage.removeItem('lorebook.cfg'); location.reload();
  };
}

/* ---------- backup reminder banner ---------- */
function renderNudge() {
  const n = $('#nudge'), real = S.entries.filter(e => !e.demo).length;
  const stale = !CFG.lastBackup ? real >= 3 : (Date.now() - CFG.lastBackup > 14 * 864e5 && real > 0);
  if (!stale || (CFG.nudgeDismissed && Date.now() - CFG.nudgeDismissed < 3 * 864e5)) { n.innerHTML = ''; $('#setBadge').classList.add('hidden'); return; }
  $('#setBadge').classList.remove('hidden');
  n.innerHTML = `<div class="nudge">${ic('lock')}<div><b>Back up your library</b><br>${CFG.lastBackup ? 'It’s been a while.' : 'Your books only live on this phone.'} Tap to make a backup.</div><button class="x" aria-label="Dismiss">${ic('x')}</button></div>`;
  $('.nudge', n).onclick = e => { if (e.target.closest('.x')) { CFG.nudgeDismissed = Date.now(); saveCfg(); renderNudge(); return; } openSettings(); };
}

/* ---------- welcome / first run ---------- */
function showWelcome() {
  const w = $('#welcome'); w.classList.remove('hidden'); S.view = 'welcome';
  const step1 = () => {
    w.innerHTML = `<div class="wl-step"><div class="boot-book" style="margin-bottom:10px"><i class="bb-l"></i><i class="bb-r"></i><i class="bb-s"></i></div>
      <div class="wl-logo">LOREBOOK</div><div class="wl-tag">A cosy library of journals for every game you play. Your progress, memories &amp; best screenshots — on the shelf.</div>
      <div class="wl-feats"><div class="wl-feat">${ic('book')}<span><b>One book per game.</b> Style each one however you like.</span></div><div class="wl-feat">${ic('quill')}<span><b>Dated notes.</b> Every entry is time-stamped &amp; sealed.</span></div><div class="wl-feat">${ic('camera')}<span><b>Snap special moments</b> and paste them in as photos.</span></div><div class="wl-feat">${ic('trophy')}<span><b>Level up</b> your librarian rank &amp; collect achievements.</span></div></div>
      <button class="btn primary block" id="wlGo" style="max-width:320px">Begin adventure</button></div>`;
    $('#wlGo').onclick = () => { Snd.resume(); Snd.play('newbook'); step2(); };
  };
  const step2 = () => {
    w.innerHTML = `<div class="wl-step"><div class="wl-win"><i></i><u></u></div><div class="wl-logo" style="font-size:26px">A WINDOW ON THE WORLD</div>
      <div class="wl-tag">Your library has a little window. It shows the real weather &amp; time of day outside — rain, snow, sunsets, the lot. Only your approximate location is used, and only to ask a free weather service about the sky.</div>
      <div class="wl-card"><button class="btn primary block" id="wlGps">${ic('pin')} Allow location</button><button class="btn block" id="wlCity">Search a city instead</button><div id="wlBox"></div><div id="wlMsg" class="dim" style="text-align:center"></div></div>
      <button class="btn ghost" id="wlSkip">Skip for now</button></div>`;
    const finish = () => { CFG.welcomed = true; saveCfg(); w.classList.add('hidden'); w.innerHTML = ''; enterLibrary(true); };
    $('#wlGps').onclick = async () => { Snd.play('tap'); const m = $('#wlMsg'); m.className = 'dim'; m.textContent = 'Asking your phone…'; try { await useGps(); m.className = 'ok'; m.textContent = 'Lovely, the window can see outside!'; setTimeout(finish, 900); } catch (e) { m.className = 'err'; m.textContent = e.message + ' Try a city, or skip — you can change this in Settings.'; Snd.play('err'); } };
    $('#wlCity').onclick = () => { const bx = $('#wlBox'); if (bx.innerHTML) { bx.innerHTML = ''; return; } citySearchUI(bx, async c => { $('#wlMsg').textContent = 'Looking out the window…'; await setLocation(c); $('#wlMsg').className = 'ok'; $('#wlMsg').textContent = c.name + ' it is!'; setTimeout(finish, 900); }); };
    $('#wlSkip').onclick = () => { Snd.play('tap'); finish(); };
  };
  step1();
}
