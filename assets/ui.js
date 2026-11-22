/* assets/ui.js — 侧栏、成就面板、图例、详情卡 */

function hl(text){
  if(!state.q) return escapeHtml(text);
  const q = state.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escapeHtml(text).replace(new RegExp('(' + q + ')', 'gi'),
    m => `<mark style="background:rgba(232,194,106,.26);color:#f4e3b6;border-radius:3px;padding:0 2px">${m}</mark>`);
}

function matchQuery(p){
  if(!state.q) return true;
  const q = state.q.toLowerCase();
  return (p.name + ' ' + p.area + ' ' + p.note + ' ' + p.req + ' ' + catMeta(p.cat).name).toLowerCase().includes(q);
}

function renderSidebar(){
  if(state.tab === 'ach'){ renderAchList(); return; }
  if(state.tab === 'best'){ renderBestiary(); return; }
  if(state.tab === 'route'){ renderRoute(); return; }
  if(state.tab === 'grim'){ renderGrimoire(); return; }
  const counts = catCounts();
  const scroll = document.getElementById('scroll');
  const st = scroll.scrollTop;
  let html = '';

  CATS.forEach(c => {
    const on = state.catOn[c.id] !== false;
    const open = !state.collapsed.has(c.id);
    const list = PIN_INDEX.filter(p => p.cat === c.id && matchQuery(p));
    if(state.q && list.length === 0) return;
    const cn = counts[c.id] || { total:0, done:0 };
    const pct = cn.total ? (cn.done / cn.total * 100) : 0;

    html += `<section class="group ${open ? 'open' : ''}" data-cat="${c.id}">
      <button class="group-head" data-toggle="${c.id}">
        <span class="gicon" style="color:${c.color}">${ICONS[c.icon] || ICONS.pin}</span>
        <span class="gname">${c.name}<small>${c.sub}</small></span>
        <span class="gnum"><b>${cn.done}</b>/${cn.total}${c.target && c.target !== cn.total ? `<em style="font-style:normal;color:#6b8296"> / 目标 ${c.target}</em>` : ''}</span>
        <span class="vis" data-vis="${c.id}" title="切换该图层显示" style="opacity:${on ? 1 : .32}">
          <i style="background:${c.color}"></i></span>
      </button>
      <div class="group-body">
        <div class="gbar"><i style="width:${pct}%;background:linear-gradient(90deg,${c.color}55,${c.color})"></i></div>
        <p class="gdesc">${c.desc}</p>
        ${list.map(p => {
          const dn = state.done.has(p.id);
          return `<div class="item ${dn ? 'done' : ''} ${state.sel === p.id ? 'sel' : ''}" data-pin="${cssEsc(p.id)}">
            <span class="chk" data-check="${cssEsc(p.id)}">${ICONS.check}</span>
            <span class="it-main">
              <span class="it-name">${hl(p.name)}</span>
              <span class="it-meta"><span class="loc">${escapeHtml(p.area)}</span>${p.req ? `<span class="need">· ${escapeHtml(p.req)}</span>` : ''}</span>
            </span>
            ${p.ach ? `<span class="it-ach">${escapeHtml(p.ach)}</span>` : ''}
          </div>`;
        }).join('')}
      </div>
    </section>`;
  });

  if(!html) html = `<div class="empty">没有找到「${escapeHtml(state.q)}」<br><br>试试：骷髅 · 陵墓 · 镜片 · 冲刺</div>`;
  scroll.innerHTML = html;
  bindListEvents();
  if(state.q) scroll.scrollTop = 0; else scroll.scrollTop = st;
}

