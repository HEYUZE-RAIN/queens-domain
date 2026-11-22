/* =========================================================
   assets/markers.js — 地图地标图形（程序化 SVG，编组后可整体缩放）
   ========================================================= */

const LANDMARKS = [
  /* --- 起始岛 --- */
  { t:'temple', x:868, y:1148, s:1.0, label:'神殿' },
  { t:'camp',   x:922, y:1118, s:0.9 },
  { t:'misc',   x:1036, y:1188, s:0.8, kind:'wreck' },
  { t:'tree',   x:790, y:1064, s:0.9 },

  /* --- 中央大岛 --- */
  { t:'camp',   x:770, y:722, s:1.1 },
  { t:'temple', x:896, y:632, s:1.2, label:'神殿前庭' },
  { t:'tree',   x:680, y:662, s:1.0 },
  { t:'tree',   x:1040, y:700, s:1.0 },
  { t:'ruin',   x:958, y:800, s:0.9 },

  /* --- 墓地 --- */
  { t:'grave',  x:1136, y:950, s:1.0 },
  { t:'grave',  x:1206, y:986, s:1.0 },
  { t:'grave',  x:1262, y:944, s:0.9 },
  { t:'camp',   x:1216, y:1024, s:0.8 },

  /* --- 断桥 / 塔 --- */
  { t:'tower',  x:1338, y:760, s:1.0 },
  { t:'ruin',   x:1444, y:760, s:0.8 },

  /* --- 知识之塔 --- */
  { t:'tower',  x:452, y:848, s:1.25, label:'知识之塔' },

  /* --- 奥布穆尔神殿 --- */
  { t:'temple', x:690, y:968, s:1.0, label:'沉没神殿' },

  /* --- 青翠山谷 --- */
  { t:'tree',   x:492, y:372, s:1.0 },
  { t:'tree',   x:700, y:398, s:1.0 },
  { t:'temple', x:580, y:300, s:0.9 },

  /* --- 上古界域 --- */
  { t:'factory',x:1044, y:216, s:1.0 },
  { t:'tower3', x:1120, y:238, s:1.0 },
  { t:'tower3', x:1018, y:346, s:0.7 },
  { t:'tower3', x:1266, y:358, s:0.7 },
  { t:'factory',x:1210, y:404, s:0.9 },

  /* --- 罪之记录 --- */
  { t:'tower',  x:906, y:186, s:1.15 },

  /* --- 石化花园 --- */
  { t:'garden', x:406, y:238, s:1.0 },

  /* --- 西拉阿兹城堡 --- */
  { t:'castle', x:1584, y:404, s:1.15 },

  /* --- 迪姆波陵墓 --- */
  { t:'tomb',   x:1524, y:938, s:1.1, label:'陵墓' },
  { t:'tomb',   x:1472, y:832, s:0.8 },

  /* --- 地牢 --- */
  { t:'cave',   x:322, y:648, s:1.0 },

  /* --- 冥界 --- */
  { t:'gate',   x:588, y:1110, s:0.9 },

  /* --- 贸易站 --- */
  { t:'shop',   x:1702, y:1070, s:0.9 },

  /* --- 吉格基神殿 --- */
  { t:'temple', x:828, y:938, s:0.7 }
];

