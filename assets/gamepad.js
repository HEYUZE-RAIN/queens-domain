/* =========================================================
   assets/gamepad.js — 主机手柄适配（PS 风格）+ 全键盘导航
   映射：×确认 / ○返回 / L1 R1 切页签 / L2 R2 切区域
        ↑↓ 列表焦点 / 十字键 + 右摇杆 平移地图 / △ 详情 / □ 勾选
        L3 复位视图 / Options 打开区域细部图
   ========================================================= */

const GP = {
  idx: null,
  prev: {},
  repeat: {},
  connected: false,
  lastInputTime: 0
};

const PAD_BTN = {
  X: 0, CIRCLE: 1, SQUARE: 2, TRIANGLE: 3,
  L1: 4, R1: 5, L2: 6, R2: 7,
  SHARE: 8, OPTIONS: 9, L3: 10, R3: 11,
  UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15, PS: 16
};

/* 焦点清单：返回当前可聚焦元素数组 */
function focusables(){
  const list = [];
  const scope = document.body.classList.contains('gp-nav') ? document : null;
  document.querySelectorAll('.gp-focus').forEach(el => {
    if(el.offsetParent !== null) list.push(el);
  });
  return list;
}

let gpFocusIdx = -1;
function setFocus(idx){
  const list = document.querySelectorAll('.gp-focus');
  list.forEach(el => el.classList.remove('gp-on'));
  if(idx < 0 || idx >= list.length) { gpFocusIdx = -1; return; }
  const el = list[idx];
  el.classList.add('gp-on');
  gpFocusIdx = idx;
  el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function moveFocus(dir){
  const list = Array.prototype.slice.call(document.querySelectorAll('.gp-focus'));
  const vis = list.filter(el => el.offsetParent !== null || el.getClientRects().length);
  if(!vis.length) return;
  let cur = vis.indexOf(document.querySelector('.gp-on'));
  if(cur < 0) cur = -1;
  cur = dir > 0 ? (cur + 1) % vis.length : (cur - 1 + vis.length) % vis.length;
  list.forEach(el => el.classList.remove('gp-on'));
  vis[cur].classList.add('gp-on');
  vis[cur].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/* 列表首项聚焦 */
function focusFirst(){
  const list = Array.prototype.slice.call(document.querySelectorAll('#scroll .gp-focus'));
  if(list.length){ list.forEach(e => e.classList.remove('gp-on')); list[0].classList.add('gp-on'); }
}

/* 手柄的「区域跳转」：按当前列表顺序滚到下一个分类 */
function jumpGroup(dir){
  const gs = Array.prototype.slice.call(document.querySelectorAll('.group'));
  if(!gs.length) return;
  let cur = gs.findIndex(g => g.classList.contains('open'));
  if(cur < 0) cur = dir > 0 ? -1 : 0;
  const nx = (cur + dir + gs.length) % gs.length;
  gs.forEach(g => g.classList.remove('open'));
  gs[nx].classList.add('open');
  gs[nx].scrollIntoView({ block: 'start', behavior: 'smooth' });
  const head = gs[nx].querySelector('[data-toggle]');
  if(head) head.classList.add('gp-on');
  const nm = gs[nx].querySelector('.gname');
  showPadHint(nm ? nm.textContent.replace(/\s+/g, ' ').trim() : '');
}

/* 重建页面后会丢焦点：按记录恢复 */
function refocus(){
  const el = document.querySelector('.gp-focus.gp-on');
  if(el && !el.getClientRects().length) setFocus(Math.min(gpFocusIdx, document.querySelectorAll('.gp-focus').length - 1));
}

/* ---------- 主循环 ---------- */
let gpRAF = null;
function gpLoop(){
  gpRAF = requestAnimationFrame(gpLoop);
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  let pad = null;
  for(let i = 0; i < pads.length; i++){ if(pads[i] && pads[i].connected){ pad = pads[i]; GP.idx = i; break; } }
  if(!pad){
    if(GP.connected){ GP.connected = false; document.body.classList.remove('gp-nav'); hidePadHint(); }
    return;
  }
  if(!GP.connected){
    GP.connected = true;
    document.body.classList.add('gp-nav');
    markFocusables();
    if(!document.querySelector('.gp-on')) focusFirst();
    showPadHint('手柄已连接');
  }

  const now = performance.now();
  const pressed = (b) => {
    const v = pad.buttons[b];
    return !!(v && (v.pressed || v.value > 0.5));
  };
  const edge = (b, name) => {
    const p = pressed(b);
    const was = GP.prev[name];
    GP.prev[name] = p;
    return p && !was;
  };

  // —— 页签切换 L1 / R1
  if(edge(PAD_BTN.L1, 'l1')) cycleTab(-1);
  if(edge(PAD_BTN.R1, 'r1')) cycleTab(1);

  // —— 分类切换 L2 / R2
  if(tick(pad, PAD_BTN.L2, 'l2', now, 280)) jumpGroup(-1);
  if(tick(pad, PAD_BTN.R2, 'r2', now, 280)) jumpGroup(1);

  // —— 列表焦点
  if(tick(pad, PAD_BTN.UP, 'up', now, 190)) moveFocus(-1);
  if(tick(pad, PAD_BTN.DOWN, 'down', now, 190)) moveFocus(1);

  // —— 确认 / 返回 / 详情 / 勾选
  if(edge(PAD_BTN.X, 'x')) padConfirm();
  if(edge(PAD_BTN.CIRCLE, 'circle')) padBack();
  if(edge(PAD_BTN.TRIANGLE, 'tri')) padDetail();
  if(edge(PAD_BTN.SQUARE, 'sq')) padToggleDone();
  if(edge(PAD_BTN.OPTIONS, 'opt')) padZone();
  if(edge(PAD_BTN.L3, 'l3')) fitView(0.03);

  // —— 右摇杆 / 十字键平移地图
  const rx = pad.axes[2] || 0, ry = pad.axes[3] || 0;
  const dead = 0.18;
  let dx = 0, dy = 0;
  if(Math.abs(rx) > dead) dx += rx * 26;
  if(Math.abs(ry) > dead) dy += ry * 26;
  if(pressed(PAD_BTN.LEFT)) dx -= 22;
  if(pressed(PAD_BTN.RIGHT)) dx += 22;
  if(dy || dx){
    view.x -= dx; view.y -= dy;
    clampPan(); applyTransform();
    markPadInput();
  }

  // —— 左摇杆（未聚焦列表时移动光标）
  const lx = pad.axes[0] || 0, ly = pad.axes[1] || 0;
  if(Math.abs(lx) > 0.5 && now - GP.repeat.cursor > 200){
    GP.repeat.cursor = now;
    if(lx > 0) moveFocus(1); else moveFocus(-1);
  }
}

function tick(pad, b, name, now, ms){
  const v = pad.buttons[b];
  const p = !!(v && (v.pressed || v.value > 0.5));
  if(!p){ GP.repeat[name] = 0; return false; }
  if(!GP.repeat[name]){ GP.repeat[name] = now; return true; }
  if(now - GP.repeat[name] > ms){ GP.repeat[name] = now; return true; }
  return false;
}

function markPadInput(){
  document.body.classList.add('gp-nav');
}

/* ---------- 动作 ---------- */
function cycleTab(dir){
  const tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  if(!tabs.length) return;
  let i = tabs.findIndex(t => t.classList.contains('on'));
  i = (i + dir + tabs.length) % tabs.length;
  tabs[i].click();
  showPadHint(tabs[i].textContent.replace(/\d+.*$/, '').trim());
}

function cycleCat(dir){
  if(state.tab !== 'all') return;
  const groups = Array.prototype.slice.call(document.querySelectorAll('.group'));
  if(!groups.length) return;
  let cur = groups.findIndex(g => g.classList.contains('open'));
  if(cur < 0) cur = 0;
  else { groups[cur].classList.remove('open'); state.collapsed.add(groups[cur].dataset.cat); }
  const next = (cur + dir + groups.length) % groups.length;
  groups[next].classList.add('open');
  state.collapsed.delete(groups[next].dataset.cat);
  groups[next].scrollIntoView({ block: 'start', behavior: 'smooth' });
  const nm = groups[next].querySelector('.gname');
  showPadHint(nm ? nm.firstChild.textContent : '');
}

function padConfirm(){
  if(document.getElementById('zoneModal').classList.contains('show')){
    // 细部图内：确认 = 切楼层
    const fl = document.querySelectorAll('#zFloors .zfloor');
    let i = Array.prototype.findIndex.call(fl, f => f.classList.contains('on'));
    if(fl.length) fl[(i + 1) % fl.length].click();
    return;
  }
  if(document.getElementById('zonePick').classList.contains('show')) return;
  if(document.getElementById('padModal').classList.contains('show')){ document.getElementById('padModal').classList.remove('show'); return; }
  if(document.getElementById('modal').classList.contains('show')){ document.getElementById('mOk').click(); return; }
  let el = document.querySelector('.gp-on');
  if(!el){ focusFirst(); el = document.querySelector('.gp-on'); }
  if(el){ el.click(); refocus(); }
}

function padBack(){
  if(document.getElementById('padModal').classList.contains('show')){ document.getElementById('padModal').classList.remove('show'); return; }
  if(document.getElementById('zoneModal').classList.contains('show')){ closeZone(); return; }
  if(document.getElementById('zonePick').classList.contains('show')){ document.getElementById('zonePick').classList.remove('show'); return; }
  if(document.getElementById('modal').classList.contains('show')){ document.getElementById('modal').classList.remove('show'); return; }
  const d = document.getElementById('detail');
  if(d.classList.contains('show')){ d.classList.remove('show'); state.sel = null; refreshPinStates(); return; }
  // 关掉当前选中分类
  const open = document.querySelector('.group.open');
  if(open){ open.classList.remove('open'); state.collapsed.add(open.dataset.cat); }
}

function padDetail(){
  const el = document.querySelector('.gp-on');
  if(!el) return;
  const pin = el.dataset.pin;
  if(pin){ selectPin(pin, true); }
}

function padToggleDone(){
  const el = document.querySelector('.gp-on');
  if(!el) return;
  const chk = el.querySelector('[data-check]');
  if(chk){ chk.click(); refocus(); return; }
  const zp = el.dataset.zpin;
  if(zp){ togglePin(zp); }
}

function padZone(){
  const d = document.getElementById('zoneModal');
  if(d.classList.contains('show')){ closeZone(); return; }
  const el = document.querySelector('.gp-on');
  const pin = el && el.dataset.pin;
  if(pin){
    const p = PIN_INDEX.find(x => x.id === pin);
    const zk = p && AREA_TO_ZONE[p.area];
    if(zk){ openZone(zk, 0); return; }
  }
  document.getElementById('zonePick').classList.add('show');
}

/* ---------- 提示条 ---------- */
let hintTimer;
function showPadHint(text){
  let h = document.getElementById('padhint');
  if(!h){
    h = document.createElement('div');
    h.id = 'padhint';
    h.className = 'padhint';
    document.body.appendChild(h);
  }
  h.innerHTML = text
    ? `<span>${text}</span>`
    : '';
  h.classList.add('show');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => h.classList.remove('show'), 1600);
}
function hidePadHint(){
  const h = document.getElementById('padhint');
  if(h) h.classList.remove('show');
}

/* ---------- 手柄按键条 ---------- */
function renderPadBar(){
  const bar = document.getElementById('padbar');
  if(!bar) return;
  bar.innerHTML = `
    <span><i>×</i>确认</span>
    <span><i>○</i>返回</span>
    <span><i>△</i>详情</span>
    <span><i>□</i>勾选</span>
    <span><i>L1</i><i>R1</i>页签</span>
    <span><i>L2</i><i>R2</i>分类</span>
    <span><i>十字</i><i>R</i>平移</span>
    <span><i>Opt</i>区域图</span>
    <span><i>L3</i>复位</span>`;
}

/* ---------- 初始化 ----------
   本页不接真实手柄：只保留键盘导航。
   「手柄」按钮打开的是主机按键对照表（PS / Xbox 键位说明），不读取手柄输入。
   USE_REAL_PAD 置 true 可恢复真实手柄支持。
*/
const USE_REAL_PAD = false;

function initGamepad(){
  if(!USE_REAL_PAD){
    // 纯说明模式：不加手柄事件、不轮询、不显示底部按键条
    const bar = document.getElementById('padbar');
    if(bar) bar.style.display = 'none';
    return;
  }
  renderPadBar();
  window.addEventListener('gamepadconnected', e => {
    GP.connected = true;
    document.body.classList.add('gp-nav');
    showPadHint('手柄已连接：' + (e.gamepad.id || '').slice(0, 28));
    // 给所有可聚焦元素加类
    markFocusables();
  });
  window.addEventListener('gamepaddisconnected', () => {
    GP.connected = false;
    document.body.classList.remove('gp-nav');
    hidePadHint();
  });
  if(navigator.getGamepads){
    const pads = navigator.getGamepads();
    for(let i = 0; i < pads.length; i++){
      if(pads[i]){
        setTimeout(() => {
          document.body.classList.add('gp-nav');
          markFocusables();
          showPadHint('手柄已连接');
        }, 600);
        break;
      }
    }
  }
  gpLoop();
}

/* 给互动元素打上可聚焦标记 */
function markFocusables(){
  const sel = '.tab, .group-head, .item, .mini, .btn, .mbtn, .zfloor, .zitem, .ach, .rshead, .rsteps li, .rtrick, .zpick, .lg, .mgline, .zclose, .legend-head';
  document.querySelectorAll(sel).forEach(el => el.classList.add('gp-focus'));
}

/* MutationObserver：内容变化后补标记并保持焦点 */
function watchFocus(){
  const mo = new MutationObserver(() => {
    markFocusables();
    refocus();
  });
  mo.observe(document.getElementById('scroll'), { childList: true, subtree: true });
  ['zoneGrid', 'zFloors', 'zList'].forEach(id => {
    const el = document.getElementById(id);
    if(el) mo.observe(el, { childList: true, subtree: true });
  });
}
