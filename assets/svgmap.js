/* assets/svgmap.js — 程序化生成地图 SVG，注入 #stage */
const PAL = {
  isle:  ['#7f9d6c', '#3f5a40', '#a9c79a'],
  isle2: ['#6d8263', '#374d3b', '#9db892'],
  ind:   ['#5e6a77', '#2c3843', '#93aec2'],
  crypt: ['#6d6559', '#37332e', '#d3c19a'],
  castle:['#5e4a55', '#2b2430', '#d79aa9'],
  sand:  ['#8c8467', '#4b4738', '#e0d29e'],
  dark:  ['#4c465d', '#262234', '#bda9f0'],
  water: ['#3d6a78', '#173540', '#7fbdd2']
};

const BLOBS = [
  { k:'isle',  t:'forest', p:[[690,1130],[686,1084],[706,1042],[740,1012],[790,986],[848,972],[910,980],[968,972],[1024,996],[1066,1030],[1090,1074],[1082,1120],[1046,1162],[996,1192],[936,1208],[872,1218],[812,1200],[756,1186],[712,1162]] },
  { k:'isle',  t:'forest', p:[[600,706],[596,624],[650,566],[712,522],[790,494],[870,478],[950,486],[1030,494],[1108,530],[1160,600],[1180,668],[1170,740],[1120,800],[1050,826],[980,862],[900,872],[820,860],[752,834],[688,800],[630,760]] },
  { k:'isle',  t:'forest', p:[[398,404],[396,330],[452,272],[524,232],[600,214],[680,198],[752,222],[800,278],[806,350],[780,418],[730,458],[668,492],[600,500],[530,488],[462,460],[414,430]] },
  { k:'isle2', t:'forest', p:[[1100,980],[1098,936],[1130,906],[1180,886],[1240,878],[1290,896],[1318,930],[1314,982],[1280,1018],[1224,1030],[1168,1030],[1122,1010]] },
  { k:'isle2', t:'forest', p:[[1218,792],[1216,740],[1256,706],[1308,684],[1366,676],[1420,690],[1460,720],[1474,768],[1470,812],[1440,846],[1386,858],[1320,852],[1262,832],[1228,812]] },
  { k:'ind',   t:'grid',   p:[[920,300],[922,246],[948,202],[990,176],[1040,162],[1096,148],[1156,138],[1218,146],[1276,164],[1330,196],[1364,240],[1384,292],[1382,346],[1358,394],[1312,430],[1254,450],[1190,462],[1128,458],[1070,448],[1016,428],[968,396],[936,350]] },
  { k:'dark',  t:'grid',   p:[[846,196],[848,152],[878,126],[918,116],[958,132],[982,160],[978,194],[948,220],[900,226],[864,216]] },
  { k:'sand',  t:'hatch',  p:[[320,240],[322,190],[356,164],[402,152],[452,162],[486,188],[492,228],[474,264],[430,282],[376,284],[334,268]] },
  { k:'crypt', t:'tomb',   p:[[1412,962],[1416,908],[1462,878],[1524,864],[1588,862],[1636,884],[1656,922],[1648,962],[1618,992],[1568,1008],[1512,1018],[1458,1006],[1424,988]] },
  { k:'castle',t:'tomb',   p:[[1424,438],[1428,376],[1470,330],[1526,302],[1588,294],[1648,292],[1700,314],[1734,356],[1742,404],[1724,450],[1680,484],[1626,502],[1566,510],[1512,498],[1466,470]] },
  { k:'isle2', t:'forest', p:[[408,886],[406,848],[436,826],[474,818],[508,830],[522,858],[514,890],[486,908],[444,910],[416,900]] },
  { k:'water', t:'wave',   p:[[600,1006],[604,960],[640,930],[690,918],[740,926],[774,952],[782,988],[764,1022],[722,1044],[670,1048],[626,1034]] },
  { k:'dark',  t:'grid',   p:[[268,668],[270,628],[300,606],[336,602],[366,616],[378,646],[370,676],[340,696],[302,696],[278,684]] },
  { k:'isle2', t:'forest', p:[[1662,1088],[1664,1056],[1692,1040],[1724,1042],[1746,1060],[1748,1086],[1730,1106],[1698,1112],[1674,1104]] },
  { k:'sand',  t:'hatch',  p:[[798,944],[800,924],[822,914],[846,920],[856,938],[850,954],[830,962],[808,958]] },
  { k:'dark',  t:'grid',   p:[[542,1122],[546,1090],[572,1072],[606,1072],[630,1090],[634,1118],[620,1142],[588,1152],[558,1144]] },
  { k:'crypt', t:'tomb',   p:[[1428,850],[1430,824],[1456,808],[1490,806],[1514,820],[1520,844],[1504,862],[1472,868],[1444,864]] }
];

function smoothPath(pts, tension){
  tension = tension == null ? 0.2 : tension;
  const n = pts.length;
  let d = '';
  for(let i = 0; i < n; i++){
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) * tension, c1y = p1[1] + (p2[1] - p0[1]) * tension;
    const c2x = p2[0] - (p3[0] - p1[0]) * tension, c2y = p2[1] - (p3[1] - p1[1]) * tension;
    if(i === 0) d += 'M' + p1[0].toFixed(1) + ',' + p1[1].toFixed(1);
    d += 'C' + c1x.toFixed(1) + ',' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ',' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
  }
  return d + 'Z';
}

function insetPts(pts, k){
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return pts.map(p => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]);
}

