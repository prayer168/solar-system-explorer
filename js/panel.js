// 星球資訊卡與下方星球選單
import { BODY_MAP, DOCK_ORDER, AU_KM, EARTH_G } from './data.js';
import { $, $$, fmt } from './util.js';

const TEX = 'assets/textures/';
let current = null, tab = 'intro', cb = {};

export function ballStyle(b) {
  if (b.texture) {
    const glow = b.id === 'sun' ? 'box-shadow:0 0 18px rgba(255,181,71,.8);' : '';
    return `background-image:url(${TEX}${b.texture});${glow}`;
  }
  // 冥王星：程式繪製的示意（淡色愛心＋暗帶）
  return 'background:radial-gradient(circle at 62% 58%, #f4e6d2 0 18%, transparent 19%),' +
    'linear-gradient(170deg, transparent 52%, rgba(90,60,40,.55) 53% 68%, transparent 69%),' +
    'radial-gradient(circle at 35% 35%, #ead2b6, #d8b89a 50%, #8f7259);';
}

// ---------- 數字的兒童友善寫法 ----------
function distText(b) {
  if (b.id === 'sun') return ['離太陽', '太陽系中心'];
  if (b.parent) return ['離地球', `${fmt(b.distFromParentKm / 10000, 1)} 萬公里`];
  const km = b.au * AU_KM;
  return ['離太陽', `${fmt(km / 1e8, 1)} 億公里<small>（${fmt(b.au, 2)} AU）</small>`];
}
function yearText(b) {
  if (b.id === 'sun') return ['繞銀河一圈', '約 2.3 億年'];
  if (b.parent) return ['繞地球一圈', `${fmt(b.periodDays, 1)} 天`];
  const d = b.periodDays;
  return ['一年（公轉）', d < 730 ? `${fmt(d, 0)} 天` : `${fmt(d / 365.25, 1)} 年`];
}
function hoursText(h) {
  h = Math.abs(h);
  return h < 72 ? `${fmt(h, 1)} 小時` : `${fmt(h / 24, 1)} 天`;
}
function dayText(b) {
  if (b.dayH == null) return ['自轉一圈', `約 ${hoursText(b.rotationH)}`];
  return ['一天（日出到日出）', hoursText(b.dayH) + (b.rotationH < 0 ? '<small>（倒著轉）</small>' : '')];
}

const ATMO_COLORS = ['#7cdcff', '#ffcf6b', '#ff8a5c', '#a98bff', '#7be0a0', '#ff7ab6'];

