/* assets/map.js — 地图视图、点位渲染 */
const view = { scale: 0.62, x: 0, y: 0, min: 0.30, max: 2.6 };

function applyTransform(){
  if(!stage) return;
  stage.style.transform = `translate3d(${view.x}px,${view.y}px,0) scale(${view.scale})`;
  const s = Math.round(Math.min(1.4, Math.max(0.6, 1 / view.scale)) * 1000) / 1000;
  document.querySelectorAll('.pin').forEach(el => el.style.setProperty('--s', s));
  // 缩小时适度弱化文字，避免压住点位
  const lab = document.getElementById('labels');
  if(lab) lab.style.opacity = view.scale < 0.55 ? 0.55 : 1;
  const zl = document.getElementById('zoomlabel');
  if(zl) zl.textContent = Math.round(view.scale * 100) + '%';
}

function fitView(pad){
  pad = pad || 0;
  const w = viewport.clientWidth, h = viewport.clientHeight;
  const portrait = h > w * 1.05;
  // 地图有效内容区域（岛屿集中在这里，底部留了连接图例）
  // 实测全部岛屿范围：x 176–1783，y 72–1270（留 40px 余量）
  const BX = 140, BY = 40, BW = 1680, BH = 1270;
  if(portrait){
    // 竖屏：暂不做专门适配，沿用最朴素的贴合逻辑
    view.scale = Math.max(view.min, Math.min(view.max, (w / BW) * (1 - pad)));
    view.x = (w - BW * view.scale) / 2 - BX * view.scale;
    view.y = (h - BH * view.scale) / 2 - BY * view.scale;
  } else {
    const k = Math.min(w / (BW + 90), h / (BH + 70)) * (1 - pad);
    view.scale = Math.max(view.min, Math.min(view.max, k));
    view.x = (w - BW * view.scale) / 2 - BX * view.scale;
    view.y = (h - BH * view.scale) / 2 - BY * view.scale;
  }
  applyTransform();
}

function centerOn(x, y, scale){
  const w = viewport.clientWidth, h = viewport.clientHeight;
  if(scale) view.scale = Math.max(view.min, Math.min(view.max, scale));
  view.x = w / 2 - x * view.scale;
  view.y = h / 2 - y * view.scale;
  clampPan();
  applyTransform();
}

function zoomAt(cx, cy, factor){
  const ns = Math.max(view.min, Math.min(view.max, view.scale * factor));
  const k = ns / view.scale;
  view.x = cx - (cx - view.x) * k;
  view.y = cy - (cy - view.y) * k;
  view.scale = ns;
  applyTransform();
}

/* 地图有效内容范围（与 fitView 保持一致） */
const CONTENT = { x1: 140, y1: 40, w: 1680, h: 1270 };

function clampPan(){
  const w = viewport.clientWidth, h = viewport.clientHeight;
  // 用真实内容范围而不是整张 2000×1400 画布
  const mw = CONTENT.w * view.scale, mh = CONTENT.h * view.scale;
  const padX = Math.max(50, w * 0.14), padY = Math.max(50, h * 0.14);
  const slackX = mw <= w ? (w - mw) / 2 + 40 : 0;
  const slackY = mh <= h ? (h - mh) / 2 + 40 : 0;
  if(mw <= w) view.x = Math.min((w - mw) / 2 + slackX, Math.max((w - mw) / 2 - slackX, view.x));
  else view.x = Math.min(padX, Math.max(w - mw - padX, view.x));
  if(mh <= h) view.y = Math.min((h - mh) / 2 + slackY, Math.max((h - mh) / 2 - slackY, view.y));
  else view.y = Math.min(padY, Math.max(h - mh - padY, view.y));
}

/* 大地图不再绘制收集物点位：改为每个区域的统计徽标 */
function renderPins(){
  if(pinsLayer) pinsLayer.innerHTML = '';
  if(typeof refreshRegionBadges === 'function') refreshRegionBadges();
}

function refreshPinStates(){
  if(typeof refreshRegionBadges === 'function') refreshRegionBadges();
  document.querySelectorAll('.pin').forEach(el => {
    const id = el.dataset.id, cat = el.dataset.cat;
    el.classList.toggle('done', state.done.has(id));
    el.classList.toggle('dim', state.catOn[cat] === false);
    el.classList.toggle('sel', state.sel === id);
  });
}
