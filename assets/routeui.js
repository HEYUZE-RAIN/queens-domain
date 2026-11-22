/* assets/routeui.js — 白金路线页签渲染 */

const RS_KEY = 'qd_route_steps_v1';
let R_DONE = new Set();
try { const r = localStorage.getItem(RS_KEY); if(r) R_DONE = new Set(JSON.parse(r)); } catch(e){}
function rsave(){ try{ localStorage.setItem(RS_KEY, JSON.stringify([...R_DONE])); }catch(e){} }

/* =========================================================
   剧透遮罩：进入剧透页签先盖住全部内容，确认后才渲染
   ========================================================= */
const SPOIL_TABS = { route: 1, grim: 1 };

function spoilGateEl(){ return document.getElementById('spoilGate'); }

function isSpoilLocked(tab){ return !!SPOIL_TABS[tab] && !SPOIL_ACK.has(tab); }

const SPOIL_ACK = (() => {
  try {
    const raw = localStorage.getItem('qd_spoil_ack_v1');
    return new Set(raw ? JSON.parse(raw) : []);
  } catch(e){ return new Set(); }
})();

function spoilAck(tab){
  SPOIL_ACK.add(tab);
  try { localStorage.setItem('qd_spoil_ack_v1', JSON.stringify([...SPOIL_ACK])); } catch(e){}
  hideSpoilGate();
}

/* 显示遮罩（覆盖整个侧栏内容区） */
function showSpoilGate(tab){
  const g = spoilGateEl();
  if(!g) return;
  const cfg = SPOIL_TABS[tab];
  const isRoute = tab === 'route';

  g.innerHTML = `
    <div class="sg-inner">
      <div class="sg-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2.4 22.2 20.6H1.8L12 2.4Z"/>
          <path d="M12 8.6v5.2"/><circle cx="12" cy="17.4" r="1" fill="currentColor" stroke="none"/>
        </svg>
      </div>
      <div class="sg-title">${isRoute ? '这不是给第一次玩的玩家看的' : '这也不是给第一次玩的玩家看的'}</div>
      <div class="sg-sub">${isRoute ? 'SPOILER · PLATINUM SPEED ROUTE' : 'SPOILER · WITCH\'S GRIMOIRE'}</div>

      <div class="sg-body">
        <p>${isRoute
          ? '本路线每一步都在<b>绕开正常流程</b>：提前开锁、跳车穿墙、跳过剧情、用魔典代码换后期武器，并在一周目内打完四个结局。'
          : '本页完整列出<b>全部 33 条魔典代码</b>及其奖励，包含后期武器、隐藏区域、Boss 与结局相关物品的名称。'}</p>
        <ul>
          <li><b>剧透拉满</b> —— 后续区域、隐藏 Boss、真结局与全遗物的位置和打法都直接写在里面。</li>
          <li><b>体验破坏</b> —— 会跳过本应作为核心乐趣的探索、解谜与成长曲线，<b>首周目照此推进会失去大部分乐趣</b>。</li>
          ${isRoute
            ? '<li><b>操作门槛</b> —— 跳车、卡位、五段冲刺越海等步骤容错很低，失败要读档重来。</li>'
            : '<li><b>易输错</b> —— 代码区分数字 0 与字母 O，输错即空耗一次充能。</li>'}
        </ul>
      </div>

      <div class="sg-acts">
        <button class="sg-back" id="sgBack">返回安全页</button>
        <button class="sg-ok" id="sgOk">我已通关 / 我已知晓，查看</button>
      </div>
      <div class="sg-foot">本次会话内不再提示 · 可以在侧栏重新进入该页签查看</div>
    </div>`;

  g.hidden = false;
  g.classList.add('show');

  const ok = g.querySelector('#sgOk');
  const back = g.querySelector('#sgBack');
  if(ok) ok.onclick = () => { spoilAck(tab); renderSidebar(); };
  if(back) back.onclick = () => {
    state.tab = 'all';
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x.dataset.tab === 'all'));
    hideSpoilGate();
    renderSidebar();
  };
}

function hideSpoilGate(){
  const g = spoilGateEl();
  if(g){ g.hidden = true; g.classList.remove('show'); g.innerHTML = ''; }
}