function bindListEvents(){
  const scroll = document.getElementById('scroll');
  scroll.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', e => {
      if(e.target.closest('[data-vis]')) return;
      const cid = btn.dataset.toggle;
      if(state.collapsed.has(cid)) state.collapsed.delete(cid); else state.collapsed.add(cid);
      btn.closest('.group').classList.toggle('open');
    });
  });
  scroll.querySelectorAll('[data-vis]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const cid = el.dataset.vis;
      state.catOn[cid] = state.catOn[cid] === false;
      save(); refreshPinStates(); renderLegend();
      const grp = el.closest('.group');
      el.style.opacity = state.catOn[cid] === false ? .32 : 1;
      grp.style.opacity = state.catOn[cid] === false ? .5 : 1;
    });
  });
  scroll.querySelectorAll('[data-check]').forEach(el => {
    el.addEventListener('click', e => { e.stopPropagation(); togglePin(el.dataset.check); });
  });
  scroll.querySelectorAll('[data-pin]').forEach(el => {
    el.addEventListener('click', () => selectPin(el.dataset.pin, true));
  });
  scroll.querySelectorAll('.group').forEach(g => {
    const cid = g.dataset.cat;
    if(state.catOn[cid] === false) g.style.opacity = .5;
  });
}

function renderAchList(){
  const scroll = document.getElementById('scroll');
  const groups = ['地点','支线','收集','武器','首领','结局'];
  const total = ACH_RAW.length, done = state.ach.size;

  const count = f => f === '全部' ? ACH_RAW.length : ACH_RAW.filter(a => a[4] === f).length;
  const dcount = f => f === '全部' ? done : ACH_RAW.filter(a => a[4] === f && state.ach.has(a[0])).length;
  const filtered = ACH_RAW.filter(a => (ACH_FILTER.v === '全部' || a[4] === ACH_FILTER.v) &&
    (!state.q || (a[1] + a[2] + a[3]).toLowerCase().includes(state.q.toLowerCase())));

  const R = 42, C = 2 * Math.PI * R;
  let html = `<div class="ach-top">
    <div class="ach-ring">
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="${R}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="7"/>
        <circle cx="50" cy="50" r="${R}" fill="none" stroke="#e8c26a" stroke-width="7" stroke-linecap="round"
          stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - done / total)).toFixed(1)}"
          transform="rotate(-90 50 50)" style="transition:stroke-dashoffset .5s"/>
      </svg>
      <div class="ach-ring-txt"><b>${done}</b><span>/${total}</span></div>
    </div>
    <div class="ach-sum">
      <div class="ach-title">成就进度 ${Math.round(done / total * 100)}%</div>
      <div class="ach-sub">${done === total ? '全部达成 · 女王魔域' : '继续探索尼亚希德岛'}</div>
      <div class="ach-bar"><i style="width:${(done / total * 100).toFixed(1)}%"></i></div>
    </div>
  </div>
  <div class="filters">${['全部', ...groups].map(f =>
    `<button class="chip ${ACH_FILTER.v === f ? 'on' : ''}" data-achfilter="${f}">${f}<em>${dcount(f)}/${count(f)}</em></button>`
  ).join('')}</div>`;

  html += '<div class="ach-list">';
  filtered.forEach(a => {
    const dn = state.ach.has(a[0]);
    html += `<div class="ach ${dn ? 'done' : ''}" data-ach="${a[0]}" title="点击可定位到该区域">
      <span class="ach-ico">${ICONS.trophy}</span>
      <span class="ach-main">
        <span class="ach-name">${hl(a[1])} <em>${escapeHtml(a[2])}</em></span>
        <span class="ach-desc">${escapeHtml(a[3])}</span>
      </span>
      <span class="chk ${dn ? 'on' : ''}" data-achcheck="${a[0]}">${ICONS.check}</span>
    </div>`;
  });
  if(!filtered.length) html += `<div class="empty">没有匹配的成就</div>`;
  html += '</div>';
  scroll.innerHTML = html;

  scroll.querySelectorAll('[data-achfilter]').forEach(b =>
    b.addEventListener('click', () => { ACH_FILTER.v = b.dataset.achfilter; renderAchList(); }));
  scroll.querySelectorAll('[data-achcheck]').forEach(b =>
    b.addEventListener('click', e => { e.stopPropagation(); toggleAch(b.dataset.achcheck); }));
  scroll.querySelectorAll('[data-ach]').forEach(el =>
    el.addEventListener('click', () => {
      const a = ACH_RAW.find(x => x[0] === el.dataset.ach);
      if(a && AREAS[a[5]]) goArea(a[5]);
    }));
}

