/* =========================================================
   assets/zonemap.js — 区域细部示意图渲染 + 缩放交互
   ========================================================= */

const ZV = { scale: 1, x: 0, y: 0, min: 0.7, max: 3, dragging:false };
const ZVW = 1000, ZVH = 430, ZVY = 285;   // 与 SVG viewBox 一致
const ZFIT_MAX = 2.1;
let ZCUR = { key: null, floor: 0 };

const ZPAL = {
  plain:  { f:'#27343f', s:'#7fa8bf', t:'#cfe0ea' },
  blue:   { f:'#223647', s:'#6fb6e8', t:'#d8ecfa' },
  crypt:  { f:'#33302b', s:'#c9b58e', t:'#f2e8d2' },
  flesh:  { f:'#3a2730', s:'#d98da4', t:'#f8dde5' },
  garden: { f:'#2b3629', s:'#a4c995', t:'#e4f2dc' },
  red:    { f:'#3b252a', s:'#e0798f', t:'#ffdde3' },
  water:  { f:'#1d3743', s:'#6fb0c9', t:'#d9eff7' },
  castle: { f:'#2d2429', s:'#d79aa9', t:'#fbe7ec' },
  dark:   { f:'#262232', s:'#bda9f0', t:'#ebe4ff' }
};

function zesc(s){ return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }

function zwrap(text, maxChars){
  if(!text) return [];
  const lines = [];
  let cur = '';
  for(const ch of text){
    cur += ch;
    if(cur.length >= maxChars){ lines.push(cur); cur = ''; }
  }
  if(cur) lines.push(cur);
  return lines;
}

function zlabel(cx, cy, text, color, maxChars){
  const lines = zwrap(text, maxChars || 9);
  const fs = lines.length > 1 ? 11.5 : 13;
  const step = fs + 2;
  const y0 = cy - (lines.length - 1) * step / 2 + 4;
  return `<text x="${cx}" y="${y0}" text-anchor="middle" style="font-family:'Songti SC','Microsoft YaHei',sans-serif;font-size:${fs}px;fill:${color};letter-spacing:.6px;opacity:.95;paint-order:stroke" stroke="#0b1219" stroke-width="3.4" stroke-opacity=".85">${
    lines.map((l, i) => `<tspan x="${cx}" dy="${i === 0 ? 0 : step}">${zesc(l)}</tspan>`).join('')
  }</text>`;
}

/* 标记点上方绘制，带底底盘避免与房间文字打架 */
function zstairs(s){
  const x = s[0], y = s[1], dir = s[2];
  let st = '';
  for(let i = 0; i < 5; i++){
    st += `<path d="M${x + 7} ${y + 6 + i * 5} h20" stroke="#e8c26a" stroke-width="1.2" stroke-opacity="${(0.26 + i * 0.14).toFixed(2)}"/>`;
  }
  return `<g>
    <rect x="${x}" y="${y}" width="34" height="34" rx="3" fill="#0e1720" fill-opacity=".85" stroke="#e8c26a" stroke-width="1.3" stroke-opacity=".66"/>
    ${st}
    <path d="M${x+17} ${dir==='u'?y+7:y+27} l-4 ${dir==='u'?5:-5} M${x+17} ${dir==='u'?y+7:y+27} l4 ${dir==='u'?5:-5}" stroke="#e8c26a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    ${s[3] ? `<text x="${x+17}" y="${y+46}" text-anchor="middle" style="font-family:'Songti SC',sans-serif;font-size:9.5px;fill:#e8c26a;opacity:.8;paint-order:stroke" stroke="#0a1017" stroke-width="2.8" stroke-opacity=".86">${zesc(s[3])}</text>` : ''}
  </g>`;
}

