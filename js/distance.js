// 比距離：2D 畫布，真實比例 / 對數壓縮，並可發射一道光
import { BODIES, BODY_MAP, AU_KM, LIGHT_KM_S } from './data.js';
import { fmt, fmtDuration } from './util.js';

const PLANETS = BODIES.filter(b => b.id !== 'sun' && !b.parent);
const MAX_AU = 40;

export class DistanceView {
  constructor(canvas, cardEl, clockEl) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.card = cardEl; this.clock = clockEl;
    this.scale = 'real'; this.sel = 'earth';
    this.photon = null; this.ls = 600; this.flash = {};
    this.active = false; this.t = 0;
    this.stars = Array.from({ length: 260 }, () => [Math.random(), Math.random(), Math.random() * 1.2 + .2, Math.random() * 6]);
    canvas.addEventListener('pointerdown', e => this.pick(e));
    this.resize();
  }
  show() { this.active = true; this.c.classList.remove('hidden'); this.resize(); this.renderCard(); }
  hide() { this.active = false; this.c.classList.add('hidden'); this.photon = null; }
  setScale(s) { this.scale = s; }
  setLightSpeed(v) { this.ls = v; }
  firePhoton() { this.photon = { sec: 0 }; this.flash = {}; }
  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.w = innerWidth; this.h = innerHeight; this.dpr = dpr;
    this.c.width = this.w * dpr; this.c.height = this.h * dpr;
  }
  // 版面：畫在上方列與下方面板之間
  layout() {
    const panel = document.getElementById('dist-panel');
    const ph = panel && !panel.classList.contains('hidden') ? panel.getBoundingClientRect().height : 0;
    const narrow = this.w < 720 || this.h < 520;
    const top = narrow ? 112 : 70, bottom = this.h - ph - 20;
    return { x0: narrow ? 30 : 60, x1: this.w - (narrow ? 22 : 50), y: top + (bottom - top) * (this.scale === 'real' ? 0.62 : 0.5), top, bottom };
  }
  xOf(au, L) {
    const f = this.scale === 'real' ? au / MAX_AU : Math.log(Math.max(au, .2) / .2) / Math.log(45 / .2);
    return L.x0 + (L.x1 - L.x0) * f;
  }
  pick(e) {
    if (!this.active) return;
    const L = this.layout();
    let best = null, bd = 30;
    for (const b of PLANETS) {
      const x = this.xOf(b.au, L), d = Math.abs(e.clientX - x) + Math.abs(e.clientY - L.y) * .3;
      if (d < bd) { bd = d; best = b; }
    }
    // 真實比例下的內太陽系放大框
    if (this.scale === 'real' && this.inset) {
      const I = this.inset;
      if (e.clientX > I.x && e.clientX < I.x + I.w && e.clientY > I.y && e.clientY < I.y + I.h) {
        for (const b of PLANETS.filter(p => p.au < 1.7)) {
          const x = I.x + 16 + (I.w - 32) * (b.au / 1.7), d = Math.abs(e.clientX - x);
          if (d < 22 && (!best || d < bd)) { bd = d; best = b; }
        }
      }
    }
    if (best) { this.sel = best.id; this.renderCard(); }
  }
  renderCard() {
    const b = BODY_MAP[this.sel];
    const km = b.au * AU_KM;
    const lightS = km / LIGHT_KM_S;
    const hsr = km / 300 / 24 / 365.25, car = km / 100 / 24 / 365.25, walk = km / 5 / 24 / 365.25;
    const yrs = y => y < 1 ? `${fmt(y * 365.25, 0)} 天` : y >= 10000 ? `${fmt(y / 10000, 1)} 萬年` : `${fmt(y, 0)} 年`;
    this.card.innerHTML = [
      ['head', `${b.name}離太陽`, `${fmt(km / 1e8, 2)} 億公里<small>（${fmt(b.au, 2)} AU）</small>`],
      ['', '☀️ 光要跑', fmtDuration(lightS)],
      ['', '🚄 高鐵 300 km/h', yrs(hsr)],
      ['', '🚗 汽車 100 km/h', yrs(car)],
      ['', '🚶 走路 5 km/h', yrs(walk)],
    ].map(([c, k, v]) => `<div class="stat ${c}"><span>${k}</span><b>${v}</b></div>`).join('');
  }
  update(dt) {
    if (!this.active) return;
    this.t += dt;
    if (this.photon) {
      this.photon.sec += dt * this.ls;
      const au = this.photon.sec * LIGHT_KM_S / AU_KM;
      for (const b of PLANETS) if (au >= b.au && !this.flash[b.id]) this.flash[b.id] = this.t;
      this.clock.textContent = `光走了 ${fmtDuration(this.photon.sec)}`;
      if (au > 46) this.photon = null;
    }
    this.draw();
  }
  draw() {
    const { ctx, w, h, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#050816'; ctx.fillRect(0, 0, w, h);
    for (const [sx, sy, r, ph] of this.stars) {
      ctx.globalAlpha = .35 + .35 * Math.sin(this.t * 1.3 + ph);
      ctx.fillStyle = '#cfe0ff'; ctx.beginPath(); ctx.arc(sx * w, sy * h, r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const L = this.layout();
    // 太陽（左側邊緣的一大片光）
    const g = ctx.createRadialGradient(L.x0 - 40, L.y, 4, L.x0 - 40, L.y, 90);
    g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(.25, 'rgba(255,190,80,.9)'); g.addColorStop(1, 'rgba(255,140,40,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(L.x0 - 40, L.y, 90, 0, 7); ctx.fill();
    // 軸線與刻度
    ctx.strokeStyle = 'rgba(150,190,255,.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(L.x0, L.y); ctx.lineTo(L.x1, L.y); ctx.stroke();
    ctx.font = '12px "Noto Sans TC", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(159,176,214,.8)';
    const ticks = this.scale === 'real' ? [0, 5, 10, 15, 20, 25, 30, 35, 40] : [.2, .5, 1, 2, 5, 10, 20, 40];
    for (const t of ticks) {
      const x = this.xOf(t, L);
      ctx.fillRect(x - .5, L.y + 22, 1, 6);
      ctx.fillText(`${t} AU`, x, L.y + 42);
    }
    ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(234,242,255,.75)';
    ctx.fillText(this.scale === 'real' ? '每格 5 AU（1 AU = 地球到太陽的距離 ≈ 1.5 億公里）' : '壓縮顯示：越往右，每一格代表的距離越大', L.x0, L.y + 64);
    // 光子
    let pau = -1;
    if (this.photon) {
      pau = this.photon.sec * LIGHT_KM_S / AU_KM;
      const x = this.xOf(Math.max(pau, 0.0001), L);
      const lg = ctx.createLinearGradient(L.x0, 0, x, 0);
      lg.addColorStop(0, 'rgba(255,230,140,0)'); lg.addColorStop(1, 'rgba(255,240,170,.9)');
      ctx.strokeStyle = lg; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(L.x0, L.y); ctx.lineTo(x, L.y); ctx.stroke();
      const pg = ctx.createRadialGradient(x, L.y, 0, x, L.y, 14);
      pg.addColorStop(0, '#fff'); pg.addColorStop(.4, 'rgba(255,230,120,.9)'); pg.addColorStop(1, 'rgba(255,200,80,0)');
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(x, L.y, 14, 0, 7); ctx.fill();
    }
    // 行星
    PLANETS.forEach((b, i) => {
      const x = this.xOf(b.au, L);
      const r = Math.max(3, Math.min(11, 2.5 + Math.sqrt(b.radiusE) * 2.4));
      const sel = b.id === this.sel;
      const fl = this.flash[b.id] != null ? Math.max(0, 1 - (this.t - this.flash[b.id]) / 1.2) : 0;
      if (fl > 0) {
        ctx.fillStyle = `rgba(255,240,170,${fl * .6})`; ctx.beginPath(); ctx.arc(x, L.y, r + 18 * (1 - fl) + 6, 0, 7); ctx.fill();
      }
      if (sel) { ctx.strokeStyle = '#7cdcff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, L.y, r + 6, 0, 7); ctx.stroke(); }
      ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(x, L.y, r, 0, 7); ctx.fill();
      if (b.id === 'saturn') { ctx.strokeStyle = 'rgba(232,211,160,.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, L.y, r * 2, r * .6, -.3, 0, 7); ctx.stroke(); }
      // 內行星在真實比例下會擠在一起，標籤交錯擺放
      const crowded = this.scale === 'real' && b.au < 2;
      if (!crowded || sel) {
        const up = i % 2 === 0;
        ctx.textAlign = 'center'; ctx.font = `${sel ? 700 : 500} 13px "Noto Sans TC", sans-serif`;
        ctx.fillStyle = sel ? '#7cdcff' : '#eaf2ff';
        ctx.fillText(b.name, x, up ? L.y - r - 10 : L.y + r + 18 > L.y + 18 ? L.y - r - 26 : L.y - r - 10);
      }
    });
    // 真實比例的內太陽系放大框
    this.inset = null;
    if (this.scale === 'real') {
      const I = { x: L.x0, y: L.top + 6, w: Math.min(360, (L.x1 - L.x0) * .55), h: 78 };
      if (L.y - I.y - I.h < 40) I.h = Math.max(54, L.y - I.y - 50);
      this.inset = I;
      ctx.fillStyle = 'rgba(14,22,48,.7)'; ctx.strokeStyle = 'rgba(124,220,255,.4)'; ctx.lineWidth = 1;
      roundRect(ctx, I.x, I.y, I.w, I.h, 10); ctx.fill(); ctx.stroke();
      const x15 = this.xOf(1.7, L);
      ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(124,220,255,.35)';
      ctx.beginPath(); ctx.moveTo(I.x + 8, I.y + I.h); ctx.lineTo(L.x0, L.y - 8); ctx.moveTo(I.x + I.w - 8, I.y + I.h); ctx.lineTo(x15, L.y - 8); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(159,176,214,.9)'; ctx.font = '11px "Noto Sans TC", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('放大看：內太陽系（0～1.7 AU）', I.x + 10, I.y + 15);
      const iy = I.y + I.h * .62;
      ctx.strokeStyle = 'rgba(150,190,255,.3)'; ctx.beginPath(); ctx.moveTo(I.x + 16, iy); ctx.lineTo(I.x + I.w - 16, iy); ctx.stroke();
      ctx.fillStyle = '#ffb547'; ctx.beginPath(); ctx.arc(I.x + 16, iy, 5, 0, 7); ctx.fill();
      for (const b of PLANETS.filter(p => p.au < 1.7)) {
        const x = I.x + 16 + (I.w - 32) * (b.au / 1.7);
        const sel = b.id === this.sel;
        if (pau >= b.au && this.flash[b.id] != null) {
          const fl = Math.max(0, 1 - (this.t - this.flash[b.id]) / 1.2);
          ctx.fillStyle = `rgba(255,240,170,${fl * .6})`; ctx.beginPath(); ctx.arc(x, iy, 12, 0, 7); ctx.fill();
        }
        if (sel) { ctx.strokeStyle = '#7cdcff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, iy, 9, 0, 7); ctx.stroke(); }
        ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(x, iy, 4.5, 0, 7); ctx.fill();
        ctx.fillStyle = sel ? '#7cdcff' : '#eaf2ff'; ctx.textAlign = 'center'; ctx.font = '11px "Noto Sans TC", sans-serif';
        ctx.fillText(b.name, x, iy - 10);
      }
      if (pau > 0 && pau < 1.7) {
        const x = I.x + 16 + (I.w - 32) * (pau / 1.7);
        ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(x, iy, 3.5, 0, 7); ctx.fill();
      }
    }
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
