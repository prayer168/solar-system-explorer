// 太陽系天體資料（主要來源：NASA Planetary Fact Sheet、NASA Science Solar System）
// 數值以兒童易懂為原則四捨五入。衛星數量為 2025 年資料，仍持續有新發現。

export const AU_KM = 149_597_870.7;
export const LIGHT_KM_S = 299_792.458;
export const EARTH_G = 9.8;

export const BODIES = [
  {
    id: 'sun', name: '太陽', en: 'Sun', type: '恆星', typeKey: 'star',
    color: '#ffb547', texture: '2k_sun.jpg',
    diameterKm: 1_392_700, radiusE: 109.1, massE: 333_000, gravity: 274,
    au: 0, periodDays: 0, rotationH: 609.1, dayH: null, tiltDeg: 7.25,
    tempC: 5500, tempNote: '表面約 5,500°C，核心高達 1,500 萬°C',
    moons: 0, earthsFit: '約 130 萬', density: 1.41,
    intro: '太陽是太陽系的中心，也是一顆會發光發熱的恆星。太陽系 99.86% 的質量都在太陽身上，它的重力讓所有行星乖乖繞著它轉。',
    atmosphere: [['氫', 73], ['氦', 25], ['其他', 2]],
    atmoLabel: '組成成分',
    layers: [
      { name: '核心', r: 0.25, color: '#fff6c2', desc: '核融合反應的地方，氫變成氦並放出巨大能量' },
      { name: '輻射層', r: 0.7, color: '#ffd166', desc: '能量以光的形式慢慢往外傳，要花十幾萬年' },
      { name: '對流層', r: 0.96, color: '#ff9f43', desc: '熱氣體像滾水一樣上下翻滾' },
      { name: '光球層', r: 1.0, color: '#ff7a1a', desc: '我們看到的「太陽表面」，約 5,500°C' },
    ],
    facts: [
      '光從太陽出發，大約 8 分 20 秒才會到達地球，所以你看到的太陽是「8 分鐘前」的樣子。',
      '太陽大到可以裝進約 130 萬顆地球！',
      '太陽已經大約 46 億歲，現在正值「壯年」，還能再穩定發光約 50 億年。',
      '太陽表面的黑點叫「太陽黑子」，那裡溫度比周圍低，所以看起來比較暗。',
      '千萬不能直接用眼睛或望遠鏡看太陽，會傷害眼睛！',
    ],
    missions: [
      ['帕克太陽探測器', '2018', '史上最接近太陽、速度最快的人造物體'],
      ['太陽軌道器', '2020', '歐美合作，首次拍攝太陽的南北極'],
      ['Aditya-L1', '2023', '印度第一個太陽觀測衛星'],
    ],
  },
  {
    id: 'mercury', name: '水星', en: 'Mercury', type: '類地行星', typeKey: 'rocky',
    color: '#b5aea5', texture: '2k_mercury.jpg',
    diameterKm: 4_879, radiusE: 0.383, massE: 0.055, gravity: 3.7,
    au: 0.387, periodDays: 88, rotationH: 1407.6, dayH: 4222.6, tiltDeg: 0.03,
    tempC: 167, tempNote: '白天 430°C、夜晚 −180°C，溫差最大',
    moons: 0, earthsFit: '18 顆水星才有一個地球大', density: 5.43, L0: 252.25,
    intro: '水星是離太陽最近、也是最小的行星。它沒有大氣層保溫，所以白天熱得像烤箱，晚上又冷得像冰庫。',
    atmosphere: [['幾乎沒有大氣', 100]],
    atmoLabel: '大氣',
    layers: [
      { name: '鐵質核心', r: 0.83, color: '#c97b4a', desc: '核心超大，佔了星球大部分' },
      { name: '地函', r: 0.97, color: '#8d7b6a', desc: '岩石構成' },
      { name: '地殼', r: 1.0, color: '#b5aea5', desc: '布滿隕石坑，很像月球' },
    ],
    facts: [
      '水星繞太陽一圈只要 88 天，是跑得最快的行星。',
      '水星上的「一天」（日出到下次日出）比它的「一年」還長！約等於地球 176 天。',
      '水星的名字雖然有「水」，但上面幾乎沒有水；在中國古代五行裡，水星對應「水」。',
      '水星的極區隕石坑裡，可能藏著永遠照不到陽光的冰。',
    ],
    missions: [
      ['水手 10 號', '1974', '第一艘飛掠水星的探測器'],
      ['信使號 MESSENGER', '2011–2015', '第一艘繞行水星的探測器'],
      ['貝皮可倫坡號', '2018 發射', '歐洲與日本合作，預定 2026 年底進入水星軌道'],
    ],
  },
  {
    id: 'venus', name: '金星', en: 'Venus', type: '類地行星', typeKey: 'rocky',
    color: '#e8c27a', texture: '2k_venus_atmosphere.jpg',
    diameterKm: 12_104, radiusE: 0.949, massE: 0.815, gravity: 8.9,
    au: 0.723, periodDays: 224.7, rotationH: -5832.5, dayH: 2802, tiltDeg: 177.4,
    tempC: 464, tempNote: '平均 464°C，是最熱的行星',
    moons: 0, earthsFit: '大小跟地球差不多', density: 5.24, L0: 181.98,
    intro: '金星大小和地球很像，被稱為地球的「姊妹星」。但它被厚厚的二氧化碳雲層包住，溫室效應讓它成為太陽系最熱的行星。',
    atmosphere: [['二氧化碳', 96.5], ['氮', 3.5]],
    atmoLabel: '大氣成分',
    layers: [
      { name: '鐵鎳核心', r: 0.5, color: '#d98c4a', desc: '金屬核心' },
      { name: '地函', r: 0.96, color: '#a8744a', desc: '炙熱的岩石' },
      { name: '地殼', r: 1.0, color: '#c9a36b', desc: '有許多火山' },
    ],
    facts: [
      '金星是「倒著轉」的：在金星上，太陽從西邊升起、東邊落下！',
      '金星表面的氣壓是地球的 92 倍，就像潛到 900 公尺深的海裡。',
      '金星比水星離太陽更遠，卻比水星更熱，因為厚厚的大氣把熱困住了（溫室效應）。',
      '傍晚在西方天空最亮的「長庚星」、清晨的「啟明星」，都是金星。',
    ],
    missions: [
      ['金星 7 號', '1970', '蘇聯，人類第一次成功登陸另一顆行星'],
      ['麥哲倫號', '1990–1994', '用雷達穿透雲層繪製地形圖'],
      ['拂曉號 Akatsuki', '2015', '日本，研究金星的大氣'],
    ],
  },
  {
    id: 'earth', name: '地球', en: 'Earth', type: '類地行星', typeKey: 'rocky',
    color: '#4f8cff', texture: '2k_earth_daymap.jpg', clouds: '2k_earth_clouds.jpg',
    diameterKm: 12_756, radiusE: 1, massE: 1, gravity: 9.8,
    au: 1, periodDays: 365.25, rotationH: 23.93, dayH: 24, tiltDeg: 23.44,
    tempC: 15, tempNote: '平均 15°C，有液態水',
    moons: 1, earthsFit: '我們的家', density: 5.51, L0: 100.46,
    intro: '地球是我們的家，也是目前唯一已知有生命的星球。它離太陽的距離剛剛好，讓水能以液體存在，表面約 71% 被海洋覆蓋。',
    atmosphere: [['氮', 78], ['氧', 21], ['氬等', 1]],
    atmoLabel: '大氣成分',
    layers: [
      { name: '內核', r: 0.19, color: '#fff1a8', desc: '固態鐵鎳，約 5,400°C' },
      { name: '外核', r: 0.55, color: '#ffb347', desc: '液態鐵，流動產生地磁' },
      { name: '地函', r: 0.99, color: '#e0663b', desc: '高溫岩石，會緩慢流動' },
      { name: '地殼', r: 1.0, color: '#6b8f5e', desc: '我們居住的薄薄一層' },
    ],
    facts: [
      '地球在「宜居帶」裡：不太熱也不太冷，剛好適合液態水存在。',
      '地球的自轉軸傾斜 23.4°，這就是我們有春夏秋冬四季的原因。',
      '地球是太陽系密度最大的行星。',
      '地球磁場像一把隱形的保護傘，擋住太陽風，還會在極區形成美麗的極光。',
    ],
    missions: [
      ['史普尼克 1 號', '1957', '人類第一顆人造衛星'],
      ['阿波羅 8 號', '1968', '拍下著名的「地出」照片'],
      ['福爾摩沙衛星五號、七號', '2017、2019', '臺灣自主研製的觀測與氣象衛星'],
    ],
  },
  {
    id: 'moon', name: '月球', en: 'Moon', type: '衛星', typeKey: 'moon', parent: 'earth',
    color: '#c8c8c8', texture: '2k_moon.jpg',
    diameterKm: 3_475, radiusE: 0.273, massE: 0.0123, gravity: 1.6,
    au: 1, distFromParentKm: 384_400, periodDays: 27.3, rotationH: 655.7, dayH: 708.7, tiltDeg: 6.7,
    tempC: -20, tempNote: '白天 120°C、夜晚 −130°C',
    moons: 0, earthsFit: '約 50 個月球才有一個地球大', density: 3.34,
    intro: '月球是地球唯一的天然衛星，距離地球約 38 萬公里。月球本身不會發光，我們看到的月光其實是反射的太陽光。',
    atmosphere: [['幾乎沒有大氣', 100]],
    atmoLabel: '大氣',
    layers: [
      { name: '內核', r: 0.14, color: '#ffd27a', desc: '小小的鐵核心' },
      { name: '外核', r: 0.2, color: '#e09a5a', desc: '可能是液態' },
      { name: '地函', r: 0.97, color: '#8a8378', desc: '岩石' },
      { name: '月殼', r: 1.0, color: '#c8c8c8', desc: '布滿隕石坑與月海' },
    ],
    facts: [
      '月球自轉一圈和繞地球一圈的時間一樣，所以永遠用同一面對著地球。',
      '月球上沒有風，太空人留下的腳印可以保存數百萬年。',
      '月球每年大約遠離地球 3.8 公分。',
      '潮汐主要是月球的引力造成的。',
    ],
    missions: [
      ['阿波羅 11 號', '1969', '人類第一次登上月球'],
      ['嫦娥四號', '2019', '首次登陸月球背面'],
      ['阿提米絲計畫', '進行中', '讓人類重返月球的計畫'],
    ],
  },
  {
    id: 'mars', name: '火星', en: 'Mars', type: '類地行星', typeKey: 'rocky',
    color: '#e0603a', texture: '2k_mars.jpg',
    diameterKm: 6_792, radiusE: 0.532, massE: 0.107, gravity: 3.7,
    au: 1.524, periodDays: 687, rotationH: 24.6, dayH: 24.7, tiltDeg: 25.2,
    tempC: -65, tempNote: '平均 −65°C',
    moons: 2, earthsFit: '約 7 顆火星才有一個地球大', density: 3.93, L0: 355.45,
    intro: '火星是紅色的岩石行星，紅色來自地表的氧化鐵（鐵鏽）。它有四季、極冠，還有太陽系最高的火山，是人類最想移民的行星。',
    atmosphere: [['二氧化碳', 95], ['氮', 2.8], ['氬', 2.2]],
    atmoLabel: '大氣成分（非常稀薄）',
    layers: [
      { name: '鐵核心', r: 0.5, color: '#d9884a', desc: '鐵、鎳、硫' },
      { name: '地函', r: 0.96, color: '#a8553a', desc: '岩石' },
      { name: '地殼', r: 1.0, color: '#e0603a', desc: '含氧化鐵，呈紅色' },
    ],
    facts: [
      '奧林帕斯山高約 22 公里，是聖母峰的 2 倍多，是太陽系最高的火山。',
      '火星的一天約 24 小時 39 分，跟地球很接近。',
      '火星有兩顆像馬鈴薯形狀的小衛星：火衛一和火衛二。',
      '科學家發現火星以前有河流和湖泊，地下可能還有冰。',
    ],
    missions: [
      ['海盜 1 號', '1976', '第一次成功在火星表面工作'],
      ['好奇號', '2012', '核能動力的火星車'],
      ['毅力號與機智號', '2021', '機智號是第一架在其他星球飛行的直升機'],
      ['祝融號', '2021', '中國第一輛火星車'],
    ],
  },
  {
    id: 'jupiter', name: '木星', en: 'Jupiter', type: '氣體巨行星', typeKey: 'gas',
    color: '#d9a066', texture: '2k_jupiter.jpg',
    diameterKm: 142_984, radiusE: 11.21, massE: 317.8, gravity: 23.1,
    au: 5.2, periodDays: 4331, rotationH: 9.9, dayH: 9.9, tiltDeg: 3.1,
    tempC: -110, tempNote: '雲頂約 −110°C',
    moons: 95, earthsFit: '約 1,321 顆', density: 1.33, L0: 34.40,
    intro: '木星是太陽系最大的行星，質量是其他所有行星加起來的 2 倍多。它主要由氫和氦組成，沒有可以站的地面。',
    atmosphere: [['氫', 90], ['氦', 10]],
    atmoLabel: '大氣成分',
    layers: [
      { name: '核心', r: 0.15, color: '#b07a4a', desc: '可能是岩石和冰，邊界模糊' },
      { name: '金屬氫', r: 0.78, color: '#8fa3c8', desc: '高壓讓氫變得像金屬一樣導電' },
      { name: '液態氫', r: 0.97, color: '#d8b98a', desc: '氫被壓成液體' },
      { name: '雲層', r: 1.0, color: '#e8c79a', desc: '彩色條紋就是雲帶' },
    ],
    facts: [
      '「大紅斑」是一個比地球還大的超級風暴，已經吹了 300 多年。',
      '木星自轉一圈不到 10 小時，是自轉最快的行星。',
      '木星的強大重力像「宇宙吸塵器」，幫地球擋掉很多彗星和小行星。',
      '伽利略在 1610 年發現木星的 4 顆大衛星：木衛一、二、三、四。',
      '木衛三比水星還大，是太陽系最大的衛星。',
    ],
    missions: [
      ['先鋒 10 號', '1973', '第一艘飛掠木星的探測器'],
      ['伽利略號', '1995–2003', '第一艘繞行木星的探測器'],
      ['朱諾號', '2016', '研究木星內部與極區'],
      ['JUICE、歐羅巴快船', '2023、2024 發射', '前往探索木星的冰衛星'],
    ],
  },
  {
    id: 'saturn', name: '土星', en: 'Saturn', type: '氣體巨行星', typeKey: 'gas',
    color: '#e8d3a0', texture: '2k_saturn.jpg', rings: '2k_saturn_ring_alpha.png',
    diameterKm: 120_536, radiusE: 9.45, massE: 95.2, gravity: 9.0,
    au: 9.58, periodDays: 10747, rotationH: 10.7, dayH: 10.7, tiltDeg: 26.7,
    tempC: -140, tempNote: '雲頂約 −140°C',
    moons: 274, earthsFit: '約 764 顆', density: 0.69, L0: 49.94,
    intro: '土星有一圈美麗壯觀的光環，由無數冰塊和岩石碎片組成。它是衛星最多的行星，也是密度最小的行星。',
    atmosphere: [['氫', 96], ['氦', 3], ['其他', 1]],
    atmoLabel: '大氣成分',
    layers: [
      { name: '核心', r: 0.2, color: '#b08a5a', desc: '岩石與冰' },
      { name: '金屬氫', r: 0.5, color: '#8fa3c8', desc: '高壓下的金屬態氫' },
      { name: '液態氫氦', r: 0.97, color: '#e0c890', desc: '' },
      { name: '雲層', r: 1.0, color: '#f0dca8', desc: '' },
    ],
    facts: [
      '土星的密度比水還小，如果有一個超大的浴缸，土星會浮起來！',
      '土星環寬約 28 萬公里，但厚度大多只有約 10 公尺。',
      '土星擁有 274 顆已確認的衛星（2025 年），是衛星最多的行星。',
      '土衛六（泰坦）有濃厚的大氣，還有甲烷構成的湖泊。',
    ],
    missions: [
      ['先鋒 11 號', '1979', '第一艘飛掠土星的探測器'],
      ['航海家 1、2 號', '1980、1981', '拍下土星環的細節'],
      ['卡西尼—惠更斯號', '2004–2017', '繞土星 13 年，惠更斯號登陸土衛六'],
      ['蜻蜓號', '預計 2028 發射', '要在土衛六上飛行的無人機'],
    ],
  },
  {
    id: 'uranus', name: '天王星', en: 'Uranus', type: '冰巨行星', typeKey: 'ice',
    color: '#9fe3e8', texture: '2k_uranus.jpg', thinRings: true,
    diameterKm: 51_118, radiusE: 4.01, massE: 14.5, gravity: 8.7,
    au: 19.2, periodDays: 30589, rotationH: -17.2, dayH: 17.2, tiltDeg: 97.8,
    tempC: -195, tempNote: '約 −195°C，曾測到 −224°C 的最低溫',
    moons: 29, earthsFit: '約 63 顆', density: 1.27, L0: 313.23,
    intro: '天王星是一顆藍綠色的冰巨行星，顏色來自大氣中的甲烷。它幾乎是「躺著」繞太陽轉，非常特別。',
    atmosphere: [['氫', 83], ['氦', 15], ['甲烷', 2]],
    atmoLabel: '大氣成分',
    layers: [
      { name: '岩石核心', r: 0.25, color: '#9a7a5a', desc: '' },
      { name: '冰質地函', r: 0.75, color: '#5fb0c8', desc: '水、氨、甲烷組成的「冰」，其實是熱熱的流體' },
      { name: '氫氦大氣', r: 1.0, color: '#9fe3e8', desc: '' },
    ],
    facts: [
      '天王星的自轉軸傾斜約 98°，就像一顆滾著走的球。',
      '因為躺著轉，天王星的南北極各有約 42 年白天、42 年黑夜。',
      '天王星是第一顆用望遠鏡發現的行星（1781 年，赫歇爾）。',
      '天王星也有光環，只是又細又暗。',
    ],
    missions: [
      ['航海家 2 號', '1986', '目前唯一造訪過天王星的探測器'],
    ],
  },
  {
    id: 'neptune', name: '海王星', en: 'Neptune', type: '冰巨行星', typeKey: 'ice',
    color: '#4b6cff', texture: '2k_neptune.jpg',
    diameterKm: 49_528, radiusE: 3.88, massE: 17.1, gravity: 11.0,
    au: 30.05, periodDays: 59800, rotationH: 16.1, dayH: 16.1, tiltDeg: 28.3,
    tempC: -200, tempNote: '約 −200°C',
    moons: 16, earthsFit: '約 58 顆', density: 1.64, L0: 304.88,
    intro: '海王星是離太陽最遠的行星，深藍色的外表下吹著太陽系最強的風。從地球用肉眼看不到它。',
    atmosphere: [['氫', 80], ['氦', 19], ['甲烷', 1]],
    atmoLabel: '大氣成分',
    layers: [
      { name: '岩石核心', r: 0.25, color: '#9a7a5a', desc: '' },
      { name: '冰質地函', r: 0.8, color: '#3f7fd0', desc: '水、氨、甲烷' },
      { name: '氫氦大氣', r: 1.0, color: '#4b6cff', desc: '' },
    ],
    facts: [
      '海王星的風速可達每小時 2,000 公里，比高鐵快 6 倍以上！',
      '海王星是先用數學算出位置，再用望遠鏡找到的行星（1846 年）。',
      '海王星繞太陽一圈要 165 年，從被發現到現在才剛繞完一圈多一點。',
      '海衛一（崔頓）是「倒著」繞海王星轉的大衛星，上面有冰火山。',
    ],
    missions: [
      ['航海家 2 號', '1989', '目前唯一造訪過海王星的探測器'],
    ],
  },
  {
    id: 'pluto', name: '冥王星', en: 'Pluto', type: '矮行星', typeKey: 'dwarf',
    color: '#d8b89a', texture: null,
    diameterKm: 2_376, radiusE: 0.186, massE: 0.0022, gravity: 0.62,
    au: 39.5, periodDays: 90560, rotationH: -153.3, dayH: 153.3, tiltDeg: 122.5,
    tempC: -225, tempNote: '約 −225°C',
    moons: 5, earthsFit: '比月球還小', density: 1.85, L0: 238.93,
    intro: '冥王星原本是第九大行星，2006 年被重新分類為「矮行星」。它住在海王星外面的古柏帶，表面有一個巨大的愛心形冰原。',
    atmosphere: [['氮', 99], ['甲烷等', 1]],
    atmoLabel: '大氣成分（非常稀薄）',
    layers: [
      { name: '岩石核心', r: 0.7, color: '#8a6a50', desc: '' },
      { name: '水冰地函', r: 0.95, color: '#bcd4e6', desc: '可能有地下海洋' },
      { name: '氮冰表面', r: 1.0, color: '#d8b89a', desc: '' },
    ],
    facts: [
      '冥王星表面有一塊愛心形狀的冰原，叫做「湯博區」。',
      '冥王星比月球還小，所以 2006 年被改分類為矮行星。',
      '冥王星最大的衛星凱倫，大小約是冥王星的一半，兩者像在跳雙人舞。',
      '冥王星繞太陽一圈要 248 年。',
    ],
    missions: [
      ['新視野號', '2015', '第一次近距離拍攝冥王星'],
    ],
  },
];