function renderIntro(b) {
  const [dl, dv] = distText(b), [yl, yv] = yearText(b), [al, av] = dayText(b);
  const stats = [
    ['直徑', `${fmt(b.diameterKm)} 公里`],
    ['重力', `${fmt(b.gravity, 1)} m/s²<small>（地球 ${fmt(b.gravity / EARTH_G, 2)} 倍）</small>`],
    [dl, dv], [yl, yv], [al, av],
    ['溫度', b.tempNote],
    ['衛星', b.typeKey === 'moon' ? '它自己就是衛星' : `${b.moons} 顆`],
    ['大小比一比', b.earthsFit],
  ];
  const atmo = b.atmosphere.map(([n, p], i) =>
    `<div style="width:${Math.max(p, 4)}%;background:${b.atmosphere.length === 1 ? 'rgba(255,255,255,.12)' : ATMO_COLORS[i % 6]}" title="${n} ${p}%"><span>${n}${b.atmosphere.length > 1 ? ' ' + p + '%' : ''}</span></div>`).join('');
  let link = '';
  if (b.id === 'earth') link = `<button class="pill link-btn" data-link="moon">🌙 看看月球</button>`;
  if (b.id === 'moon') link = `<button class="pill link-btn" data-link="earth">🌍 回到地球</button>`;
  return `<p class="intro">${b.intro}</p>
    <div class="stats">${stats.map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`).join('')}</div>
    <h4 class="atmo-title">${b.atmoLabel}</h4><div class="atmo">${atmo}</div>${link}`;
}

function renderInside(b) {
  const R = 96, cx = 100;
  const circles = [...b.layers].reverse().map(l =>
    `<circle cx="${cx}" cy="${cx}" r="${(l.r * R).toFixed(1)}" fill="${l.color}" stroke="rgba(0,0,0,.25)" stroke-width=".6"/>`).join('');
  const surface = b.texture
    ? `<defs><pattern id="surf" patternUnits="userSpaceOnUse" width="384" height="192"><image href="${TEX}${b.texture}" width="384" height="192" preserveAspectRatio="none"/></pattern>
       <radialGradient id="shade" cx="35%" cy="35%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".15"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient></defs>
       <path d="M100,100 L100,4 A96,96 0 1,0 196,100 Z" fill="url(#surf)"/><path d="M100,100 L100,4 A96,96 0 1,0 196,100 Z" fill="url(#shade)"/>`
    : `<path d="M100,100 L100,4 A96,96 0 1,0 196,100 Z" fill="${b.color}" opacity=".95"/>`;
  const list = b.layers.map(l => `<li><b><i style="background:${l.color}"></i>${l.name}</b><span>${l.desc}</span></li>`).join('');
  return `<div class="cutaway"><svg viewBox="0 0 200 200" aria-label="${b.name}剖面圖">${circles}${surface}
      <line x1="100" y1="100" x2="100" y2="4" stroke="rgba(255,255,255,.5)" stroke-width=".8"/>
      <line x1="100" y1="100" x2="196" y2="100" stroke="rgba(255,255,255,.5)" stroke-width=".8"/></svg>
    <ul class="layers">${list}</ul></div>
    <p class="note">切開來看看！由內到外的構造（示意圖，比例約略）。</p>`;
}

function renderCompare(b) {
  const E = BODY_MAP.earth;
  const rows = [
    ['直徑', b.diameterKm, E.diameterKm, v => `${fmt(v)} km`],
    ['質量', b.massE, 1, v => `${fmt(v, v < 1 ? 3 : 1)} 倍`],
    ['重力', b.gravity, E.gravity, v => `${fmt(v, 1)} m/s²`],
    ['離太陽', b.parent ? E.au : b.au, 1, v => `${fmt(v, 2)} AU`],
    ['一年', b.periodDays, E.periodDays, v => v < 730 ? `${fmt(v, 0)} 天` : `${fmt(v / 365.25, 1)} 年`],
    ['一天', b.dayH ?? Math.abs(b.rotationH), 24, v => hoursText(v)],
    ['溫度', b.tempC, 15, v => `${fmt(v)}°C`, v => v + 273],
    ['衛星', b.moons, 1, v => `${fmt(v)} 顆`],
  ];
  const bars = rows.map(([label, v, ev, f, tr]) => {
    const tv = tr ? tr(v) : v, te = tr ? tr(ev) : ev;
    const max = Math.max(tv, te) || 1;
    const w = Math.max(1.5, (tv / max) * 100), em = (te / max) * 100;
    return `<div class="bar-row"><label>${label}</label><div class="track"><i style="width:${w}%;background:${b.color}"></i>
      <span class="earth-mark" style="left:${em}%" title="地球"></span></div><em>${f(v)}</em></div>`;
  }).join('');
  const g = b.gravity;
  return `<p class="note">彩色長條是${b.name}，白色細線是地球的位置。</p><div class="bars">${bars}</div>
    <div class="weight"><h4>🧒 如果你站在${b.name}上…</h4>
      <label>我的體重 <input id="kg" type="range" min="15" max="80" value="30"> <b id="kg-v">30 公斤</b></label>
      <div class="result"><span class="kid" id="kid">🧍</span><div>你會覺得自己有 <b id="w-v"></b><br>原地用力跳，可以跳 <b id="j-v"></b><span class="jump"></span></div></div>
    </div>`;

  function _() { return g; }
}

function bindCompare(b) {
  const kg = $('#kg'); if (!kg) return;
  const upd = () => {
    const k = +kg.value, w = k * b.gravity / EARTH_G, j = 30 * EARTH_G / b.gravity;
    $('#kg-v').textContent = `${k} 公斤`;
    $('#w-v').textContent = `${fmt(w, w < 10 ? 1 : 0)} 公斤重`;
    $('#j-v').textContent = j >= 100 ? `${fmt(j / 100, 1)} 公尺高` : `${fmt(j, j < 2 ? 1 : 0)} 公分高`;
    const s = Math.min(2.2, Math.max(0.55, Math.pow(w / k, 0.35)));
    $('#kid').style.transform = `scaleY(${1 / s}) scaleX(${s})`;
  };
  kg.addEventListener('input', upd); upd();
}

function renderFacts(b) {
  return `<ul class="facts">${b.facts.map(f => `<li>${f}</li>`).join('')}</ul>`;
}
function renderMissions(b) {
  return `<div class="missions">${b.missions.map(([n, y, d]) =>
    `<div class="mission"><em>${y}</em><b>${n}</b><span>${d}</span></div>`).join('')}</div>
    <p class="note">🚀 人類派出探測器，代替我們去看看遙遠的世界。</p>`;
}

function renderTab() {
  const b = current; if (!b) return;
  const body = $('#p-body');
  const fn = { intro: renderIntro, inside: renderInside, compare: renderCompare, facts: renderFacts, missions: renderMissions }[tab];
  body.innerHTML = fn(b);
  body.scrollTop = 0;
  $$('.tabs button').forEach(x => x.classList.toggle('on', x.dataset.tab === tab));
  if (tab === 'compare') bindCompare(b);
  $$('[data-link]', body).forEach(x => x.addEventListener('click', () => cb.onLink && cb.onLink(x.dataset.link)));
}

export function initPanel(callbacks) {
  cb = callbacks;
  $$('.tabs button').forEach(x => x.addEventListener('click', () => { tab = x.dataset.tab; renderTab(); }));
  $('#panel-close').addEventListener('click', () => cb.onClose && cb.onClose());
  $('#p-prev').addEventListener('click', () => cb.onNav && cb.onNav(-1));
  $('#p-next').addEventListener('click', () => cb.onNav && cb.onNav(1));
}

export function openPanel(b, keepTab = false) {
  const same = current && current.id === b.id;
  current = b;
  if (!keepTab && !same) tab = 'intro';
  const ball = $('#p-ball');
  ball.setAttribute('style', ballStyle(b));
  $('#p-type').textContent = b.type;
  $('#p-type').style.setProperty('--c', b.color);
  $('#p-name').textContent = b.name;
  $('#p-en').textContent = b.en;
  renderTab();
  $('#panel').classList.add('open');
  document.body.classList.add('panel-open');
}

export function closePanelUI() {
  current = null;
  $('#panel').classList.remove('open');
  document.body.classList.remove('panel-open');
}

export function buildDock(onPick) {
  const dock = $('#dock');
  dock.innerHTML = '';
  for (const id of DOCK_ORDER) {
    const b = BODY_MAP[id];
    const btn = document.createElement('button');
    btn.className = 'dock-item'; btn.dataset.id = id; btn.title = b.name;
    const s = id === 'sun' ? 40 : Math.round(20 + Math.min(18, Math.sqrt(b.radiusE) * 7));
    btn.innerHTML = `<span class="ball" style="--s:${s}px;${ballStyle(b)}"></span><span>${b.name}</span>`;
    btn.addEventListener('click', () => onPick(id));
    dock.appendChild(btn);
  }
}
export function setDockActive(id) {
  $$('.dock-item').forEach(x => x.classList.toggle('on', x.dataset.id === id || (id === 'moon' && x.dataset.id === 'earth')));
}