function renderLegend(){
  const counts = catCounts();
  const box = document.getElementById('legendList');
  box.innerHTML = CATS.map(c => {
    const on = state.catOn[c.id] !== false;
    const cn = counts[c.id] || { total:0, done:0 };
    return `<button class="lg ${on ? '' : 'off'}" data-lg="${c.id}">
      <span class="sw" style="background:${c.color};box-shadow:0 0 7px ${c.color}66"></span>
      <span class="lbl">${c.name}</span>
      <span class="n">${cn.done}/${cn.total}</span>
    </button>`;
  }).join('');
  box.querySelectorAll('[data-lg]').forEach(b => b.addEventListener('click', () => {
    const cid = b.dataset.lg;
    state.catOn[cid] = state.catOn[cid] === false;
    save(); refreshPinStates(); renderLegend(); renderSidebar();
  }));
}

function selectPin(id, fromList){
  state.sel = id;
  const p = PIN_INDEX.find(x => x.id === id);
  if(!p) return;
  const meta = catMeta(p.cat);
  const dn = state.done.has(id);
  const card = document.getElementById('detail');
  card.innerHTML = `
    <div class="detail-top">
      <div class="detail-kicker"><span class="dotk" style="background:${meta.color}"></span>${meta.name} · 第 ${p.idx} 项</div>
      <h4 style="color:${meta.color}">${escapeHtml(p.name)}</h4>
      <button class="detail-close" id="dclose">${ICONS.close}</button>
    </div>
    <div class="detail-body">
      <div class="drow"><span class="k">区域</span><span class="v">${escapeHtml(p.area)}</span></div>
      ${p.req ? `<div class="drow"><span class="k">需求</span><span class="v"><span class="dreq">${ICONS.req}${escapeHtml(p.req)}</span></span></div>` : ''}
      ${p.ach ? `<div class="drow"><span class="k">成就</span><span class="v">${escapeHtml(p.ach)}</span></div>` : ''}
      <div class="dnote">${p.note ? escapeHtml(p.note) : '暂无更多说明。'}</div>
      <div class="dactions">
        <button class="btn ${dn ? 'gold' : ''}" id="dtoggle">${dn ? '取消标记' : '标记为已收集'}</button>
        <button class="btn ghost" id="dzone">${ICONS.map}区域图</button>
      </div>
    </div>`;
  card.classList.add('show');
  document.getElementById('dclose').onclick = () => { card.classList.remove('show'); state.sel = null; refreshPinStates(); };
  document.getElementById('dtoggle').onclick = () => { togglePin(id); selectPin(id, true); };
  document.getElementById('dzone').onclick = () => {
    const zk = (typeof AREA_TO_ZONE !== 'undefined') && AREA_TO_ZONE[p.area];
    if(zk) openZone(zk, 0); else toast('该区域暂无细部图');
  };
  refreshPinStates();

  const el = document.querySelector(`.pin[data-id="${cssEsc(id)}"]`);
  if(el){
    el.animate([{ transform:'scale(1)' }, { transform:'scale(2.2)' }, { transform:'scale(1)' }],
      { duration: 700, iterations: 2, easing: 'ease-out' });
  }
  if(!fromList){
    const row = document.querySelector(`.item[data-pin="${cssEsc(id)}"]`);
    if(row){
      const grp = row.closest('.group');
      if(grp && !grp.classList.contains('open')) grp.classList.add('open');
      row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }
}

function goArea(key){
  const a = AREAS[key];
  if(!a) return;
  centerOn(a.x, a.y, Math.max(view.scale, 0.95));
  if(window.innerWidth < 820) document.getElementById('sidebar').classList.add('collapsed');
}

function togglePin(id){
  const wasDone = state.done.has(id);
  if(wasDone) state.done.delete(id); else state.done.add(id);
  save(); refreshPinStates(); renderSidebar(); renderLegend(); updateOverall();
  const p = PIN_INDEX.find(x => x.id === id);
  if(p && !wasDone) toast(`已收录 · ${p.name}（${catMeta(p.cat).name}）`);
}

function toggleAch(id){
  const wasDone = state.ach.has(id);
  if(wasDone) state.ach.delete(id); else state.ach.add(id);
  save(); renderAchList(); updateOverall();
  const a = ACH_RAW.find(x => x[0] === id);
  if(a && !wasDone) toast(`成就达成 · ${a[1]}`);
  if(state.ach.size === ACH_RAW.length) setTimeout(() => toast('女王魔域 · 全成就达成'), 900);
}

function updateOverall(){
  const c = catCounts();
  let all = 0, done = 0;
  CATS.forEach(x => { all += (c[x.id] || {}).total || 0; done += (c[x.id] || {}).done || 0; });
  const pct = all ? done / all : 0;
  document.getElementById('ovPct').textContent = Math.round(pct * 100) + '%';
  document.getElementById('ovBar').style.width = (pct * 100).toFixed(1) + '%';
  document.getElementById('ovCnt').textContent = `${done} / ${all} 项`;
  const tabAll = document.querySelector('.tab[data-tab="all"] .cnt');
  if(tabAll) tabAll.textContent = all;
  const tabAch = document.querySelector('.tab[data-tab="ach"] .cnt');
  if(tabAch && typeof ACH_RAW !== 'undefined') tabAch.textContent = ACH_RAW.length;
  document.getElementById('ovAch').textContent = `成就 ${state.ach.size}/${ACH_RAW.length}`;
  const ovl = document.getElementById('ovLeft');
  if(ovl) ovl.textContent = pct >= 1 ? '全收集完成' : `剩余 ${all - done} 项`;
  const ta = document.getElementById('tAch'); if(ta) ta.textContent = state.ach.size + '/' + ACH_RAW.length;
  const tc = document.getElementById('tCollect'); if(tc) tc.textContent = done + '/' + all;
  const ms = document.getElementById('modalStats');
  if(ms) ms.innerHTML = `<div class="statline"><span>已收集项目</span><b>${done} / ${all}</b></div>
    <div class="statline"><span>已达成成就</span><b>${state.ach.size} / ${ACH_RAW.length}</b></div>`;
}

let toastTimer;
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}

