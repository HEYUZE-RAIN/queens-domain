/* =========================================================
   assets/mapdraw.js — 大地图绘制（区域轮廓 / 连接 / 地标 / 统计）
   设计原则：
   1. 地图只表达「区域」层面：轮廓、连通、地标
   2. 收集物不画在地图上，改为每个区域的统计徽标
   3. 连接线区分陆路 / 冲刺 / 升降 / 门锁 / 隐藏
   ========================================================= */

/* ---------- 连接线样式 ---------- */
const LINK_STYLE = {
  path:   { col:'#b9c8b0', w:2.2, dash:'',        op:.5,  name:'陆路 / 桥' },
  dash:   { col:'#7fd0e8', w:2.2, dash:'7 6',     op:.72, name:'风之冲刺跨越' },
  lift:   { col:'#8fb383', w:2.2, dash:'2 5',     op:.7,  name:'升降 / 传送' },
  gate:   { col:'#e8c26a', w:2.2, dash:'11 5',    op:.8,  name:'需要钥匙 / 破除器' },
  secret: { col:'#b6a3f2', w:2.0, dash:'3 6',     op:.72, name:'隐藏入口 / 破序' }
};

/* ---------- 精确求「线段与岛屿多边形的交点」 ---------- */
/* 有些区域是「岛上的一个地点」而不是独立岛屿，指定它所属的岛 */
/* 「岛上的地点」不是独立岛屿，给它一个岛内的小区域作为轮廓，
   避免多个区域共用同一多边形造成完全重叠 */
const __POLY_CACHE = {};
function polyOf(r){
  if(!r) return null;
  if(__POLY_CACHE[r.lab] !== undefined) return __POLY_CACHE[r.lab];
  // 区域名与岛屿名不一致的别名
  const NAME_ALIAS = { '乌姆巴达贸易站':'商人岛' };
  const wantLab = NAME_ALIAS[r.lab] || r.lab;
  const is = ISLANDS.find(x => x.lab === wantLab);
  __POLY_CACHE[r.lab] = is ? is.p : null;
  return __POLY_CACHE[r.lab];
}

