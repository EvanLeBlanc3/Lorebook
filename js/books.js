'use strict';
/* ============================================================
   LOREBOOK — catalogue (icons, fonts, patterns, themes, achievements)
   and the book renderers (spines + covers)
   ============================================================ */

/* ---------- icons (stroke style, 24x24) ---------- */
const ICONS = {
  // emblems
  sword: '<path d="M20 4l-.6 4.6L10 18l-4-4 9.4-9.4z"/><path d="M4 20l3-3M7 17l-2.2 2.2M8.6 12.6l2.8 2.8"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M12 7v10M8 11h8"/>',
  potion: '<path d="M9 3h6M10 3v5l-4.6 8.6A3 3 0 008 21h8a3 3 0 002.6-4.4L14 8V3"/><path d="M7.5 15h9"/>',
  gem: '<path d="M6 4h12l4 6-10 11L2 10z"/><path d="M2 10h20M9 4l-1 6 4 11M15 4l1 6-4 11"/>',
  skull: '<path d="M12 3a8 8 0 00-8 8c0 3 1.5 4.5 3 5.5V20h10v-3.5c1.5-1 3-2.5 3-5.5a8 8 0 00-8-8z"/><circle cx="9" cy="11" r="1.6"/><circle cx="15" cy="11" r="1.6"/><path d="M10 20v-2M14 20v-2"/>',
  crown: '<path d="M3 18L2 7l5 4 5-7 5 7 5-4-1 11z"/><path d="M3 21h18"/>',
  star: '<path d="M12 2.5l3 6.3 6.9 1-5 4.9 1.2 6.9L12 18.3l-6.1 3.3 1.2-6.9-5-4.9 6.9-1z"/>',
  heart: '<path d="M12 21s-8-5.5-8-11a4.5 4.5 0 018-2.7A4.5 4.5 0 0120 10c0 5.5-8 11-8 11z"/>',
  controller: '<path d="M7 7h10a5 5 0 015 5l-1 5a2.5 2.5 0 01-4.3 1L15 16H9l-1.7 2A2.5 2.5 0 013 17l-1-5a5 5 0 015-5z"/><path d="M7 10v4M5 12h4"/><circle cx="15.5" cy="11" r=".8"/><circle cx="17.5" cy="13" r=".8"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/>',
  ghost: '<path d="M5 21V11a7 7 0 0114 0v10l-3-2-2 2-2-2-2 2-3-2z"/><circle cx="9.5" cy="11" r="1"/><circle cx="14.5" cy="11" r="1"/>',
  rocket: '<path d="M12 2c4 2 6 6 6 10l-3 3H9l-3-3c0-4 2-8 6-10z"/><circle cx="12" cy="9" r="2"/><path d="M9 15l-2 5 5-2 5 2-2-5"/>',
  tree: '<path d="M12 22v-5M12 17c-4 0-6-2.5-6-5 0-1.5 1-3 2.5-3.5C8 7 9.5 4 12 2c2.5 2 4 5 3.5 6.5C17 9 18 10.5 18 12c0 2.5-2 5-6 5z"/>',
  flame: '<path d="M12 22c-4 0-7-3-7-7 0-3 2-5 3-7 1 1.5 2 2 3 2 0-3 1-6 3-8 1 3 5 6 5 12 0 4-3 8-7 8z"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  wand: '<path d="M4 20L16 8M15 3v4M13 5h4M20 10v3M18.5 11.5h3M8 4v2M7 5h2"/>',
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/>',
  book: '<path d="M4 4h6a2 2 0 012 2v14a2 2 0 00-2-2H4zM20 4h-6a2 2 0 00-2 2v14a2 2 0 012-2h6z"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/>',
  // ui
  back: '<path d="M15 5l-7 7 7 7"/>',
  forward: '<path d="M9 5l7 7-7 7"/>',
  dots: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  camera: '<path d="M3 8h4l2-3h6l2 3h4v11H3z"/><circle cx="12" cy="13" r="3.5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M3 18l5-5 4 4 3-3 6 6"/>',
  quill: '<path d="M20 4c-8 0-13 5-14 13l-2 3 3-2c8-1 13-6 13-14z"/><path d="M9 15l6-6"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 01-10 0zM7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3M12 14v4M8 21h8M9 18h6"/>',
  palette: '<path d="M12 3a9 9 0 100 18c1.5 0 2-1 1.5-2s0-2.5 1.5-2.5H17a4 4 0 004-4c0-5-4-9.5-9-9.5z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  speaker: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>',
  sort: '<path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  pin: '<path d="M12 21s-7-6.5-7-12a7 7 0 0114 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  moon: '<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>',
  window: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 3v18M4 12h16"/>',
  anchor: '<circle cx="12" cy="5" r="2.2"/><path d="M12 7.2V21M8 11h8M4 14c0 4 3.5 7 8 7s8-3 8-7M4 14l-1.5 2M20 14l1.5 2"/>',
  flower: '<circle cx="12" cy="12" r="2"/><path d="M12 10C10 7 10 4 12 2c2 2 2 5 0 8zM14 12c3-2 6-2 8 0-2 2-5 2-8 0zM12 14c2 3 2 6 0 8-2-2-2-5 0-8zM10 12c-3 2-6 2-8 0 2-2 5-2 8 0z"/>',
  pyramid: '<path d="M12 3L2 20h20zM12 3v17M7 12l5 3 5-3"/>',
  cog: '<circle cx="12" cy="12" r="3.5"/><path d="M12 2.5l1.6 2.6 3-.8.8 3 2.6 1.6-1.6 2.6 1.6 2.6-2.6 1.6-.8 3-3-.8L12 21.5l-1.6-2.6-3 .8-.8-3-2.6-1.6 1.6-2.6-1.6-2.6 2.6-1.6.8-3 3 .8z"/>',
  home: '<path d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6"/>',
  shuffle: '<path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  hash: '<path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16"/>',
  ruler: '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
  type: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>'
};
const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const EMBLEMS = ['sword', 'shield', 'potion', 'gem', 'skull', 'crown', 'star', 'heart', 'controller', 'key', 'ghost', 'rocket', 'tree', 'flame', 'bolt', 'wand', 'map', 'book', 'dice', 'moon'];

