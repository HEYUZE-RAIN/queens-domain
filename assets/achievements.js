/* =========================================================
   assets/achievements.js — 53 项成就（Steam / PS 同列表）
   字段：[id, 中文名, 英文名, 解锁条件, 分类, 区域锚点]
   ========================================================= */

const ACH_RAW = [
  /* —— 抵达地点 (10) —— */
  ['ocean','潮汐漫步','Ocean Walk','抵达奥布穆尔神殿。','地点','obmuer'],
  ['pages','无尽篇章','Endless Pages','抵达知识之塔。','地点','tower'],
  ['tomb','未封之墓','Unsealed Tomb','抵达迪姆波陵墓。','地点','mausoleum'],
  ['genesis','创世','Genesis','坠入裂隙抵达上古界域。','地点','ancient'],
  ['halls','憎恶之厅','Halls of Hatred','越过城堡大桥，抵达西拉阿兹城堡。','地点','castle'],
  ['dark','寂暗','Dark Silence','抵达被遗忘的地牢。','地点','forsaken'],
  ['groves','圣林','Sacred Groves','抵达青翠山谷。','地点','verdant'],
  ['mire','深沼','Deep Mire','抵达腐烂洞窟。','地点','rotting'],
  ['sin','罪恶看守者','Sin Keeper','抵达罪之记录。','地点','sin'],
  ['memorial','纪念塑像','Memorial Sculpture','抵达石化花园。','地点','garden'],

  /* —— 支线与收集 (20) —— */
  ['raiders','伊鲁佩掠夺者之末','Fate of the Iryupe Raiders','向阿甘米船长告知其船员的命运。','支线','isle'],
  ['waters','圣水','Sacred Waters','将所有奥贝瓦之卵交给深渊之母埃尔玛。','收集','obmuer'],
  ['lifetime','终身事业','A Lifetime\'s Work','协助知识守护者沃尔哈完成研究。','支线','tower'],
  ['sparkling','一尘不染','Sparkling Clean','清理知识之塔。','支线','tower'],
  ['latefee','不交滞纳金','I\'m Not Paying the Late Fee','归还所有失落的书籍。','收集','tower'],
  ['vaults','被遗忘的房间','Forgotten Rooms','探索所有宝物库。','收集','tower'],
  ['birds','同类羽翼','Birds of a Feather','交给加吉大厨 60 张餐券。','收集','mausoleum'],
  ['wise','智慧之作','Wise Work','见证机械工程师欧西的实验结果。','支线','ancient'],
  ['deal','做个交易','Let\'s Make a Deal','在乌姆巴达贸易站消费 1000 枚古代金币。','支线','shop'],
  ['living','活着的石头','Living Stone','唤醒石化花园。','支线','garden'],
  ['ducks','精美收藏','A Fine Collection','把所有鸭子雕像交给乌姆巴达。','收集','shop'],
  ['places','你要去的地方','Oh the Places You\'ll Go','获得一份奇怪的奖励。','支线','isle'],
  ['beyond','彼方呼唤','The Call From Beyond','完成神秘仪式。','支线','garden'],
  ['witch','巫术','Witchcraft','在魔法书中留下记述。','支线','tower'],
  ['temper','怒涛','Raging Tempest','取回风暴宝石。','收集','tower'],
  ['wind','感受风','Feel the Wind','集齐五颗风之宝石。','收集','isle'],
  ['perfected','完美武具','Perfected Weaponry','强化所有主武器。','收集','ancient'],
  ['armaments','武库充盈','Extensive Armaments','收集所有主武器。','收集','ancient'],
  ['volley','万箭齐发','Versatile Volley','收集所有类型的投掷武器。','收集','isle'],
  ['accoutre','琳琅饰物','Eclectic Accoutrements','收集所有饰品。','收集','isle'],
  ['treasure','璀璨宝藏','Glimmering Treasures','收集所有宝物。','收集','isle'],
  ['energy','能量过载','Overflowing Energy','收集全部能量单元。','收集','ancient'],
  ['eyes','魔法之眼','Magic Eyes','集齐第二视觉面具的全部四片镜片。','收集','mausoleum'],
  ['ancienttech','古代科技','Ancient Technology','找到一种截然不同的主武器。','收集','ancient'],
  ['travelled','行遍群岛','Well Travelled','激活所有水晶碑与风之祭坛。','收集','isle'],
  ['coffers','宝箱清空','Emptied Coffers','打开所有宝箱。','收集','isle'],
  ['passages','隐秘通道','Concealed Passages','开启所有暗门。','收集','isle'],

  /* —— 武器 (3) —— */
  ['flying','飞剑','Flying Sword','取得圣剑恩杜。','武器','isle'],
  ['blade','沐浴圣光的剑刃','Blade Bathed in Holy Light','锻成真圣剑阿昆拉。','武器','puwema'],
  ['spiritual','至灵之剑','Most Spiritual Sword','取得奥库乔之审判。','武器','garden'],

  /* —— 首领 (8) —— */
  ['baleen','凶鳞','Treacherous Baleen','击败海王达古姆。','首领','obmuer'],
  ['hell','转录地狱','Hell Transcribed','击败死灵之书。','首领','tower'],
  ['demonic','恶魔奴役','Demonic Servitude','击败畸变恶魔波伊尼尔与杜艾尼尔。','首领','mausoleum'],
  ['sworn','誓约守护','Sworn Protector','击败乔萨米 · 赛迦领主。','首领','bridge2'],
  ['silver','恐银','Dread Silver','击败奥库乔的先驱。','首领','sin'],
  ['wake','梦醒','Wake From Dreams','击败普韦玛神殿守门者乌孙哈与乌焦米欧德。','首领','puwema'],
  ['rotten','腐水之下','Beneath Rotten Waters','击败巨大农奴。','首领','rotting'],
  ['angels','堕落天使','Fallen Angels','击败血天使领主尤梅德与沃耶基。','首领','forsaken'],

  /* —— 结局 (5) —— */
  ['ending1','最不幸','Most Unfortunate','达成结局 1（以任意武器击败女王）。','结局','castle'],
  ['ending2','无暗之国','A Kingdom Free From Darkness','达成结局 2（以真圣剑阿昆拉击败女王）。','结局','castle'],
  ['ending3','弑神者','God Slayer','达成结局 3（以奥库乔之审判放逐女王）。','结局','castle'],
  ['ending4','吞噬','Eat','达成结局 4（完成银骷髅仪式后吞噬女王）。','结局','castle'],
  ['platinum','女王魔域','Queen\'s Domain','克服尼亚希德岛上的所有挑战。','结局','isle']
];