export const BODY_MAP = Object.fromEntries(BODIES.map(b => [b.id, b]));

// 行星選單順序（月球從地球資訊卡進入）
export const DOCK_ORDER = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

// 總覽模式（教學比例）：大小與距離都經過壓縮，方便一次看到全部
export const OVERVIEW = {
  sun: { r: 6, d: 0 },
  mercury: { r: 0.45, d: 11 },
  venus: { r: 0.95, d: 15.5 },
  earth: { r: 1.0, d: 21 },
  moon: { r: 0.27, d: 2.2 },
  mars: { r: 0.6, d: 27 },
  jupiter: { r: 3.0, d: 46 },
  saturn: { r: 2.5, d: 62 },
  uranus: { r: 1.6, d: 77 },
  neptune: { r: 1.55, d: 90 },
  pluto: { r: 0.32, d: 102 },
};

// 各天體的其他衛星（總覽模式小型展示用）
export const MINI_MOONS = {
  mars: [['火衛一', 0.08, 1.0, 0.32], ['火衛二', 0.06, 1.35, 1.26]],
  jupiter: [['木衛一', 0.13, 4.2, 1.77], ['木衛二', 0.12, 5.0, 3.55], ['木衛三', 0.18, 6.0, 7.15], ['木衛四', 0.16, 7.2, 16.7]],
  saturn: [['土衛六 泰坦', 0.18, 6.2, 15.9]],
  neptune: [['海衛一 崔頓', 0.12, 2.6, -5.9]],
  pluto: [['凱倫', 0.16, 0.9, 6.4]],
};