/* ---------- patterns ---------- */
function patUrl(name, col) {
  const c = col, S = {
    stripes: `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12'><path d='M-2 2l4-4M0 12L12 0M10 14l4-4' stroke='${c}' stroke-width='2' opacity='.5'/></svg>`,
    diamonds: `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><path d='M10 1L19 10 10 19 1 10z' fill='none' stroke='${c}' stroke-width='1.2' opacity='.5'/></svg>`,
    scales: `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><path d='M0 10A10 10 0 0 0 20 10M-10 20A10 10 0 0 0 10 20M10 20A10 10 0 0 0 30 20' fill='none' stroke='${c}' stroke-width='1.2' opacity='.55'/></svg>`,
    runes: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><path d='M6 4v14M6 8l6-4M6 13l6-4M17 10v10M17 15l5-3' stroke='${c}' stroke-width='1.6' fill='none' opacity='.5' stroke-linecap='round'/></svg>`,
    circuit: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><path d='M0 8h8v8h10M18 0v6h-5M24 20h-6' fill='none' stroke='${c}' stroke-width='1.2' opacity='.55'/><circle cx='8' cy='8' r='1.6' fill='${c}' opacity='.7'/><circle cx='18' cy='16' r='1.6' fill='${c}' opacity='.7'/></svg>`,
    stars: `<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22'><path d='M11 3l1.5 4.5H17l-3.7 2.7 1.4 4.5L11 12l-3.7 2.7 1.4-4.5L5 7.5h4.5z' fill='${c}' opacity='.5'/></svg>`,
    dots: `<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><circle cx='5' cy='5' r='1.5' fill='${c}' opacity='.55'/></svg>`,
    checker: `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><rect width='8' height='8' fill='${c}' opacity='.28'/><rect x='8' y='8' width='8' height='8' fill='${c}' opacity='.28'/></svg>`,
    waves: `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='12'><path d='M0 6q5-6 10 0t10 0' fill='none' stroke='${c}' stroke-width='1.3' opacity='.55'/></svg>`,
    pixels: `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><rect x='2' y='2' width='3' height='3' fill='${c}' opacity='.6'/><rect x='9' y='6' width='3' height='3' fill='${c}' opacity='.4'/><rect x='5' y='11' width='3' height='3' fill='${c}' opacity='.5'/></svg>`
  };
  return S[name] ? `url('data:image/svg+xml,${encodeURIComponent(S[name]).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29')}')` : 'none';
}
const PATTERNS = ['none', 'stripes', 'diamonds', 'scales', 'runes', 'circuit', 'stars', 'dots', 'checker', 'waves', 'pixels'];

