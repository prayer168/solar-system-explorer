// 太陽系探險家 — 主程式：3D 場景、軌道、模式切換、導覽
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BODIES, BODY_MAP, DOCK_ORDER, OVERVIEW, MINI_MOONS, GALAXY_STEPS, TOUR } from './data.js';
import { $, $$, clamp, lerp, easeInOut, easeOut, animate, stepTweens, cancelTween, fmt, Labels, speech } from './util.js';
import { initPanel, openPanel, closePanelUI, buildDock, setDockActive } from './panel.js';
import { DistanceView } from './distance.js';
import { Galaxy } from './galaxy.js';

const DEG = Math.PI / 180;
const J2000 = Date.UTC(2000, 0, 1, 12);
const HOME = { pos: new THREE.Vector3(0, 48, 95), target: new THREE.Vector3(0, 0, 0) };
const INCL = { mercury: 7, venus: 3.4, mars: 1.85, jupiter: 1.3, saturn: 2.5, uranus: .77, neptune: 1.77, pluto: 17.1 };
const TYPE_COLOR = { star: '#ffb547', rocky: '#e0a070', moon: '#bbbbbb', gas: '#f0c890', ice: '#7fd8f0', dwarf: '#c9a8ff' };
const isMobile = () => matchMedia('(max-width:720px), (max-height:520px) and (orientation:landscape)').matches;

// ---------- 渲染器 ----------
const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, .01, 10000);
camera.position.set(0, 260, 420);
const controls = new OrbitControls(camera, canvas);
Object.assign(controls, { enableDamping: true, dampingFactor: .08, maxDistance: 900, minDistance: 1, rotateSpeed: .7, zoomSpeed: .9 });
controls.addEventListener('start', () => cancelTween('cam'));

const labels = new Labels($('#labels'), THREE);

// ---------- 載入 ----------
const manager = new THREE.LoadingManager();
let loaded = false;
const loaderText = $('#loader-text');
manager.onProgress = (url, n, total) => { loaderText.textContent = `正在準備星球… ${Math.round(n / total * 100)}%`; };
manager.onLoad = () => finishLoading();
setTimeout(() => finishLoading(), 15000);
const texLoader = new THREE.TextureLoader(manager);
const maxAniso = renderer.capabilities.getMaxAnisotropy();
function tex(name, srgb = true) {
  const t = texLoader.load('assets/textures/' + name);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, maxAniso);
  return t;
}

// ---------- 場景物件 ----------
const solarGroup = new THREE.Group(); scene.add(solarGroup);
const sizeGroup = new THREE.Group(); sizeGroup.visible = false; scene.add(sizeGroup);

const sunLight = new THREE.PointLight(0xffffff, 3, 0, 0); scene.add(sunLight);
const ambient = new THREE.AmbientLight(0xffffff, .35); scene.add(ambient);

const starTex = tex('2k_stars_milky_way.jpg');
const sky = new THREE.Mesh(new THREE.SphereGeometry(4000, 64, 32),
  new THREE.MeshBasicMaterial({ map: starTex, side: THREE.BackSide, color: 0x8a8a9a, depthWrite: false }));
scene.add(sky);

function glowTexture(inner = 'rgba(255,240,200,1)', mid = 'rgba(255,170,60,.35)') {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, inner); gr.addColorStop(.25, mid); gr.addColorStop(1, 'rgba(255,120,20,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const GLOW = glowTexture();
function glowSprite(scale, op) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.setScalar(scale); return s;
}

function plutoTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#b89a7c'; g.fillRect(0, 0, 512, 256);
  let seed = 7; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 260; i++) {
    g.fillStyle = `rgba(${90 + r() * 80},${60 + r() * 50},${40 + r() * 40},${.15 + r() * .25})`;
    g.beginPath(); g.ellipse(r() * 512, r() * 256, 4 + r() * 30, 3 + r() * 16, r() * 3, 0, 7); g.fill();
  }
  // 愛心冰原（史波尼克平原）
  g.fillStyle = 'rgba(245,235,220,.92)';
  g.beginPath();
  const cx = 300, cy = 140, s = 46;
  g.moveTo(cx, cy + s * .9);
  g.bezierCurveTo(cx - s * 1.6, cy - s * .1, cx - s * .7, cy - s * 1.2, cx, cy - s * .45);
  g.bezierCurveTo(cx + s * .7, cy - s * 1.2, cx + s * 1.6, cy - s * .1, cx, cy + s * .9);
  g.fill();
  // 暗色赤道帶（克蘇魯區）
  g.fillStyle = 'rgba(70,35,25,.55)'; g.beginPath(); g.ellipse(130, 150, 110, 28, -.1, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// 地球日夜 shader
function earthMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { dayMap: { value: tex('2k_earth_daymap.jpg') }, nightMap: { value: tex('2k_earth_nightmap.jpg') }, sunPos: { value: new THREE.Vector3() } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform sampler2D dayMap; uniform sampler2D nightMap; uniform vec3 sunPos;
      varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){
        vec3 L = normalize(sunPos - vW); float d = dot(normalize(vN), L);
        vec3 day = texture2D(dayMap, vUv).rgb; vec3 night = texture2D(nightMap, vUv).rgb;
        float k = smoothstep(-0.15, 0.2, d);
        vec3 col = mix(night * 1.4 + day * .03, day * (0.25 + 0.95 * max(d, 0.0)), k);
        vec3 V = normalize(cameraPosition - vW);
        float rim = pow(1.0 - max(dot(V, normalize(vN)), 0.0), 3.0);
        col += vec3(.3,.55,1.0) * rim * (0.15 + 0.6 * k);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

function atmosphere(r, color, op = .5) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, 48, 24), new THREE.ShaderMaterial({
    uniforms: { c: { value: new THREE.Color(color) }, op: { value: op } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 c; uniform float op; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.5); gl_FragColor = vec4(c, f * op);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide,
  }));
}

