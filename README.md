# 🪐 太陽系探險家 Solar System Explorer

給國小學生的 3D 互動太陽系與銀河系教材。

🔗 **線上版（GitHub Pages）：https://prayer168.github.io/solar-system-explorer/**

全螢幕、單頁、不捲動，電腦、平板、手機都能用，也可以投影上課。

## 功能

| 模式 | 內容 |
|---|---|
| 🪐 總覽 | 太陽、八大行星、冥王星與月球在軌道上運行。可調時間速度，開關軌道、名稱、小行星帶與分類圖層。點星球會飛過去並打開介紹卡：特色、大小、距離、公轉與自轉、溫度、衛星、內部構造剖面、小知識與問答。 |
| ⚖️ 比大小 | 依真實比例排列各星球（1 地球半徑＝1 單位），也可以把太陽加進來比。 |
| 📏 比距離 | 真實距離或壓縮顯示。「發射一道光」可看光從太陽跑到各行星要多久（真實光速、×100、×600、×3000）。 |
| 🌌 銀河系 | 從太陽系一路縮小：奧爾特雲 → 太陽的鄰居 → 銀河系的旋臂 → 本星系群，看看太陽系在銀河系的哪裡。 |
| ▶ 自動導覽 | 鏡頭自動依序介紹，並附字幕與中文語音朗讀，適合投影上課。 |

**操作方式**
- 拖曳或單指滑動：旋轉；滾輪或雙指：縮放
- 鍵盤：← → 切換星球、空白鍵暫停、Esc 關閉
- 可加到主畫面，以 PWA 全螢幕使用；看過一次後可離線使用

## 技術

- 原生 HTML、CSS 與 ES Modules，不需要建置
- [three.js](https://threejs.org) 0.160，透過 importmap 從 jsDelivr 載入
- Service Worker：程式檔網路優先，貼圖快取優先

```
index.html            頁面骨架與 UI
css/style.css         版面（RWD、玻璃面板、手機底部抽屜）
js/main.js            場景、相機、模式切換、導覽、主迴圈
js/data.js            星球資料與導覽腳本
js/panel.js           資訊卡
js/distance.js        比距離模式
js/galaxy.js          銀河系多層縮放
js/util.js            補間動畫、標籤、語音
assets/textures/      星球貼圖
sw.js / manifest.webmanifest   PWA
```

## 本機執行

```bash
python -m http.server 8123
# 開啟 http://localhost:8123
```

## 部署

### GitHub Pages（已啟用）
Settings → Pages：來源是 `main` 分支的根目錄 `/`。repo 裡有 `.nojekyll`，GitHub 會直接提供靜態檔。只要 push，約一分鐘後就會更新。

### Vercel

在 Vercel 用 **Import Git Repository** 選擇本 repo，設定如下：
- Framework Preset：**Other**
- Build Command：留空
- Output Directory：`.`（根目錄）

## 資料來源與授權

- 星球貼圖：[Solar System Scope](https://www.solarsystemscope.com/textures/)，[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，依據 NASA 資料製作
- 星球數據：NASA Planetary Fact Sheet、NASA Science。數字已四捨五入，衛星數量會隨新發現改變
- 冥王星貼圖由程式繪製，僅供示意
- three.js：MIT License

製作：黑熊老師的自然教室