/* ---------- 收集物布点 ---------- */
/* 每层实际包含哪些点位：按区域 + 关键词匹配楼层关键词表 */
const FLOOR_PIN_FILTER = {
  tower: [
    /地下室|蜡烛|行刑|活板门|布达恩|血库|风之刺剑|紫罗兰|遗骨|书虫|书架阵/,
    /阳台|石像鬼|中庭|悬空|封印门|回廊|蝠妖|四平台|窗外|沃尔哈|知识守护者/,
    /螺旋|壁龛|风暴|档案馆|死灵|拉杆|铁星蜥/,
    /遗忘地牢|锡佩哈|红门|回廊|监牢/
  ],
  mausoleum: [
    /厨房|面具|安息室|佩哈|远征|屋顶|风之宝石|努|石柱|桥拱|拱门|窗外/,
    /符文|红水|石棺|蛛网|拱顶|黑暗墓区|烛台|高岩|绿光|首领之门|镜片|隐墙|通风|竖井/,
    /祭坛|符号墙|引魂者|苍蓝火焰|遗物|洞穴/
  ],
  castle: [
    /圣杯|权杖|餐厅|吧台|角斗|寝宫|垃圾房|血池|红管|祭坛|宝箱|储物/,
    /女王|魂之|屋顶|高塔|密室|自动机兵|门厅/
  ],
  ancient: [
    /瞭望|跳岛|机兵|欧西|能量塔|洞穴|传送小屋|实验室|风之祭坛|空心树|小岛|缆线|传送带|风晶/,
    /罪之记录|乔萨米|大桥|缺口|篝火|城堡屋顶|城堡门厅/
  ],
  isle: [
    /海岸|栅栏|塔楼|海滩|岛链|尖塔|森林眼|蓝火把|开关|隐藏|风剑|金字塔|商人|古币|魔典|神殿守卫|枯树|帕多拉/,
    /墓地|墓穴|木棒|锈矛|恩杜|白树|井|维尔维特|大晨星/,
    /断裂之桥|桥拱|塔前庭|阿甘米|船长|拟态/
  ],
  obmuer: [
    /断桥|三叉戟|石板|殿门|鱼人/,
    /钥匙|中厅|风之宝石|圣池|王室|达古姆|海王|长戟|长枪/,
    /埃尔玛|洞窟|烽火|祭坛|加吉|卵/
  ],
  verdant: [
    /林间|中段|捷径|数据模块|晶片神殿|血祭|血天使|乔萨米|窗户/,
    /普韦玛|八封印|守门|祭坛|真圣剑/
  ],
  garden: [
    /降落|石屋|兽像|谜题|幻影|小岛|欧贾玛|三叉戟|水晶碑/,
    /骷髅|鱼像|大门|封印/
  ]
};

/* 每层点位：关键词命中 + 未命中的点位轮转补齐（保证区域所有点位都能被看到） */
function pickFloorPins(key, floorIdx){
  const areas = Object.keys(AREA_TO_ZONE).filter(a => AREA_TO_ZONE[a] === key);
  const all = PIN_INDEX.filter(p => areas.indexOf(p.area) >= 0);
  const z = ZONES[key];
  const nf = z ? z.floors.length : 1;
  if(nf <= 1) return all;
  const filters = FLOOR_PIN_FILTER[key];
  if(!filters) return all;

  // 先算归属层
  const owner = {};
  all.forEach(p => {
    const o = filters.findIndex(rx => rx && rx.test(p.name + ' ' + p.area));
    owner[p.id] = o;
  });
  const orphans = all.filter(p => owner[p.id] < 0);

  // 本层：关键词命中 + 分配给本层的孤儿
  const mine = all.filter(p => owner[p.id] === floorIdx);
  orphans.forEach((p, i) => { if((i + floorIdx) % nf === 0) mine.push(p); });
  return mine;
}

const CAT_GLYPH = {
  skull:'骷', egg:'卵', duck:'鸭', lens:'镜', gem:'晶',
  beacon:'碑', boss:'王', npc:'人', key:'钥', book:'书',
  memento:'魂', cell:'电', vault:'库', charm:'罗'
};