/* =========================================================
   怪物图鉴页签
   ========================================================= */
let BEST_REGION = 'all';
let BEST_ONLY_HIDDEN = false;

function renderBestiary(){
  const scroll = document.getElementById('scroll');
  if(typeof BEST_RAW === 'undefined'){ scroll.innerHTML = '<div class="empty">图鉴数据未加载</div>'; return; }

  const total = 188;
  const done = state.best.size;
  const pct = total ? done / total : 0;

  let html = `<div class="ach-top">
    <div class="ach-ring"><svg viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="7"/>
      <circle cx="50" cy="50" r="42" fill="none" stroke="#7fe0c8" stroke-width="7" stroke-linecap="round"
        stroke-dasharray="${(2*Math.PI*42).toFixed(1)}" stroke-dashoffset="${(2*Math.PI*42*(1-pct)).toFixed(1)}"
        transform="rotate(-90 50 50)"/>
    </svg><div class="ach-ring-txt"><b>${done}</b><span>/${total}</span></div></div>
    <div class="ach-sum">
      <div class="ach-title">图鉴 ${Math.round(pct*100)}%</div>
      <div class="ach-sub">${done >= 187 ? '除 121 号外全部收录' : '121 号（魂之锡佩哈）不计入沃尔哈要求'}</div>
      <div class="ach-bar"><i style="width:${pct*100}%;background:linear-gradient(90deg,#2a8c7d,#7fe0c8)"></i></div>
    </div>
  </div>`;

  html += `<div class="bestbar">
    <button class="chip ${BEST_REGION==='all'?'on':''}" data-breg="all">全部<em>${done}/${total}</em></button>
    <button class="chip ${BEST_ONLY_HIDDEN?'on':''}" data-bhid="1">只看隐藏怪</button>
  </div>
  <div class="bestregs">${BEST_REGIONS.map(r => {
    const list = BEST_RAW.filter(e => e[0] >= r.from && e[0] <= r.to);
    const d = list.filter(e => state.best.has(e[0])).length;
    return `<button class="breg ${BEST_REGION===r.key?'on':''}" data-breg="${r.key}">
      ${escapeHtml(r.name)}<em>${d}/${list.length}</em></button>`;
  }).join('')}</div>`;

  // 列表
  const regions = BEST_REGION === 'all' ? BEST_REGIONS : BEST_REGIONS.filter(r => r.key === BEST_REGION);
  regions.forEach(r => {
    let list = BEST_RAW.filter(e => e[0] >= r.from && e[0] <= r.to);
    if(BEST_ONLY_HIDDEN) list = list.filter(e => e[3] === 1);
    if(state.q){
      const q = state.q.toLowerCase();
      list = list.filter(e => (e[1] + ' ' + e[2] + ' ' + e[4]).toLowerCase().includes(q));
    }
    const d = list.filter(e => state.best.has(e[0])).length;
    if(!list.length && state.q) return;

    html += `<section class="bgroup">
      <div class="bhead">
        <span class="bnum">${String(r.from).padStart(3,'0')}–${String(r.to).padStart(3,'0')}</span>
        <span class="bname">${escapeHtml(r.name)}</span>
        <span class="bcnt">${d}/${list.length}</span>
        ${ZONES[r.zone] ? `<button class="bmap" data-bzone="${r.zone}" title="打开区域图">${ICONS.map}</button>` : ''}
      </div>
      <div class="blist">
        ${list.map(e => {
          const dn = state.best.has(e[0]);
          return `<div class="bentry ${dn?'done':''} ${e[3]===1?'hid':''}" data-best="${e[0]}">
            <span class="bchk">${ICONS.check}</span>
            <span class="bno">${String(e[0]).padStart(3,'0')}</span>
            <span class="bmain">
              <span class="bnm">${hl(e[1])}<em>${escapeHtml(e[2])}</em>${e[3]===1?'<i class="btag">隐藏</i>':''}</span>
              ${e[4] ? `<span class="bnote">${hl(e[4])}</span>` : ''}
            </span>
          </div>`;
        }).join('')}
      </div>
    </section>`;
  });

  if(!html.includes('bgroup')) html += '<div class="empty">没有匹配的条目</div>';
  scroll.innerHTML = html;

  scroll.querySelectorAll('[data-breg]').forEach(b => b.onclick = () => {
    BEST_REGION = b.dataset.breg; renderBestiary();
  });
  scroll.querySelectorAll('[data-bhid]').forEach(b => b.onclick = () => {
    BEST_ONLY_HIDDEN = !BEST_ONLY_HIDDEN; renderBestiary();
  });
  scroll.querySelectorAll('[data-bzone]').forEach(b => b.onclick = e => {
    e.stopPropagation(); openZone(b.dataset.bzone, 0);
  });
  scroll.querySelectorAll('[data-best]').forEach(el => el.onclick = () => toggleBest(+el.dataset.best));
}

function toggleBest(n){
  if(state.best.has(n)) state.best.delete(n); else state.best.add(n);
  save(); renderBestiary(); updateOverall();
  const e = BEST_RAW.find(x => x[0] === n);
  if(e && state.best.has(n)) toast('已收录 · ' + e[1]);
}
