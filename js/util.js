// 共用小工具：DOM 選取、補間動畫、數字格式、畫面標籤
export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = t => 1 - Math.pow(1 - t, 3);

// ---------- 補間動畫（由主迴圈 stepTweens 推進） ----------
const tweens = new Map();
let tweenId = 0;
export function animate(dur, fn, ease = easeInOut, key = null) {
  return new Promise(resolve => {
    const k = key ?? `t${++tweenId}`;
    const old = tweens.get(k);
    if (old) old.cancel();
    const tw = { t: 0, dur: Math.max(dur, 0.0001), fn, ease, resolve, cancelled: false,
      cancel() { this.cancelled = true; tweens.delete(k); resolve(false); } };
    tweens.set(k, tw);
    tw.key = k;
  });
}
export function stepTweens(dt) {
  for (const [k, tw] of [...tweens]) {
    if (tw.cancelled) continue;
    tw.t = Math.min(1, tw.t + dt / tw.dur);
    tw.fn(tw.ease(tw.t), tw.t);
    if (tw.t >= 1) { tweens.delete(k); tw.resolve(true); }
  }
}
export function cancelTween(key) { const tw = tweens.get(key); if (tw) tw.cancel(); }
export const isTweening = key => (key ? tweens.has(key) : tweens.size > 0);

// ---------- 數字 ----------
export const fmt = (n, d = 0) => Number(n).toLocaleString('zh-TW', { maximumFractionDigits: d, minimumFractionDigits: 0 });

export function fmtDuration(sec) {
  if (sec < 60) return `${fmt(sec, sec < 10 ? 1 : 0)} 秒`;
  if (sec < 3600) { const m = Math.floor(sec / 60); return `${m} 分 ${Math.floor(sec % 60)} 秒`; }
  const h = sec / 3600;
  if (h < 48) { return `${Math.floor(h)} 小時 ${Math.floor((sec % 3600) / 60)} 分`; }
  const d = h / 24;
  if (d < 365 * 2) return `${fmt(d, 0)} 天`;
  const y = d / 365.25;
  if (y < 10000) return `${fmt(y, y < 100 ? 1 : 0)} 年`;
  return `${fmt(y / 10000, 1)} 萬年`;
}

// ---------- 畫面標籤 ----------
// 每個標籤：text、getPos()（回傳世界座標 Vector3）、getRadius()（世界半徑，用來放在星球下方）
export class Labels {
  constructor(container, THREE) {
    this.el = container; this.T = THREE; this.items = [];
    this.v = new THREE.Vector3(); this.v2 = new THREE.Vector3();
    this.visible = true;
  }
  add(html, getPos, opt = {}) {
    const d = document.createElement('div');
    d.className = 'lbl' + (opt.cls ? ' ' + opt.cls : '');
    d.innerHTML = html;
    if (opt.onClick) d.addEventListener('click', e => { e.stopPropagation(); opt.onClick(); });
    this.el.appendChild(d);
    const item = { el: d, getPos, group: opt.group || 'default', getRadius: opt.getRadius || (() => 0),
      maxDist: opt.maxDist ?? Infinity, minDist: opt.minDist ?? 0, opacity: opt.opacity || null, hidden: false };
    this.items.push(item);
    return item;
  }
  setGroup(group, show) { for (const it of this.items) if (it.group === group) it.hidden = !show; }
  removeGroup(group) {
    this.items = this.items.filter(it => { if (it.group === group) { it.el.remove(); return false; } return true; });
  }
  update(camera, activeGroups) {
    const w = innerWidth, h = innerHeight;
    camera.updateMatrixWorld();
    for (const it of this.items) {
      const show = this.visible && !it.hidden && activeGroups.has(it.group);
      if (!show) { if (it.el.style.display !== 'none') it.el.style.display = 'none'; continue; }
      const p = it.getPos(this.v);
      const dist = camera.position.distanceTo(p);
      this.v2.copy(p).project(camera);
      const op = it.opacity ? it.opacity() : 1;
      if (this.v2.z > 1 || dist > it.maxDist || dist < it.minDist || op <= 0.02 ||
          this.v2.x < -1.2 || this.v2.x > 1.2 || this.v2.y < -1.2 || this.v2.y > 1.2) {
        if (it.el.style.display !== 'none') it.el.style.display = 'none';
        continue;
      }
      if (it.el.style.display === 'none') it.el.style.display = '';
      const x = (this.v2.x * 0.5 + 0.5) * w;
      let y = (-this.v2.y * 0.5 + 0.5) * h;
      const r = it.getRadius();
      if (r > 0) {
        // 依螢幕上的半徑往下推，讓標籤在星球下方
        const fov = camera.fov * Math.PI / 180;
        const px = (r / (dist * Math.tan(fov / 2))) * (h / 2) / (camera.view?.enabled ? 1 : 1);
        y += Math.min(px, h * 0.4) + 4;
      } else y += 6;
      it.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, 0)`;
      it.el.style.opacity = op < 1 ? op : '';
    }
  }
}

// 簡單的語音朗讀（zh-TW）
export const speech = {
  enabled: true,
  voice: null,
  init() {
    if (!('speechSynthesis' in window)) { this.enabled = false; return; }
    const pick = () => {
      const vs = speechSynthesis.getVoices();
      this.voice = vs.find(v => /zh[-_]TW/i.test(v.lang)) || vs.find(v => /zh[-_](HK|Hant)/i.test(v.lang)) || vs.find(v => /^zh/i.test(v.lang)) || null;
    };
    pick();
    speechSynthesis.onvoiceschanged = pick;
  },
  speak(text, onEnd) {
    this.stop();
    if (!this.enabled || !('speechSynthesis' in window)) return false;
    const plain = text.replace(/<[^>]+>/g, '');
    const parts = plain.match(/[^。！？!?]+[。！？!?]?/g) || [plain];
    let i = 0, done = false;
    const finish = () => { if (!done) { done = true; onEnd && onEnd(); } };
    const next = () => {
      if (i >= parts.length) return finish();
      const u = new SpeechSynthesisUtterance(parts[i++].trim());
      u.lang = 'zh-TW'; if (this.voice) u.voice = this.voice;
      u.rate = 0.95; u.pitch = 1.1;
      u.onend = next; u.onerror = finish;
      this._u = u;
      speechSynthesis.speak(u);
    };
    next();
    return true;
  },
  pause() { if ('speechSynthesis' in window) speechSynthesis.pause(); },
  resume() { if ('speechSynthesis' in window) speechSynthesis.resume(); },
  stop() { if ('speechSynthesis' in window) { speechSynthesis.cancel(); } },
};
