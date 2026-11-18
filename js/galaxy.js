// 銀河系模式：從太陽系一路縮小到本星系群（六個尺度，交叉淡入＋縮放）
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GALAXY_STEPS } from './data.js';
import { animate, easeInOut, clamp } from './util.js';

// ---------- 可重現的亂數 ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261118);
const gauss = () => { let u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

// ---------- 點雲材質（大小有上下限，遠處不會消失、近處不會太大） ----------
const VERT = `attribute vec3 aColor; attribute float aSize;
uniform float uScale; uniform float uMax;
varying vec3 vC; varying float vA;
void main(){
  vC = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float s = aSize * uScale / max(-mv.z, 0.001);
  vA = clamp(s / 1.5, 0.15, 1.0);
  gl_PointSize = clamp(s, 1.5, uMax);
}`;
const FRAG = `uniform float uOp; varying vec3 vC; varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d); a *= a;
  gl_FragColor = vec4(vC, a * uOp * vA);
}`;

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(.18, 'rgba(255,255,255,.85)');
  gr.addColorStop(.45, 'rgba(255,255,255,.22)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const GROUP_OF = { oort: 'oort', neighbors: 'neighbors', arm: 'milky', galaxy: 'milky', edge: 'milky', local: 'local' };
const ORDER = ['oort', 'neighbors', 'milky', 'local'];

export class Galaxy {
  constructor(canvas, labels) {
    this.labels = labels;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 20000);
    this.camera.position.set(0, 30, 75);
    this.controls = new OrbitControls(this.camera, canvas);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.08, autoRotate: true, autoRotateSpeed: 0.35, enablePan: false, enabled: false, minDistance: 2, maxDistance: 600 });
    this.uScale = { value: 800 };
    this.glow = glowTexture();
    this.mats = {}; this.groups = {}; this.ops = {}; this.base = {};
    this.active = false; this.step = 0; this.cur = null;
    this.labelGroups = ORDER.map(g => 'g-' + g);

    // 銀河系中心放在 C，讓太陽剛好在世界原點（方便各尺度以太陽為中心縮放）
    this.sunR = 26; this.sunA = 5.68 + Math.PI / 4;
    this.sunLocal = new THREE.Vector3(this.sunR * Math.cos(this.sunA), 0, this.sunR * Math.sin(this.sunA));
    this.C = this.sunLocal.clone().negate();

    for (const g of ORDER) {
      const grp = new THREE.Group(); grp.visible = false;
      this.groups[g] = grp; this.mats[g] = []; this.ops[g] = 0;
      this.base[g] = (g === 'milky' || g === 'local') ? this.C.clone() : new THREE.Vector3();
      grp.position.copy(this.base[g]);
      this.scene.add(grp);
    }
    this.buildBackground();
    this.buildOort();
    this.buildNeighbors();
    this.buildMilky();
    this.buildLocal();
    this.resize(innerWidth, innerHeight, Math.min(devicePixelRatio || 1, 2));
  }

  // ---------- 小工具 ----------
  points(pos, col, size, max = 24, base = 1) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uScale: this.uScale, uMax: { value: max }, uOp: { value: base } },
    });
    return { obj: new THREE.Points(geo, mat), mat, base };
  }
  add(g, { obj, mat, base }, parent) { (parent || this.groups[g]).add(obj); this.mats[g].push({ mat, base }); return obj; }
  sprite(g, color, scale, pos, op = 1, parent) {
    const mat = new THREE.SpriteMaterial({ map: this.glow, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: op });
    const s = new THREE.Sprite(mat); s.scale.setScalar(scale); s.position.copy(pos);
    (parent || this.groups[g]).add(s); this.mats[g].push({ mat, base: op });
    return s;
  }
  line(g, pts, color, op, loop = false, parent) {
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false });
    const l = loop ? new THREE.LineLoop(geo, mat) : new THREE.Line(geo, mat);
    (parent || this.groups[g]).add(l); this.mats[g].push({ mat, base: op });
    return l;
  }
  ring(g, r, color, op, n = 128) {
    const pts = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; pts.push(new THREE.Vector3(r * Math.cos(a), 0, r * Math.sin(a))); }
    return this.line(g, pts, color, op, true);
  }
  label(g, html, local, opt = {}) {
    const grp = this.groups[g], p = local.clone();
    return this.labels.add(html, v => v.copy(p).applyMatrix4(grp.matrixWorld),
      { group: 'g-' + g, cls: opt.cls || 'minor', opacity: () => this.ops[g], getRadius: () => 0 });
  }
  setOp(g, op) {
    this.ops[g] = op;
    for (const { mat, base } of this.mats[g]) {
      if (mat.uniforms && mat.uniforms.uOp) mat.uniforms.uOp.value = base * op; else mat.opacity = base * op;
    }
    this.groups[g].visible = op > 0.005;
  }
  setScale(g, s, pivot) {
    const grp = this.groups[g], B = this.base[g];
    grp.scale.setScalar(s);
    grp.position.copy(pivot).sub(pivot.clone().sub(B).multiplyScalar(s));
  }

  // ---------- 背景星空 ----------
  buildBackground() {
    const pos = [], col = [], size = [];
    for (let i = 0; i < 3000; i++) {
      const v = new THREE.Vector3(gauss(), gauss(), gauss()).normalize().multiplyScalar(3000 + rnd() * 2000);
      pos.push(v.x, v.y, v.z);
      const w = rnd(), b = .35 + rnd() * .5;
      col.push(b * (w < .2 ? 1 : .85), b * .9, b * (w > .7 ? 1 : .8));
      size.push(5 + rnd() * 8);
    }
    const p = this.points(pos, col, size, 3);
    this.scene.add(p.obj);
  }

  // ---------- 1. 太陽系與奧爾特雲 ----------
  buildOort() {
    const g = 'oort', O = new THREE.Vector3();
    this.sprite(g, 0xffd27a, 2.6, O);
    this.sprite(g, 0xff9a3c, 7, O, .35);
    [.45, .7, .95, 1.25, 1.8, 2.2, 2.6, 2.95].forEach(r => this.ring(g, r, 0x8fb8ff, .35));
    // 古柏帶
    let pos = [], col = [], size = [];
    for (let i = 0; i < 2500; i++) {
      const r = 3 + rnd() * 1.2, a = rnd() * Math.PI * 2;
      pos.push(r * Math.cos(a), gauss() * .12, r * Math.sin(a));
      const b = .5 + rnd() * .4; col.push(b * .8, b * .85, b); size.push(.05 + rnd() * .05);
    }
    this.add(g, this.points(pos, col, size, 4));
    // 奧爾特雲：內側較扁、外側近球形
    pos = []; col = []; size = [];
    for (let i = 0; i < 7000; i++) {
      const r = 18 + Math.pow(rnd(), .7) * 22;
      const flat = 0.45 + 0.55 * (r - 18) / 22;
      const v = new THREE.Vector3(gauss(), gauss() * flat, gauss()).normalize().multiplyScalar(r);
      pos.push(v.x, v.y, v.z);
      const b = .35 + rnd() * .45; col.push(b * .7, b * .85, b); size.push(.25 + rnd() * .3);
    }
    this.add(g, this.points(pos, col, size, 5, .9));
    this.label(g, '太陽與八大行星', new THREE.Vector3(0, -1.2, 0), { cls: 'big' });
    this.label(g, '古柏帶', new THREE.Vector3(4.4, 0, 0));
    this.label(g, '奧爾特雲（冰塊雲）', new THREE.Vector3(26, 16, 0), { cls: 'big' });
    this.label(g, '1.6 光年', new THREE.Vector3(-30, -12, 0));
  }

  // ---------- 2. 太陽的鄰居（1 單位＝1 光年） ----------
  buildNeighbors() {
    const g = 'neighbors', O = new THREE.Vector3();
    this.sprite(g, 0xffe08a, 2.4, O);
    this.label(g, '太陽', new THREE.Vector3(0, -.6, 0), { cls: 'big' });
    [5, 10, 20, 40].forEach(r => {
      this.ring(g, r, 0x7aa8ff, .28);
      this.label(g, `${r} 光年`, new THREE.Vector3(r * .7071, 0, r * .7071));
    });
    const STARS = [
      ['比鄰星', 4.24, 0xff7b5c, 1.2, 1.2, .25],
      ['巴納德星', 5.96, 0xff8a66, 1.2, 2.6, -.2],
      ['天狼星', 8.6, 0xbcd6ff, 3, 4.0, -.35],
      ['南河三', 11.5, 0xfff3d6, 2.4, 4.6, .15],
      ['牛郎星', 16.7, 0xf4f7ff, 2.4, .2, .3],
      ['織女星', 25, 0xd8e6ff, 3, 5.6, .45],
      ['北落師門', 25, 0xeaf0ff, 2.4, 2.0, -.5],
      ['大角星', 36.7, 0xffb066, 3.4, 3.2, .4],
      ['五車二', 42.9, 0xfff0b0, 3.4, 5.0, .2],
    ];
    for (const [name, d, color, s, a, el] of STARS) {
      const p = new THREE.Vector3(d * Math.cos(el) * Math.cos(a), d * Math.sin(el), d * Math.cos(el) * Math.sin(a));
      this.sprite(g, color, s, p);
      this.line(g, [p, new THREE.Vector3(p.x, 0, p.z)], 0x9fc0ff, .35);
      this.label(g, `${name} <small>${d} 光年</small>`, p, { cls: '' });
    }
    const pos = [], col = [], size = [];
    for (let i = 0; i < 400; i++) {
      const v = new THREE.Vector3(gauss(), gauss() * .6, gauss()).normalize().multiplyScalar(6 + rnd() * 44);
      pos.push(v.x, v.y, v.z);
      const w = rnd(), b = .4 + rnd() * .4;
      col.push(b, b * (w < .5 ? .7 : .9), b * (w < .5 ? .55 : 1)); size.push(.35 + rnd() * .3);
    }
    this.add(g, this.points(pos, col, size, 6));
  }

  // ---------- 3–5. 銀河系（1 單位＝1,000 光年，半徑 50） ----------
  buildMilky() {
    const g = 'milky', pos = [], col = [], size = [];
    const push = (x, y, z, c, s) => { pos.push(x, y, z); col.push(c[0], c[1], c[2]); size.push(s); };
    const blue = [.62, .74, 1], warm = [1, .82, .62], white = [.95, .95, 1];
    const mix = (a, b, t, k) => [k * (a[0] + (b[0] - a[0]) * t), k * (a[1] + (b[1] - a[1]) * t), k * (a[2] + (b[2] - a[2]) * t)];
    const K = 4.33;
    const armAngle = (i, r) => i * Math.PI / 2 + K * Math.log(r / 7);
    // 四條旋臂（0、2 為主旋臂）
    for (let n = 0; n < 30000; n++) {
      const i = rnd() < .62 ? (rnd() < .5 ? 0 : 2) : (rnd() < .5 ? 1 : 3);
      const r = 7 + 43 * Math.pow(rnd(), 1.3);
      const th = armAngle(i, r), sig = 1.2 + .04 * r;
      const x = r * Math.cos(th) + gauss() * sig, z = r * Math.sin(th) + gauss() * sig;
      const y = gauss() * .5 * (1 - r / 70);
      push(x, y, z, mix(blue, white, rnd(), .55), .28 + rnd() * .25);
    }
    // 粉紅色的恆星育嬰室（HII 區）
    for (let n = 0; n < 600; n++) {
      const i = Math.floor(rnd() * 4), r = 9 + 40 * rnd(), th = armAngle(i, r);
      push(r * Math.cos(th) + gauss() * .8, gauss() * .2, r * Math.sin(th) + gauss() * .8, [.9, .38, .62], .6 + rnd() * .5);
    }
    // 盤面散布的恆星
    for (let n = 0; n < 7000; n++) {
      const r = 50 * Math.sqrt(rnd()) * .95 + 2, a = rnd() * Math.PI * 2;
      push(r * Math.cos(a), gauss() * .6, r * Math.sin(a), mix(warm, white, rnd(), .3), .25 + rnd() * .2);
    }
    // 棒狀結構
    const bc = Math.cos(.44), bs = Math.sin(.44);
    for (let n = 0; n < 4000; n++) {
      const u = gauss() * 6, v = gauss() * 1.6;
      push(u * bc - v * bs, gauss() * .9, u * bs + v * bc, mix(warm, white, rnd() * .3, .5), .3 + rnd() * .25);
    }
    // 核球
    for (let n = 0; n < 9000; n++) push(gauss() * 4, gauss() * 2.2, gauss() * 4, mix(warm, [1, .7, .45], rnd(), .55), .3 + rnd() * .3);
    // 獵戶臂（太陽附近的小旋臂）
    const S = this.sunLocal, tan = new THREE.Vector3(-Math.sin(this.sunA), 0, Math.cos(this.sunA)), rad = S.clone().normalize();
    for (let n = 0; n < 2500; n++) {
      const t = gauss() * 4.5, w = gauss() * .8;
      const p = S.clone().addScaledVector(tan, t).addScaledVector(rad, w + t * .25);
      push(p.x, gauss() * .3, p.z, mix(blue, white, rnd(), .6), .25 + rnd() * .2);
    }
    this.add(g, this.points(pos, col, size, 7));
    // 太陽的位置
    this.sunSprite = this.sprite(g, 0xffe27a, 1.1, S);
    this.sprite(g, 0xffd27a, 3.2, new THREE.Vector3(), .55);
    this.label(g, '你在這裡（太陽）', S, { cls: 'here' });
    this.label(g, '人馬座 A*<small>（超大黑洞）</small>', new THREE.Vector3(0, 0, 0));
    this.label(g, '獵戶臂', S.clone().addScaledVector(tan, 4.5).add(new THREE.Vector3(0, .4, 0)), { cls: '' });
    const NAMES = ['英仙臂', '人馬臂', '盾牌－半人馬臂', '矩尺臂'];
    NAMES.forEach((nm, i) => {
      const r = i < 2 ? 33 : 40, th = armAngle(i, r);
      this.label(g, nm, new THREE.Vector3(r * Math.cos(th), 0, r * Math.sin(th)));
    });
  }

  // ---------- 6. 本星系群 ----------
  spiral(n, R, arms, tint, k, parent) {
    const pos = [], col = [], size = [];
    for (let m = 0; m < n; m++) {
      if (rnd() < .3) {
        pos.push(gauss() * R * .12, gauss() * R * .07, gauss() * R * .12);
        col.push(k, k * .82, k * .6); size.push(R * .05);
        continue;
      }
      const i = Math.floor(rnd() * arms), r = R * (.12 + .88 * Math.pow(rnd(), 1.2));
      const th = i * Math.PI * 2 / arms + 4.33 * Math.log(r / (R * .14));
      pos.push(r * Math.cos(th) + gauss() * R * .05, gauss() * R * .02, r * Math.sin(th) + gauss() * R * .05);
      const t = rnd(); col.push(k * (tint[0] + (1 - tint[0]) * t), k * (tint[1] + (1 - tint[1]) * t), k * tint[2]); size.push(R * .035);
    }
    return this.add('local', this.points(pos, col, size, 6), parent);
  }
  blob(n, R, pos0, k, parent) {
    const pos = [], col = [], size = [];
    for (let m = 0; m < n; m++) {
      pos.push(pos0.x + gauss() * R, pos0.y + gauss() * R * .6, pos0.z + gauss() * R * .8);
      col.push(k * .8, k * .85, k); size.push(R * .12);
    }
    return this.add('local', this.points(pos, col, size, 5), parent);
  }
  buildLocal() {
    const g = 'local';
    const mw = new THREE.Group(); this.groups[g].add(mw);
    this.spiral(5000, 3, 4, [.65, .75, 1], .6, mw);
    const and = new THREE.Group(); and.position.set(50, 4, -8); and.rotation.set(.6, 0, .3); this.groups[g].add(and);
    this.spiral(9000, 4.5, 2, [.75, .75, 1], .55, and);
    const tri = new THREE.Group(); tri.position.set(38, -8, 16); tri.rotation.set(-.5, 0, .4); this.groups[g].add(tri);
    this.spiral(2500, 1.8, 2, [.6, .75, 1], .55, tri);
    this.blob(900, .5, new THREE.Vector3(3.2, -2.2, 1.6), .55);
    this.blob(500, .32, new THREE.Vector3(3.6, -2.8, 2.6), .5);
    this.spinners = [mw, and, tri];
    // 一些矮星系
    for (let i = 0; i < 24; i++) {
      const p = new THREE.Vector3(gauss() * 22 + 22, gauss() * 10, gauss() * 18);
      this.blob(60, .25, p, .35);
    }
    this.label(g, '銀河系（我們）', new THREE.Vector3(0, -2.4, 0), { cls: 'here' });
    this.label(g, '仙女座星系 <small>250 萬光年</small>', new THREE.Vector3(50, -1, -8), { cls: '' });
    this.label(g, '三角座星系', new THREE.Vector3(38, -10, 16), { cls: '' });
    this.label(g, '大麥哲倫雲', new THREE.Vector3(3.2, -2.9, 1.6));
    this.label(g, '小麥哲倫雲', new THREE.Vector3(3.6, -3.6, 2.6));
  }

  // ---------- 鏡頭位置 ----------
  pose(id) {
    const C = this.C, V = (x, y, z) => new THREE.Vector3(x, y, z);
    switch (id) {
      case 'oort': return { pos: V(0, 30, 75), target: V(0, 0, 0) };
      case 'neighbors': return { pos: V(0, 55, 75), target: V(0, 0, 0) };
      case 'arm': return { pos: V(0, 6, 9), target: V(0, 0, 0) };
      case 'galaxy': return { pos: C.clone().add(V(0, 85, 20)), target: C.clone() };
      case 'edge': return { pos: C.clone().add(V(0, 3, 95)), target: C.clone() };
      default: return { pos: C.clone().add(V(20, 30, 80)), target: C.clone().add(V(25, 0, 0)) };
    }
  }

  go(i, instant = false) {
    i = clamp(i, 0, GALAXY_STEPS.length - 1);
    const st = GALAXY_STEPS[i], ng = GROUP_OF[st.id], og = this.cur;
    const forward = og ? ORDER.indexOf(ng) > ORDER.indexOf(og) : true;
    this.step = i; this.cur = ng;
    const P = this.pose(st.id);
    this.controls.autoRotate = false;
    const pivot = (og === 'local' || ng === 'local') ? this.C : new THREE.Vector3();
    for (const g of ORDER) if (g !== og && g !== ng) { this.setOp(g, 0); this.setScale(g, 1, pivot); }
    if (instant || !og) {
      if (og && og !== ng) this.setOp(og, 0);
      this.setOp(ng, 1); this.setScale(ng, 1, pivot);
      this.camera.position.copy(P.pos); this.controls.target.copy(P.target);
      this.controls.update(); this.controls.autoRotate = true;
      return Promise.resolve(true);
    }
    const p0 = this.camera.position.clone(), t0 = this.controls.target.clone();
    const oStart = this.ops[og], nStart = og === ng ? 1 : this.ops[ng];
    const S_OUT = forward ? .2 : 5, S_IN = forward ? 5 : .2;
    return animate(2.6, (e, t) => {
      this.camera.position.lerpVectors(p0, P.pos, e);
      this.controls.target.lerpVectors(t0, P.target, e);
      if (og !== ng) {
        const fo = smooth(t * 2.2), fi = smooth((t - .3) / .7);
        this.setOp(og, oStart * (1 - fo));
        this.setScale(og, Math.pow(S_OUT, smooth(t * 1.6)), pivot);
        this.setOp(ng, nStart + (1 - nStart) * fi);
        this.setScale(ng, Math.pow(S_IN, 1 - smooth(t * 1.15)), pivot);
      } else this.setOp(ng, 1);
    }, easeInOut, 'gcam').then(done => {
      if (done) {
        if (og !== ng) { this.setOp(og, 0); this.setScale(og, 1, pivot); }
        this.setScale(ng, 1, pivot); this.setOp(ng, 1);
        this.controls.autoRotate = true;
      }
      return done;
    });
  }

  show() { this.active = true; this.controls.enabled = true; }
  hide() { this.active = false; this.controls.enabled = false; }

  update(dt) {
    if (!this.active) return;
    if (this.spinners) { this.spinners[0].rotation.y += dt * .05; this.spinners[1].rotation.y += dt * .03; this.spinners[2].rotation.y += dt * .04; }
    if (this.sunSprite) this.sunSprite.material.opacity = this.ops.milky * (.75 + .25 * Math.sin(performance.now() / 300));
    this.controls.update();
  }
  render(renderer) { renderer.render(this.scene, this.camera); }
  resize(w, h, dpr) {
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.uScale.value = h * .5 / Math.tan(this.camera.fov * Math.PI / 360) * dpr;
  }
}