/* 判断点是否在多边形内（射线法） */
function inPoly(pt, poly){
  let x = pt[0], y = pt[1], inside = false;
  for(let i = 0, j = poly.length - 1; i < poly.length; j = i++){
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if(((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

/* 内缩量：放置时留余量，渲染/校验用同一值 */
const LABEL_PAD = 4;
const LABEL_PAD_RENDER = 1;

/* =========================================================
   标签几何判定 —— 全项目唯一实现
   ---------------------------------------------------------
   放置算法、最终复核、渲染判定、校验脚本 四处都调用这里。
   ⚠ 改判定标准只改这一个函数，不要在各处复制粘贴。

   rect: { x, y, w, h }  （世界坐标，左上角 + 尺寸）
   pad : 内缩量，把判定框往里收 pad 像素
   ========================================================= */
function labelFitsPoly(rect, poly, pad){
  if(!poly) return true;
  const P = pad == null ? LABEL_PAD : pad;
  const L = rect.x + P, R = rect.x + rect.w - P;
  const T = rect.y + P, B = rect.y + rect.h - P;
  const cx = rect.x + rect.w / 2, M = (T + B) / 2;
  // 四角 + 中心 + 四边中点。
  // 四角是关键：岛屿底部常收窄，只查下边中点会让两个角戳到海面上。
  const pts = [
    [cx, M],
    [L, M], [R, M],
    [cx, T], [cx, B],
    [L, T], [R, T],
    [L, B], [R, B]
  ];
  return pts.every(c => inPoly(c, poly));
}

/* 标签框在渲染时的真实几何（放置与渲染共用，避免两处各算一套） */
function labelRect(A, dx, dy, sc){
  const s2 = sc == null ? 1 : sc;
  const sz = A.sz * s2;
  const wBox = Math.max(A.r.lab.length * sz + 14 * s2, (A.r.en || '').length * sz * 0.27 * 2) + 10 * s2;
  const hBox = A.r.en ? sz + sz * 0.72 + 9 * s2 : sz + 9 * s2;
  const x = A.r.anchor[0] + dx;
  const top = A.r.anchor[1] + dy - sz - 2;
  return { x: x - wBox / 2, y: top, w: wBox, h: hBox, sz: sz, cx: x };
}

function polyCenter(poly){
  return [
    poly.reduce((t, q) => t + q[0], 0) / poly.length,
    poly.reduce((t, q) => t + q[1], 0) / poly.length
  ];
}

/* 线段 a→b 与多边形所有边的交点，按离 a 的距离排序 */
function segPolyHits(a, b, poly){
  const hits = [];
  const dx = b[0] - a[0], dy = b[1] - a[1];
  for(let i = 0, j = poly.length - 1; i < poly.length; j = i++){
    const p1 = poly[j], p2 = poly[i];
    const ex = p2[0] - p1[0], ey = p2[1] - p1[1];
    const den = dx * ey - dy * ex;
    if(Math.abs(den) < 1e-9) continue;
    const t = ((p1[0] - a[0]) * ey - (p1[1] - a[1]) * ex) / den;   // 线段参数
    const u = ((p1[0] - a[0]) * dy - (p1[1] - a[1]) * dx) / den;   // 边参数
    if(t >= 0 && t <= 1 && u >= 0 && u <= 1){
      hits.push({ t, pt:[a[0] + dx * t, a[1] + dy * t] });
    }
  }
  hits.sort((m, n) => m.t - n.t);
  return hits;
}

/* 从区域中心沿方向 dir 射出，取最先/最后穿出多边形的位置
   mode='exit' 起点用（取穿出点），mode='enter' 终点用（取进入点） */
function boundaryPoint(center, target, poly, gap){
  if(!poly) return center;
  const d = [target[0] - center[0], target[1] - center[1]];
  const len = Math.hypot(d[0], d[1]) || 1;
  // 反向延长，保证起点在多边形内部
  const far = [center[0] - d[0] / len * 4000, center[1] - d[1] / len * 4000];
  const hits = segPolyHits(far, target, poly);
  if(!hits.length) return center;
  const last = hits[hits.length - 1].pt;       // 沿 far→target 方向最后穿出点
  const ux = d[0] / len, uy = d[1] / len;
  return [last[0] + ux * gap, last[1] + uy * gap];
}


/* 把「曲线 + 终点」改成「曲线 + 直线进近 + 终点」，保证箭头方向正对目标 */
/* 曲线收尾到 b，再从 b 反向退 APPROACH 像素处拉一条直线到 b，
   这样箭头方向严格等于「b 处进近方向」，不会歪。
   AP = 曲线的起点（用于计算 b 处的进近法线），通常传区域的边界点。 */
function withApproach(a, b, ctrl, from){
  const APPROACH = 30;
  // b 处的进近方向：从「控制点到 b」的方向（即曲线末端的自然走向）
  let dx = b[0] - ctrl[0], dy = b[1] - ctrl[1];
  let L = Math.hypot(dx, dy) || 1;
  dx /= L; dy /= L;
  // 曲线止于 b 前 30px
  const stop = [b[0] - dx * APPROACH, b[1] - dy * APPROACH];
  return `M${a[0].toFixed(1)},${a[1].toFixed(1)}` +
         ` Q${ctrl[0].toFixed(1)},${ctrl[1].toFixed(1)} ${stop[0].toFixed(1)},${stop[1].toFixed(1)}` +
         ` L${b[0].toFixed(1)},${b[1].toFixed(1)}`;
}

/* =========================================================
   连接线：手工控制点 + 曲线插值
   思路：每条连线由「起点 + via 控制点 + 终点」组成，
   用 Catmull-Rom 转三次贝塞尔，末端强制直线进近保证箭头朝向。
   不再做网格寻路（会产生自绕与缠绕）。
   ========================================================= */

/* 求多边形上距离给定方向最近的点：
   从多边形每条边上找「沿 dir 方向射线的穿出点」，取离 a 最近的那个 */
function exitPoint(a, target, poly, gap){
  if(!poly) return [a[0], a[1]];
  const dx = target[0] - a[0], dy = target[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L, uy = dy / L;

  // 先判断 a 是否在岛内。在的话，沿 dir 正向求穿出点；
  // 不在的话（a 已在岛外），直接沿 dir 正向推 gap。
  if(!inPoly(a, poly)) return [a[0] + ux * gap, a[1] + uy * gap];

  const far = [a[0] + ux * 4000, a[1] + uy * 4000];
  const hits = segPolyHits(a, far, poly);
  if(!hits.length) return [a[0] + ux * gap, a[1] + uy * gap];
  const p = hits[0].pt;                       // 第一个穿出点
  return [p[0] + ux * gap, p[1] + uy * gap];
}

/* 判断点是否在某多边形内（容差外扩，用缓冲判断） */
function pointNearPoly(pt, poly, pad){
  if(inPoly(pt, poly)) return true;
  for(let i = 0; i < poly.length; i++){
    const q = poly[i];
    if(Math.hypot(pt[0]-q[0], pt[1]-q[1]) < pad) return true;
  }
  return false;
}

/* 判断线段是否穿过某岛（用于路线自检） */
function segCrossIsland(p, q, skipPolys){
  for(const is of ISLANDS){
    if(skipPolys.indexOf(is.p) >= 0) continue;
    const hits = segPolyHits(p, q, is.p);
    if(hits.length) return is.lab;
  }
  return null;
}

/* =========================================================
   可见图寻路：把所有岛屿顶点外扩后作为节点，
   连线不与任何岛相交即视为「可见」，用 Dijkstra 求最短路。
   相比网格 A* 更精确：不会产生锯齿，也不会自交。
   ========================================================= */
/* =========================================================
   绕岛寻路：海面网格 A* + 靠岸惩罚
   走线稳定、不穿岛，也不产生自我绕圈
   ========================================================= */
const NAV = { step: 14, x0: 200, y0: 60, x1: 1820, y1: 1360 };
let __NAVBLOCKED = null;

function navBlocked(){
  if(__NAVBLOCKED) return __NAVBLOCKED;
  const cols = Math.ceil((NAV.x1 - NAV.x0) / NAV.step);
  const rows = Math.ceil((NAV.y1 - NAV.y0) / NAV.step);
  const grid = new Uint8Array(cols * rows);
  for(let r = 0; r < rows; r++){
    for(let c = 0; c < cols; c++){
      const x = NAV.x0 + c * NAV.step, y = NAV.y0 + r * NAV.step;
      let blocked = 0;
      for(const is of ISLANDS){
        if(inPoly([x, y], is.p)){ blocked = 1; break; }
      }
      grid[r * cols + c] = blocked;
    }
  }
  __NAVBLOCKED = { grid, cols, rows };
  return __NAVBLOCKED;
}

function toCell(pt){ return [Math.round((pt[0] - NAV.x0) / NAV.step), Math.round((pt[1] - NAV.y0) / NAV.step)]; }
function toPt(c){ return [NAV.x0 + c[0] * NAV.step, NAV.y0 + c[1] * NAV.step]; }

function nearestFree(c, nav){
  const { grid, cols, rows } = nav;
  for(let r = 0; r < 16; r++){
    for(let dy = -r; dy <= r; dy++){
      for(let dx = -r; dx <= r; dx++){
        const x = c[0] + dx, y = c[1] + dy;
        if(x < 0 || y < 0 || x >= cols || y >= rows) continue;
        if(!grid[y * cols + x]) return [x, y];
      }
    }
  }
  return null;
}

/* A*（8 邻接，斜向不切角，靠岸加代价） */
function findPath(sPt, ePt){
  const nav = navBlocked();
  const { grid, cols, rows } = nav;
  const S = nearestFree(toCell(sPt), nav), E = nearestFree(toCell(ePt), nav);
  if(!S || !E) return null;
  const key = c => c[1] * cols + c[0];
  const h = c => Math.hypot(c[0] - E[0], c[1] - E[1]);
  const open = [S];
  const g = { [key(S)]: 0 };
  const from = {};
  const closed = new Set();
  let guard = 0;
  while(open.length && guard++ < 26000){
    let bi = 0, bf = Infinity;
    for(let i = 0; i < open.length; i++){
      const c = open[i], f = g[key(c)] + h(c) * 1.12;
      if(f < bf){ bf = f; bi = i; }
    }
    const cur = open.splice(bi, 1)[0];
    if(cur[0] === E[0] && cur[1] === E[1]){
      const path = [E];
      let k = key(E);
      while(from[k]){ path.unshift(from[k]); k = key(from[k]); }
      return path.map(toPt);
    }
    closed.add(key(cur));
    for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){
      if(!dx && !dy) continue;
      const nx = cur[0] + dx, ny = cur[1] + dy;
      if(nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      if(grid[ny * cols + nx]) continue;
      if(dx && dy && (grid[cur[1] * cols + nx] || grid[ny * cols + cur[0]])) continue;
      const nk = ny * cols + nx;
      if(closed.has(nk)) continue;
      // 靠岸惩罚：让路径主动走开阔水面
      const nx2 = NAV.x0 + nx * NAV.step, ny2 = NAV.y0 + ny * NAV.step;
      let near = 0;
      for(const is of ISLANDS){
        for(let k2 = 0; k2 < is.p.length; k2 += 2){
          if(Math.abs(is.p[k2][0] - nx2) < 46 && Math.abs(is.p[k2][1] - ny2) < 46){ near = 1; break; }
        }
        if(near) break;
      }
      const cost = g[key(cur)] + (dx && dy ? 1.414 : 1) + (near ? 1.6 : 0);
      if(g[nk] === undefined || cost < g[nk]){
        g[nk] = cost; from[nk] = [cur[0], cur[1]];
        if(!open.some(c => c[0] === nx && c[1] === ny)) open.push([nx, ny]);
      }
    }
  }
  return null;
}

/* 折线简化：去掉近似共线的点 */
function simplify(pts){
  if(pts.length < 3) return pts;
  const out = [pts[0]];
  for(let i = 1; i < pts.length - 1; i++){
    const a = out[out.length - 1], b = pts[i], c = pts[i + 1];
    const cross = Math.abs((b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]));
    if(cross > 30) out.push(b);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/* 绕过所有岛屿的路径；返回折线点数组（含首末） */
function routeAround(S, E){
  const path = findPath(S, E);
  if(!path || path.length < 2) return null;
  const pts = simplify(path);
  pts[0] = S; pts[pts.length - 1] = E;
  return pts;
}

/* =========================================================
   单条连接线：起点 → (A*) → 终点，末端直线进近
   ========================================================= */
function buildLink(A, B, bow, polyA, polyB){
  // 同岛：沿岛缘外侧走一小段弧
  if(polyA && polyB && polyA === polyB){
    const c = polyCenter(polyA);
    const pa = boundaryPoint(c, A, polyA, 3);
    const pb = boundaryPoint(c, B, polyB, 3);
    const ua = [pa[0]-c[0], pa[1]-c[1]], ub = [pb[0]-c[0], pb[1]-c[1]];
    const la = Math.hypot(ua[0], ua[1]) || 1, lb = Math.hypot(ub[0], ub[1]) || 1;
    const OUT = 22;
    const s0 = [pa[0] + ua[0]/la*OUT, pa[1] + ua[1]/la*OUT];
    const e0 = [pb[0] + ub[0]/lb*OUT, pb[1] + ub[1]/lb*OUT];
    const mid = [(s0[0]+e0[0])/2, (s0[1]+e0[1])/2];
    const vx = e0[0]-s0[0], vy = e0[1]-s0[1];
    const vl = Math.hypot(vx,vy) || 1;
    const nx = -vy/vl, ny = vx/vl;
    const away = ((mid[0]-c[0])*nx + (mid[1]-c[1])*ny) >= 0 ? 1 : -1;
    const off = Math.min(46, vl*0.28) * away;
    const ctrl = [mid[0] + nx*off, mid[1] + ny*off];
    return { A: s0, B: e0, ctrl, same:true };
  }

  // 嵌套/贴岛：直连锚点
  const nested = (polyB && inPoly(A, polyB)) || (polyA && inPoly(B, polyA));
  if(nested) return { A, B, ctrl: [(A[0]+B[0])/2, (A[1]+B[1])/2], nested:true };

  // 端点吸附到岛缘外侧
  const dirA = [B[0]-A[0], B[1]-A[1]];
  const dirB = [A[0]-B[0], A[1]-B[1]];
  const s0 = polyA ? exitPoint(A, [A[0]+dirA[0], A[1]+dirA[1]], polyA, 12) : A;
  const e0 = polyB ? exitPoint(B, [B[0]+dirB[0], B[1]+dirB[1]], polyB, 12) : B;

  // 两端很近（贴岛/紧贴）：不做 A*，直接短弧
  if(Math.hypot(e0[0]-s0[0], e0[1]-s0[1]) < 90){
    const mid = [(s0[0]+e0[0])/2, (s0[1]+e0[1])/2];
    const vx = e0[0]-s0[0], vy = e0[1]-s0[1];
    const vl = Math.hypot(vx,vy) || 1;
    const ctrl = [mid[0] - vy/vl*22, mid[1] + vx/vl*22];
    return { A: s0, B: e0, pts:[s0, ctrl, e0], short:true };
  }
  // A* 绕行
  const pts = routeAround(s0, e0);
  return { A: s0, B: e0, pts: pts || [s0, e0] };
}

/* 把折线转成 SVG 路径（Catmull-Rom 圆滑，末段强制直线保证箭头朝向） */
function polyToPath(pts){
  if(!pts || pts.length < 2) return '';
  const nav = pts.slice();
  // 末端进近段
  const E = nav[nav.length - 1], pre = nav[nav.length - 2];
  let bx = E[0]-pre[0], by = E[1]-pre[1];
  const bl = Math.hypot(bx,by) || 1;
  bx /= bl; by /= bl;
  const AP = Math.min(34, bl * 0.5);
  nav.splice(nav.length - 1, 0, [E[0]-bx*AP, E[1]-by*AP]);

  let d = `M${nav[0][0].toFixed(1)},${nav[0][1].toFixed(1)}`;
  for(let i = 0; i < nav.length - 1; i++){
    const p0 = nav[i], p1 = nav[i+1];
    if(i === nav.length - 2){ d += ` L${p1[0].toFixed(1)},${p1[1].toFixed(1)}`; break; }
    const pm = nav[i-1] || p0, pn = nav[i+2] || p1;
    const c1 = [p0[0] + (p1[0]-pm[0])/6, p0[1] + (p1[1]-pm[1])/6];
    const c2 = [p1[0] - (pn[0]-p0[0])/6, p1[1] - (pn[1]-p0[1])/6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p1[0].toFixed(1)},${p1[1].toFixed(1)}`;
  }
  return d;
}

/* 计算所有连接 */
function buildLinks(){
  const out = [];
  LINKS.forEach(l => {
    const RA = regionById(l.a), RB = regionById(l.b);
    if(!RA || !RB) return;
    const pa = polyOf(RA), pb = polyOf(RB);
    const ca = pa && !inPoly(RA.anchor, pa) ? polyCenter(pa) : RA.anchor;
    const cb = pb && !inPoly(RB.anchor, pb) ? polyCenter(pb) : RB.anchor;
    const geo = buildLink(ca, cb, 20, pa, pb);
    geo.d = polyToPath(geo.pts || [geo.A, geo.ctrl, geo.B]);
    out.push({ ...l, A: RA, B: RB, geo });
  });
  return out;
}

/* ---------- 区域统计 ---------- */
function regionStats(){
  const m = {};
  REGIONS.forEach(r => { m[r.id] = { total:0, done:0, cats:{} }; });
  // 区域名 → region id
  const byArea = {};
  REGIONS.forEach(r => { byArea[r.lab] = r.id; });

  PIN_INDEX.forEach(p => {
    let rid = byArea[p.area];
    if(!rid && typeof AREA_ALIAS !== 'undefined') rid = AREA_ALIAS[p.area];
    // 陵墓屋顶 / 城堡大桥这类独立小图优先
    if(!rid){
      const z = AREA_TO_ZONE[p.area];
      const cand = REGIONS.filter(r => r.zone === z);
      rid = cand.length ? cand[0].id : null;
    }
    if(!rid || !m[rid]) return;
    m[rid].total++;
    if(state.done.has(p.id)) m[rid].done++;
    m[rid].cats[p.cat] = (m[rid].cats[p.cat] || 0) + 1;
  });
  return m;
}

/* ---------- 主绘制 ---------- */
function paintMap(){
  const svg = document.getElementById('mapsvg');
  if(!svg) return;

  const defs = `<defs>
    <linearGradient id="seaAll" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="${MCOL.sea1}"/><stop offset="46%" stop-color="${MCOL.sea0}"/><stop offset="100%" stop-color="${MCOL.sea2}"/>
    </linearGradient>
    <pattern id="paperGrid" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M0 0H50M0 0V50" stroke="#7fa8bf" stroke-opacity="0.03" stroke-width="1"/>
    </pattern>
    <pattern id="texHatch2" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
      <line x1="0" y1="0" x2="0" y2="8" stroke="#d4e8da" stroke-width="1" stroke-opacity="0.055"/>
    </pattern>
    <pattern id="texGrid2" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(10)">
      <path d="M0 0H24M0 0V24" stroke="#b9d4e4" stroke-width="1" stroke-opacity="0.075"/>
    </pattern>
    <pattern id="texWave2" width="30" height="15" patternUnits="userSpaceOnUse">
      <path d="M0 7.5 q 7.5 -6 15 0 t 15 0" stroke="#9fd8e8" stroke-width="1" fill="none" stroke-opacity="0.18"/>
    </pattern>
    <pattern id="texTomb2" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-40)">
      <line x1="0" y1="0" x2="0" y2="12" stroke="#e8dcc0" stroke-width="1" stroke-opacity="0.07"/>
    </pattern>
    <filter id="softBig" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
    <filter id="softMed" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="8"/></filter>
    <marker id="arwPath" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="16" markerHeight="16" orient="auto" markerUnits="userSpaceOnUse"><path d="M11.2 6 L1.6 9.8 L3.8 6 L1.6 2.2 Z" fill="#b9c8b0"/></marker>
    <marker id="arwDash" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="17" markerHeight="17" orient="auto" markerUnits="userSpaceOnUse"><path d="M11.2 6 L1.6 9.8 L3.8 6 L1.6 2.2 Z" fill="#7fd0e8"/></marker>
    <marker id="arwLift" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="17" markerHeight="17" orient="auto" markerUnits="userSpaceOnUse"><path d="M11.2 6 L1.6 9.8 L3.8 6 L1.6 2.2 Z" fill="#8fb383"/></marker>
    <marker id="arwGate" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="18" markerHeight="18" orient="auto" markerUnits="userSpaceOnUse"><path d="M11.2 6 L1.6 9.8 L3.8 6 L1.6 2.2 Z" fill="#e8c26a"/></marker>
    <marker id="arwSecret" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="17" markerHeight="17" orient="auto" markerUnits="userSpaceOnUse"><path d="M11.2 6 L1.6 9.8 L3.8 6 L1.6 2.2 Z" fill="#b6a3f2"/></marker>
  </defs>`;

  let o = defs;
  o += `<rect width="2000" height="1400" fill="url(#seaAll)"/>`;
  o += `<rect width="2000" height="1400" fill="url(#paperGrid)" opacity="0.4"/>`;

  // ---- 1. 等深线 + 岛屿本体 ----
  const rings = [
    { k:1.22, op:0.075, w:1.0 },
    { k:1.12, op:0.13,  w:1.1 },
    { k:1.058,op:0.2,   w:1.25 }
  ];
  ISLANDS.forEach((is, i) => {
    const c = MCOL[is.k];
    const cx = is.p.reduce((s, q) => s + q[0], 0) / is.p.length;
    const cy = is.p.reduce((s, q) => s + q[1], 0) / is.p.length;
    rings.forEach(r => {
      o += `<path d="${smooth(scalePts(is.p, r.k, cx, cy))}" fill="none" stroke="#4b8ba0" stroke-opacity="${r.op}" stroke-width="${r.w}"/>`;
    });
    o += `<path d="${smooth(scalePts(is.p, 1.09, cx, cy))}" fill="${c.mid}" opacity="0.2" filter="url(#softBig)"/>`;
  });

  ISLANDS.forEach((is, i) => {
    const c = MCOL[is.k];
    const path = smooth(is.p);
    const cx = is.p.reduce((s, q) => s + q[0], 0) / is.p.length;
    const cy = is.p.reduce((s, q) => s + q[1], 0) / is.p.length;
    o += `<defs><radialGradient id="ig${i}" cx="42%" cy="34%" r="72%">
      <stop offset="0%" stop-color="${c.top}"/><stop offset="62%" stop-color="${c.mid}"/><stop offset="100%" stop-color="${c.bot}"/>
    </radialGradient></defs>`;
    o += `<path d="${smooth(is.p.map(q => [q[0] + 4, q[1] + 9]))}" fill="#000" opacity="0.45" filter="url(#softMed)"/>`;
    o += `<path d="${path}" fill="url(#ig${i})" stroke="${c.line}" stroke-width="2.4" stroke-opacity="0.62" stroke-linejoin="round"/>`;
    o += `<path d="${smooth(scalePts(is.p, 0.968, cx, cy))}" fill="none" stroke="#ffffff" stroke-opacity="0.09" stroke-width="1.3"/>`;
    o += texFor(is, path, cx, cy);
  });

  // ---- 3. 区域地标 ----
  o += `<g id="mapMarks">`;
  REGIONS.forEach(r => {
    (r.marks || []).forEach(m => {
      o += LM_SHAPE.draw(m);
    });
  });
  o += `</g>`;

  // ---- 4. 区域热点：整块岛屿都可点 ----
  o += `<g id="mapHot">`;
  // 按面积从小到大绘制：小区域在上层，点击优先命中它
  REGIONS.map(r => ({ r, poly: polyOf(r) }))
    .filter(x => x.poly)
    .map(x => {
      const xs = x.poly.map(q => q[0]), ys = x.poly.map(q => q[1]);
      const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
      return { ...x, area };
    })
    .sort((a, b) => a.area - b.area)
    .forEach(({ r, poly }) => {
      const path = smooth(poly);
      o += `<path d="${path}" fill="#7fe0c8" fill-opacity="0" stroke="none"
        class="rhot" data-rid="${r.id}" style="cursor:pointer;transition:fill-opacity .16s"/>`;
    });
  o += `</g>`;

  // ---- 5. 区域名（带底板，作为视觉焦点与点选提示）----
  // 先算出每块标签的尺寸，再做一次「互相推开」的避让
  const labBox = REGIONS.map(r => {
    const sz = r.stat ? 12.5 : 11;
    const wLab = r.lab.length * sz + 14;
    const wEn = (r.en || '').length * sz * 0.27;
    const h = r.en ? sz + sz * 0.72 + 9 : sz + 9;
    // 标签矩形纵向占 [dy-h, dy]，放在锚点下方 → dy 至少为 h + 间距
    return { r, sz, w: Math.max(wLab, wEn * 2) + 10, h, dy: Math.round(h + 14) };
  });
  // 地标位置（用于让标签避开它们）
  const markPts = [];
  REGIONS.forEach(r => (r.marks || []).forEach(m => markPts.push([m.x, m.y, 13])));

  const at = (A, dy) => [A.r.anchor[0], A.r.anchor[1] + dy];
  const hitMark = (A, dy) => {
    const [ax, ay] = at(A, dy);
    for(const m of markPts){
      if(Math.abs(m[0] - ax) < A.w/2 + m[2] && Math.abs(m[1] - ay) < A.h + m[2]) return true;
    }
    return false;
  };
  const hitLab = (A, dya, B, dyb) => {
    const [ax, ay] = at(A, dya), [bx, by] = at(B, dyb);
    // 矩形 A: x∈[ax-w/2, ax+w/2], y∈[ay-h, ay]；B 同理
    return (Math.min(ax + A.w/2, bx + B.w/2) - Math.max(ax - A.w/2, bx - B.w/2) > -4) &&
           (Math.min(ay, by) - Math.max(ay - A.h, by - B.h) > -4);
  };

  // 标签放置：四角必须完全落在自己的轮廓内
  // 候选顺序严格按「离锚点近」排列；全部不合法时标记为 outside（改用指引线）
  const polyCache = {};
  REGIONS.forEach(r => { polyCache[r.id] = polyOf(r); });

  // 统一走全局 labelRect / labelFitsPoly，不再在此处另算一套几何
  const fitsPoly = (A, dx, dy, w, h, sc) =>
    labelFitsPoly(labelRect(A, dx, dy, sc), polyCache[A.r.id], LABEL_PAD);

  const placed = [];
  labBox.forEach(A => {
    const baseDy = A.dy;
    // 由近到远排列
    // 候选偏移：以锚点为基准，同时把「岛心」也作为强候选
    const poly = polyCache[A.r.id];
    let gx = 0, gy = 0;
    if(poly){
      gx = poly.reduce((t,q)=>t+q[0],0)/poly.length - A.r.anchor[0];
      gy = poly.reduce((t,q)=>t+q[1],0)/poly.length - A.r.anchor[1];
    }
    const dyC = [gy, gy + 10, gy - 10, gy + 20, gy - 20,
                 baseDy, baseDy - 24, baseDy + 20, baseDy - 40, baseDy + 36,
                 gy + 34, gy - 34];
    const dxC = [gx, 0, -10, 10, -20, 20, -30, 30];
    const scales = [1, 0.9, 0.82, 0.75, 0.68, 0.62, 0.56];

    let best = null;
    for(const sc of scales){
      const w = A.w * sc, h = A.h * sc;
      // 按距离排序后取第一个合法的
      const cands = [];
      for(const dy of dyC) for(const dx of dxC){
        cands.push({ dx, dy, sc, dist: Math.abs(dx) + Math.abs(dy - baseDy) });
      }
      cands.sort((m, n) => m.dist - n.dist);
      for(const c of cands){
        if(!fitsPoly(A, c.dx, c.dy, w, h, sc)) continue;
        // 合法位置里，优先不压地标、不压其他标签
        let bad = 0;
        if(hitMark(A, c.dy)) bad += 2;
        for(const P of placed){ if(hitLab(A, c.dy, P.A, P.dy)) bad += 1; }
        const score = bad * 1000 + c.dist + (1 - sc) * 30;
        if(!best || score < best.score) best = { ...c, score, bad };
        break;   // 该缩放下第一个合法位置即采用
      }
      if(best && best.bad === 0) break;
    }
    // 最终复核：与放置、渲染、校验共用同一判定函数，标准不会漂移
    if(best && fitsPoly(A, best.dx, best.dy, A.w * best.sc, A.h * best.sc, best.sc)){
      A.dx = best.dx; A.dy = best.dy; A.scale = best.sc; A.outside = false;
    } else {
      // 岛内放不下：标签贴到岛屿下缘外侧，用引线连回
      A.dx = 0; A.scale = 1; A.outside = true;
      const poly2 = polyCache[A.r.id];
      if(poly2){
        const maxY = Math.max(...poly2.map(q => q[1]));
        // 标签底边落在岛屿下缘以外 8px
        A.dy = Math.round((maxY - A.r.anchor[1]) + A.sz + 8);
      } else {
        A.dy = baseDy + 12;
      }
    }
    placed.push({ A, dy: A.dy });
  });

  o += `<g id="mapLabs">`;
  labBox.forEach(A0 => {
    const { r } = A0;
    const dy = A0.dy, ddx = A0.dx || 0, sc = A0.scale || 1;
    // 几何统一由 labelRect 计算，与放置阶段完全一致
    const rc = labelRect(A0, ddx, dy, sc);
    const sz = rc.sz, x = rc.cx, y = r.anchor[1];
    const wBox = rc.w, hBox = rc.h, rectY = rc.y;

    // 是否越界：走同一个判定函数（内缩量与校验脚本相同）
    const isOutside = !labelFitsPoly(rc, polyOf(r), LABEL_PAD_RENDER);

    // 引线：从锚点连到标签顶部
    if(isOutside){
      o += `<line data-leader="${r.id}" x1="${x}" y1="${y}" x2="${x}" y2="${rectY.toFixed(1)}"
        stroke="#9ee2f5" stroke-opacity=".8" stroke-width="1.3"/>
        <circle cx="${x}" cy="${y}" r="2.4" fill="#9ee2f5" opacity=".95"/>`;
    }

    o += `<g class="rlab" data-rid="${r.id}" style="cursor:pointer">
      <rect x="${(x - wBox/2).toFixed(1)}" y="${rectY.toFixed(1)}" width="${wBox.toFixed(1)}" height="${hBox.toFixed(1)}" rx="9"
        fill="#070f15" fill-opacity="${isOutside ? '.9' : '.5'}"
        stroke="${isOutside ? 'rgba(143,208,232,.55)' : 'rgba(143,208,232,.18)'}" stroke-width="1"/>
      <text x="${x}" y="${(y + dy).toFixed(1)}" text-anchor="middle"
        style="font-family:Georgia,'Songti SC',serif;font-size:${sz}px;fill:#f6faf2;letter-spacing:${(sz*0.14).toFixed(1)}px;opacity:.97;paint-order:stroke"
        stroke="#050c11" stroke-width="5" stroke-opacity=".95">${r.lab}</text>
      ${r.en ? `<text x="${x}" y="${(y + dy + sz * 0.92).toFixed(1)}" text-anchor="middle"
        style="font-family:'Inter',system-ui,sans-serif;font-size:${(sz*0.44).toFixed(1)}px;fill:#c2d6c8;letter-spacing:${(sz*0.09).toFixed(1)}px;opacity:.62;paint-order:stroke"
        stroke="#050c11" stroke-width="3.4" stroke-opacity=".9">${r.en}</text>` : ''}
    </g>`;
  });
  o += `</g>`;

  // ---- 6. 进度指示：区域名右侧一个小圆点（有未收集则为金色）----
  o += `<g id="mapDots">`;
  REGIONS.filter(r => r.stat).forEach(r => {
    const st = (window.__REG_STATS || {})[r.id] || { total:0, done:0 };
    if(!st.total) return;
    const full = st.done >= st.total;
    const [x, y] = r.anchor;
    const sz = 13.5;
    const wLab = r.lab.length * sz + 14;
    const cx = x + wLab / 2 + 7, cy = y + 26 - sz * 0.4;
    o += `<circle cx="${cx}" cy="${cy}" r="4.6" fill="${full ? '#7fe0c8' : '#e8c26a'}"
      stroke="#070f15" stroke-width="1.4" opacity=".95" pointer-events="none"/>`;
  });
  o += `</g>`;

  svg.innerHTML = o;
  bindHotspots();
  if(typeof refreshPopIfOpen === 'function') refreshPopIfOpen();
}


/* =========================================================
   区域弹窗：点大地图上的区域 → 弹出该区域详情
   内容：名称 / 收集进度条 / 分类明细 / 可通往区域 / 进入细部图
   ========================================================= */
const LINK_META = {
  path:   { name:'陆路 / 桥',   col:'#b9c8b0' },
  dash:   { name:'风之冲刺',    col:'#7fd0e8' },
  lift:   { name:'升降 / 传送', col:'#8fb383' },
  gate:   { name:'钥匙 / 破除器', col:'#e8c26a' },
  secret: { name:'隐藏 / 破序', col:'#b6a3f2' }
};

/* 某个区域的所有出边 */
function gatesOf(rid){
  return LINKS.filter(l => l.a === rid || l.b === rid).map(l => {
    const other = l.a === rid ? l.b : l.a;
    const R = regionById(other);
    return { id: other, name: R ? R.lab : other, type: l.type, label: l.label || '' };
  });
}

/* ---------- 弹窗 DOM ---------- */
let __regPop = null;
function regPopEl(){
  if(__regPop) return __regPop;
  const d = document.createElement('div');
  d.id = 'regPop';
  d.className = 'reg-pop';
  document.querySelector('.mapwrap').appendChild(d);
  __regPop = d;
  return d;
}

function openRegionPop(rid, clientX, clientY){
  const r = regionById(rid);
  if(!r) return;
  const st = (window.__REG_STATS || {})[r.id] || { total:0, done:0, cats:{} };
  const pct = st.total ? st.done / st.total : 0;
  const full = st.total > 0 && st.done >= st.total;
  const hasZone = typeof ZONES !== 'undefined' && !!ZONES[r.zone];
  const gs = gatesOf(rid);

  // 分类明细
  const cats = Object.entries(st.cats || {}).sort((a, b) => b[1] - a[1]);
  const catRow = cats.map(([c, n]) => {
    const meta = (typeof catMeta === 'function') ? catMeta(c) : { name:c, color:'#9ab' };
    const doneN = (typeof PIN_INDEX !== 'undefined') ? PIN_INDEX.filter(p => p.cat === c && p.area === r.lab && state.done.has(p.id)).length : 0;
    return `<span class="rp-cat"><i style="background:${meta.color}"></i>${meta.name}<em>${doneN}/${n}</em></span>`;
  }).join('');

  const pop = regPopEl();
  pop.innerHTML = `
    <div class="rp-head">
      <div class="rp-t">
        <span class="rp-name">${r.lab}</span>
        <span class="rp-en">${r.en || ''}</span>
      </div>
      <button class="rp-x" id="rpClose">✕</button>
    </div>
    ${r.note ? `<div class="rp-note">${r.note}</div>` : ''}

    <div class="rp-stat">
      <div class="rp-bar"><i style="width:${(pct*100).toFixed(1)}%;background:${full?'linear-gradient(90deg,#2a8c7d,#7fe0c8)':'linear-gradient(90deg,#8a6a2a,#e8c26a)'}"></i></div>
      <div class="rp-num">${st.done} / ${st.total}${full?' · 已全收集':''}</div>
    </div>
    ${catRow ? `<div class="rp-cats">${catRow}</div>` : '<div class="rp-empty">该区域暂无收集物</div>'}

    ${gs.length ? `<div class="rp-sec">可通往</div>
    <div class="rp-links">${gs.map(g => {
      const m = LINK_META[g.type] || LINK_META.path;
      return `<div class="rp-link"><i style="background:${m.col}"></i><b>${g.name}</b><span>${g.label || m.name}</span></div>`;
    }).join('')}</div>` : ''}

    ${hasZone ? `<button class="rp-go" data-zone="${r.zone}">进入细部图 · ${ZONES[r.zone].floors.length} 层 →</button>` : ''}
  `;
  pop.classList.add('show');

  // 定位：以「被点区域的屏幕包围盒」为基准，优先放到区域外侧，避免盖住它
  pop.style.visibility = 'hidden';
  const wrapEl = document.querySelector('.mapwrap');
  const wrap = wrapEl.getBoundingClientRect();
  const pr = pop.getBoundingClientRect();
  const GAP = 14, MARGIN = 12;
  const MARGIN_B = 44;   // 底部留出缩放控件与进度条的空间

  // 该区域的屏幕范围
  const hotEl = document.querySelector(`.rhot[data-rid="${rid}"]`);
  let zone = null;
  if(hotEl){
    const zb = hotEl.getBoundingClientRect();
    zone = { l: zb.left - wrap.left, t: zb.top - wrap.top, r: zb.right - wrap.left, b: zb.bottom - wrap.top,
             w: zb.width, h: zb.height };
  }

  const clampX = v => Math.max(MARGIN, Math.min(wrap.width - pr.width - MARGIN, v));
  const clampY = v => Math.max(MARGIN, Math.min(wrap.height - pr.height - MARGIN_B, v));

  let left, top;
  if(zone){
    // 四个方向各算一个候选，选「不压住区域且离点击点最近」的
    const cands = [
      { side:'right',  l: zone.r + GAP,           t: zone.t + zone.h/2 - pr.height/2, ok: zone.r + GAP + pr.width <= wrap.width - MARGIN },
      { side:'left',   l: zone.l - GAP - pr.width, t: zone.t + zone.h/2 - pr.height/2, ok: zone.l - GAP - pr.width >= MARGIN },
      { side:'bottom', l: zone.l + zone.w/2 - pr.width/2, t: zone.b + GAP, ok: zone.b + GAP + pr.height <= wrap.height - MARGIN_B },
      { side:'top',    l: zone.l + zone.w/2 - pr.width/2, t: zone.t - GAP - pr.height, ok: zone.t - GAP - pr.height >= MARGIN }
    ].filter(c => c.ok);

    // 计算每个候选与点击点的距离，取最近的
    const cx = clientX - wrap.left, cy = clientY - wrap.top;
    cands.forEach(c => {
      const pcx = clampX(c.l) + pr.width/2, pcy = clampY(c.t) + pr.height/2;
      c.dist = Math.hypot(pcx - cx, pcy - cy);
      // 惩罚：横向超出可视宽度太多
      c.penalty = (c.l < MARGIN || c.l + pr.width > wrap.width - MARGIN) ? 400 : 0;
    });
    cands.sort((a, b) => (a.dist + a.penalty) - (b.dist + b.penalty));

    if(cands.length){
      left = clampX(cands[0].l);
      top = clampY(cands[0].t);
    } else {
      // 四周都没空间（大区域铺满地图）：贴到最近的边缘外侧
      left = clampX(clientX - wrap.left + 18);
      top = clampY(clientY - wrap.top - pr.height / 2);
    }
  } else {
    left = clampX(clientX - wrap.left + 16);
    top = clampY(clientY - wrap.top - pr.height / 2);
  }

  pop.style.left = left + 'px';
  pop.style.top = top + 'px';
  pop.style.visibility = '';

  pop.querySelector('#rpClose').onclick = ev => { ev.stopPropagation(); closeRegionPop(); };
  const go = pop.querySelector('.rp-go');
  if(go) go.onclick = ev => {
    ev.stopPropagation();
    closeRegionPop();
    if(typeof openZone === 'function') openZone(go.dataset.zone, 0);
  };
}

function closeRegionPop(){
  if(__regPop) __regPop.classList.remove('show');
}

/* ---------- 地图热点绑定（事件委托，避免元素重建后丢失） ---------- */
function bindHotspots(){
  const svg = document.getElementById('mapsvg');
  if(!svg || svg.__hotBound) return;
  svg.__hotBound = true;

  const pick = ev => {
    const t = ev.target.closest ? ev.target.closest('.rhot, .rlab') : null;
    return t ? t.dataset.rid : null;
  };

  svg.addEventListener('click', ev => {
    const rid = pick(ev);
    if(!rid) return;
    ev.stopPropagation();
    ev.preventDefault();
    openRegionPop(rid, ev.clientX, ev.clientY);
    // 高亮所选区域
    svg.querySelectorAll('.rhot').forEach(x => x.setAttribute('fill-opacity', '0'));
    const hot = svg.querySelector(`.rhot[data-rid="${rid}"]`);
    if(hot) hot.setAttribute('fill-opacity', '.1');
  });

  svg.addEventListener('mousemove', ev => {
    const rid = pick(ev);
    svg.querySelectorAll('.rhot').forEach(x => {
      if(x !== svg.querySelector(`.rhot[data-rid="${rid}"]`)) x.setAttribute('fill-opacity', '0');
    });
    if(rid){
      const hot = svg.querySelector(`.rhot[data-rid="${rid}"]`);
      if(hot && hot.getAttribute('fill-opacity') !== '.1') hot.setAttribute('fill-opacity', '.07');
    }
  });
  svg.addEventListener('mouseleave', () => {
    svg.querySelectorAll('.rhot').forEach(x => x.setAttribute('fill-opacity', '0'));
  });

  // 点空白关闭
  const vp = document.getElementById('viewport');
  if(vp && !vp.__regBound){
    vp.__regBound = true;
    vp.addEventListener('pointerdown', ev => {
      if(!ev.target.closest('.rhot') && !ev.target.closest('.rlab') && !ev.target.closest('#regPop')){
        closeRegionPop();
      }
    });
  }
}

/* 兼容旧调用 */
function bindGates(){ bindHotspots(); }
function refreshRegionBadges(){
  window.__REG_STATS = regionStats();
  if(typeof paintMap === 'function') paintMap();
}
function bindBadges(){ bindHotspots(); }
function bindZoneEntries(){}

/* 在路径末端画一个独立三角形箭头。
   位置与方向都从路径自身解析（取真实终点与末段切线），不依赖外部传入的点。 */
function arrowHead(d, st){
  const segs = [...d.matchAll(/([MLQC])([^MLQC]*)/g)].map(m => ({ c:m[1], v:m[2].trim().split(/[ ,]+/).map(Number) }));
  if(segs.length < 2) return '';
  const last = segs[segs.length - 1], prev = segs[segs.length - 2];
  let E, tail;
  if(last.c === 'L'){
    E = [last.v[0], last.v[1]];
    tail = prev.c === 'C' ? [prev.v[4], prev.v[5]] : prev.c === 'Q' ? [prev.v[2], prev.v[3]] : [prev.v[0], prev.v[1]];
  } else if(last.c === 'C'){
    E = [last.v[4], last.v[5]];
    tail = [last.v[2], last.v[3]];
  } else if(last.c === 'Q'){
    E = [last.v[2], last.v[3]];
    tail = [last.v[0], last.v[1]];
  } else {
    E = [last.v[0], last.v[1]];
    tail = E;
  }
  let dx = E[0] - tail[0], dy = E[1] - tail[1];
  const L = Math.hypot(dx, dy);
  if(!isFinite(L) || L < 0.01) return '';
  dx /= L; dy /= L;
  const nx = -dy, ny = dx;

  const len = 14, half = 6.2;
  const tip   = E;
  const base  = [E[0] - dx * len, E[1] - dy * len];
  const p1    = [base[0] + nx * half, base[1] + ny * half];
  const p2    = [base[0] - nx * half, base[1] - ny * half];
  const notch = [E[0] - dx * len * 0.78, E[1] - dy * len * 0.78];
  const f = q => q[0].toFixed(1) + ',' + q[1].toFixed(1);
  return `<path d="M${f(tip)} L${f(p1)} L${f(notch)} L${f(p2)} Z" fill="${st.col}"
    stroke="#070f15" stroke-width="1.1" stroke-opacity=".7" stroke-linejoin="round" pointer-events="none"/>`;
}

/* 区域统计徽标：环形进度 + 数字 */
function regionBadge(r){
  const st = (window.__REG_STATS || {})[r.id] || { total:0, done:0 };
  const x = r.anchor[0], y = r.anchor[1];
  const pct = st.total ? st.done / st.total : 0;
  const full = st.total > 0 && st.done >= st.total;
  const R = 15, C = 2 * Math.PI * R;
  const col = full ? '#7fe0c8' : (pct > 0.5 ? '#a9d18a' : '#e8c26a');

  // 没有细部图的区域（陵墓屋顶/城堡大桥等）只画进度环，不做跳转按钮
  const hasZone = typeof ZONES !== 'undefined' && !!ZONES[r.zone];
  const ring = `<g class="rbadge" data-rid="${r.id}" style="cursor:pointer">
    <circle cx="${x}" cy="${y}" r="${R + 4}" fill="#070f15" fill-opacity=".82"/>
    <circle cx="${x}" cy="${y}" r="${R}" fill="none" stroke="#ffffff" stroke-opacity=".13" stroke-width="3.2"/>
    <circle cx="${x}" cy="${y}" r="${R}" fill="none" stroke="${col}" stroke-width="3.2" stroke-linecap="round"
      stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - pct)).toFixed(1)}"
      transform="rotate(-90 ${x} ${y})"/>
    <text x="${x}" y="${y + 4}" text-anchor="middle"
      style="font-family:'Inter',system-ui,sans-serif;font-size:11px;fill:${full ? '#8ff0dd' : '#f4ead2'};font-weight:600;paint-order:stroke"
      stroke="#070f15" stroke-width="2.6" stroke-opacity=".9">${st.done}/${st.total}</text>
  </g>`;
  if(!hasZone) return ring;
  return ring + zoneEntry(r);
}

/* 跳转细部图的按钮：贴在徽标左下方，小胶囊 + 箭头 */
function zoneEntry(r){
  const [x, y] = r.anchor;
  const hasZone = typeof ZONES !== 'undefined' && !!ZONES[r.zone];
  if(!hasZone) return '';
  const n = ZONES[r.zone].floors.length;
  const w = 52, h = 17;
  const bx = x - 6, by = y + 20;      // 徽标下方左侧
  const tx = bx + 9, ty = by + h / 2 + 3.4;
  return `<g class="zent" data-rid="${r.id}" data-zone="${r.zone}" style="cursor:pointer">
    <rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="8.5"
      fill="#070f15" fill-opacity=".8" stroke="rgba(143,208,232,.45)" stroke-width="1"/>
    <path d="M${bx + 8} ${by + h/2} h6 M${bx + 11} ${by + h/2 - 2.6} L${bx + 13.6} ${by + h/2} L${bx + 11} ${by + h/2 + 2.6}"
      fill="none" stroke="#9ee2f5" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="${bx + 20}" y="${ty}" style="font-family:'Inter','Microsoft YaHei',sans-serif;font-size:9.5px;fill:#bfe6f2;letter-spacing:.4px">
      细部图${n > 1 ? ' ' + n + 'F' : ''}</text>
  </g>`;
}

/* 刷新徽标数字（勾选收集物后调用，不重绘整张地图） */
function refreshRegionBadges(){
  window.__REG_STATS = regionStats();
  const g = document.getElementById('mapStats');
  if(!g) return;
  g.innerHTML = REGIONS.filter(r => r.stat).map(regionBadge).join('');
  bindBadges();
  bindZoneEntries();
}

function bindZoneEntries(){
  document.querySelectorAll('#mapStats .zent').forEach(el => {
    el.addEventListener('click', ev => {
      ev.stopPropagation();
      ev.preventDefault();
      const z = el.dataset.zone;
      if(typeof openZone === 'function' && ZONES[z]) openZone(z, 0);
    });
    el.addEventListener('mouseenter', () => {
      const rc = el.querySelector('rect');
      if(rc){ rc.setAttribute('fill-opacity', '1'); rc.setAttribute('stroke', 'rgba(143,208,232,.9)'); }
    });
    el.addEventListener('mouseleave', () => {
      const rc = el.querySelector('rect');
      if(rc){ rc.setAttribute('fill-opacity', '.8'); rc.setAttribute('stroke', 'rgba(143,208,232,.45)'); }
    });
  });
}

function bindBadges(){
  document.querySelectorAll('#mapStats .rbadge').forEach(el => {
    el.addEventListener('click', ev => {
      ev.stopPropagation();
      const r = regionById(el.dataset.rid);
      if(!r) return;
      if(typeof openZone === 'function' && ZONES[r.zone]) openZone(r.zone, 0);
      else centerOn(r.anchor[0], r.anchor[1], Math.max(view.scale, 0.95));
    });
    el.addEventListener('mouseenter', () => el.setAttribute('opacity', '.85'));
    el.addEventListener('mouseleave', () => el.setAttribute('opacity', '1'));
  });
}