/* ---------- catalogue ---------- */
const STYLES = [
  { id: 'tome', name: 'Tome', blurb: 'gilded hardcover' }, { id: 'grimoire', name: 'Grimoire', blurb: 'clasped & gemmed' },
  { id: 'paperback', name: 'Paperback', blurb: 'dog-eared favourite' }, { id: 'gamecase', name: 'Game Case', blurb: 'shrink-wrapped' },
  { id: 'cartridge', name: 'Cartridge', blurb: 'blow on it first' }, { id: 'datapad', name: 'Datapad', blurb: 'holo-glow tablet' }
];
const FONTS = [
  { id: 'classic', name: 'Classic', stack: "Georgia,'Times New Roman',serif" },
  { id: 'palatino', name: 'Palatino', stack: "Palatino,'Palatino Linotype','Book Antiqua',serif" },
  { id: 'copper', name: 'Copperplate', stack: "Copperplate,'Copperplate Gothic Light',Palatino,serif" },
  { id: 'papyrus', name: 'Papyrus', stack: "Papyrus,Palatino,fantasy" },
  { id: 'typewriter', name: 'Typewriter', stack: "'American Typewriter','Courier New',serif" },
  { id: 'marker', name: 'Marker', stack: "'Marker Felt','Comic Sans MS',cursive" },
  { id: 'chalk', name: 'Chalk', stack: "Chalkduster,'Comic Sans MS',cursive" },
  { id: 'script', name: 'Script', stack: "'Snell Roundhand','Brush Script MT',cursive" },
  { id: 'futura', name: 'Futura', stack: "Futura,'Trebuchet MS',sans-serif" },
  { id: 'didot', name: 'Didot', stack: "Didot,'Bodoni 72',Georgia,serif" },
  { id: 'arcade', name: 'Arcade', stack: "'Arial Black',Impact,sans-serif" },
  { id: 'terminal', name: 'Terminal', stack: "'Courier New',Menlo,monospace" }
];
const fontStack = id => (FONTS.find(f => f.id === id) || FONTS[0]).stack;
const PLATFORMS = {
  PC: { abbr: 'PC', col: '#4a5568' }, Switch: { abbr: 'NSW', col: '#e60012' }, PlayStation: { abbr: 'PS', col: '#0b4fb8' }, Xbox: { abbr: 'XBOX', col: '#107c10' },
  Mobile: { abbr: 'MOB', col: '#0ea5e9' }, Retro: { abbr: 'RETRO', col: '#8b5cf6' }, Tabletop: { abbr: 'TTRPG', col: '#b45309' }, Other: { abbr: 'GAME', col: '#6b7280' }
};
const COVER_SWATCHES = ['#7a1f2b', '#c2410c', '#d4a017', '#3f7d20', '#0f766e', '#1d4ed8', '#5b21b6', '#be185d', '#111827', '#4b5563', '#e5e7eb', '#f5e6c8', '#064e3b', '#7c2d12', '#0ea5e9', '#84cc16'];
const TRIM_SWATCHES = ['#e3b341', '#c0c7d1', '#cd7f32', '#ffffff', '#111111', '#ff4fd8', '#22e5ff', '#9dff3a'];
const EFFECTS = [{ id: 'none', name: 'None' }, { id: 'glow', name: 'Glow' }, { id: 'sparkle', name: 'Sparkle' }, { id: 'foil', name: 'Holo Foil' }];
const TAGS = {
  note: { name: 'Note', icon: 'quill', col: '#8d6e4a' }, quest: { name: 'Quest', icon: 'map', col: '#2f8f6b' }, boss: { name: 'Boss', icon: 'sword', col: '#b3342f' },
  loot: { name: 'Loot', icon: 'gem', col: '#2a7fc4' }, secret: { name: 'Secret', icon: 'key', col: '#8a4fc7' }, oops: { name: 'Oops', icon: 'skull', col: '#555c66' }, hype: { name: 'Hype', icon: 'bolt', col: '#d99a12' }
};

