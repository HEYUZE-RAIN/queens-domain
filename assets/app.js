/* =========================================================
   assets/app.js — 女王魔域全收集互动地图（核心）
   ========================================================= */

const ICONS = {
  skull:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5c-4.4 0-7.6 3-7.6 7.2 0 2.5 1 4.2 2.4 5.4v2.4c0 .8.6 1.4 1.4 1.4h.9v1.6c0 .6.5 1 1 1h4c.5 0 1-.4 1-1v-1.6h.9c.8 0 1.4-.6 1.4-1.4v-2.4c1.4-1.2 2.4-2.9 2.4-5.4 0-4.2-3.2-7.2-7.6-7.2Z"/><circle cx="9" cy="10.4" r="1.7"/><circle cx="15" cy="10.4" r="1.7"/><path d="M12 14.2v2"/></svg>',
  egg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c3.3 0 6 4.4 6 8.6A6 6 0 0 1 6 11.6C6 7.4 8.7 3 12 3Z"/><path d="M9.4 9.2c.4-1.6 1.3-2.8 2.4-3.4"/></svg>',
  duck:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8.6 20c-2.6 0-4.6-1.8-4.6-4 0-2 1.6-3.4 3.6-3.7"/><path d="M7.6 12.3c0-3 2.3-5.3 5.2-5.3 2.6 0 4.6 1.7 5 4.1"/><circle cx="15.4" cy="7.4" r="2.9"/><path d="M18.3 7.2h2.6l-1.9 1.6"/><path d="M8.4 12.6h11.2c-.6 2.6-2.8 4.2-5.6 4.2H12c-2 0-3.6 1.4-3.6 3.2"/></svg>',
  lens:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.2 21 12l-9 8.8L3 12z"/><circle cx="12" cy="12" r="2.8"/></svg>',
  gem:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6.4 4h11.2l3.4 5.2L12 20.4 1 9.2Z"/><path d="M1 9.2h20M8.4 4 12 9.2 15.6 4M12 9.2v11.2"/></svg>',
  beacon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.6 15.4 8 12 13.4 8.6 8Z"/><path d="M8 17.4h8M9.2 20.8h5.6"/><path d="M12 13.4v4"/></svg>',
  boss:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.6 18.6 5.8 8.4l4 3.4L12 5l2.2 6.8 4-3.4 1.2 10.2Z"/><path d="M4.6 18.6h14.8"/></svg>',
  npc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7.6" r="3.6"/><path d="M4.6 21c0-4 3.3-6.6 7.4-6.6s7.4 2.6 7.4 6.6"/></svg>',
  key:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.4" cy="8" r="3.8"/><path d="M10 10.6 20.4 21M17.4 18l1.8-1.8M14.6 15.2l1.8-1.8"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.4C9.8 4.9 7 4.4 4 4.9v14c3-.5 5.8 0 8 1.5 2.2-1.5 5-2 8-1.5v-14c-3-.5-5.8 0-8 1.5Z"/><path d="M12 6.4v14"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5 9.5 17.5 19.5 6.5"/></svg>',
  chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5.5 16 12l-7 6.5"/></svg>',
  close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.6" cy="10.6" r="6.4"/><path d="M15.4 15.4 21 21"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a6.6 6.6 0 0 0-6.6 6.6c0 4.6 5.4 10.9 6.1 11.7a.7.7 0 0 0 1 0c.7-.8 6.1-7.1 6.1-11.7A6.6 6.6 0 0 0 12 2Zm0 9.2a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2Z"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  minus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  fit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V5.4A1.4 1.4 0 0 1 5.4 4H9M15 4h3.6A1.4 1.4 0 0 1 20 5.4V9M20 15v3.6a1.4 1.4 0 0 1-1.4 1.4H15M9 20H5.4A1.4 1.4 0 0 1 4 18.6V15"/></svg>',
  crown:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.2 8.4 6.6 11l3.2-6 2.2 4 2.2-4 3.2 6 3.4-2.6-1.4 9.4H4.6Z"/></svg>',
  trophy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M7 5.4H4.4v1.8A3.2 3.2 0 0 0 7.6 10.4M17 5.4h2.6v1.8a3.2 3.2 0 0 1-3.2 3.2M12 14v3.4M8.4 20.4h7.2"/></svg>',
  list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6.5h16M4 12h16M4 17.5h16"/></svg>',
  map:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4 3.6 6.2v14L9 18l6 2 5.4-2.2v-14L15 6Z"/><path d="M9 4v14M15 6v14"/></svg>',
  reset:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.6 6"/><path d="M20 4.5V11h-6.5"/></svg>',
  req:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h6l-1 8 9-12h-6Z"/></svg>',
  memento:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.2" r="4.2"/><path d="M12 12.4v9M8.6 18h6.8M9.6 21.2h4.8"/></svg>',
  cell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.6" y="7" width="15.4" height="10" rx="2.4"/><path d="M21.4 10.4v3.2"/><path d="M9.4 9.6 7.2 12.6h2.8L8.4 15.4 11.8 12H9.2z"/></svg>',
  vault:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.4" y="4.4" width="17.2" height="15.2" rx="2.4"/><circle cx="12" cy="12" r="4"/><path d="M12 8v1.6M12 14.4V16M8 12h1.6M14.4 12H16"/></svg>',
  charm:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.6 14 9l6.4.4-5 3.9 1.8 6.1L12 15.8 6.8 19.4 8.6 13.3 3.6 9.4 10 9z"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/></svg>'
};

const LS_KEY = 'qd_map_progress_v1';
const state = {
  done: new Set(),
  ach: new Set(),
  best: new Set(),     // 图鉴已击杀条目编号
  catOn: {},
  sel: null,
  tab: 'all',
  q: '',
  collapsed: new Set(['beacon'])
};

let PIN_INDEX = [];
const ACH_FILTER = { v: '全部' };

let viewport, stage, pinsLayer;

function pinId(cat, i){ return cat + ':' + i; }
function catMeta(id){ return CATS.find(c => c.id === id) || { color:'#888', name:id, icon:'pin' }; }
function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function cssEsc(s){ return String(s).replace(/["\\]/g, '\\$&'); }

function initPins(){
  const counter = {};
  PIN_INDEX = PIN_RAW.map((p, i) => {
    const [cat, name, area, xy, note, req, ach] = p;
    counter[cat] = (counter[cat] || 0) + 1;
    return { i, id: pinId(cat, i), cat, name, area, x: xy[0], y: xy[1],
             note: note || '', req: req || '', ach: ach || '', idx: counter[cat] };
  });
}

function catCounts(){
  const m = {};
  CATS.forEach(c => m[c.id] = { total:0, done:0 });
  PIN_INDEX.forEach(p => {
    if(!m[p.cat]) m[p.cat] = { total:0, done:0 };
    m[p.cat].total++;
    if(state.done.has(p.id)) m[p.cat].done++;
  });
  return m;
}

function save(){
  try{
    localStorage.setItem(LS_KEY, JSON.stringify({
      done:[...state.done], ach:[...state.ach], best:[...state.best], catOn: state.catOn
    }));
  }catch(e){}
}
function load(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return;
    const d = JSON.parse(raw);
    if(Array.isArray(d.done)) state.done = new Set(d.done);
    if(Array.isArray(d.ach)) state.ach = new Set(d.ach);
    if(Array.isArray(d.best)) state.best = new Set(d.best);
    if(d.catOn && typeof d.catOn === 'object') state.catOn = d.catOn;
  }catch(e){}
}