function collectDotsSVG(key, floorIdx, f){
  const pins = pickFloorPins(key, floorIdx);
  if(!pins.length) return '';
  const rooms = (f.rooms || []).filter(r => r[2] >= 90 && r[3] >= 70);
  if(!rooms.length) return '';

  let o = '';
  const buckets = rooms.map(() => []);
  pins.forEach((p, i) => buckets[i % buckets.length].push(p));

  buckets.forEach((list, ri) => {
    const room = rooms[ri];
    if(!list.length) return;
    const pad = 16;
    const cols = Math.max(1, Math.min(4, Math.floor((room[2] - pad * 2) / 24)));
    const rows = Math.ceil(list.length / cols);
    const cw = (room[2] - pad * 2) / cols;
    const ch = Math.min(24, Math.max(19, (room[3] - pad * 2 - 16) / rows));
    const x0 = room[0] + pad + cw / 2;
    const y0 = room[1] + pad + 6;
    list.forEach((p, i) => {
      const cx = x0 + (i % cols) * cw;
      const cy = y0 + Math.floor(i / cols) * ch;
      const done = state.done.has(p.id);
      const col = catMeta(p.cat).color;
      const ic = CAT_GLYPH[p.cat] || '●';
      o += `<g class="cdot" data-cid="${p.id}">
        <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="10.5" fill="#0a1017" fill-opacity=".95"/>
        <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="9" fill="${col}" fill-opacity="${done ? 0.14 : 0.92}"
          stroke="${col}" stroke-width="${done ? 1.6 : 0.8}" stroke-opacity=".9"/>
        <text x="${cx.toFixed(1)}" y="${(cy + 4).toFixed(1)}" text-anchor="middle"
          style="font-family:'Songti SC',serif;font-size:11px;fill:${done ? col : '#0a1017'};font-weight:700;pointer-events:none">${ic}</text>
        <title>${zesc(p.name)}${done ? ' · 已收集' : ''}</title>
      </g>`;
    });
  });
  return o;
}

function zmarkSVG(m){
  // 编号显示在房间块的左上角，避免压住房间名
  return `<g>
    <circle cx="${m[0]}" cy="${m[1]}" r="9.5" fill="#0c141b" fill-opacity=".92"/>
    <circle cx="${m[0]}" cy="${m[1]}" r="8.2" fill="${m[3]}" fill-opacity=".26" stroke="${m[3]}" stroke-width="1.3"/>
    <text x="${m[0]}" y="${m[1]+3.8}" text-anchor="middle" style="font-family:Georgia,serif;font-size:10px;fill:${m[3]}">${zesc(m[2])}</text>
  </g>`;
}