function texLayer(b){
  const cx = b.p.reduce((s, p) => s + p[0], 0) / b.p.length;
  const cy = b.p.reduce((s, p) => s + p[1], 0) / b.p.length;
  const xs = b.p.map(p => p[0]), ys = b.p.map(p => p[1]);
  const w = Math.max.apply(null, xs) - Math.min.apply(null, xs);
  const h = Math.max.apply(null, ys) - Math.min.apply(null, ys);
  let s = '';
  const path = smoothPath(b.p);
  if(b.t === 'forest'){
    let seed = 11 + cx;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for(let i = 0; i < 13; i++){
      const x = cx + (rnd() - 0.5) * w * 0.74, y = cy + (rnd() - 0.5) * h * 0.7;
      const r = 5 + rnd() * 4;
      s += '<path d="M' + x.toFixed(0) + ' ' + (y - r).toFixed(0) + ' l ' + (r * .78).toFixed(1) + ' ' + r.toFixed(1) +
           ' l ' + (-r * 1.56).toFixed(1) + ' 0 Z" fill="#1d3325" opacity="0.45"/>';
    }
    s += '<path d="' + path + '" fill="url(#texHatch)" opacity="0.55"/>';
  } else if(b.t === 'grid'){
    s += '<path d="' + path + '" fill="url(#texGrid)" opacity="0.85"/>';
  } else if(b.t === 'wave'){
    s += '<path d="' + path + '" fill="url(#texWave)" opacity="0.9"/>';
  } else if(b.t === 'tomb'){
    s += '<path d="' + path + '" fill="url(#texTomb)" opacity="0.8"/>';
  } else if(b.t === 'hatch'){
    s += '<path d="' + path + '" fill="url(#texHatch)" opacity="0.6"/>';
  }
  return s;
}

function buildSVG(){
  let o = '';
  o += '<defs>';
  o += '<linearGradient id="seaG" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0%" stop-color="#08161e"/><stop offset="50%" stop-color="#0d2129"/><stop offset="100%" stop-color="#061118"/></linearGradient>';
  o += '<filter id="sb" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="16"/></filter>';
  o += '<filter id="sb2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>';
  o += '<pattern id="texHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(36)"><line x1="0" y1="0" x2="0" y2="7" stroke="#d4e8da" stroke-width="1" stroke-opacity="0.11"/></pattern>';
  o += '<pattern id="texGrid" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(12)"><path d="M0 0 H22 M0 0 V22" stroke="#b9d4e4" stroke-width="1" stroke-opacity="0.10"/></pattern>';
  o += '<pattern id="texWave" width="26" height="14" patternUnits="userSpaceOnUse"><path d="M0 7 q 6.5 -6 13 0 t 13 0" stroke="#9fd8e8" stroke-width="1.1" fill="none" stroke-opacity="0.24"/></pattern>';
  o += '<pattern id="texTomb" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)"><line x1="0" y1="0" x2="0" y2="11" stroke="#e8dcc0" stroke-width="1" stroke-opacity="0.10"/></pattern>';
  BLOBS.forEach((b, i) => {
    const c = PAL[b.k];
    o += '<radialGradient id="tg' + i + '" cx="45%" cy="38%" r="68%"><stop offset="0%" stop-color="' + c[0] + '"/><stop offset="100%" stop-color="' + c[1] + '"/></radialGradient>';
  });
  o += '</defs>';

  o += '<rect width="2000" height="1400" fill="url(#seaG)"/>';
  o += '<g fill="none" stroke="#2e6577" stroke-opacity="0.26" stroke-width="1.1">' +
    '<path d="M-40 176 Q 320 116 660 176 T 1300 156 T 1900 196 T 2060 172"/>' +
    '<path d="M-40 232 Q 320 172 660 232 T 1300 212 T 1900 252 T 2060 228"/>' +
    '<path d="M-40 1086 Q 320 1026 660 1086 T 1300 1066 T 1900 1106 T 2060 1082"/>' +
    '<path d="M-40 1156 Q 320 1096 660 1156 T 1300 1136 T 1900 1176 T 2060 1152"/>' +
    '<path d="M-40 1326 Q 340 1286 700 1316 T 1400 1296 T 2060 1332"/>' +
    '<path d="M150 624 Q 380 694 566 648"/>' +
    '<path d="M1520 1176 Q 1760 1232 1960 1186"/></g>';
  o += '<g fill="none" stroke="#4d97aa" stroke-opacity="0.12" stroke-width="1">' +
    '<path d="M120 76 Q 420 32 760 68 T 1420 52 T 2000 84"/>' +
    '<path d="M0 1236 Q 380 1192 760 1230 T 1440 1210 T 2000 1242"/></g>';

  BLOBS.forEach((b, i) => {
    const c = PAL[b.k];
    const path = smoothPath(b.p);
    o += '<path d="' + smoothPath(insetPts(b.p, 1.10)) + '" fill="' + c[1] + '" opacity="0.34" filter="url(#sb)"/>';
    o += '<path d="' + smoothPath(b.p.map(p => [p[0] + 5, p[1] + 9])) + '" fill="#000" opacity="0.36" filter="url(#sb2)"/>';
    o += '<path d="' + path + '" fill="url(#tg' + i + ')" stroke="' + c[2] + '" stroke-width="2.2" stroke-opacity="0.55"/>';
    o += '<path d="' + smoothPath(insetPts(b.p, 0.955)) + '" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1.2"/>';
    o += texLayer(b);
  });
  return o;
}

function mountMap(){
  const img = document.getElementById('mapimg');
  if(img) img.remove();
  const holder = document.getElementById('stage');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 2000 1400');
  svg.setAttribute('width', '2000');
  svg.setAttribute('height', '1400');
  svg.setAttribute('id', 'mapsvg');
  svg.style.cssText = 'position:absolute;inset:0;width:2000px;height:1400px;pointer-events:none';
  svg.innerHTML = buildSVG();
  holder.insertBefore(svg, holder.firstChild);
}