/* ---------- themes ---------- */
const svgUrl = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
const THEMES = {
  grand: {
    name: "Wizard's Archive", blurb: 'Candlelit wood, brass fittings & drifting dust', icon: 'wand', swatch: ['#4b2f24', '#a56d3d', '#ffc766'], wallSize: '60px 60px',
    wall: svgUrl("<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><path d='M30 6c6 8 6 14 0 22-6-8-6-14 0-22zM30 32c6 8 6 14 0 22-6-8-6-14 0-22z' fill='#ffd27a' opacity='.07'/><path d='M0 30c8-6 14-6 22 0-8 6-14 6-22 0zM38 30c8-6 14-6 22 0-8 6-14 6-22 0z' fill='#ffd27a' opacity='.06'/></svg>"),
    v: { 'wall-a': '#4b2f24', 'wall-b': '#1b0f0a', 'wood-a': '#a56d3d', 'wood-b': '#6b4224', 'wood-c': '#3b2312', 'plank-hi': '#d9a066', 'case-bg': 'linear-gradient(180deg,#160b07,#2a170d)', glow: '#ffc766', accent: '#f2b84b', ink: '#fbe9c6', 'ink-dim': '#cdb48a', panel: 'rgba(38,22,13,.97)', 'panel-2': 'rgba(78,47,27,.92)', 'hud-bg': 'rgba(30,17,10,.8)', floor: 'linear-gradient(180deg,#2a170d,#120906)', 'rug-a': '#8c2230', 'rug-b': '#d6a84a', 'win-glow': 'rgba(255,200,110,.4)', 'win-frame': '#7a4a26', 'win-frame2': '#c9944f', 'curt-a': '#7d1f33', 'curt-b': '#5c1425', 'j-bg-a': '#2a170d', 'j-bg-b': '#0d0603' }
  },
  arcade: {
    name: 'Neon Arcade', blurb: 'Synthwave grid, neon trim & pixel confetti', icon: 'controller', swatch: ['#1a0b3d', '#ff3df2', '#22e5ff'], wallSize: '40px 40px',
    wall: svgUrl("<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><path d='M0 .5H40M.5 0V40' stroke='#a050ff' stroke-opacity='.22'/><rect x='19' y='19' width='2' height='2' fill='#ff3df2' opacity='.5'/></svg>"),
    v: { 'wall-a': '#241052', 'wall-b': '#06021a', 'wood-a': '#2d2350', 'wood-b': '#17112f', 'wood-c': '#0a0818', 'plank-hi': '#22e5ff', 'case-bg': 'linear-gradient(180deg,#07031a,#150a35)', glow: '#ff3df2', accent: '#22e5ff', ink: '#f2e8ff', 'ink-dim': '#b8a4e8', panel: 'rgba(14,8,38,.97)', 'panel-2': 'rgba(44,24,96,.92)', 'hud-bg': 'rgba(12,6,34,.82)', floor: 'linear-gradient(180deg,#160a38,#05020f)', 'rug-a': '#ff3df2', 'rug-b': '#22e5ff', 'win-glow': 'rgba(255,61,242,.55)', 'win-frame': '#ff3df2', 'win-frame2': '#22e5ff', 'curt-a': '#3a1a7a', 'curt-b': '#27105a', 'j-bg-a': '#1a0b3d', 'j-bg-b': '#05020f' }
  },
  haunted: {
    name: 'Haunted Stacks', blurb: 'Gothic oak, ghostly wisps & a suspicious draft', icon: 'ghost', swatch: ['#1d2a2a', '#4a3b52', '#7dff9b'], wallSize: '44px 44px',
    wall: svgUrl("<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44'><rect width='22' height='44' fill='#9dffbf' opacity='.035'/><circle cx='11' cy='22' r='2' fill='#b48cff' opacity='.14'/><path d='M33 8l3 6-3 6-3-6z' fill='#7dff9b' opacity='.08'/></svg>"),
    v: { 'wall-a': '#1f3030', 'wall-b': '#080c10', 'wood-a': '#52405e', 'wood-b': '#2e2338', 'wood-c': '#170f1e', 'plank-hi': '#8a6aa0', 'case-bg': 'linear-gradient(180deg,#07090c,#141a20)', glow: '#7dff9b', accent: '#8affc1', ink: '#e1f8ea', 'ink-dim': '#97bfa8', panel: 'rgba(14,20,24,.97)', 'panel-2': 'rgba(40,52,60,.92)', 'hud-bg': 'rgba(10,16,18,.82)', floor: 'linear-gradient(180deg,#141b1d,#050708)', 'rug-a': '#3a2a4a', 'rug-b': '#7dff9b', 'win-glow': 'rgba(125,255,155,.4)', 'win-frame': '#3a2d46', 'win-frame2': '#7b6590', 'curt-a': '#2f2447', 'curt-b': '#1c1430', 'j-bg-a': '#16221f', 'j-bg-b': '#05080a' }
  },
  starship: {
    name: 'Starship Archive', blurb: 'Brushed metal, blinking panels & shooting stars', icon: 'rocket', swatch: ['#0c1a2e', '#5d6b80', '#4dd8ff'], wallSize: '80px 80px',
    wall: svgUrl("<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect x='1' y='1' width='78' height='78' fill='none' stroke='#4dd8ff' stroke-opacity='.14'/><path d='M1 40h78M40 1v78' stroke='#4dd8ff' stroke-opacity='.06'/><circle cx='6' cy='6' r='1.5' fill='#4dd8ff' opacity='.3'/><circle cx='74' cy='74' r='1.5' fill='#4dd8ff' opacity='.3'/></svg>"),
    v: { 'wall-a': '#10253f', 'wall-b': '#030812', 'wood-a': '#74839a', 'wood-b': '#475469', 'wood-c': '#252f40', 'plank-hi': '#cfe6ff', 'case-bg': 'linear-gradient(180deg,#030a14,#0b1a2c)', glow: '#4dd8ff', accent: '#4dd8ff', ink: '#e3f5ff', 'ink-dim': '#8fb4cc', panel: 'rgba(6,16,30,.97)', 'panel-2': 'rgba(24,48,78,.92)', 'hud-bg': 'rgba(4,12,24,.82)', floor: 'linear-gradient(180deg,#0e1c30,#02060c)', 'rug-a': '#12324f', 'rug-b': '#4dd8ff', 'win-glow': 'rgba(77,216,255,.45)', 'win-frame': '#5d6b80', 'win-frame2': '#c3d3e6', 'curt-a': '#14304f', 'curt-b': '#0c2036', 'j-bg-a': '#0b1a2c', 'j-bg-b': '#02060c' }
  },
  treehouse: {
    name: 'Enchanted Treehouse', blurb: 'Mossy planks, fireflies & falling leaves', icon: 'tree', swatch: ['#2e5a34', '#b98550', '#d8ff7a'], wallSize: '36px 80px',
    wall: svgUrl("<svg xmlns='http://www.w3.org/2000/svg' width='36' height='80'><path d='M0 0V80M18 0V80' stroke='#000' stroke-opacity='.2'/><path d='M8 12q3 6 0 12M27 50q-3 6 0 12' stroke='#000' stroke-opacity='.12' fill='none'/><ellipse cx='28' cy='20' rx='3' ry='1.6' fill='#b6e35a' opacity='.12'/></svg>"),
    v: { 'wall-a': '#3d6b3d', 'wall-b': '#122a1b', 'wood-a': '#c4915a', 'wood-b': '#8a5a2e', 'wood-c': '#4f3219', 'plank-hi': '#8fc556', 'case-bg': 'linear-gradient(180deg,#0f2417,#1c3b25)', glow: '#d8ff7a', accent: '#b6e35a', ink: '#f4ffdc', 'ink-dim': '#b4cf8a', panel: 'rgba(18,40,26,.97)', 'panel-2': 'rgba(50,86,50,.92)', 'hud-bg': 'rgba(14,34,22,.82)', floor: 'linear-gradient(180deg,#31502a,#10200f)', 'rug-a': '#b6e35a', 'rug-b': '#6b8f3a', 'win-glow': 'rgba(216,255,122,.35)', 'win-frame': '#6e4a26', 'win-frame2': '#4f8a3a', 'curt-a': '#a9b94a', 'curt-b': '#7f9136', 'j-bg-a': '#1a3524', 'j-bg-b': '#08140c' }
  },
  dungeon: {
    name: 'Pixel Dungeon', blurb: 'Cold stone, flickering torches & rising embers', icon: 'shield', swatch: ['#3a3a44', '#6b6b78', '#ff8a2a'], wallSize: '48px 24px',
    wall: svgUrl("<svg xmlns='http://www.w3.org/2000/svg' width='48' height='24'><path d='M0 .5H48M0 12.5H48M.5 0V12M24.5 12V24' stroke='#000' stroke-opacity='.4'/><rect x='6' y='3' width='8' height='2' fill='#fff' opacity='.05'/><rect x='30' y='15' width='9' height='2' fill='#fff' opacity='.05'/></svg>"),
    v: { 'wall-a': '#41414d', 'wall-b': '#15151b', 'wood-a': '#7a7a88', 'wood-b': '#4c4c57', 'wood-c': '#2a2a33', 'plank-hi': '#a6a6b4', 'case-bg': 'linear-gradient(180deg,#0e0e13,#1d1d25)', glow: '#ff8a2a', accent: '#ff9f43', ink: '#f4ece0', 'ink-dim': '#b9ad9a', panel: 'rgba(22,22,28,.97)', 'panel-2': 'rgba(60,60,72,.92)', 'hud-bg': 'rgba(18,18,24,.84)', floor: 'linear-gradient(180deg,#2a2a33,#0c0c10)', 'rug-a': '#6b1d1d', 'rug-b': '#c9a24a', 'win-glow': 'rgba(255,138,42,.3)', 'win-frame': '#555563', 'win-frame2': '#8d8d9c', 'curt-a': '#5a1a1a', 'curt-b': '#3f1010', 'j-bg-a': '#25252d', 'j-bg-b': '#0a0a0e' }
  }
};
/* five more rooms */
Object.assign(THEMES, {
  cabin: {
    name: 'Cozy Cabin', blurb: 'Log walls, crackling embers & snowy pines', icon: 'home', swatch: ['#6b4426', '#b07a46', '#ff9a3c'], wallSize: '80px 42px',
    wall: svgUrl("<svg xmlns='http://www.w3.org/2000/svg' width='80' height='42'><path d='M0 21H80' stroke='#000' stroke-opacity='.38' stroke-width='3'/><path d='M0 6c20 3 40-3 80 0M0 32c25-3 45 3 80 0' stroke='#000' stroke-opacity='.1' fill='none'/><path d='M0 1H80' stroke='#fff' stroke-opacity='.05'/></svg>"),
    v: { 'wall-a': '#6b4426', 'wall-b': '#26150a', 'wood-a': '#b07a46', 'wood-b': '#7a4a26', 'wood-c': '#3f2512', 'plank-hi': '#d9a56a', 'case-bg': 'linear-gradient(180deg,#1a0e07,#33200f)', glow: '#ff9a3c', accent: '#ffb35c', ink: '#fff0dc', 'ink-dim': '#d3b48e', panel: 'rgba(40,24,14,.97)', 'panel-2': 'rgba(96,58,32,.92)', 'hud-bg': 'rgba(34,20,11,.82)', floor: 'linear-gradient(180deg,#4a2c17,#1a0e07)', 'rug-a': '#b3242b', 'rug-b': '#f2d9a0', 'win-glow': 'rgba(255,170,80,.4)', 'win-frame': '#6a4021', 'win-frame2': '#a8733f', 'curt-a': '#c0282e', 'curt-b': '#8f1b20', 'j-bg-a': '#33200f', 'j-bg-b': '#100803' }
  },
  pirate: {
    name: "Captain's Quarters", blurb: 'Salt-worn planks, leaded glass & a passing galleon', icon: 'anchor', swatch: ['#3a2a1c', '#7a5230', '#e8b84a'], wallSize: '90px 30px',
    wall: svgUrl("<svg xmlns='http://www.w3.org/2000/svg' width='90' height='30'><path d='M0 .5H90M0 15.5H90' stroke='#000' stroke-opacity='.4'/><path d='M45 0V15M20 15V30M70 15V30' stroke='#000' stroke-opacity='.3'/><circle cx='6' cy='8' r='1.3' fill='#c9a24a' opacity='.35'/><circle cx='84' cy='23' r='1.3' fill='#c9a24a' opacity='.35'/></svg>"),
    v: { 'wall-a': '#3a2a1c', 'wall-b': '#120b06', 'wood-a': '#7a5230', 'wood-b': '#4f321a', 'wood-c': '#2a1a0c', 'plank-hi': '#b88a50', 'case-bg': 'linear-gradient(180deg,#0f0904,#241608)', glow: '#ffd35a', accent: '#e8b84a', ink: '#f8ebcf', 'ink-dim': '#c2a77a', panel: 'rgba(30,20,11,.97)', 'panel-2': 'rgba(78,52,28,.92)', 'hud-bg': 'rgba(26,17,9,.84)', floor: 'linear-gradient(180deg,#3a2614,#120a04)', 'rug-a': '#1c4b5e', 'rug-b': '#e8b84a', 'win-glow': 'rgba(120,200,230,.35)', 'win-frame': '#4a2c14', 'win-frame2': '#b88a3a', 'curt-a': '#6b4a2a', 'curt-b': '#4a3018', 'j-bg-a': '#2a1b0e', 'j-bg-b': '#0a0603' }
  },
  sakura: {
    name: 'Sakura Dojo', blurb: 'Paper screens, lacquered shelves & drifting petals', icon: 'flower', swatch: ['#4b2b3a', '#9b2f2f', '#ff8fb8'], wallSize: '60px 60px',
    wall: svgUrl("<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><path d='M.5 .5H59.5V59.5H.5z' fill='none' stroke='#ffd0e0' stroke-opacity='.1'/><path d='M30 0V60M0 30H60' stroke='#ffd0e0' stroke-opacity='.05'/><ellipse cx='14' cy='44' rx='3' ry='1.8' fill='#ffb3d1' opacity='.18' transform='rotate(30 14 44)'/><ellipse cx='46' cy='16' rx='3' ry='1.8' fill='#ffb3d1' opacity='.14' transform='rotate(-20 46 16)'/></svg>"),
    v: { 'wall-a': '#5a2c42', 'wall-b': '#1d0d16', 'wood-a': '#9b2f2f', 'wood-b': '#5e1a1a', 'wood-c': '#2e0c0c', 'plank-hi': '#e0585a', 'case-bg': 'linear-gradient(180deg,#14080c,#2a1119)', glow: '#ffb3d1', accent: '#ff8fb8', ink: '#fff0f5', 'ink-dim': '#d9aabb', panel: 'rgba(32,14,22,.97)', 'panel-2': 'rgba(88,36,56,.92)', 'hud-bg': 'rgba(28,12,19,.82)', floor: 'linear-gradient(180deg,#5d6b3a,#232b12)', 'rug-a': '#a82a3a', 'rug-b': '#f5d1de', 'win-glow': 'rgba(255,179,209,.4)', 'win-frame': '#2a1810', 'win-frame2': '#5a3a26', 'curt-a': '#f4ecd8', 'curt-b': '#e3d6b6', 'j-bg-a': '#3a1a2a', 'j-bg-b': '#10060b' }
  },
  tomb: {
    name: "Pharaoh's Vault", blurb: 'Sandstone, torchlight & pyramids at the door', icon: 'pyramid', swatch: ['#7a5a30', '#c9a064', '#ffb347'], wallSize: '80px 80px',
    wall: svgUrl("<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><path d='M0 .5H80M0 40.5H80' stroke='#000' stroke-opacity='.3'/><g fill='none' stroke='#f0c050' stroke-opacity='.2' stroke-width='1.6'><ellipse cx='20' cy='20' rx='8' ry='4'/><circle cx='20' cy='20' r='1.8'/><path d='M58 8v22M52 14h12M58 8a4 4 0 100-.1M10 56q5-6 10 0t10 0M50 60v14M44 66h12'/></g></svg>"),
    v: { 'wall-a': '#7a5a30', 'wall-b': '#26180a', 'wood-a': '#c9a064', 'wood-b': '#9a7438', 'wood-c': '#5a4018', 'plank-hi': '#ead29a', 'case-bg': 'linear-gradient(180deg,#1a1006,#33220e)', glow: '#ffb347', accent: '#f0c050', ink: '#fff3d4', 'ink-dim': '#d4bd8a', panel: 'rgba(36,24,10,.97)', 'panel-2': 'rgba(100,72,30,.92)', 'hud-bg': 'rgba(30,20,8,.84)', floor: 'linear-gradient(180deg,#8a6a38,#2a1c0a)', 'rug-a': '#1a6b6b', 'rug-b': '#f0c050', 'win-glow': 'rgba(255,190,90,.45)', 'win-frame': '#b98a4e', 'win-frame2': '#e3c07a', 'curt-a': '#c9a24a', 'curt-b': '#8a6a22', 'j-bg-a': '#3a2810', 'j-bg-b': '#120b04' }
  },
  steampunk: {
    name: 'Steampunk Study', blurb: 'Riveted brass, puffing steam & turning gears', icon: 'cog', swatch: ['#5a3a22', '#c07a3e', '#ffa84a'], wallSize: '90px 90px',
    wall: svgUrl("<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90'><rect x='3.5' y='3.5' width='83' height='83' rx='3' fill='none' stroke='#000' stroke-opacity='.35'/><rect x='5.5' y='5.5' width='79' height='79' rx='2' fill='none' stroke='#ffc98a' stroke-opacity='.08'/><g fill='#e8a35e' opacity='.3'><circle cx='10' cy='10' r='2'/><circle cx='80' cy='10' r='2'/><circle cx='10' cy='80' r='2'/><circle cx='80' cy='80' r='2'/></g></svg>"),
    v: { 'wall-a': '#5a3a22', 'wall-b': '#1a0f08', 'wood-a': '#c07a3e', 'wood-b': '#8a4f22', 'wood-c': '#4a2a12', 'plank-hi': '#f0b070', 'case-bg': 'linear-gradient(180deg,#140b05,#2c1a0c)', glow: '#ffa84a', accent: '#ffb85c', ink: '#fbe8cc', 'ink-dim': '#c9a47a', panel: 'rgba(38,22,12,.97)', 'panel-2': 'rgba(100,60,30,.92)', 'hud-bg': 'rgba(32,18,10,.84)', floor: 'linear-gradient(180deg,#4a2e18,#140a05)', 'rug-a': '#3f5f4a', 'rug-b': '#d89a4a', 'win-glow': 'rgba(255,168,74,.4)', 'win-frame': '#a8632a', 'win-frame2': '#e8a35e', 'curt-a': '#7a3a2a', 'curt-b': '#5a2a1e', 'j-bg-a': '#2e1a0e', 'j-bg-b': '#0c0603' }
  }
});