function renderRoute(){
  if(isSpoilLocked('route')){ showSpoilGate('route'); document.getElementById('scroll').innerHTML = ''; return; }
  hideSpoilGate();
  const scroll = document.getElementById('scroll');
  const total = ROUTE.stages.reduce((s, st) => s + st.steps.length, 0);
  const done = [...R_DONE].filter(k => k.indexOf('s:') === 0).length;
  const pct = total ? done / total * 100 : 0;

  let html = `
  <div class="rhead">
    <h3>${ROUTE.meta.title}</h3>
    <div class="rsub">${ROUTE.meta.sub}</div>
  </div>

  <div class="route-alert">
    <div class="ra-top">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2.6 22 20.4H2L12 2.6Z"/><path d="M12 9v4.6"/><circle cx="12" cy="17.2" r=".9" fill="currentColor" stroke="none"/>
      </svg>
      <b>这不是给第一次玩的玩家看的</b>
    </div>
    <div class="ra-body">
      <p class="ra-lead">本路线是<b>极致功利</b>的速通/白金方案 —— 它的每一步都在<b>绕开正常流程</b>：提前开锁、跳车穿墙、跳过剧情、用魔典代码换后期武器、在第一个周目里把四个结局全部打完。</p>
      <ul class="ra-list">
        <li><b>剧透拉满</b>：步骤里直接写出后期区域、隐藏 Boss、真结局与全遗物的位置和打法，看到即剧透。</li>
        <li><b>体验破坏</b>：大量使用破序与提前开锁，会跳过本应作为核心乐趣的探索、解谜与成长曲线，<b>一周目照此推进会失去大部分乐趣</b>。</li>
        <li><b>操作门槛</b>：跳车、卡位、五段冲刺越海等步骤容错很低，失败要读档重来。</li>
      </ul>
      <p class="ra-tail">建议只用两种情况打开本页：<b>已经通关过一遍</b>，或者<b>明确只想拿白金奖杯</b>、不在乎首次体验。想好好玩第一周目，请直接关掉。</p>
    </div>
  </div>

  <div class="rhead rhead-body">
    <p>${ROUTE.meta.intro}</p>
    <div class="rwarn">⚠ ${ROUTE.meta.patch}</div>
    <div class="rbar"><i style="width:${pct.toFixed(1)}%"></i></div>
    <div class="rbarfoot"><span>步骤进度</span><b>${done} / ${total}</b></div>
  </div>`;

  html += `<div class="rsec-t">六大原则</div><div class="rrules">` +
    ROUTE.rules.map(r => `<div class="rrule"><b>${r.t}</b><span>${r.d}</span></div>`).join('') + `</div>`;

  html += `<div class="rsec-t">路线阶段</div>`;

  ROUTE.stages.forEach((st, si) => {
    const keys = st.steps.map((_, i) => `s:${si}:${i}`);
    const dn = keys.filter(k => R_DONE.has(k)).length;
    const open = !state.collapsed.has('route' + si);
    html += `<section class="rstage ${open ? 'open' : ''}" data-rs="${si}">
      <button class="rshead" data-rtoggle="${si}">
        <span class="rn">${st.n}</span>
        <span class="rt">
          <b>${st.title}</b>
          <em>${st.period} · ${st.place}</em>
        </span>
        <span class="rprog">${dn}/${st.steps.length}</span>
        <span class="rmap" data-rgo="${si}" title="打开该区域细部图">${ICONS.map}</span>
        <span class="chev">${ICONS.chev}</span>
      </button>
      <div class="rsbody">
        <div class="rgoals">${st.goal.map(g => `<span class="rgoal">${g}</span>`).join('')}</div>
        <ol class="rsteps">
          ${st.steps.map((s, i) => {
            const k = `s:${si}:${i}`;
            const isKey = s.indexOf('★') === 0;
            const txt = s.replace(/^★+/, '');
            const strong = /\*\*(.+?)\*\*/;
            let body = escapeHtml(txt);
            body = body.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
            return `<li class="${R_DONE.has(k) ? 'done' : ''} ${isKey ? 'key' : ''}" data-rstep="${k}">
              <span class="rchk">${ICONS.check}</span>
              <span class="rtxt">${body}</span>
            </li>`;
          }).join('')}
        </ol>
        ${st.tip ? `<div class="rtip">${escapeHtml(st.tip)}</div>` : ''}
        ${st.check ? `<div class="rcheck"><b>离开前对一下</b>${st.check.map(c => `<span>${escapeHtml(c)}</span>`).join('')}</div>` : ''}
        <button class="rzone" data-rzone="${st.zone}">${ICONS.map} 打开该区域细部图</button>
      </div>
    </section>`;
  });

  html += `<div class="rsec-t">破序 / 邪道 / 省时技巧</div><div class="rtricks">` +
    ROUTE.tricks.map(t => `<div class="rtrick">
      <div class="rttop"><span class="rtag">${t.tag}</span><b>${t.t}</b>
        <button class="rgo" data-rzone="${t.z}">${ICONS.map}</button></div>
      <p>${t.d}</p></div>`).join('') + `</div>`;

  html += `<div class="rsec-t">已知 bug 与规避</div><div class="rbugs">` +
    ROUTE.bugs.map(b => `<div class="rbug"><span class="bv">${b.v}</span><b>${b.t}</b><p>${b.d}</p></div>`).join('') + `</div>
    <div class="rfine">资料来源：Output Lag / ShowGamer / TechRaptor / Prima Games / Steam 社区与 patch notes（1.01.03–1.01.07），核对至 2026-11-19。仅收录多次独立来源交叉印证的内容；标注「据称」「玩家报告」的条目为单一来源。</div>`;

  scroll.innerHTML = html;
  bindRouteEvents(scroll);
}