function ringGeometry(inner, outer) {
  const g = new THREE.RingGeometry(inner, outer, 160, 1);
  const p = g.attributes.position, uv = g.attributes.uv, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); uv.setXY(i, (v.length() - inner) / (outer - inner), .5); }
  return g;
}

function makeBodyMesh(b, r) {
  let mat;
  if (b.id === 'sun') mat = new THREE.MeshBasicMaterial({ map: tex(b.texture), color: 0xffffff });
  else if (b.id === 'earth') mat = earthMaterial();
  else if (b.id === 'pluto') mat = new THREE.MeshStandardMaterial({ map: plutoTexture(), roughness: 1, metalness: 0 });
  else mat = new THREE.MeshStandardMaterial({ map: tex(b.texture), roughness: 1, metalness: 0 });
  const seg = r > 2 ? 96 : 64;
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg / 2), mat);
  const root = new THREE.Group(); root.add(mesh);
  if (b.id === 'sun') { root.add(glowSprite(r * 3.2, .9)); root.add(glowSprite(r * 7, .35)); }
  if (b.clouds) {
    const cl = new THREE.Mesh(new THREE.SphereGeometry(r * 1.015, 64, 32),
      new THREE.MeshStandardMaterial({ map: tex('2k_earth_clouds.jpg'), alphaMap: tex('2k_earth_clouds.jpg', false), transparent: true, opacity: .85, depthWrite: false }));
    mesh.add(cl); root.userData.clouds = cl;
  }
  if (b.id === 'earth') root.add(atmosphere(r * 1.06, '#5fa8ff', .55));
  if (b.id === 'venus') root.add(atmosphere(r * 1.05, '#ffd9a0', .45));
  if (b.id === 'mars') root.add(atmosphere(r * 1.04, '#ff9a6a', .25));
  if (b.id === 'neptune') root.add(atmosphere(r * 1.04, '#5f8dff', .35));
  if (b.id === 'uranus') root.add(atmosphere(r * 1.04, '#9ff0ff', .3));
  if (b.rings) {
    const rt = tex('2k_saturn_ring_alpha.png');
    const ring = new THREE.Mesh(ringGeometry(r * 1.24, r * 2.27),
      new THREE.MeshStandardMaterial({ map: rt, alphaMap: rt, transparent: true, side: THREE.DoubleSide, roughness: 1, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; mesh.add(ring);
  }
  if (b.thinRings) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(r * 1.6, r * 2.0, 128, 1),
      new THREE.MeshBasicMaterial({ color: 0xcfe8f0, transparent: true, opacity: .35, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; mesh.add(ring);
  }
  return { root, mesh };
}

// ---------- 建立太陽系（總覽） ----------
const nodes = {};          // id -> { b, r, d, orbit, holder, tilt, mesh, root, pick, line }
const pickables = [];
const orbitLines = [];
const tmpV = new THREE.Vector3();

for (const b of BODIES) {
  const o = OVERVIEW[b.id]; if (!o) continue;
  const n = { b, r: o.r, d: o.d };
  const parent = b.parent ? nodes[b.parent].holder : solarGroup;
  n.orbit = new THREE.Group();
  n.orbit.rotation.z = (b.parent ? 5.1 : (INCL[b.id] || 0)) * DEG;
  parent.add(n.orbit);
  n.holder = new THREE.Group(); n.orbit.add(n.holder);
  n.tilt = new THREE.Group(); n.tilt.rotation.z = (b.tiltDeg || 0) * DEG; n.holder.add(n.tilt);
  const { root, mesh } = makeBodyMesh(b, o.r);
  n.root = root; n.mesh = mesh; n.tilt.add(root);
  // 點選用的隱形球
  n.pick = new THREE.Mesh(new THREE.SphereGeometry(Math.max(o.r * 1.3, .9), 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
  n.pick.userData.id = b.id; n.holder.add(n.pick); pickables.push(n.pick);
  // 軌道線
  if (o.d > 0) {
    const pts = []; for (let i = 0; i <= 256; i++) { const a = i / 256 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * o.d, 0, -Math.sin(a) * o.d)); }
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0x9fb4ff, transparent: true, opacity: b.parent ? .25 : .35, depthWrite: false }));
    n.orbit.add(line); n.line = line; orbitLines.push(n);
  }
  // 小衛星
  n.minis = [];
  for (const [name, mr, md, mp] of (MINI_MOONS[b.id] || [])) {
    const s = o.r + md * (b.id === 'jupiter' || b.id === 'saturn' ? .55 : 1) + (b.id === 'jupiter' || b.id === 'saturn' ? o.r * .35 : 0);
    const g = new THREE.Group(); n.holder.add(g);
    const m = new THREE.Mesh(new THREE.SphereGeometry(mr, 24, 12), new THREE.MeshStandardMaterial({ color: 0xbdb5a8, roughness: 1 }));
    m.position.x = s; g.add(m);
    g.rotation.y = Math.random() * Math.PI * 2;
    n.minis.push({ g, m, period: mp, name });
    labels.add(name, v => m.getWorldPosition(v), { cls: 'minor', group: 'minor', maxDist: 30, getRadius: () => mr });
  }
  nodes[b.id] = n;
}