// 銀河系「宇宙地址」步驟
export const GALAXY_STEPS = [
  {
    id: 'oort', title: '太陽系與奧爾特雲', scale: '約 3 光年',
    text: '八大行星都擠在中心那個小亮點裡！包圍太陽系的是一大團冰塊雲——奧爾特雲，延伸到約 1.6 光年遠，是長週期彗星的老家。',
  },
  {
    id: 'neighbors', title: '太陽的鄰居', scale: '約 50 光年',
    text: '離太陽最近的恆星是比鄰星，距離 4.2 光年——光要跑 4 年多！就算搭最快的太空船，也要飛好幾千年。',
  },
  {
    id: 'arm', title: '獵戶臂', scale: '約 8,000 光年',
    text: '太陽系位在銀河系一條較小的旋臂——「獵戶臂」上。這裡的恆星比較不擁擠，對生命來說是比較安全的地方。',
  },
  {
    id: 'galaxy', title: '銀河系（俯視）', scale: '約 10 萬光年',
    text: '銀河系是一個棒旋星系，有 1,000 億到 4,000 億顆恆星。太陽距離銀河中心約 2.6 萬光年，以每秒約 230 公里的速度繞中心轉，一圈要約 2.3 億年，叫做「銀河年」。',
  },
  {
    id: 'edge', title: '銀河系（側看）', scale: '盤面厚約 1,000 光年',
    text: '從側面看，銀河系像兩個背對背的荷包蛋：中間鼓起的是核球，中心有一個超大質量黑洞「人馬座 A*」。夏夜天空那條「銀河」，就是我們從盤面裡面看出去的樣子。',
  },
  {
    id: 'local', title: '本星系群', scale: '約 500 萬光年',
    text: '銀河系不孤單！它和仙女座星系、三角座星系，以及大小麥哲倫雲等 80 多個星系組成「本星系群」。仙女座星系距離約 250 萬光年，大約 45 億年後會和銀河系相撞合併。',
  },
];