/* ---------- books: defaults, dims, renderers ---------- */
const STYLE_BASE = { tome: { w: 50, h: 1 }, grimoire: { w: 60, h: 1.02 }, paperback: { w: 36, h: .94 }, gamecase: { w: 40, h: 1 }, cartridge: { w: 54, h: .78 }, datapad: { w: 34, h: .98 } };
function newBookDraft() {
  return { id: uid(), title: '', platform: 'PC', style: 'tome', color: '#7a1f2b', trim: '#e3b341', font: 'classic', emblem: 'sword', pattern: 'none', size: 'medium', thick: 'normal', effect: 'none', cover: null, createdAt: Date.now(), order: Date.now() };
}
function randomBookLook(b) {
  const r = Math.random, color = pick(COVER_SWATCHES); let tr = TRIM_SWATCHES.filter(t => Math.abs(lum(t) - lum(color)) > .25); if (!tr.length) tr = TRIM_SWATCHES; const trim = pick(tr);
  Object.assign(b, { style: pick(STYLES).id, color, trim, font: pick(FONTS).id, emblem: pick(EMBLEMS), pattern: r() < .35 ? 'none' : pick(PATTERNS.slice(1)), size: pick(['short', 'medium', 'medium', 'tall']), thick: pick(['slim', 'normal', 'normal', 'thick']), effect: r() < .5 ? 'none' : pick(['glow', 'sparkle', 'foil']) });
  return b;
}
function bookDims(b, n) {
  const base = STYLE_BASE[b.style] || STYLE_BASE.tome, H = { short: 128, medium: 150, tall: 172 }[b.size] || 150, T = { slim: .82, normal: 1, thick: 1.25 }[b.thick] || 1;
  return { w: Math.round(base.w * T + Math.min(n || 0, 40) * .22), h: Math.round(H * base.h) };
}
function bookVars(b, n, dims) {
  const d = dims || bookDims(b, n), pl = PLATFORMS[b.platform] || PLATFORMS.Other;
  return [`--c:${b.color}`, `--c2:${shade(b.color, -.38)}`, `--c3:${shade(b.color, .22)}`, `--t:${b.trim}`, `--t2:${shade(b.trim, -.35)}`, `--tx:${textOn(b.color)}`, `--tt:${textOn(b.trim)}`,
  `--font:${fontStack(b.font)}`, `--pat:${patUrl(b.pattern, b.trim)}`, `--plat:${pl.col}`, `--w:${d.w}px`, `--h:${d.h}px`].join(';');
}
function spineHTML(b, n) {
  const d = bookDims(b, n), pl = PLATFORMS[b.platform] || PLATFORMS.Other;
  const reserve = { tome: 74, grimoire: 80, paperback: 64, gamecase: 78, cartridge: 54, datapad: 64 }[b.style] || 70;
  const avail = d.h - reserve - (n ? 18 : 0), t = (b.title || 'Untitled').trim();
  const lines = d.w >= 46 ? 2 : 1, cw = lines === 2 ? .6 : .56;
  const fs = clamp(avail * lines / (t.length * cw * 1.1), 9, 14.5), cap = Math.max(3, Math.floor(avail * lines / (fs * cw * 1.15)));
  const tt = t.length > cap ? t.slice(0, cap - 1).trimEnd() + '…' : t, wrap = lines === 2 && t.length * fs * cw > avail;
  return `<div class="sp sp-${b.style} fx-${b.effect || 'none'}" data-id="${b.id}" style="${bookVars(b, n, d)};--fs:${fs.toFixed(1)}px;--tmax:${avail + (b.style === 'cartridge' ? 10 : 0)}px" role="button" aria-label="${esc(t)} journal">
    <i class="sp-pat"></i><i class="sp-sh"></i><i class="sp-a"></i><i class="sp-b"></i>
    <span class="sp-emb">${ic(b.emblem)}</span>
    <span class="sp-title ${wrap ? 'two' : ''}">${esc(tt)}</span>
    ${b.style === 'gamecase' ? `<span class="sp-plat">${pl.abbr}</span>` : ''}
    ${n ? `<span class="sp-count">${n > 99 ? '99+' : n}</span>` : ''}
    <i class="sp-fx"></i></div>`;
}
function coverHTML(b, n) {
  const pl = PLATFORMS[b.platform] || PLATFORMS.Other, t = (b.title || 'Untitled').trim();
  const art = b.cover ? `<img src="${b.cover}" alt="">` : ic(b.emblem);
  const L = t.length, tf = L <= 9 ? 2.7 : L <= 16 ? 2.2 : L <= 26 ? 1.75 : 1.4;
  const ex = {
    tome: '<b class="cn tl"></b><b class="cn tr"></b><b class="cn bl"></b><b class="cn br"></b><i class="cv-ribbon"></i>',
    grimoire: '<b class="cn tl"></b><b class="cn tr"></b><b class="cn bl"></b><b class="cn br"></b><i class="gem"></i><i class="clasp"><b></b></i><i class="strap"></i>',
    paperback: `<div class="cv-author">A Player’s Journal</div><div class="sticker"><b>${n || 0}</b><small>entries</small></div>`,
    gamecase: `<div class="gc-top"><span>${pl.abbr}</span><small>LOREBOOK</small></div><div class="gc-rate"><b>J</b><small>JOURNAL<br>EVERYONE</small></div><i class="gc-seal"></i>`,
    cartridge: '<i class="ct-grip"></i><div class="ct-top">LOREBOOK</div><i class="ct-pins"></i>',
    datapad: '<div class="dp-bar"><span>LORE-OS</span><i class="dp-bat"></i></div><div class="dp-btns"><b></b><b></b><b></b></div><i class="dp-scan"></i>'
  }[b.style] || '';
  return `<div class="cv cv-${b.style} fx-${b.effect || 'none'}" style="${bookVars(b, n)};--tf:${tf}">
    <i class="cv-pat"></i><i class="cv-frame"></i><i class="cv-hinge"></i>
    <div class="cv-art">${art}</div>
    <div class="cv-title"><span>${esc(t)}</span></div>
    <div class="cv-sub">${esc(b.platform || '')}</div>
    ${ex}<i class="cv-fx"></i></div>`;
}