// 太陽本身的光芒閃動
const sunNode = nodes.sun;

// 小行星帶、古柏帶
function belt(n, r0, r1, h, color, size) {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = r0 + (r1 - r0) * Math.pow(Math.random(), .9);
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = (Math.random() - .5) * h; pos[i * 3 + 2] = Math.sin(a) * r;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color, size, sizeAttenuation: true, transparent: true, opacity: .8, depthWrite: false }));
}
const asteroidBelt = belt(3000, 32, 40, 1.4, 0xb0a090, .16);
const kuiperBelt = belt(4000, 95, 115, 5, 0x9fb8d8, .22);
solarGroup.add(asteroidBelt, kuiperBelt);
labels.add('小行星帶', v => v.set(0, 0, -36), { cls: 'minor', group: 'belts' });
labels.add('古柏帶', v => v.set(-74, 0, -74), { cls: 'minor', group: 'belts' });

// 適居帶（生命可居住區）
const zone = new THREE.Mesh(new THREE.RingGeometry(18, 25, 128, 1),
  new THREE.MeshBasicMaterial({ color: 0x3ee08a, transparent: true, opacity: .14, side: THREE.DoubleSide, depthWrite: false }));
zone.rotation.x = -Math.PI / 2; zone.visible = false; solarGroup.add(zone);
const zoneLabel = labels.add('🌱 適居帶：水可以是液體', v => v.set(0, 0, 21.5), { cls: 'minor', group: 'zones' });

// 星球標籤
for (const id in nodes) {
  const n = nodes[id];
  labels.add(n.b.name, v => n.holder.getWorldPosition(v), {
    cls: id === 'sun' ? 'big' : (n.b.parent ? 'minor' : ''), group: 'bodies', getRadius: () => n.r,
    maxDist: n.b.parent ? 40 : Infinity, onClick: () => focusBody(id),
  });
}