/* 把 **粗体** 转成 <b>，避免模板里转义层层嵌套 */
function mdBold(str){
  return String(str == null ? '' : str).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}

/* =========================================================
   魔典 33 条 · 独立页签
   ========================================================= */
function renderGrimoire(){
  if(isSpoilLocked('grim')){ showSpoilGate('grim'); document.getElementById('scroll').innerHTML = ''; return; }
  hideSpoilGate();
  const scroll = document.getElementById('scroll');
  const codes = GRIMOIRE.codes;
  const n = codes.length;

  let html = `
  <div class="grim-head">
    <h3>女巫魔典 · 33 条代码</h3>
    <div class="grim-sub">WITCH'S GRIMOIRE · ALL 33 CODES</div>
  </div>

  <div class="grim-alert">
    <div class="ra-top">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2.6 22 20.4H2L12 2.6Z"/><path d="M12 9v4.6"/><circle cx="12" cy="17.2" r=".9" fill="currentColor" stroke="none"/>
      </svg>
      <b>这也不是给第一次玩的玩家看的</b>
    </div>
    <div class="ra-body">
      <p class="ra-lead">本页完整列出<b>全部 33 条魔典代码</b>及其奖励 —— 其中包含<b>后期武器、隐藏区域、Boss 与结局相关物品</b>的中文名称，看到就等于剧透。</p>
      <ul class="ra-list">
        <li><b>剧透拉满</b>：代码表按分类列出全部奖励，等于把后期装备线一次性摊开。</li>
        <li><b>体验破坏</b>：用代码可以<b>跳过大量探索与解谜环节</b>，直接拿到本应后期才有的装备，<b>会极大破坏游戏体验</b>。</li>
        <li><b>易输错</b>：代码区分<code>数字 0</code>与<code>字母 O</code>、<code>数字 33</code>与<code>字母</code>，输错即空耗一次充能。</li>
      </ul>
      <p class="ra-tail">建议只用两种情况打开本页：<b>已经通关过一遍</b>，或者<b>专门做全收集/白金跑图</b>、把魔典当工具用。想好好玩第一周目，请直接关掉。</p>
    </div>
  </div>

  <div class="grim">
    <div class="gr-row"><b>位置</b><span>${mdBold(GRIMOIRE.where)}</span></div>
    <div class="gr-row"><b>用法</b><span>${mdBold(GRIMOIRE.how)}</span></div>
    <div class="gr-row"><b>充能</b><span>${mdBold(GRIMOIRE.recharge)}</span></div>
    <div class="gr-warn">⚠ ${mdBold(GRIMOIRE.warn)}</div>
    <div class="gr-pick">首选三条：${GRIMOIRE.pick.map(c => `<code>${c}</code>`).join(' ')}</div>
  </div>

  <div class="grim-list-head">
    <span>全部 ${n} 条</span>
    <span class="grim-hint">点击任意一行复制代码</span>
  </div>

  <div class="grtable">
    <div class="grhead"><span>代码</span><span>奖励 / 效果</span><span>类</span></div>
    ${codes.map(c => `<div class="grline ${c[3].indexOf('★') >= 0 ? 'star' : ''}" data-gcode="${c[0]}">
      <code>${c[0]}</code>
      <span><b>${c[1]}</b><em>${c[2]}</em></span>
      <i>${c[3].replace('★','')}</i>
    </div>`).join('')}
  </div>

  <div class="grnote">33 条代码均来自社区汇总（Steam 讨论区首发，Destructoid / ShowGamer / Yekpeak 交叉核对），实际数值以游戏内为准。点击任意一行代码可复制。</div>
  `;

  scroll.innerHTML = html;

  // 点击复制
  scroll.querySelectorAll('[data-gcode]').forEach(el => {
    el.style.cursor = 'copy';
    el.addEventListener('click', () => {
      const code = el.dataset.gcode;
      const done = () => {
        el.classList.add('copied');
        setTimeout(() => el.classList.remove('copied'), 900);
        if(typeof toast === 'function') toast('已复制 ' + code);
      };
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(code).then(done).catch(done);
      } else {
        try{
          const ta = document.createElement('textarea');
          ta.value = code; document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); document.body.removeChild(ta); done();
        }catch(e){ done(); }
      }
    });
  });

  scroll.scrollTop = 0;
}