/* ---- 生成某区域的 SVG ---- */
function buildZoneSVG(key, floorIdx){
  const z = ZONES[key];
  if(!z) return '';
  const f = z.floors[floorIdx] || z.floors[0];
  const W = ZVW, H = 720;
  const VY = ZVY, VH = ZVH;
  let o = `<svg viewBox="0 ${VY} ${W} ${VH}" width="${W}" height="${H}" style="position:absolute;top:0;left:0;width:${W}px;height:${H}px">`;
  o += `<defs>
    <pattern id="zpaper" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M0 0H40M0 0V40" stroke="#7fa8bf" stroke-opacity=".045" stroke-width="1"/>
    </pattern>
    <pattern id="ztile" width="12" height="12" patternUnits="userSpaceOnUse">
      <path d="M0 0H12M0 0V12" stroke="#ffffff" stroke-opacity=".02" stroke-width="1"/>
    </pattern>
    <filter id="zsh" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
    <radialGradient id="zvig" cx="50%" cy="50%" r="72%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".5"/>
    </radialGradient>
  </defs>`;
  o += `<rect x="0" y="${VY}" width="${W}" height="${VH}" fill="#0a1017"/>`;
  o += `<rect x="0" y="${VY}" width="${W}" height="${VH}" fill="url(#zpaper)"/>`;

  // 走廊（先画，房间压在上面）
  (f.halls || []).forEach(h => {
    if(!h[2] || !h[3]) return;
    o += `<rect x="${h[0]}" y="${h[1]}" width="${h[2]}" height="${h[3]}" rx="3" fill="#151f28" stroke="#3f5a6b" stroke-width="1.2" stroke-opacity=".72"/>`;
  });

  // 房间
  (f.rooms || []).forEach(r => {
    const p = ZPAL[r[5]] || ZPAL.plain;
    const labelMax = Math.max(4, Math.floor((r[2] - 14) / 11.5));
    o += `<g>
      <rect x="${r[0]+3}" y="${r[1]+6}" width="${r[2]}" height="${r[3]}" rx="7" fill="#000" opacity=".45" filter="url(#zsh)"/>
      <rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" rx="7" fill="${p.f}"/>
      <rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" rx="7" fill="url(#ztile)"/>
      <rect x="${r[0]+.6}" y="${r[1]+.6}" width="${r[2]-1.2}" height="${r[3]-1.2}" rx="6.5" fill="none" stroke="${p.s}" stroke-width="1.5" stroke-opacity=".66"/>
      <rect x="${r[0]+4}" y="${r[1]+4}" width="${r[2]-8}" height="${r[3]-8}" rx="4" fill="none" stroke="${p.s}" stroke-width=".8" stroke-opacity=".16"/>
      ${zlabel(r[0]+r[2]/2, r[1]+r[3]/2 + (r[2] > 140 ? 9 : 4), r[4], p.t, labelMax)}
    </g>`;
  });

  // 楼梯
  (f.stairs || []).forEach(s => { o += zstairs(s); });

  // 门 / 通道
  (f.link || []).forEach(l => {
    const vert = l[2] === 'v';
    const tx = vert ? l[0] + 13 : l[0];
    const ty = vert ? l[1] + 4 : l[1] - 15;
    o += `<g><rect x="${l[0]-13}" y="${l[1]-3.5}" width="26" height="7" rx="2" fill="#e8c26a" fill-opacity=".72" stroke="#f6dfa8" stroke-width=".8" transform="rotate(${vert?90:0} ${l[0]} ${l[1]})"/>
      <text x="${tx}" y="${ty}" text-anchor="${vert?'start':'middle'}" style="font-family:'Songti SC','Microsoft YaHei',sans-serif;font-size:11px;fill:#f4dfa9;opacity:.92;paint-order:stroke" stroke="#0b1219" stroke-width="3.4" stroke-opacity=".9">${zesc(l[3]||'')}</text></g>`;
  });

  // 升降梯 / 竖井
  (f.lift || []).forEach(l => {
    o += `<g><circle cx="${l[0]}" cy="${l[1]}" r="14" fill="#0e1a16" fill-opacity=".88" stroke="#8fb383" stroke-width="1.3" stroke-dasharray="3.5 3.5" stroke-opacity=".85"/>
      <path d="M${l[0]-6} ${l[1]} h12 M${l[0]-6} ${l[1]-5} v10 M${l[0]+6} ${l[1]-5} v10" stroke="#8fb383" stroke-width="1.5" fill="none"/>
      <text x="${l[0]-22}" y="${l[1]+4}" text-anchor="end" style="font-family:'Songti SC','Microsoft YaHei',sans-serif;font-size:10.5px;fill:#a9c79a;opacity:.88;paint-order:stroke" stroke="#0b1219" stroke-width="3" stroke-opacity=".85">${zesc(l[2]||'')}</text></g>`;
  });

  // 编号标记（放在最上层，带底盘）
  const marks = f.marks || [];
  marks.forEach(m => { o += zmarkSVG(m); });

  // 收集物点位
  o += collectDotsSVG(key, floorIdx, f);

  // 暗角：用 style 而非 attribute 设置 pointer-events，避免不同引擎忽略属性
  o += `<rect x="0" y="${VY}" width="${W}" height="${VH}" fill="url(#zvig)" style="pointer-events:none"/>`;
  o += `<text x="${W-16}" y="${VY+VH-12}" text-anchor="end" style="font-family:'Inter',system-ui,sans-serif;font-size:10px;fill:#51677a;letter-spacing:1.1px;opacity:.62;pointer-events:none">${zesc(f.label)} · 示意结构，非游戏内实景比例</text>`;
  o += '</svg>';
  return o;
}

/* ---- 打开区域 ---- */
function openZone(key, floorIdx){
  const z = ZONES[key];
  if(!z) return;
  ZCUR.key = key;
  ZCUR.floor = Math.min(floorIdx || 0, z.floors.length - 1);
  const m = document.getElementById('zoneModal');
  m.classList.add('show');
  document.getElementById('zTitle').textContent = z.name;
  document.getElementById('zSub').textContent = z.sub;
  document.getElementById('zNote').textContent = z.note || '';

  // 楼层标签
  const ft = document.getElementById('zFloors');
  ft.innerHTML = z.floors.map((f, i) =>
    `<button class="zfloor ${i===ZCUR.floor?'on':''}" data-zf="${i}">${zesc(f.label)}</button>`).join('');
  ft.querySelectorAll('[data-zf]').forEach(b => b.onclick = () => {
    ZCUR.floor = +b.dataset.zf; refreshZone();
  });

  refreshZone();
  renderZoneRelated();
  requestAnimationFrame(() => setTimeout(() => { zfit(); if(typeof markFocusables === 'function') markFocusables(); }, 60));
}