// ---------- 比大小模式（真實比例：1 地球半徑 = 1 單位） ----------
const SIZE_SUN_X = -111.1;
const sizeItems = {};
{
  let x = 0;
  for (const id of DOCK_ORDER) {
    if (id === 'sun') continue;
    const b = BODY_MAP[id], r = b.radiusE;
    x += r;
    const { root, mesh } = makeBodyMesh(b, r);
    const tilt = new THREE.Group(); tilt.rotation.z = (b.tiltDeg || 0) * DEG; tilt.add(root);
    tilt.position.set(x, 0, 0); sizeGroup.add(tilt);
    const pick = new THREE.Mesh(new THREE.SphereGeometry(Math.max(r * 1.1, .6), 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
    pick.position.copy(tilt.position); pick.userData.sizeId = id; sizeGroup.add(pick);
    sizeItems[id] = { b, r, x, mesh, root };
    if (mesh.material.uniforms && mesh.material.uniforms.sunPos) mesh.material.uniforms.sunPos.value.set(SIZE_SUN_X, 0, 0);
    labels.add(b.name, v => v.set(sizeItems[id].x, 0, 0), { group: 'size', getRadius: () => r, onClick: () => sizeFocus(id) });
    x += r + 1.2;
  }
  const sb = BODY_MAP.sun;
  const { root, mesh } = makeBodyMesh(sb, 109.1);
  root.position.set(SIZE_SUN_X, 0, 0); sizeGroup.add(root);
  sizeItems.sun = { b: sb, r: 109.1, x: SIZE_SUN_X, mesh, root };
  labels.add('太陽（只露出一角）', v => v.set(SIZE_SUN_X + 60, 95, 0), { cls: 'big', group: 'size' });
}
const sizeTotal = (() => { const p = sizeItems.pluto; return p.x + p.r; })();

// ---------- 銀河系 & 距離 ----------
const galaxy = new Galaxy(canvas, labels);
const dist = new DistanceView($('#dist-canvas'), $('#dist-card'), $('#photon-clock'));

// ---------- 狀態 ----------
const state = {
  mode: 'overview', focus: null, playing: true, days: (Date.now() - J2000) / 864e5,
  speed: 45, layers: { orbits: true, labels: true, belts: true, zones: false },
  viewF: 0, sizeSel: null,
};
const camRel = new THREE.Vector3();
let following = false;

// ---------- 時間 ----------
function daysPerSec() { const v = 10 ** ((state.speed - 45) / 22); return state.focus ? Math.min(v, .04) : v; }
function speedLabel() {
  const d = 10 ** ((state.speed - 45) / 22);
  if (d < 1 / 24) return `1 秒 = ${fmt(d * 1440, 1)} 分鐘`;
  if (d < 1) return `1 秒 = ${fmt(d * 24, 1)} 小時`;
  if (d < 60) return `1 秒 = ${fmt(d, 1)} 天`;
  if (d < 730) return `1 秒 = ${fmt(d / 30.44, 1)} 個月`;
  return `1 秒 = ${fmt(d / 365.25, 1)} 年`;
}
function updateDateUI() {
  const dt = new Date(J2000 + state.days * 864e5);
  $('#sim-date').textContent = `${dt.getUTCFullYear()} 年 ${dt.getUTCMonth() + 1} 月 ${dt.getUTCDate()} 日`;
}

function placeBodies(dtSec) {
  const days = state.days;
  for (const id in nodes) {
    const n = nodes[id], b = n.b;
    if (n.d > 0) {
      const th = ((b.L0 ?? 0) + 360 * days / b.periodDays) * DEG;
      n.holder.position.set(Math.cos(th) * n.d, 0, -Math.sin(th) * n.d);
    }
    // 自轉（以模擬時間計，但每幀限制最大角度避免頻閃）
    if (b.rotationH) {
      const w = 2 * Math.PI * (dtSec * daysPerSec() * 24) / b.rotationH;
      const capped = Math.sign(w) * Math.min(Math.abs(w), .15) + dtSec * .02 * Math.sign(b.rotationH);
      if (b.parent) { /* 月球潮汐鎖定：永遠同一面朝地球 */ n.mesh.rotation.y = Math.atan2(-n.holder.position.x, -n.holder.position.z) + Math.PI; }
      else n.mesh.rotation.y += state.playing ? capped : dtSec * .02 * Math.sign(b.rotationH);
    }
    if (n.root.userData.clouds) n.root.userData.clouds.rotation.y += dtSec * .01;
    for (const m of n.minis) m.g.rotation.y = 2 * Math.PI * days / m.period;
  }
  const e = nodes.earth;
  e.mesh.material.uniforms.sunPos.value.set(0, 0, 0);
  // 比大小模式：慢慢自轉
  if (state.mode === 'size') for (const id in sizeItems) sizeItems[id].mesh.rotation.y += dtSec * (id === 'sun' ? .01 : .12);
}

// ---------- 視角偏移（資訊面板打開時讓星球置中於剩下的空間） ----------
function applyViewOffset() {
  const w = innerWidth, h = innerHeight, f = state.viewF;
  if (f < .001) { camera.clearViewOffset(); return; }
  if (isMobile()) camera.setViewOffset(w, h, 0, h * .31 * f, w, h);
  else { const pw = Math.min(400, w * .36); camera.setViewOffset(w, h, pw / 2 * f, 0, w, h); }
}
function tweenViewF(to) {
  const from = state.viewF;
  animate(.9, e => { state.viewF = lerp(from, to, e); applyViewOffset(); }, easeInOut, 'viewf');
}

// ---------- 相機移動 ----------
function flyTo(pos, target, dur = 2) {
  following = false;
  const p0 = camera.position.clone(), t0 = controls.target.clone();
  return animate(dur, e => { camera.position.lerpVectors(p0, pos, e); controls.target.lerpVectors(t0, target, e); }, easeInOut, 'cam');
}

function focusOffset(n) {
  const p = n.holder.getWorldPosition(new THREE.Vector3());
  const sunDir = p.lengthSq() > 1e-6 ? p.clone().negate().normalize() : new THREE.Vector3(0, 0, 1);
  const up = new THREE.Vector3(0, 1, 0);
  const perp = new THREE.Vector3().crossVectors(up, sunDir).normalize();
  if (perp.lengthSq() < .5) perp.set(1, 0, 0);
  const k = n.b.id === 'sun' ? 3.2 : 4.2;
  const off = sunDir.multiplyScalar(.6).add(perp.multiplyScalar(.75)).add(up.multiplyScalar(.35)).normalize().multiplyScalar(n.r * k * (isMobile() ? 1.25 : 1));
  if (n.b.id === 'saturn') off.multiplyScalar(1.25);
  return off;
}

function focusBody(id, opts = {}) {
  if (state.mode !== 'overview') setMode('overview', { keepFocus: true });
  const n = nodes[id]; if (!n) return;
  state.focus = id;
  const off = focusOffset(n);
  const startRel = camera.position.clone().sub(n.holder.getWorldPosition(tmpV));
  const t0 = controls.target.clone();
  const tgtStart = t0.clone().sub(n.holder.getWorldPosition(new THREE.Vector3()));
  following = false;
  controls.minDistance = n.r * 1.3;
  animate(2.2, e => {
    const p = n.holder.getWorldPosition(tmpV);
    const rel = new THREE.Vector3().lerpVectors(startRel, off, e);
    controls.target.copy(p).add(tgtStart.clone().multiplyScalar(1 - e));
    camera.position.copy(p).add(rel);
  }, easeInOut, 'cam').then(done => { if (done) { following = true; camRel.copy(off); } });
  // 跟隨：tween 期間也持續更新，結束後記錄相對位置
  if (!opts.noPanel) { openPanel(n.b); tweenViewF(1); }
  setDockActive(id);
}

function unfocus() {
  if (!state.focus && state.mode === 'overview') { flyTo(HOME.pos, HOME.target, 2); return; }
  state.focus = null; following = false;
  controls.minDistance = 1;
  closePanelUI(); tweenViewF(0); setDockActive(null);
  if (state.mode === 'overview') flyTo(HOME.pos, HOME.target, 2.2);
  if (state.mode === 'size') sizeFrame(state.sizeSel === 'sun' ? 'sun' : 'all');
}

function navBody(dir) {
  const order = [...DOCK_ORDER.slice(0, 4), 'moon', ...DOCK_ORDER.slice(4)];
  const cur = state.mode === 'size' ? (state.sizeSel || 'earth') : (state.focus || 'sun');
  let i = order.indexOf(cur); i = (i + dir + order.length) % order.length;
  if (state.mode === 'size') { const id = order[i] === 'moon' ? (dir > 0 ? 'mars' : 'earth') : order[i]; sizeFocus(id); }
  else focusBody(order[i]);
}

// ---------- 比大小 ----------
function sizeFrame(which) {
  state.sizeSel = which === 'sun' ? 'sun' : null;
  $('#size-all').classList.toggle('on', which !== 'sun');
  $('#size-sun').classList.toggle('on', which === 'sun');
  const asp = innerWidth / innerHeight, mob = asp < 1;
  if (which === 'sun') {
    flyTo(new THREE.Vector3(-20, 20, mob ? 520 : 300), new THREE.Vector3(-20, 0, 0), 2.2);
    $('#size-text').innerHTML = '太陽的直徑大約是地球的 <b>109 倍</b>，體積可以裝進約 <b>130 萬顆</b>地球！右邊那排小點，就是全部的行星。';
  } else {
    const mid = sizeTotal / 2, span = sizeTotal * 1.08;
    const d = (span / 2) / Math.tan(22.5 * DEG) / Math.min(asp, 1.8) * (mob ? 1.1 : 1);
    flyTo(new THREE.Vector3(mid, d * .18, d), new THREE.Vector3(mid, 0, 0), 2);
    $('#size-text').innerHTML = '這是行星的<b>真實大小比例</b>（距離不是真的）。點一顆星球，看看它跟地球比起來有多大。';
  }
  closePanelUI(); tweenViewF(0); setDockActive(null);
}
function sizeFocus(id) {
  if (id === 'moon') id = 'earth';
  if (state.mode !== 'size') setMode('size');
  const it = sizeItems[id]; if (!it) return;
  state.sizeSel = id;
  if (id === 'sun') { sizeFrame('sun'); openPanel(it.b); tweenViewF(1); setDockActive('sun'); return; }
  $('#size-all').classList.remove('on'); $('#size-sun').classList.remove('on');
  const p = new THREE.Vector3(it.x, 0, 0);
  flyTo(p.clone().add(new THREE.Vector3(0, it.r * .3, it.r * 4.5 * (isMobile() ? 1.3 : 1))), p, 1.8);
  const b = it.b, rE = b.radiusE;
  $('#size-text').innerHTML = `<b>${b.name}</b>的半徑是地球的 <b>${fmt(rE, 2)} 倍</b>${b.earthsFit ? `（${b.earthsFit}）` : ''}。`;
  openPanel(b); tweenViewF(1); setDockActive(id);
}

// ---------- 圖層 ----------
function applyLayers() {
  const L = state.layers;
  for (const n of orbitLines) {
    n.line.visible = L.orbits;
    n.line.material.color.set(L.zones ? TYPE_COLOR[n.b.typeKey] || '#9fb4ff' : '#9fb4ff');
    n.line.material.opacity = L.zones ? .7 : (n.b.parent ? .25 : .35);
  }
  asteroidBelt.visible = kuiperBelt.visible = L.belts;
  zone.visible = L.zones;
  labels.visible = L.labels;
  labels.setGroup('zones', L.zones);
  labels.setGroup('belts', L.belts);
  $('#legend').classList.toggle('hidden', !L.zones || state.mode !== 'overview');
  $$('[data-toggle]').forEach(x => x.classList.toggle('on', !!L[x.dataset.toggle]));
}

// ---------- 模式切換 ----------
const MODES = ['overview', 'size', 'distance', 'galaxy'];
function setMode(m, opts = {}) {
  if (m === state.mode && !opts.force) return;
  const prev = state.mode;
  state.mode = m;
  document.body.classList.remove(...MODES.map(x => 'mode-' + x));
  document.body.classList.add('mode-' + m);
  $$('#modes button').forEach(x => x.classList.toggle('on', x.dataset.mode === m));
  $('#size-panel').classList.toggle('hidden', m !== 'size');
  $('#dist-panel').classList.toggle('hidden', m !== 'distance');
  $('#galaxy-panel').classList.toggle('hidden', m !== 'galaxy');

  if (!opts.keepFocus) { state.focus = null; following = false; closePanelUI(); state.viewF = 0; applyViewOffset(); setDockActive(null); }
  controls.minDistance = 1;
  cancelTween('cam');

  solarGroup.visible = m === 'overview';
  sizeGroup.visible = m === 'size';
  sunLight.position.set(m === 'size' ? SIZE_SUN_X : 0, 0, 0);
  ambient.intensity = m === 'size' ? .45 : .35;
  controls.enabled = m === 'overview' || m === 'size';

  if (m === 'distance') dist.show(); else if (prev === 'distance') dist.hide();
  if (m === 'galaxy') { galaxy.show(); galaxy.go(galaxy.cur ? galaxy.step : 0, !galaxy.cur); updateGalaxyUI(); }
  else if (prev === 'galaxy') galaxy.hide();

  if (m === 'overview' && !opts.keepFocus && prev !== 'overview') {
    camera.position.set(0, 140, 260); controls.target.set(0, 0, 0); flyTo(HOME.pos, HOME.target, 2);
  }
  if (m === 'size') { camera.position.set(-40, 60, 200); controls.target.set(0, 0, 0); sizeFrame('all'); }
  applyLayers();
}

function updateGalaxyUI() {
  const i = galaxy.step, st = GALAXY_STEPS[i];
  $('#g-title').textContent = st.title;
  $('#g-scale').textContent = st.scale;
  $('#g-text').textContent = st.text;
  $('#g-dots').innerHTML = GALAXY_STEPS.map((s, k) => `<button class="${k === i ? 'on' : ''}" data-g="${k}" aria-label="${s.title}" title="${s.title}"></button>`).join('');
  $$('#g-dots button').forEach(x => x.addEventListener('click', () => galaxyGo(+x.dataset.g)));
  $('#g-prev').disabled = i === 0;
  $('#g-next').disabled = i === GALAXY_STEPS.length - 1;
}
function galaxyGo(i) {
  if (state.mode !== 'galaxy') setMode('galaxy');
  galaxy.go(i); updateGalaxyUI();
}

// ---------- 點選 ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let down = null;
canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener('pointerup', e => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t;
  down = null;
  if (moved > 6 || dt > 400) return;
  if (state.mode !== 'overview' && state.mode !== 'size') return;
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  camera.updateMatrixWorld();
  ray.setFromCamera(ndc, camera);
  if (state.mode === 'overview') {
    const hit = ray.intersectObjects(pickables, false)[0];
    if (hit) { stopTour(); focusBody(hit.object.userData.id); }
  } else {
    const hit = ray.intersectObjects(sizeGroup.children.filter(c => c.userData.sizeId), false)[0];
    if (hit) { stopTour(); sizeFocus(hit.object.userData.sizeId); }
  }
});

// ---------- 導覽 ----------
const tour = { on: false, i: 0, paused: false, t: 0, dur: 8, spoken: false, speechDone: false, step: null };
function captionFor(s) {
  if (s.focus) { const b = BODY_MAP[s.focus]; return `<b>${b.name}</b>：${b.intro}${b.facts && b.facts[0] ? (typeof b.facts[0] === 'string' ? b.facts[0] : (b.facts[0].text || '')) : ''}`; }
  if (s.galaxy !== undefined) { const g = GALAXY_STEPS[s.galaxy]; return `<b>${g.title}</b>（${g.scale}）：${g.text}`; }
  return s.text;
}
function runTourStep() {
  const s = TOUR[tour.i]; tour.step = s;
  tour.t = 0; tour.speechDone = false; tour.photonFired = false;
  const html = captionFor(s);
  const plainLen = html.replace(/<[^>]+>/g, '').length;
  tour.dur = Math.max(6, plainLen * .19);
  $('#caption-text').innerHTML = html;
  $('#caption').classList.remove('hidden');
  // 動作
  const wantZones = s.layer === 'zones';
  if (state.layers.zones !== wantZones) { state.layers.zones = wantZones; applyLayers(); }
  if (s.focus) focusBody(s.focus);
  else if (s.galaxy !== undefined) galaxyGo(s.galaxy);
  else if (s.mode) {
    if (s.mode === 'overview') {
      if (state.mode !== 'overview') setMode('overview');
      else { if (state.focus) { state.focus = null; closePanelUI(); tweenViewF(0); setDockActive(null); controls.minDistance = 1; } flyTo(HOME.pos, HOME.target, 2.4); }
      if (s.layer === 'zones') flyTo(new THREE.Vector3(0, 70, 60), new THREE.Vector3(0, 0, 0), 2.4);
    } else setMode(s.mode);
  }
  const token = tour.token = (tour.token || 0) + 1;
  tour.spoken = speech.speak(html, () => { if (tour.token === token) tour.speechDone = true; });
  updateCaptionUI();
}
function tourTick(dt) {
  if (!tour.on || tour.paused) return;
  tour.t += dt;
  const s = tour.step;
  if (s && s.photon && !tour.photonFired && tour.t > 1.2) { tour.photonFired = true; dist.firePhoton(); }
  $('#caption-bar span').style.width = `${Math.min(100, tour.t / (tour.spoken ? Math.max(tour.dur, 3) : tour.dur) * 100)}%`;
  let next = false;
  if (tour.spoken) {
    if (tour.speechDone) {
      if (tour.t < tour.dur * .35) tour.spoken = false;        // 語音太快結束（可能沒有語音），改用計時
      else if (tour.t >= 3) next = true;
    }
    if (tour.t > tour.dur * 2.2) next = true;
  } else if (tour.t >= tour.dur) next = true;
  if (next) tourNext(1);
}
function tourNext(dir) {
  const ni = tour.i + dir;
  if (ni < 0) return;
  if (ni >= TOUR.length) { stopTour(); return; }
  tour.i = ni; runTourStep();
}
function startTour() {
  tour.on = true; tour.paused = false; tour.i = 0;
  document.body.classList.add('touring');
  $('#btn-tour .txt').textContent = '停止導覽'; $('#btn-tour .ico').textContent = '⏹';
  if (!state.playing) togglePlay();
  runTourStep();
}
function stopTour() {
  if (!tour.on) return;
  tour.on = false; speech.stop();
  document.body.classList.remove('touring');
  $('#caption').classList.add('hidden');
  $('#btn-tour .txt').textContent = '自動導覽'; $('#btn-tour .ico').textContent = '▶';
  if (state.layers.zones) { state.layers.zones = false; applyLayers(); }
}
function pauseTour(p = !tour.paused) {
  tour.paused = p;
  if (p) speech.pause(); else speech.resume();
  updateCaptionUI();
}
function updateCaptionUI() { $('#cap-pause').textContent = tour.paused ? '▶' : '⏸'; $('#cap-pause').title = tour.paused ? '繼續' : '暫停'; }

// ---------- UI 綁定 ----------
initPanel({
  onClose: () => unfocus(),
  onNav: dir => { stopTour(); navBody(dir); },
  onLink: id => { stopTour(); if (state.mode === 'size') sizeFocus(id); else focusBody(id); },
});
buildDock(id => { stopTour(); if (state.mode === 'size') sizeFocus(id); else focusBody(id); });

$$('#modes button').forEach(x => x.addEventListener('click', () => { stopTour(); setMode(x.dataset.mode); }));
$('#btn-tour').addEventListener('click', () => (tour.on ? stopTour() : startTour()));
$('#cap-prev').addEventListener('click', () => tourNext(-1));
$('#cap-next').addEventListener('click', () => tourNext(1));
$('#cap-pause').addEventListener('click', () => pauseTour());
$('#cap-stop').addEventListener('click', () => stopTour());

function togglePlay() {
  state.playing = !state.playing;
  $('#btn-play').textContent = state.playing ? '⏸' : '▶';
  $('#btn-play').title = state.playing ? '暫停' : '播放';
}
$('#btn-play').addEventListener('click', togglePlay);
const speedEl = $('#speed');
speedEl.addEventListener('input', () => { state.speed = +speedEl.value; $('#speed-label').textContent = speedLabel(); });
$('#speed-label').textContent = speedLabel();
$$('[data-toggle]').forEach(x => x.addEventListener('click', () => { const k = x.dataset.toggle; state.layers[k] = !state.layers[k]; applyLayers(); }));

$('#size-all').addEventListener('click', () => sizeFrame('all'));
$('#size-sun').addEventListener('click', () => sizeFrame('sun'));

$$('[data-scale]').forEach(x => x.addEventListener('click', () => {
  dist.setScale(x.dataset.scale); $$('[data-scale]').forEach(y => y.classList.toggle('on', y === x));
}));
$$('#light-speed button').forEach(x => x.addEventListener('click', () => {
  dist.setLightSpeed(+x.dataset.ls); $$('#light-speed button').forEach(y => y.classList.toggle('on', y === x));
}));
$('#btn-photon').addEventListener('click', () => dist.firePhoton());

$('#g-prev').addEventListener('click', () => { stopTour(); galaxyGo(galaxy.step - 1); });
$('#g-next').addEventListener('click', () => { stopTour(); galaxyGo(galaxy.step + 1); });

speech.init();
const voiceBtn = $('#btn-voice');
function syncVoice() { voiceBtn.setAttribute('aria-pressed', String(speech.enabled)); voiceBtn.classList.toggle('on', speech.enabled); voiceBtn.title = speech.enabled ? '語音朗讀：開' : '語音朗讀：關'; }
voiceBtn.addEventListener('click', () => { speech.enabled = !speech.enabled; if (!speech.enabled) speech.stop(); syncVoice(); });
syncVoice();

function toggleFull() {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)?.call(document.documentElement);
}
$('#btn-full').addEventListener('click', toggleFull);
$('#btn-about').addEventListener('click', () => $('#about').showModal());

addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('input, textarea, dialog[open]')) return;
  const k = e.key;
  if (k === 'ArrowRight' || k === 'ArrowLeft') {
    const dir = k === 'ArrowRight' ? 1 : -1;
    if (tour.on) tourNext(dir);
    else if (state.mode === 'galaxy') galaxyGo(galaxy.step + dir);
    else if (state.mode === 'overview' || state.mode === 'size') navBody(dir);
    e.preventDefault();
  } else if (k === ' ') { if (tour.on) pauseTour(); else togglePlay(); e.preventDefault(); }
  else if (k === 'Escape') { if (tour.on) stopTour(); else unfocus(); }
  else if (k >= '1' && k <= '4') { stopTour(); setMode(MODES[+k - 1]); }
  else if (k === 'f' || k === 'F') toggleFull();
});

// ---------- 視窗大小 ----------
function onResize() {
  const w = innerWidth, h = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix(); applyViewOffset();
  galaxy.resize(w, h, dpr); dist.resize();
}
addEventListener('resize', onResize);
addEventListener('orientationchange', () => setTimeout(onResize, 200));

// ---------- 載入完成 ----------
function finishLoading() {
  if (loaded) return; loaded = true;
  $('#loader').classList.add('done');
  setTimeout(() => $('#loader').remove(), 1200);
  flyTo(HOME.pos, HOME.target, 3.5).then(() => {
    let seen = false; try { seen = localStorage.getItem('sse-hint') === '1'; } catch (_) {}
    if (!seen) {
      const hint = $('#hint'); hint.classList.remove('hidden');
      setTimeout(() => hint.classList.add('hidden'), 6000);
      try { localStorage.setItem('sse-hint', '1'); } catch (_) {}
    }
  });
}