function lmSVG(l){
  const s = l.s || 1;
  const k = 1;
  let g = '';
  const gold = '#e8c26a';
  switch(l.t){
    case 'temple':
      g = `<g fill="#4a3f33" stroke="${gold}" stroke-width="1.2" stroke-opacity=".75">
        <path d="M-16 12 L-16 -2 L0 -16 L16 -2 L16 12 Z" fill="#3d342a"/>
        <path d="M-16 -2 L0 -14 L16 -2" fill="none"/>
        <rect x="-3" y="2" width="6" height="10" fill="#e8c26a" fill-opacity=".35" stroke="none"/>
        <path d="M-19 14 H19" stroke="${gold}" stroke-opacity=".45"/>
      </g>`;
      break;
    case 'camp':
      g = `<g stroke="#c9b18a" stroke-width="1.2" fill="none" stroke-opacity=".8">
        <path d="M-14 10 L0 -8 L14 10 Z" fill="#4b3f31"/>
        <path d="M0 -8 V10" stroke-opacity=".5"/>
        <path d="M-16 12 H16" stroke-opacity=".4"/>
      </g>`;
      break;
    case 'grave':
      g = `<g stroke="#d8d2bb" stroke-width="1.1" fill="none" stroke-opacity=".62">
        <path d="M-8 10 V-6 M-8 -6 h-5 M-8 -10 h5"/>
        <path d="M2 10 V-2 M2 -2 h-4 M2 -6 h4"/>
      </g>`;
      break;
    case 'tower':
      g = `<g fill="#40382f" stroke="#d3c19a" stroke-width="1.1" stroke-opacity=".8">
        <path d="M-7 14 L-5 -8 L-7 -14 L7 -14 L5 -8 L7 14 Z"/>
        <path d="M-5 -8 H5" fill="none"/>
        <circle cx="0" cy="-2" r="2.4" fill="#e8c26a" fill-opacity=".55" stroke="none"/>
      </g>`;
      break;
    case 'tower3':
      g = `<g stroke="#8fe2ff" stroke-width="1.2" fill="#255066" fill-opacity=".9">
        <path d="M-10 10 L0 -12 L10 10 Z"/>
        <path d="M-10 10 H10" stroke-opacity=".55"/>
        <circle cx="0" cy="4" r="2" fill="#8fe2ff" fill-opacity=".7" stroke="none"/>
      </g>`;
      break;
    case 'factory':
      g = `<g fill="#3a4450" stroke="#9fb8c9" stroke-width="1.1" stroke-opacity=".7">
        <rect x="-13" y="-4" width="26" height="14"/>
        <path d="M-9 -4 V-12 H-3 V-4 M5 -4 V-9 H11 V-4" fill="none"/>
      </g>`;
      break;
    case 'castle':
      g = `<g fill="#3b2f3a" stroke="#d79aa9" stroke-width="1.2" stroke-opacity=".85">
        <path d="M-16 14 V-4 H-11 V-10 H-5 V-4 H5 V-10 H11 V-4 H16 V14 Z"/>
        <path d="M-6 14 V4 H6 V14" fill="#1a141c"/>
        <path d="M-18 16 H18" stroke-opacity=".4"/>
      </g>`;
      break;
    case 'tomb':
      g = `<g fill="#3a352e" stroke="#d3c19a" stroke-width="1.1" stroke-opacity=".75">
        <path d="M-12 12 V-6 L0 -14 L12 -6 V12 Z"/>
        <path d="M0 12 V2" fill="none"/>
        <path d="M-14 14 H14" stroke-opacity=".35"/>
      </g>`;
      break;
    case 'garden':
      g = `<g fill="#6b6450" stroke="#e0d29e" stroke-width="1" stroke-opacity=".7">
        <path d="M-9 10 L-6 -8 L-3 10 Z"/><path d="M2 10 L5 -10 L8 10 Z"/>
        <circle cx="0" cy="4" r="14" fill="none" stroke-opacity=".28" stroke-dasharray="3 4"/>
      </g>`;
      break;
    case 'cave':
      g = `<g fill="#1a1a24" stroke="#b6aede" stroke-width="1.1" stroke-opacity=".7">
        <path d="M-13 10 Q-11 -6 0 -8 Q11 -6 13 10 Z"/>
        <path d="M-4 10 Q-3 2 0 2 Q3 2 4 10" fill="#0b0a12"/>
      </g>`;
      break;
    case 'gate':
      g = `<g stroke="#bda9f0" stroke-width="1.2" fill="none" stroke-opacity=".75">
        <path d="M-10 10 V-4 Q0 -14 10 -4 V10"/>
        <path d="M-13 12 H13" stroke-opacity=".4"/>
      </g>`;
      break;
    case 'shop':
      g = `<g stroke="${gold}" stroke-width="1.2" fill="none" stroke-opacity=".8">
        <path d="M-11 10 V-2 L0 -10 L11 -2 V10 Z" fill="#443a25"/>
        <path d="M-13 -2 H13" stroke-opacity=".5"/>
      </g>`;
      break;
    case 'tree':
      g = `<g fill="#22402c" stroke="#7fae7a" stroke-width=".9" stroke-opacity=".35">
        <path d="M-11 8 L0 -10 L11 8 Z"/><path d="M0 8 V14" stroke="#3a4a34" stroke-width="1.6"/>
      </g>`;
      break;
    case 'ruin':
      g = `<g stroke="#a9a08a" stroke-width="1.1" fill="none" stroke-opacity=".55">
        <path d="M-10 10 V-2 H-4 V6 M0 10 V-8 H6 V10 M9 10 V0"/>
      </g>`;
      break;
    case 'gap':
      g = `<g stroke="#8fb9c9" stroke-width="1.2" fill="none" stroke-opacity=".6">
        <path d="M-14 8 H-4 M4 8 H14"/>
        <path d="M-4 -2 Q0 6 4 -2" stroke-dasharray="3 3"/>
      </g>`;
      break;
    case 'bridge':
      g = `<g stroke="#e0d29e" stroke-width="1.3" fill="none" stroke-opacity=".75">
        <path d="M-16 6 Q0 -8 16 6"/>
        <path d="M-16 6 V10 M16 6 V10 M-8 0 V6 M0 -4 V6 M8 0 V6"/>
      </g>`;
      break;
    case 'wreck':
      g = `<g stroke="#b6a077" stroke-width="1.3" fill="none" stroke-opacity=".7">
        <path d="M-12 6 Q-4 -2 4 2 Q10 5 14 2"/>
        <path d="M-2 2 V-10 M-2 -10 H8"/>
      </g>`;
      break;
  }
  const label = l.label
    ? `<text x="0" y="34" style="font-family:Georgia,'Songti SC',serif;font-size:11px;letter-spacing:1.6px;fill:#f2ead6;opacity:.72;paint-order:stroke" stroke="#07131a" stroke-width="2.4" stroke-opacity=".55" text-anchor="middle">${l.label}</text>`
    : '';
  return `<g transform="translate(${l.x},${l.y}) scale(${s})" opacity=".92">${g}${label}</g>`;
}

function renderLandmarks(){
  const layer = document.getElementById('landmarks');
  if(!layer) return;
  layer.innerHTML = LANDMARKS.map(lmSVG).join('');
}


/* 地标绘制接口（供 mapdraw.js 调用） */
const LM_SHAPE = { draw: lmSVG };