// 自動導覽腳本
export const TOUR = [
  { mode: 'overview', text: '歡迎來到太陽系！太陽和繞著它轉的八大行星、矮行星、衛星、小行星與彗星，組成了一個大家庭。' },
  { mode: 'overview', layer: 'zones', text: '靠近太陽的水星、金星、地球、火星是岩石做的「類地行星」；小行星帶外面的木星、土星是「氣體巨行星」，天王星、海王星是「冰巨行星」。' },
  { focus: 'sun' }, { focus: 'mercury' }, { focus: 'venus' }, { focus: 'earth' }, { focus: 'moon' },
  { focus: 'mars' }, { focus: 'jupiter' }, { focus: 'saturn' }, { focus: 'uranus' }, { focus: 'neptune' }, { focus: 'pluto' },
  { mode: 'size', text: '把行星排成一排，用真實比例來比大小：木星的直徑是地球的 11 倍，而太陽是地球的 109 倍！左邊那一大片，只是太陽的一小角。' },
  { mode: 'distance', text: '再來看真實的距離：太陽系大部分都是空蕩蕩的太空。光從太陽出發，8 分鐘到地球，但要 4 個多小時才到海王星。', photon: true },
  { galaxy: 0 }, { galaxy: 1 }, { galaxy: 2 }, { galaxy: 3 }, { galaxy: 4 }, { galaxy: 5 },
  { mode: 'overview', text: '這就是我們在宇宙中的地址：本星系群、銀河系、獵戶臂、太陽系、地球。導覽結束，歡迎自己動手點點看每一顆星球！' },
];