function bindRouteEvents(scroll){
  scroll.querySelectorAll('[data-rtoggle]').forEach(b => b.addEventListener('click', e => {
    if(e.target.closest('[data-rzone]') || e.target.closest('[data-rgo]')) return;
    const si = b.dataset.rtoggle;
    if(state.collapsed.has('route' + si)) state.collapsed.delete('route' + si);
    else state.collapsed.add('route' + si);
    b.closest('.rstage').classList.toggle('open');
  }));
  scroll.querySelectorAll('[data-rgo]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const si = +b.dataset.rgo;
    const zk = ROUTE.stages[si].zone;
    if(ZONES[zk]) openZone(zk, 0);
  }));
  scroll.querySelectorAll('[data-rstep]').forEach(li => li.addEventListener('click', () => {
    const k = li.dataset.rstep;
    if(R_DONE.has(k)) R_DONE.delete(k); else R_DONE.add(k);
    rsave();
    li.classList.toggle('done');
    // 更新头部进度条
    const total = ROUTE.stages.reduce((s, st) => s + st.steps.length, 0);
    const done = [...R_DONE].filter(x => x.indexOf('s:') === 0).length;
    const bar = scroll.querySelector('.rbar > i');
    if(bar) bar.style.width = (done / total * 100).toFixed(1) + '%';
    const bf = scroll.querySelector('.rbarfoot b');
    if(bf) bf.textContent = done + ' / ' + total;
    const st = li.closest('.rstage');
    if(st){
      const idx = +st.dataset.rs;
      const p = st.querySelector('.rprog');
      if(p) p.textContent = ROUTE.stages[idx].steps.filter((_, i) => R_DONE.has(`s:${idx}:${i}`)).length + '/' + ROUTE.stages[idx].steps.length;
    }
  }));
  scroll.querySelectorAll('[data-gcode]').forEach(el => el.addEventListener('click', () => {
    const code = el.dataset.gcode;
    try{
      navigator.clipboard.writeText(code);
      toast('已复制 ' + code);
    }catch(e){ toast(code); }
  }));
  scroll.querySelectorAll('[data-rzone]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const z = b.dataset.rzone;
    if(ZONES[z]) openZone(z, 0); else toast('该区域暂无细部图');
  }));
}