/* ---------- 收集物浮层 ---------- */
let ZPOP_ID = null;
function hideDotPop(){
  const el = document.getElementById('zPop');
  if(el){ el.classList.remove('show'); el.innerHTML = ''; }
  ZPOP_ID = null;
}

function showDotPop(id, gEl){
  const p = PIN_INDEX.find(x => x.id === id);
  if(!p) return;
  const pop = document.getElementById('zPop');
  const vp = document.getElementById('zViewport');
  if(!pop || !vp) return;
  ZPOP_ID = id;
  const meta = catMeta(p.cat);
  const dn = state.done.has(id);

  pop.innerHTML = `
    <button class="zp-x" data-zpx>×</button>
    <div class="zp-cat"><i style="background:${meta.color}"></i>${zesc(meta.name)} · ${zesc(p.area)}</div>
    <div class="zp-name">${zesc(p.name)}</div>
    ${p.req ? `<div class="zp-row"><b>需求</b><span>${zesc(p.req)}</span></div>` : ''}
    ${p.ach ? `<div class="zp-row"><b>成就</b><span>${zesc(p.ach)}</span></div>` : ''}
    ${p.note ? `<div class="zp-note">${zesc(p.note)}</div>` : ''}
    <div class="zp-act">
      <button class="${dn ? 'on' : ''}" data-zptog>${dn ? '✓ 已收集' : '标记为已收集'}</button>
      <button class="jump" data-zpjump>详情</button>
    </div>`;
  pop.classList.add('show');

  // 定位：固定停靠在视口右上角，避开地图内容；同时给被点的圆点加高亮
  const vb = vp.getBoundingClientRect();
  const pw = pop.offsetWidth, ph = pop.offsetHeight;
  const ctrlW = 44;   // 右上角放大缩小按钮占位
  let left = vb.width - pw - 14;
  let top = 12;
  if(vb.width < 520 || pw > vb.width * 0.5){   // 窄屏改为底部通栏
    left = 10;
    top = vb.height - ph - 10;
    pop.style.width = (vb.width - 20) + 'px';
  } else {
    pop.style.width = '252px';
  }
  pop.style.left = Math.max(8, left) + 'px';
  pop.style.top = Math.max(8, Math.min(vb.height - ph - 8, top)) + 'px';

  // 高亮当前圆点
  document.querySelectorAll('#zStage .cdot.active').forEach(e => e.classList.remove('active'));
  gEl.classList.add('active');

  pop.querySelector('[data-zpx]').onclick = ev => { ev.stopPropagation(); hideDotPop(); };
  pop.querySelector('[data-zptog]').onclick = ev => {
    ev.stopPropagation();
    togglePin(id);
    // 只更新当前圆点与浮层按钮，避免重建 SVG 把浮层一起销毁
    const nowDone = state.done.has(id);
    const btn = pop.querySelector('[data-zptog]');
    if(btn){
      btn.classList.toggle('on', nowDone);
      btn.textContent = nowDone ? '✓ 已收集' : '标记为已收集';
    }
    gEl.classList.toggle('is-done', nowDone);
    gEl.querySelectorAll('circle').forEach((c, i) => {
      if(i === 0) return;
      c.setAttribute('fill-opacity', nowDone ? 0.14 : 0.92);
      c.setAttribute('stroke-width', nowDone ? 1.6 : 0.8);
    });
    const tx = gEl.querySelector('text');
    if(tx) tx.setAttribute('fill', nowDone ? meta.color : '#0a1017');
    // 同步右侧本区清单
    if(typeof renderZoneRelated === 'function') renderZoneRelated();
  };
  pop.querySelector('[data-zpjump]').onclick = ev => {
    ev.stopPropagation();
    hideDotPop();
    selectPin(id, true);
  };
}

