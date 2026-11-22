/* =========================================================
   女王魔域 · 全收集互动地图
   assets/data.js — 区域锚点 / 分类定义
   ========================================================= */

const AREAS = {
  isle:      { name: '尼亚希德岛',   sub: 'ISLE OF NEASIED',    x: 880,  y: 1150 },
  camp:      { name: '骑士营地',     sub: "KNIGHT'S CAMP",      x: 880,  y: 720  },
  cemetery:  { name: '墓地悬崖',     sub: 'CEMETERY PRECIPICE', x: 1170, y: 985  },
  bridge:    { name: '断裂之桥',     sub: 'BROKEN BRIDGE',      x: 1180, y: 700  },
  tower:     { name: '知识之塔',     sub: 'TOWER OF KNOWLEDGE', x: 470,  y: 868  },
  obmuer:    { name: '奥布穆尔神殿', sub: 'OBMUER TEMPLE',      x: 700,  y: 978  },
  mausoleum: { name: '迪姆波陵墓',   sub: 'DEIMPO MAUSOLEUM',   x: 1520, y: 912  },
  mroof:     { name: '陵墓屋顶',     sub: 'MAUSOLEUM ROOF',     x: 1480, y: 848  },
  ancient:   { name: '上古界域',     sub: 'ANCIENT WORLD',      x: 1150, y: 222  },
  bridge2:   { name: '城堡大桥',     sub: 'THE BRIDGE',         x: 1340, y: 478  },
  castle:    { name: '西拉阿兹城堡', sub: 'SIRAATSU CASTLE',    x: 1584, y: 380  },
  verdant:   { name: '青翠山谷',     sub: 'VERDANT HOLLOW',     x: 600,  y: 400  },
  puwema:    { name: '普韦玛神殿',   sub: 'TEMPLE OF PUWEMA',   x: 586,  y: 322  },
  rotting:   { name: '腐烂洞窟',     sub: 'ROTTING CAVERN',     x: 640,  y: 480  },
  sin:       { name: '罪之记录',     sub: 'RECORD OF SIN',      x: 900,  y: 168  },
  garden:    { name: '石化花园',     sub: 'PETRIFIED GARDEN',   x: 420,  y: 238  },
  forsaken:  { name: '被遗忘的地牢', sub: 'FORGOTTEN DUNGEON',  x: 312,  y: 650  },
  jigeki:    { name: '吉格基神殿',   sub: "JIGEKI'S TEMPLE",    x: 830,  y: 962  },
  underworld:{ name: '冥界',         sub: 'UNDERWORLD',         x: 604,  y: 1108 },
  shop:      { name: '乌姆巴达贸易站', sub: "UMBADA'S OUTPOST", x: 1700, y: 1120 }
};

const CATS = [
  { id:'skull',  name:'银骷髅',           sub:'SILVER SKULLS',       color:'#cfd6dd', icon:'skull',  total:69, target:69,
    desc:'散落全岛的银骷髅，交给石化花园下的神秘大门推进仪式。里程碑：10 → 古石鸭雕像（让骷髅显形），20 → 化石鱼，30 → 飞行蘑菇化石（可短暂飞行），60 → 音波水晶化石，69 → 仪式（The Call From Beyond）。' },
  { id:'egg',    name:'奥贝瓦之卵',       sub:'ORBEWA EGGS',         color:'#7fe0c8', icon:'egg',    total:8, target:50,
    desc:'全部交给深渊之母埃尔玛（游戏中为 50 颗，本图收录已确认的代表性点位）。她身后的卵数量即已交付数量；奖励分档给予。' },
  { id:'duck',   name:'鸭子雕像',         sub:'DUCK FIGURINES',      color:'#e8c26a', icon:'duck',   total:6,
    desc:'全部交给贸易站的乌姆巴达。石鸭雕像可开启贸易站，其余为各区域的隐藏收藏。' },
  { id:'lens',   name:'第二视觉镜片',     sub:'MASK LENSES',         color:'#a98cff', icon:'lens',   total:4,
    desc:'集齐四片后可解锁石化花园地下的仪式通道（「食」结局前置）。' },
  { id:'gem',    name:'风之宝石',         sub:'WIND GEMS',           color:'#6fb6e8', icon:'gem',    total:5,
    desc:'每颗宝石为圣剑恩杜增加一段风之冲刺，五段冲刺是抵达后期高地的关键。' },
  { id:'beacon', name:'存档点与风之祭坛', sub:'MONUMENTS & ALTARS',  color:'#8fb383', icon:'beacon', total:26,
    desc:'水晶碑用于存档与休息（休息会刷新敌人）；风之祭坛接入快速传送网络。' },
  { id:'boss',   name:'首领',             sub:'BOSSES',              color:'#e07a5f', icon:'boss',   total:14,
    desc:'主线与区域首领。查看怪物图鉴中的伤害类型抗性，换对武器远胜于堆等级。' },
  { id:'npc',    name:'关键 NPC 与任务',  sub:'NPCS & QUESTS',       color:'#e09aab', icon:'npc',    total:11,
    desc:'推动支线与成就的关键人物。部分 NPC 需要特定收集进度才会推进下一阶段。' },
  { id:'key',    name:'关键道具',         sub:'KEY ITEMS',           color:'#f0e0b0', icon:'key',    total:12,
    desc:'封印破除器、钥匙与圣剑强化件。记下打不开的门是什么颜色，拿到对应破除器再回头。' },
  { id:'book',   name:'失落的书籍',       sub:'LOST BOOKS',          color:'#c8b08f', icon:'book',   total:6,
    desc:'归还知识之塔的所有失落书籍，可重新开启稀有文物储藏室。' },
  { id:'memento',name:'遗物 · 8 灵魂',    sub:'MEMENTOS',            color:'#b9a6f0', icon:'memento',total:8,
    desc:'击败罪之记录顶层的奥库乔先驱，**打完要跟它对话**才会给你记忆之镜（不是掉落）。对「近期死亡的角色尸体」使用镜子，灵魂现身并留下遗物。8 件遗物放进迪姆波陵墓红水大厅最底层的四符号墙后祭坛，锻出奥库乔之审判（结局 3/4 的剑）。' },
  { id:'cell',   name:'能量电池',         sub:'ENERGY CELLS',        color:'#6fe0a8', icon:'cell',   total:6,
    desc:'计入「能量满溢」成就的是 6 块（初始枪械旁那两块不计）。需要蓝绿破除器、推进完罪之记录、拿到飞行蘑菇化石（交 30 骷髅），其中一块要等地形改变后才出现。' },
  { id:'vault',  name:'宝库',             sub:'TREASURE ROOMS',      color:'#d9b06a', icon:'vault',  total:5,
    desc:'5 间宝库：2 血库、2 天鹅绒库、1 翡翠库。钥匙石按链式解锁：血钥匙石（读遗迹笔记后在乌姆巴达处 24 古币购买）→ 天鹅绒钥匙石（青翠山谷第二血库）→ 翡翠钥匙石（腐烂洞窟天鹅绒库）。库内是锈蚀武器进化线本体。' },
  { id:'charm',  name:'罗盘护符',         sub:'COMPASS CHARMS',      color:'#8fd0e8', icon:'charm',  total:6,
    desc:'本作**没有地图**，只有罗盘。把六件护符装到「第二视觉面具」上后，靠近目标会在屏幕上投出全息路标。解锁条件：集齐四镜片 → 访问石化花园 → 破四处神印 → 下到地宫与神秘实体对话 → 拿到最后一只鸭子雕像 → 交乌姆巴达，商店开放六件护符。' }
];
