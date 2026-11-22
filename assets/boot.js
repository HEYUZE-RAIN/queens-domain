/* assets/boot.js — 交互绑定与初始化 */

function boot(){
  initPins();
  load();
  viewport = document.getElementById('viewport');
  stage = document.getElementById('stage');
  pinsLayer = document.getElementById('pins');   // 新布局下无此元素，仅作兼容占位

  const svg = document.getElementById('mapsvg');
  if(svg){
    if(typeof paintMap === 'function'){
      window.__REG_STATS = (typeof regionStats === 'function') ? regionStats() : {};
      paintMap();
      if(typeof bindBadges === 'function') bindBadges();
      if(typeof bindZoneEntries === 'function') bindZoneEntries();
    }
    else if(typeof buildSVG === 'function') svg.innerHTML = buildSVG();
    if(svg.parentNode && document.getElementById('mapimg')) document.getElementById('mapimg').remove();
  }
  if(typeof renderLabels === 'function') renderLabels();
  if(typeof mountMap === 'function' && !document.getElementById('mapsvg')) mountMap();

  if(typeof buildSVG !== 'function'){ console.warn('buildSVG 未加载'); }
  if(typeof renderLabels !== 'function'){ console.warn('renderLabels 未加载'); }

  renderPins();
  renderSidebar();
  renderLegend();
  updateOverall();

  /* 顶栏按钮 */
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
    state.tab = t.dataset.tab;
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t));
    document.getElementById('toolbar').style.display = state.tab !== 'all' ? 'none' : 'flex';
    if(state.tab !== 'all'){ document.getElementById('detail').classList.remove('show'); }
    // 图鉴/路线页签时收起图层面板，避免压住清单
    const lgEl = document.getElementById('legend');
    if(lgEl) lgEl.classList.toggle('closed', state.tab === 'best' || state.tab === 'route' || state.tab === 'grim');
    // 小屏：切页签时自动展开侧栏（移动端用 .open 控制显示），否则看不到列表
    if(state.tab !== 'all' && window.innerWidth <= 820 && typeof window.setSidebar === 'function'){
      window.setSidebar(true);
    }
    renderSidebar();
    document.getElementById('scroll').scrollTop = 0;
  }));

  const search = document.getElementById('search');
  let tmr;
  search.addEventListener('input', () => {
    clearTimeout(tmr);
    tmr = setTimeout(() => { state.q = search.value.trim(); renderSidebar(); }, 110);
  });

  document.getElementById('btnExpand').addEventListener('click', () => {
    const allOpen = CATS.every(c => !state.collapsed.has(c.id));
    if(allOpen) CATS.forEach(c => state.collapsed.add(c.id));
    else CATS.forEach(c => state.collapsed.delete(c.id));
    renderSidebar();
  });

  document.getElementById('btnReset').addEventListener('click', () => {
    document.getElementById('modal').classList.add('show');
  });
  document.getElementById('mCancel').onclick = () => document.getElementById('modal').classList.remove('show');
  document.getElementById('mOk').onclick = () => {
    state.done.clear(); state.ach.clear(); if(state.best) state.best.clear();
    save(); refreshPinStates(); renderSidebar(); renderLegend(); updateOverall();
    document.getElementById('modal').classList.remove('show');
    toast('进度已重置');
  };
  document.getElementById('modal').addEventListener('click', e => {
    if(e.target.id === 'modal') e.currentTarget.classList.remove('show');
  });

  /* 侧栏开合（抽屉式） */
  const sbEl = document.getElementById('sidebar');
  const mainEl = sbEl ? sbEl.parentNode : null;
  let sbTimer = null;
  function setSidebar(open){
    if(!sbEl) return;
    sbEl.classList.toggle('collapsed', !open);
    sbEl.classList.toggle('open', open);
    if(mainEl){
      mainEl.classList.toggle('sb-closed', !open);
      mainEl.classList.toggle('sb-open', open);
    }
    try{ localStorage.setItem('qd_sb_open', open ? '1' : '0'); }catch(e){}
    // 缩放与位移是相对视口计算的，视口尺寸本身在动画中连续变化，
    // 所以地图内容会自然跟着缩放位置走 —— 不要在这里再 fitView，
    // 否则动画结束时会突然跳一次比例（用户看到的就是「抖一下」）。
  }
  window.setSidebar = setSidebar;
  if(document.getElementById('btnMenu')){
    document.getElementById('btnMenu').addEventListener('click', () => {
      setSidebar(sbEl.classList.contains('collapsed'));
    });
  }
  if(document.getElementById('sbToggle')){
    document.getElementById('sbToggle').addEventListener('click', () => {
      setSidebar(sbEl.classList.contains('collapsed'));
    });
  }
  // 恢复上次状态（小屏默认收起）
  try{
    const saved = localStorage.getItem('qd_sb_open');
    if(saved === '0' || (saved === null && window.innerWidth <= 820)) setSidebar(false);
    else setSidebar(true);
  }catch(e){ setSidebar(window.innerWidth > 820); }

  /* 地图控件 */
  document.getElementById('zin').onclick = () => zoomAt(viewport.clientWidth/2, viewport.clientHeight/2, 1.35);
  document.getElementById('zout').onclick = () => zoomAt(viewport.clientWidth/2, viewport.clientHeight/2, 1/1.35);
  document.getElementById('zfit').onclick = () => fitView(0.03);
  document.getElementById('btnNext').onclick = jumpNext;

  /* 区域细部图 */
  document.getElementById('zClose').innerHTML = ICONS.close;
  document.getElementById('zClose').onclick = closeZone;
  document.getElementById('zoneModal').addEventListener('click', e => {
    if(e.target.id === 'zoneModal') closeZone();
  });
  document.getElementById('zIn').onclick = () => zzoom(1.3);
  document.getElementById('zOut').onclick = () => zzoom(1/1.3);
  document.getElementById('zFit').onclick = () => zfit();

  const grid = document.getElementById('zoneGrid');
  grid.innerHTML = Object.keys(ZONES).map(k => {
    const z = ZONES[k];
    const areas = Object.keys(AREA_TO_ZONE).filter(a => AREA_TO_ZONE[a] === k);
    const n = PIN_INDEX.filter(p => areas.indexOf(p.area) >= 0).length;
    const d = PIN_INDEX.filter(p => areas.indexOf(p.area) >= 0 && state.done.has(p.id)).length;
    return `<button class="zpick" data-zone="${k}">
      <b>${z.name}</b><em>${n ? d + '/' + n + ' 点位' : '无收集项'}</em>
    </button>`;
  }).join('');
  grid.querySelectorAll('[data-zone]').forEach(b => b.onclick = () => {
    document.getElementById('zonePick').classList.remove('show');
    openZone(b.dataset.zone, 0);
  });
  document.getElementById('zpickClose').onclick = () => document.getElementById('zonePick').classList.remove('show');
  document.getElementById('zonePick').addEventListener('click', e => {
    if(e.target.id === 'zonePick') e.currentTarget.classList.remove('show');
  });
  document.getElementById('btnZone').onclick = () => document.getElementById('zonePick').classList.add('show');

  /* 细部图内拖拽与滚轮缩放 */
  const zvp = document.getElementById('zViewport');
  let zd = false, zsx = 0, zsy = 0, zox = 0, zoy = 0, zpid = null, zMoved = false;
  zvp.addEventListener('pointerdown', e => {
    // 点在收集物圆点上时不进入拖拽，否则会抢走 click
    if(e.target.closest && e.target.closest('.cdot')) return;
    zd = true; zMoved = false; zpid = e.pointerId;
    zsx = e.clientX; zsy = e.clientY; zox = ZV.x; zoy = ZV.y;
  });
  zvp.addEventListener('pointermove', e => {
    if(!zd) return;
    const dx = e.clientX - zsx, dy = e.clientY - zsy;
    if(!zMoved){
      if(Math.abs(dx) + Math.abs(dy) < 4) return;   // 抖动阈值，避免误判
      zMoved = true;
      zvp.classList.add('dragging');
      try{ zvp.setPointerCapture(zpid); }catch(_){}
    }
    ZV.x = zox + dx; ZV.y = zoy + dy;
    if(typeof clampZonePan === 'function') clampZonePan();
    applyZoneTransform();
  });
  const zend = () => { zd = false; zMoved = false; zvp.classList.remove('dragging'); };
  zvp.addEventListener('pointerup', zend);
  zvp.addEventListener('pointercancel', zend);
  zvp.addEventListener('pointerleave', () => { if(!zMoved) zend(); });
  zvp.addEventListener('wheel', e => {
    e.preventDefault();
    zzoom(Math.exp(-e.deltaY * 0.0016));
  }, { passive: false });

  /* 拖动轨迹可吸附 */
  const lb = document.getElementById('legend');
  if(window.innerWidth < 820) lb.classList.add('closed');
  // 默认收起：地图优先，需要时点开
  lb.classList.add('closed');
  lb.querySelector('.legend-head').onclick = () => lb.classList.toggle('closed');

  /* 拖拽 */
  let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
  viewport.addEventListener('pointerdown', e => {
    if(e.target.closest('.pin') || e.target.closest('.gate') || e.target.closest('.rhot') || e.target.closest('.rlab')) return;
    dragging = true; sx = e.clientX; sy = e.clientY; ox = view.x; oy = view.y;
    viewport.classList.add('dragging');
    try{ viewport.setPointerCapture(e.pointerId); }catch(_){}
  });
  viewport.addEventListener('pointermove', e => {
    if(!dragging) return;
    view.x = ox + (e.clientX - sx);
    view.y = oy + (e.clientY - sy);
    applyTransform();
  });
  const endDrag = e => {
    if(!dragging) return;
    dragging = false;
    viewport.classList.remove('dragging');
    clampPan(); applyTransform();
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  /* 滚轮缩放 */
  viewport.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const f = Math.exp(-e.deltaY * 0.0016);
    zoomAt(e.clientX - rect.left, e.clientY - rect.top, f);
  }, { passive: false });

  /* 触摸双指缩放 */
  let pinch = null;
  viewport.addEventListener('touchstart', e => {
    if(e.touches.length === 2){
      const [a, b] = e.touches;
      pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), s: view.scale };
    }
  }, { passive: true });
  viewport.addEventListener('touchmove', e => {
    if(e.touches.length === 2 && pinch){
      const [a, b] = e.touches;
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const rect = viewport.getBoundingClientRect();
      const cx = (a.clientX + b.clientX) / 2 - rect.left;
      const cy = (a.clientY + b.clientY) / 2 - rect.top;
      zoomAt(cx, cy, (pinch.s * d / pinch.d) / view.scale);
      e.preventDefault();
    }
  }, { passive: false });
  viewport.addEventListener('touchend', () => { pinch = null; });

  /* 键盘 */
  window.addEventListener('keydown', e => {
    if(e.target.tagName === 'INPUT') return;
    if(e.key === '+' || e.key === '=') zoomAt(viewport.clientWidth/2, viewport.clientHeight/2, 1.3);
    if(e.key === '-' || e.key === '_') zoomAt(viewport.clientWidth/2, viewport.clientHeight/2, 1/1.3);
    if(e.key === '0') fitView(0.03);
    if(e.key === 'Escape'){
      // 层级：区域细部图 → 区域选择 → 重置确认 → 详情卡
      if(document.getElementById('colophonModal').classList.contains('show')){ document.getElementById('colophonModal').classList.remove('show'); return; }
      if(document.getElementById('helpModal').classList.contains('show')){ document.getElementById('helpModal').classList.remove('show'); return; }
      if(document.getElementById('srcModal').classList.contains('show')){ document.getElementById('srcModal').classList.remove('show'); return; }
      if(document.getElementById('padModal').classList.contains('show')){ document.getElementById('padModal').classList.remove('show'); return; }
      if(document.getElementById('zoneModal').classList.contains('show')){ closeZone(); return; }
      if(document.getElementById('zonePick').classList.contains('show')){ document.getElementById('zonePick').classList.remove('show'); return; }
      if(document.getElementById('modal').classList.contains('show')){ document.getElementById('modal').classList.remove('show'); return; }
      document.getElementById('detail').classList.remove('show');
      state.sel = null; refreshPinStates();
    }
  });

  window.addEventListener('resize', () => { clampPan(); applyTransform(); });

  // 布局稳定后再适配一次：侧栏展开会改变视口宽度，过早 fitView 会被 clampPan 修正
  // 布局（侧栏展开/收起）会改变视口宽度，必须等布局稳定后再适配，
  // 并在稍后补算一次，避免 clampPan 用旧宽度修正偏移
  const settleView = () => { fitView(0.02); clampPan(); applyTransform(); };
  requestAnimationFrame(() => {
    settleView();
    setTimeout(settleView, 120);
    setTimeout(settleView, 360);
    setTimeout(settleView, 700);
  });

  const srcBtn = document.getElementById('btnSrc');
  if(srcBtn){
    srcBtn.addEventListener('click', () => document.getElementById('srcModal').classList.add('show'));
    document.getElementById('srcOk').onclick = () => document.getElementById('srcModal').classList.remove('show');
    document.getElementById('srcModal').addEventListener('click', e => {
      if(e.target.id === 'srcModal') e.currentTarget.classList.remove('show');
    });
  }

  /* 说明 / 关于 */
  const openDoc = id => {
    const el = document.getElementById(id);
    if(el){ el.classList.add('show'); el.querySelector('.doc-body').scrollTop = 0; }
  };
  const closeDoc = id => { const el = document.getElementById(id); if(el) el.classList.remove('show'); };
  document.getElementById('btnHelp').addEventListener('click', () => openDoc('helpModal'));
  document.getElementById('btnColophon').addEventListener('click', () => openDoc('colophonModal'));
  document.getElementById('helpOk').onclick = () => closeDoc('helpModal');
  document.getElementById('colophonOk').onclick = () => closeDoc('colophonModal');
  ['helpModal','colophonModal'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      if(e.target.id === id) e.currentTarget.classList.remove('show');
    });
  });

  document.getElementById('btnPad').addEventListener('click', () => {
    document.getElementById('padModal').classList.add('show');
  });
  document.getElementById('padOk').onclick = () => document.getElementById('padModal').classList.remove('show');
  document.getElementById('padModal').addEventListener('click', e => {
    if(e.target.id === 'padModal') e.currentTarget.classList.remove('show');
  });

  /* 键盘导航（手柄仅作按键说明，不读取真实手柄输入） */
  if(typeof initGamepad === 'function'){ initGamepad(); }
  if(typeof watchFocus === 'function'){ watchFocus(); }
  if(typeof markFocusables === 'function'){ markFocusables(); }
}

/* 跳到下一个未收集项 */
function jumpNext(){
  const pool = PIN_INDEX.filter(p => !state.done.has(p.id) && state.catOn[p.cat] !== false);
  if(!pool.length){ toast('当前筛选下已全部收集'); return; }
  const cur = state.sel ? pool.findIndex(p => p.id === state.sel) : -1;
  const next = pool[(cur + 1) % pool.length];
  selectPin(next.id, true);
  centerOn(next.x, next.y, Math.max(view.scale, 1.1));
}

document.addEventListener('DOMContentLoaded', boot);