function refreshZone(){
  const z = ZONES[ZCUR.key];
  const f = z.floors[ZCUR.floor];
  document.querySelectorAll('#zFloors .zfloor').forEach(b => b.classList.toggle('on', +b.dataset.zf === ZCUR.floor));
  const stEl = document.getElementById('zStage');
  stEl.innerHTML = buildZoneSVG(ZCUR.key, ZCUR.floor);
  stEl.querySelectorAll('.cdot').forEach(g => {
    // 同时挂 click 与 pointerup：部分移动端点按不会派发 click 到 SVG 内层
    const fire = e => {
      if(e && e.cancelable) e.stopPropagation();
      const id = g.dataset.cid;
      if(id) showDotPop(id, g);
    };
    g.addEventListener('click', fire);
    g.addEventListener('pointerup', e => {
      if(e.pointerType === 'touch' || e.pointerType === 'pen') fire(e);
    });
  });
  // 空白处点击关闭浮层（放在圆点监听之后绑定，保证冒泡顺序正确）
  stEl.addEventListener('click', e => {
    if(e.target.closest && e.target.closest('.cdot')) return;
    hideDotPop();
  });
  hideDotPop();
  // 本层标记说明（带释义）
  const marks = f.marks || [];
  const LEG = {
    '1':'点位 1','2':'点位 2','3':'点位 3','4':'点位 4','5':'点位 5','6':'点位 6','7':'点位 7','8':'点位 8','9':'点位 9',
    'A':'区域出入口','B':'首领','S':'存档点','P':'佩哈 / 雕像','M':'面具 / 宝箱','G':'加吉厨房 / 烽火','N':'努','L':'镜片 / 拉杆','R':'屋顶 / 遗迹',
    'K':'钥匙 / 宝箱','C':'水晶碑 / 大厨','T':'传送 / 石台','H':'高塔 / 隐藏墙','Q':'女王','I':'商人岛 / 商店','E':'任务 NPC','F':'火焰 / 祭坛','D':'Boss 房',
    'V':'宝库 / 魔典','W':'风之刺剑暗门','r':'鱼人像红宝石','G2':'第三烽火','Sf':'锡佩哈雕像','↑':'逆序入口','↓':'坠落洞口','→':'出口','69':'银骷髅大门'
  };
  const dotInfo = document.createElement('span');
  dotInfo.className = 'zlegend-note';
  dotInfo.textContent = '彩色圆点 = 本层收集物（点击查看）';
  document.getElementById('zMarks').innerHTML = (marks.length
    ? marks.map(m => `<span class="zmark"><i style="background:${m[3]}"></i>${zesc(m[2])}<em>${zesc(LEG[m[2]] || '标记')}</em></span>`).join('')
    : '') + '<span class="zlegend-note">● 彩色圆点 = 本层收集物，点击查看；空心 = 已收集</span>';
}

/* ---- 本区域点位清单 ---- */
function renderZoneRelated(){
  const key = ZCUR.key;
  const areaNames = Object.keys(AREA_TO_ZONE).filter(a => AREA_TO_ZONE[a] === key);
  const list = PIN_INDEX.filter(p => areaNames.indexOf(p.area) >= 0);
  const box = document.getElementById('zList');
  const done = list.filter(p => state.done.has(p.id)).length;

  if(!list.length){ box.innerHTML = '<div class="zempty">该区域暂无可收集条目</div>'; return; }

  const byCat = {};
  list.forEach(p => { (byCat[p.cat] = byCat[p.cat] || []).push(p); });

  box.innerHTML = `<div class="zlisthead"><span>本区点位</span><b>${done}/${list.length}</b></div>` +
    Object.keys(byCat).map(cid => {
      const cm = catMeta(cid);
      return `<div class="zgrp"><div class="zgtitle"><i style="background:${cm.color}"></i>${cm.name}<em>${byCat[cid].filter(p=>state.done.has(p.id)).length}/${byCat[cid].length}</em></div>` +
        byCat[cid].map(p => `<button class="zitem ${state.done.has(p.id)?'done':''}" data-zpin="${cssEsc(p.id)}">
          <span class="zdot" style="background:${cm.color}"></span>
          <span class="zname">${escapeHtml(p.name)}</span>
          <span class="zchk">${ICONS.check}</span>
        </button>`).join('') + '</div>';
    }).join('');

  box.querySelectorAll('[data-zpin]').forEach(b => b.onclick = e => {
    if(e.target.closest('.zchk')) return;
    const id = b.dataset.zpin;
    closeZone();
    selectPin(id, true);
    const p = PIN_INDEX.find(x => x.id === id);
    if(p) centerOn(p.x, p.y, Math.max(view.scale, 1.15));
  });
  box.querySelectorAll('.zchk').forEach(c => c.onclick = e => {
    e.stopPropagation();
    const id = c.closest('[data-zpin]').dataset.zpin;
    togglePin(id);
    const keep = ZCUR.key, kf = ZCUR.floor;
    renderZoneRelated();
    ZCUR.key = keep; ZCUR.floor = kf;
  });
}

