/* =========================================================
   assets/regions.js — 大地图区域元数据
   每块地图的：锚点、统计归属（zone key）、地标列表、连接关系
   ========================================================= */

/* 地标类型 → 绘制图形 key（见 markers.js 的 LM_SHAPE） */
const REGIONS = [
  {
    id:'camp', lab:'骑士营地', en:"KNIGHT'S ENCAMPMENT", zone:'isle', k:'isle',
    anchor:[864, 714], stat:true,
    note:'开局营地。埃孔塔给锈蚀短剑，向西破栅栏进第一个水晶碑。',
    marks:[
      { t:'camp',  x:830, y:726, s:1.1, label:'营地' },
      { t:'temple',x:898, y:660, s:1.35, label:'恩杜神殿' },
      { t:'tree',  x:676, y:692, s:1.0 },
      { t:'tree',  x:1052,y:706, s:1.0 },
      { t:'ruin',  x:954, y:826, s:0.9, label:'废墟' }
    ]
  },
  {
    id:'coast', lab:'海岸林间', en:'COASTAL WOODS', zone:'isle', k:'isle',
    anchor:[935, 1156], stat:false,
    note:'起始海滩。大树背面藏《女巫魔典》，岛链上有飞刀腰带。',
    marks:[
      { t:'temple',x:911, y:1198, s:1.0, label:'风剑神殿' },
      { t:'tree',  x:815, y:1106, s:1.0, label:'魔典大树' },
      { t:'misc',  x:1040,y:1190, s:0.85, kind:'wreck', label:'沉船' },
      { t:'ruin',  x:1011, y:1108, s:0.8 }
    ]
  },
  {
    id:'cemetery', lab:'墓地悬崖', en:'CEMETERY PRECIPICE', zone:'isle', k:'isle2',
    anchor:[1267, 1014], stat:true,
    note:'蓝光水晶碑俯瞰断桥。第二颗风之宝石在东侧石塔顶。',
    marks:[
      { t:'grave', x:1204, y:979, s:1.0, label:'墓地' },
      { t:'grave', x:1214,y:988, s:0.95 },
      { t:'grave', x:1267, y:958, s:0.85 },
      { t:'camp',  x:1218,y:1026, s:0.8, label:'阿甘米营地' }
    ]
  },
  {
    id:'bridge', lab:'断裂之桥', en:'BROKEN BRIDGE', zone:'isle', k:'isle2',
    anchor:[1359, 769], stat:true,
    note:'两段风之冲刺越过。桥拱上方与桥下洞穴各有一处收集。',
    marks:[
      { t:'tower', x:1338,y:756, s:1.0, label:'桥塔' },
      { t:'ruin',  x:1440,y:766, s:0.85 },
      { t:'misc',  x:1298,y:800, s:0.8, kind:'gap', label:'断口' }
    ]
  },
  {
    id:'tower', lab:'知识之塔', en:'TOWER OF KNOWLEDGE', zone:'tower', k:'isle2',
    anchor:[430, 800], stat:true,
    note:'四层：大厅、石像鬼阳台、档案馆、地下室。打完死灵之书用强酸飞刀清血肉。',
    marks:[
      { t:'tower', x:430, y:798, s:0.95, label:'知识之塔' },
      { t:'ruin',  x:458, y:826, s:0.6 }
    ]
  },
  {
    id:'obmuer', lab:'奥布穆尔神殿', en:'OBMUER TEMPLE', zone:'obmuer', k:'water',
    anchor:[619, 995], stat:true,
    note:'沉没神殿。四块三角石板在门外水淹遗迹，双钥匙开主路，达古姆在尽头。',
    marks:[
      { t:'temple',x:620, y:1035, s:1.1, label:'沉没神殿' },
      { t:'misc',  x:575, y:1027,s:0.8, kind:'cave', label:'埃尔玛洞窟' },
      { t:'tower', x:643, y:1023, s:0.7, label:'烽火台' }
    ]
  },
  {
    id:'mausoleum', lab:'迪姆波陵墓', en:'DEIMPO MAUSOLEUM', zone:'mausoleum', k:'crypt',
    anchor:[1523, 960], stat:true,
    note:'三层：入口、六符文深处、屋顶。佩哈给面具镜片，加吉厨房在深处。',
    marks:[
      { t:'tomb',  x:1522,y:944, s:1.25, label:'陵墓' },
      { t:'tomb',  x:1588,y:912, s:0.8 },
      { t:'ruin',  x:1470,y:962, s:0.7, label:'崩溃楼梯' }
    ]
  },
  {
    id:'mroof', lab:'陵墓屋顶', en:'MAUSOLEUM ROOF', zone:'mausoleum', k:'crypt',
    anchor:[1561, 781], stat:false,
    note:'屋顶小岛链通往沃达索镜片与商人岛，需要五段冲刺 + 拳套。',
    marks:[
      { t:'tomb',  x:1561, y:781, s:0.75, label:'屋顶' }
    ]
  },
  {
    id:'verdant', lab:'青翠山谷', en:'VERDANT HOLLOW', zone:'verdant', k:'isle',
    anchor:[571, 326], stat:true,
    note:'林间捷径与普韦玛神殿。八座锡佩哈雕像之一在山谷，血祭试炼通向血天使。',
    marks:[
      { t:'tree',  x:465, y:350, s:1.05, label:'林区' },
      { t:'tree',  x:675, y:374, s:1.0 },
      { t:'temple',x:549, y:276, s:0.95, label:'普韦玛神殿' }
    ]
  },
  {
    id:'rotting', lab:'腐烂洞窟', en:'ROTTING CAVERN', zone:'rotting', k:'isle',
    anchor:[870, 433], stat:true,
    note:'腐水与下水道。巨大农奴掉吉格基钥匙中段，杰哈诺在中央岛敲钟开门。',
    marks:[
      { t:'misc',  x:846, y:430, s:0.85, kind:'cave', label:'腐水洞窟' },
      { t:'ruin',  x:910, y:436, s:0.7 }
    ]
  },
  {
    id:'garden', lab:'石化花园', en:'PETRIFIED GARDEN', zone:'garden', k:'sand',
    anchor:[262, 200], stat:true,
    note:'传送跳车进入。五把三叉戟开中央喷泉，地宫是银骷髅大门与罗盘护符解锁点。',
    marks:[
      { t:'temple',x:268, y:196, s:1.0, label:'花园' },
      { t:'misc',  x:252, y:216, s:0.8, kind:'gate', label:'骷髅门' }
    ]
  },
  {
    id:'ancient', lab:'上古界域', en:'ANCIENT WORLD', zone:'ancient', k:'ind',
    anchor:[1196, 244], stat:true,
    note:'岛链 + 能量塔。欧西实验室、传送小屋、隐藏实验室，三座塔全亮开大桥。',
    marks:[
      { t:'factory',x:1046,y:220, s:1.0, label:'欧西实验室' },
      { t:'tower3', x:1124,y:242, s:1.0, label:'一号塔' },
      { t:'tower3', x:1071, y:317, s:0.8, label:'二号塔' },
      { t:'tower3', x:1270,y:360, s:0.8, label:'三号塔' },
      { t:'factory',x:1205, y:346, s:0.85 },
      { t:'misc',  x:1290,y:300, s:0.75, kind:'gate', label:'隐藏实验室' }
    ]
  },
  {
    id:'sin', lab:'罪之记录', en:'RECORD OF SIN', zone:'sin', k:'dark',
    anchor:[871, 150], stat:true,
    note:'图书馆塔。顶层奥库乔先驱，**打完要对话**才给记忆之镜。',
    marks:[
      { t:'tower', x:871, y:152, s:1.0, label:'罪之记录' }
    ]
  },
  {
    id:'forsaken', lab:'被遗忘的地牢', en:'FORGOTTEN DUNGEON', zone:'forsaken', k:'dark',
    anchor:[299, 621], stat:true,
    note:'地牢群。血天使双子需血祭试炼的钥匙，大红门后是尤梅德与沃耶基。',
    marks:[
      { t:'misc',  x:299, y:621, s:0.95, kind:'gate', label:'地牢入口' },
      { t:'tomb',  x:271, y:647, s:0.7 }
    ]
  },
  {
    id:'castle', lab:'西拉阿兹城堡', en:'SIRAATSU CASTLE', zone:'castle', k:'castle',
    anchor:[1621, 385], stat:true,
    note:'两层。寝宫双人战、仪式血池、自动机兵，最后是三环门与女王。',
    marks:[
      { t:'castle',x:1584,y:392, s:1.3, label:'城堡' },
      { t:'tower', x:1520,y:330, s:0.75, label:'高塔' },
      { t:'ruin',  x:1660,y:452, s:0.7 }
    ]
  },
  {
    id:'bridge2', lab:'城堡大桥', en:'THE BRIDGE', zone:'castle', k:'sand',
    anchor:[1360, 466], stat:false,
    note:'通往城堡的水上长桥，桥心乔萨米·赛迦领主把守，激光穿透掩体。',
    marks:[
      { t:'misc',  x:1360, y:468, s:0.42, kind:'bridge', label:'' }
    ]
  },
  {
    id:'jigeki', lab:'吉格基神殿', en:"JIGEKI'S TEMPLE", zone:'jigeki', k:'sand',
    anchor:[880, 963], stat:true,
    note:'从奥布穆尔上方崖顶四冠谜题坠落进入。三把钥匙开门，女祭司在门后。',
    marks:[
      { t:'temple',x:880, y:960, s:0.7, label:'吉格基神殿' }
    ]
  },
  {
    id:'underworld', lab:'冥界', en:'UNDERWORLD', zone:'underworld', k:'dark',
    anchor:[560, 1170], stat:true,
    note:'丰都桥与升降梯。第二环碎石上有银骷髅。',
    marks:[
      { t:'misc',  x:560, y:1186, s:0.85, kind:'gate', label:'冥界入口' }
    ]
  },
  {
    id:'shop', lab:'乌姆巴达贸易站', en:"UMBADA'S OUTPOST", zone:'shop', k:'isle2',
    anchor:[1739, 1121], stat:true,
    note:'任意水晶碑可进。卖拳套、三叉戟钥匙、六件罗盘护符，回收宝物。',
    marks:[
      { t:'camp',  x:1739, y:1118, s:0.9, label:'贸易站' }
    ]
  },
  {
    id:'puwema', lab:'普韦玛神殿', en:'TEMPLE OF PUWEMA', zone:'verdant', k:'isle',
    anchor:[600, 118], stat:false,
    note:'青翠山谷顶部。八火把门后是守门双龙，再往里是真圣剑阿昆拉的锻造祭坛。',
    marks:[
      { t:'temple',x:600, y:116, s:0.8, label:'普韦玛神殿' }
    ]
  }
];