// ---------- 主迴圈 ----------
setMode('overview', { force: true });
camera.position.set(0, 260, 420);
updateDateUI();
const clock = new THREE.Clock();
const activeOverview = new Set(['bodies', 'minor', 'belts', 'zones']);
const activeSize = new Set(['size']);
const activeGalaxy = new Set(galaxy.labelGroups);
let dateTimer = 0;

function frame() {
  requestAnimationFrame(frame);
  tick(Math.min(clock.getDelta(), .1));
}
function tick(dt) {
  stepTweens(dt);
  if (state.playing && state.mode === 'overview') state.days += dt * daysPerSec();
  placeBodies(dt);
  if (sunNode) { const s = sunNode.root.children[1]; if (s) s.material.opacity = .85 + .08 * Math.sin(performance.now() / 700); }

  // 跟隨聚焦的星球
  if (state.mode === 'overview' && state.focus && following) {
    const p = nodes[state.focus].holder.getWorldPosition(tmpV);
    const delta = p.clone().sub(controls.target);
    controls.target.add(delta); camera.position.add(delta);
  }

  if (state.mode === 'galaxy') {
    galaxy.update(dt); galaxy.render(renderer);
    labels.update(galaxy.camera, activeGalaxy);
  } else if (state.mode === 'distance') {
    dist.update(dt);
    labels.update(camera, new Set());
  } else {
    controls.update();
    renderer.render(scene, camera);
    labels.update(camera, state.mode === 'size' ? activeSize : activeOverview);
  }
  dateTimer += dt; if (dateTimer > .25) { dateTimer = 0; updateDateUI(); }
  tourTick(dt);
}
frame();

// 給除錯用
window.__sse = { state, nodes, camera, controls, galaxy, setMode, focusBody, renderer, scene, labels,
  step(sec = 1, fps = 30) { for (let i = 0; i < sec * fps; i++) tick(1 / fps); } };
