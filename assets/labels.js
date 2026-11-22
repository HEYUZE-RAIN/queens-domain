/* assets/labels.js — 地图上的区域标注与地标图标 */

const LABELS = [
  { n:'海岸林间', s:'COASTAL WOODS', x:888, y:1052, size:17, col:'#eaf3e4' },
  { n:'骑士营地', s:"KNIGHT'S ENCAMPMENT", x:906, y:706, size:18, col:'#f2f7ee' },
  { n:'墓地悬崖', s:'CEMETERY PRECIPICE', x:1194, y:924, size:12.5, col:'#e6f1de' },
  { n:'阿甘米的营地', s:'', x:1214, y:1046, size:11.5, col:'#eecb7c' },
  { n:'断裂之桥', s:'BROKEN BRIDGE', x:1350, y:836, size:12.5, col:'#e6f1de' },
  { n:'青翠山谷', s:'VERDANT HOLLOW', x:604, y:470, size:15, col:'#e6f1de' },
  { n:'普韦玛神殿', s:'TEMPLE OF PUWEMA', x:580, y:250, size:12, col:'#fdf2cf' },
  { n:'上古界域', s:'ANCIENT WORLD', x:1158, y:300, size:17, col:'#e8f2fa' },
  { n:'罪之记录', s:'RECORD OF SIN', x:912, y:158, size:12.5, col:'#efe9ff' },
  { n:'石化花园', s:'PETRIFIED GARDEN', x:408, y:190, size:12.5, col:'#f7efd6' },
  { n:'西拉阿兹城堡', s:'SIRAATSU CASTLE', x:1584, y:486, size:16, col:'#fceef1' },
  { n:'迪姆波陵墓', s:'DEIMPO MAUSOLEUM', x:1530, y:948, size:13.5, col:'#f4efe2' },
  { n:'知识之塔', s:'TOWER OF KNOWLEDGE', x:470, y:872, size:12, col:'#e6f1de' },
  { n:'奥布穆尔神殿', s:'OBMUER TEMPLE', x:692, y:996, size:12.5, col:'#dff1f7' },
  { n:'腐烂洞窟', s:'', x:648, y:392, size:11.5, col:'#cfe0c8' },
  { n:'被遗忘的地牢', s:'FORGOTTEN DUNGEON', x:322, y:656, size:11, col:'#e7e2f6' },
  { n:'吉格基神殿', s:"JIGEKI'S TEMPLE", x:830, y:912, size:9.5, col:'#fff2d6' },
  { n:'冥界', s:'UNDERWORLD', x:588, y:1120, size:11, col:'#d3c6f5' },
  { n:'陵墓屋顶', s:'MAUSOLEUM ROOF', x:1474, y:800, size:9.5, col:'#efe4cf' },
  { n:'城堡大桥', s:'', x:1340, y:462, size:10.5, col:'#e9dfc8' },
  { n:'乌姆巴达贸易站', s:"UMBADA'S OUTPOST", x:1706, y:1086, size:9.5, col:'#f5e6b8' }
];

/* 标签避让：记录已占用的矩形，自动上移/下移重复位置 */
const CAVG = [];

const LABELS_DISABLED = true;   // 区域名改由 mapdraw.js 统一绘制

function renderLabels(){
  if(LABELS_DISABLED){ const l=document.getElementById('labels'); if(l) l.innerHTML=''; return; }
  const layer = document.getElementById('labels');
  if(!layer) return;
  let s = '';
  CAVG.length = 0;
  LABELS.forEach(L => {
    if(L.hide) return;
    // 与已有标签重叠时下移，避免糊在一起
    let y = L.y;
    for(let k = 0; k < 6; k++){
      const hit = CAVG.some(c => Math.abs(c.x - L.x) < (c.w + L.n.length * L.size * 0.6) * 0.55 && Math.abs(c.y - y) < 22);
      if(!hit) break;
      y += 24;
    }
    CAVG.push({ x: L.x, y, w: L.n.length * L.size * 0.62 });
    s += '<text x="' + L.x + '" y="' + y + '" text-anchor="middle" style="font-family:Georgia,serif;font-size:' + L.size +
         'px;letter-spacing:' + (L.size * 0.22).toFixed(1) + 'px;fill:' + L.col + ';opacity:.93;paint-order:stroke" stroke="#07131a" stroke-width="3.4" stroke-opacity="0.66">' + L.n + '</text>';
    if(L.s){
      s += '<text x="' + L.x + '" y="' + (y + L.size * 0.92).toFixed(1) + '" text-anchor="middle" style="font-family:Georgia,serif;font-size:' +
           Math.max(8, L.size * 0.55) + 'px;letter-spacing:' + (L.size * 0.12).toFixed(1) + 'px;fill:' + L.col + ';opacity:.55;paint-order:stroke" stroke="#07131a" stroke-width="2.8" stroke-opacity="0.62">' + L.s + '</text>';
    }
  });
  layer.innerHTML = s;
}