/* ---------------------------------------------------------
   区域连接：谁通到谁、用什么方式
   type: path（陆路/桥）、dash（风之冲刺跨越）、lift（升降/传送）、
         gate（需钥匙/破除器）、secret（隐藏入口/破序）
   --------------------------------------------------------- */
/* ---------------------------------------------------------
   区域连接（手工规划走线）
   type: path 陆路/桥 / dash 风之冲刺 / lift 升降·传送 /
         gate 钥匙·破除器 / secret 隐藏·破序
   via:  途经的控制点 [x,y]，用于把线引到指定海域，避免穿岛与缠绕
   --------------------------------------------------------- */
/* 航道节点：所有连线都沿着这些开阔海面走，避免穿岛与交叉缠绕
   海域分区（避让岛屿包围盒后得出）：
   - 南航道 y≈1155（起始岛以南）
   - 中航道 y≈900  （骑士营地与大岛之间的水道，x 900~1090）
   - 西航道 x≈350  （知识之塔以西）
   - 东北航道 y≈250（上古界域以北）
   - 东航道 x≈1390（陵墓与城堡之间） */
/* ---------------------------------------------------------
   区域连接
   type: path 陆路/桥 / dash 风之冲刺 / lift 升降·传送 /
         gate 钥匙·破除器 / secret 隐藏·破序
   走线由 mapdraw.js 的 A*（海面网格 + 靠岸惩罚）自动求解
   --------------------------------------------------------- */