function closeZone(){
  document.getElementById('zoneModal').classList.remove('show');
}

/* ---- 缩放 ---- */
function applyZoneTransform(){
  const st = document.getElementById('zStage');
  if(st) st.style.transform = `translate3d(${ZV.x}px,${ZV.y}px,0) scale(${ZV.scale})`;
}

/* 拖拽边界：内容不能完全拖出视口 */
function clampZonePan(){
  const vp = document.getElementById('zViewport');
  if(!vp) return;
  const sw = ZVW * ZV.scale, sh = 720 * ZV.scale;
  const keep = Math.min(vp.clientWidth * 0.3, sw * 0.5);
  if(sw <= vp.clientWidth){
    ZV.x = Math.max(0, Math.min(vp.clientWidth - sw, ZV.x));
  } else {
    ZV.x = Math.max(vp.clientWidth - sw - keep * 0.2, Math.min(keep, ZV.x));
  }
  if(sh <= vp.clientHeight){
    ZV.y = Math.max(0, Math.min(vp.clientHeight - sh, ZV.y));
  } else {
    ZV.y = Math.max(vp.clientHeight - sh - 40, Math.min(40, ZV.y));
  }
}

function zfit(){
  const vp = document.getElementById('zViewport');
  if(!vp || !vp.clientWidth) return;
  const k = Math.min(vp.clientWidth / ZVW, vp.clientHeight / ZVH) * 0.97;
  ZV.scale = Math.min(k, ZFIT_MAX);

  // 以「内容包围盒」为中心做适配：内容多集中在中部，若按整块画布居中会留大量空带
  const b = (typeof zoneContentBox === 'function') ? zoneContentBox(ZCUR.key, ZCUR.floor) : null;
  const box = b
    ? { x: b[0] - 24, y: b[1] - ZVY - 26, w: b[2] + 48, h: b[3] + 52 }
    : { x: 0, y: 0, w: ZVW, h: ZVH };

  const ky = Math.min(vp.clientHeight / Math.max(1, box.h) * 0.9, vp.clientWidth / Math.max(1, box.w) * 0.98);
  // 小屏允许横向溢出并靠拖动查看，避免缩成看不清的一团
  const minS = 0.62;
  ZV.scale = Math.max(minS, Math.min(ky, 2.4));

  const cw = box.w * ZV.scale, chh = box.h * ZV.scale;
  // 内容比视口宽时，左对齐到内容起点（可从左边开始拖）
  ZV.x = cw <= vp.clientWidth
    ? (vp.clientWidth - cw) / 2 - box.x * ZV.scale
    : 10 - box.x * ZV.scale;
  ZV.y = (vp.clientHeight - chh) / 2 - box.y * ZV.scale;

  // 硬边界：舞台顶部不得低于视口顶部过多，底部不得高于视口底部过多
  const maxX = 80, maxY = 60;
  ZV.x = Math.min(maxX, Math.max(vp.clientWidth - ZVW * ZV.scale - maxX, ZV.x));
  ZV.y = Math.min(maxY, Math.max(vp.clientHeight - 720 * ZV.scale - maxY, ZV.y));
  applyZoneTransform();
}

/* 本层所有房间的外包围盒 [x,y,w,h]（用户坐标） */
function zoneContentBox(key, floorIdx){
  const z = ZONES[key];
  if(!z) return null;
  const f = z.floors[floorIdx] || z.floors[0];
  const rs = f.rooms || [];
  if(!rs.length) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  rs.forEach(r => {
    x0 = Math.min(x0, r[0]); y0 = Math.min(y0, r[1]);
    x1 = Math.max(x1, r[0] + r[2]); y1 = Math.max(y1, r[1] + r[3]);
  });
  return [x0, y0, x1 - x0, y1 - y0];
}

function zzoom(f){
  const vp = document.getElementById('zViewport');
  const cx = vp.clientWidth / 2, cy = vp.clientHeight / 2;
  const ns = Math.max(ZV.min, Math.min(ZV.max, ZV.scale * f));
  const k = ns / ZV.scale;
  ZV.x = cx - (cx - ZV.x) * k;
  ZV.y = cy - (cy - ZV.y) * k;
  ZV.scale = ns;
  applyZoneTransform();
}