/* ---------- levels & achievements ---------- */
const RANKS = ['Apprentice Scribe', 'Page Turner', 'Quest Logger', 'Lorekeeper', 'Archivist', 'Loremaster', 'Grand Librarian', 'Archmage Chronicler', 'Legendary Scribe'];
const xpFor = l => (l - 1) * (l - 1) * 30;
const lvlOf = xp => Math.floor(Math.sqrt(Math.max(0, xp) / 30)) + 1;
const rankOf = l => RANKS[Math.min(RANKS.length - 1, Math.floor((l - 1) / 2))];

const ACH = [
  { id: 'first_book', name: 'Chapter One', desc: 'Start your first journal.', icon: 'book', test: s => s.books >= 1 },
  { id: 'books3', name: 'Shelf Stocker', desc: 'Own 3 journals.', icon: 'shield', test: s => s.books >= 3 },
  { id: 'books8', name: "Dragon's Hoard", desc: 'Own 8 journals.', icon: 'crown', test: s => s.books >= 8 },
  { id: 'first_entry', name: 'First Words', desc: 'Inscribe your first note.', icon: 'quill', test: s => s.entries >= 1 },
  { id: 'entries10', name: 'Scribe in Training', desc: 'Write 10 entries.', icon: 'edit', test: s => s.entries >= 10 },
  { id: 'entries50', name: 'Epic Chronicler', desc: 'Write 50 entries.', icon: 'flame', test: s => s.entries >= 50 },
  { id: 'entries200', name: 'Living Legend', desc: 'Write 200 entries.', icon: 'star', test: s => s.entries >= 200 },
  { id: 'first_photo', name: 'Snapshot Sorcerer', desc: 'Attach your first picture.', icon: 'camera', test: s => s.photos >= 1 },
  { id: 'photos10', name: 'Screenshot Hoarder', desc: 'Keep 10 pictures.', icon: 'image', test: s => s.photos >= 10 },
  { id: 'moment', name: 'Core Memory', desc: 'Mark a special moment.', icon: 'heart', test: s => s.moments >= 1 },
  { id: 'boss', name: 'Boss Slayer', desc: 'Log a Boss entry.', icon: 'sword', test: s => s.boss >= 1 },
  { id: 'oops', name: 'Respawn Enthusiast', desc: 'Log an Oops entry.', icon: 'skull', test: s => s.oops >= 1 },
  { id: 'streak3', name: 'Three-Day Streak', desc: 'Write on 3 days in a row.', icon: 'bolt', test: s => s.streak >= 3 },
  { id: 'streak7', name: 'Weekly Raid', desc: 'Write on 7 days in a row.', icon: 'rocket', test: s => s.streak >= 7 },
  { id: 'night', name: 'Night Owl', desc: 'Write something between midnight and 4 AM.', icon: 'moon', test: s => s.night },
  { id: 'custom', name: 'Tailor of Tomes', desc: 'Re-style an existing book.', icon: 'palette' },
  { id: 'theme', name: 'Interior Decorator', desc: 'Change the library theme.', icon: 'window' },
  { id: 'backup', name: 'Vault Keeper', desc: 'Create a backup of your library.', icon: 'lock' },
  { id: 'where', name: 'Window Seat', desc: 'Tell the window where you live.', icon: 'pin' },
  { id: 'tidy', name: 'Dewey Decimator', desc: 'Re-sort your shelf.', icon: 'sort' }
];

const GREETINGS = [
  'Ctrl+S for your memories.', 'Your save file, but with feelings.', 'Sidequests build character. And word counts.', 'Please do not feed the Mimic.',
  'Every great run starts with a note.', 'Remember: the cake is a lie. Write that down.', 'Loot now, journal later. (Journal now.)', 'Shh. The books are respawning.',
  'Press any book to continue.', 'Totally not a haunted library. Probably.', 'Quiet please — boss music is on.', 'No spoilers past this shelf.'
];