const LINKS = [
  // ===== 起始群岛 =====
  { a:'coast',    b:'camp',       type:'path',   label:'营地栅栏' },
  { a:'coast',    b:'cemetery',   type:'path',   label:'沿海路' },
  { a:'camp',     b:'cemetery',   type:'dash',   label:'两段冲刺' },
  { a:'cemetery', b:'bridge',     type:'dash',   label:'断桥' },

  // ===== 中部 =====
  { a:'camp',     b:'tower',      type:'path',   label:'塔前庭' },
  { a:'camp',     b:'verdant',    type:'path',   label:'北坡' },
  { a:'camp',     b:'obmuer',     type:'secret', label:'陵墓捷径' },
  { a:'bridge',   b:'obmuer',     type:'dash',   label:'西侧断桥' },
  { a:'verdant',  b:'puwema',     type:'path',   label:'神殿阶' },
  { a:'verdant',  b:'rotting',    type:'path',   label:'山谷隘口' },
  { a:'verdant',  b:'forsaken',   type:'gate',   label:'血祭试炼' },
  { a:'garden',   b:'coast',      type:'secret', label:'传送跳车' },
  { a:'garden',   b:'verdant',    type:'path',   label:'花园外环' },

  // ===== 地下与塔 =====
  { a:'tower',    b:'mausoleum',  type:'lift',   label:'塔→陵墓通道' },
  { a:'tower',    b:'forsaken',   type:'lift',   label:'塔地下室' },
  { a:'obmuer',   b:'underworld', type:'lift',   label:'丰都桥' },
  { a:'obmuer',   b:'jigeki',     type:'secret', label:'崖顶四冠谜题' },
  { a:'mausoleum',b:'mroof',      type:'lift',   label:'屋顶' },
  { a:'mroof',    b:'shop',       type:'dash',   label:'五段冲刺越海' },
  { a:'castle',   b:'shop',       type:'dash',   label:'商人岛' },

  // ===== 北侧 =====
  { a:'ancient',  b:'sin',        type:'path',   label:'塔区' },
  { a:'ancient',  b:'bridge2',    type:'path',   label:'桥头' },
  { a:'bridge2',  b:'castle',     type:'path',   label:'桥尾' },
  { a:'ancient',  b:'mausoleum',  type:'lift',   label:'通风井' },
  { a:'ancient',  b:'castle',     type:'gate',   label:'大桥 / 三塔' }
];

function regionById(id){ return REGIONS.find(r => r.id === id); }


/* 点位数据里的区域名 → region id（有别名时在此补充） */
const AREA_ALIAS = {
  '尼亚希德岛': 'camp',
  '海岸林间':   'camp',
  '死亡海岸':   'cemetery'
};
