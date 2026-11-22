/* =========================================================
   区域位置变动后的自动校验
   用法：node tools-check-region-icons.js
   检查项：
   1. 每个区域的锚点是否落在自己的轮廓内
   2. 每个地标是否落在自己的轮廓内
   3. 区域名标签是否落在轮廓内
   4. 所有区域是否都落在视口可视范围内
   5. 任意两块区域的轮廓是否相交
   ========================================================= */
const { chromium } = require('playwright-core');

(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8777/index.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1800);

  const r = await p.evaluate(() => {
    const inPoly = (pt, poly) => {
      let x = pt[0], y = pt[1], ins = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) ins = !ins;
      }
      return ins;
    };
    const bbOf = poly => {
      const xs = poly.map(q => q[0]), ys = poly.map(q => q[1]);
      return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    };

    const problems = [];
    const externalLabels = [];

    // 1-3 锚点 / 地标 / 标签
    REGIONS.forEach(reg => {
      const poly = polyOf(reg);
      if (!poly) { problems.push({ lab: reg.lab, issue: '找不到轮廓' }); return; }
      if (!inPoly(reg.anchor, poly)) problems.push({ lab: reg.lab, issue: '锚点在轮廓外', at: reg.anchor });
      (reg.marks || []).forEach(m => {
        if (!inPoly([m.x, m.y], poly)) problems.push({ lab: reg.lab, issue: '地标在轮廓外: ' + (m.label || m.t), at: [m.x, m.y] });
      });
      // 标签：中心 + 四边中点都要在轮廓内；外置标签（带引线）单独统计
      const el = document.querySelector(`.rlab[data-rid="${reg.id}"] rect`);
      if (el) {
        const bb = el.getBBox();
        const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
        const pts = [[cx, cy], [bb.x, cy], [bb.x + bb.width, cy], [cx, bb.y], [cx, bb.y + bb.height]];
        const outside = pts.filter(c => !inPoly(c, poly)).length;
        const hasLeader = !!document.querySelector(`#mapLabs line[data-leader="${reg.id}"]`);
        if (outside && !hasLeader) {
          problems.push({ lab: reg.lab, issue: `区域名标签越界(${outside}点在外)且无引线` });
        } else if (outside) {
          externalLabels.push(reg.lab);
        }
      }
    });

    // 4 视口
    const vp = document.getElementById('viewport').getBoundingClientRect();
    const outOfView = [...document.querySelectorAll('.rlab')].filter(el => {
      const q = el.getBoundingClientRect();
      const cx = q.x + q.width / 2, cy = q.y + q.height / 2;
      return cx < vp.x || cx > vp.x + vp.width || cy < vp.y || cy > vp.y + vp.height;
    }).map(el => el.dataset.rid);

    // 5 轮廓相交
    const list = REGIONS.map(reg => ({ lab: reg.lab, p: polyOf(reg) })).filter(x => x.p);
    const overlaps = [];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const A = bbOf(list[i].p), B = bbOf(list[j].p);
        const ox = Math.min(A[2], B[2]) - Math.max(A[0], B[0]);
        const oy = Math.min(A[3], B[3]) - Math.max(A[1], B[1]);
        if (ox > 0 && oy > 0) overlaps.push(list[i].lab + ' × ' + list[j].lab + ` (${ox}×${oy})`);
      }
    }

    return { problems, externalLabels, outOfView, overlaps };
  });

  console.log('=== 区域图标校验 ===');
  if (!r.problems.length) console.log('✓ 锚点 / 地标 / 标签 全部合规');
  else r.problems.forEach(x => console.log('✗', x.lab, '-', x.issue, x.at ? JSON.stringify(x.at) : ''));

  if (r.externalLabels.length)
    console.log('· 标签外置(带引线，岛屿太窄):', r.externalLabels.join('、'));

  if (!r.outOfView.length) console.log('✓ 所有区域都在可视范围内');
  else console.log('✗ 超出视野:', r.outOfView.join(', '));

  if (!r.overlaps.length) console.log('✓ 区域轮廓无相交');
  else r.overlaps.forEach(x => console.log('✗ 重叠:', x));

  if (errs.length) console.log('✗ 页面报错:', errs.join(' | '));

  await b.close();
  process.exit(r.problems.length || r.outOfView.length || r.overlaps.length ? 1 : 0);
})();
