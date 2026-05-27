// LA FORMA ENCONTRADA — Triangulo mode

let W, H, frame = 0;
let mx, my, pmx, pmy, vhx = 0, vhy = 0;
let expandFactor = 1.0, densityFactor = 1.0;
let particles = [], triPts = [];
let swipeActive = false;
let canvas, ctx;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  mx = W / 2; my = H / 2; pmx = W / 2; pmy = H / 2;
  buildAnchors();
  if (particles.length) resetParticles();
}

function buildAnchors() {
  const cx = W / 2, cy = H / 2;
  const r = Math.min(W, H) * 0.36 * expandFactor;
  triPts = [];
  for (let i = 0; i < 3; i++) {
    const a = Math.PI * (-0.5 + i * 2 / 3);
    triPts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
}

function drawReference() {
  const cx = W / 2, cy = H / 2;
  const r = Math.min(W, H) * 0.36 * expandFactor;
  ctx.strokeStyle = 'rgba(192,72,40,0.15)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(triPts[0][0], triPts[0][1]);
  triPts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath(); ctx.stroke();
  const ox = r * 0.12, oy = r * 0.11;
  ctx.setLineDash([6, 4]); ctx.strokeStyle = 'rgba(24,95,165,0.1)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(triPts[0][0] + ox, triPts[0][1] + oy);
  triPts.forEach(([x, y]) => ctx.lineTo(x + ox, y + oy)); ctx.closePath(); ctx.stroke();
  ctx.setLineDash([]);
  triPts.forEach(([x, y]) => {
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(192,72,40,0.4)'; ctx.fill();
  });
}

class P {
  constructor() { this.reset(); }
  reset() {
    if (triPts.length < 3) { this.x = W/2; this.y = H/2; this.vx = 0; this.vy = 0; }
    else {
      const e = Math.floor(Math.random() * 3), t = Math.random();
      const a = triPts[e], b = triPts[(e + 1) % 3];
      this.x = a[0] + (b[0] - a[0]) * t + (Math.random() - 0.5) * 10;
      this.y = a[1] + (b[1] - a[1]) * t + (Math.random() - 0.5) * 10;
      const dx = this.x - W/2, dy = this.y - H/2, d = Math.sqrt(dx*dx+dy*dy) || 1;
      this.vx = dx/d * -0.3 + (Math.random() - 0.5) * 0.5;
      this.vy = dy/d * -0.3 + (Math.random() - 0.5) * 0.5;
    }
    this.life = Math.random() * 260 + 80; this.maxLife = this.life;
    this.sz = Math.random() * 2 + 0.3; this.trail = []; this.svx = 0; this.svy = 0;
  }
  update() {
    this.trail.push([this.x, this.y]);
    if (this.trail.length > 16) this.trail.shift();
    if (swipeActive) {
      const dx = this.x - mx, dy = this.y - my, d = Math.sqrt(dx*dx+dy*dy) + 1;
      const inf = Math.max(0, 1 - d / 320) ** 2;
      this.svx += vhx * inf * 0.45; this.svy += vhy * inf * 0.12;
    }
    this.svx *= 0.90; this.svy *= 0.90;
    let fx = 0, fy = 0;
    triPts.forEach(([tx, ty]) => {
      const dx = tx - this.x, dy = ty - this.y, d = Math.sqrt(dx*dx+dy*dy) + 1;
      fx += dx/d * 0.022; fy += dy/d * 0.022;
    });
    if (!swipeActive) {
      const mdx = this.x - mx, mdy = this.y - my, md = Math.sqrt(mdx*mdx+mdy*mdy) + 1;
      if (md < 140) { fx += mdx/md * 0.75; fy += mdy/md * 0.75; }
    }
    this.vx += fx + this.svx * 0.09; this.vy += fy + this.svy * 0.09;
    const sp = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
    if (sp > 3.5) { this.vx = this.vx/sp*3.5; this.vy = this.vy/sp*3.5; }
    this.vx *= 0.97; this.vy *= 0.97;
    this.x += this.vx; this.y += this.vy;
    this.life--;
    if (this.life <= 0 || this.x < -50 || this.x > W+50 || this.y < -50 || this.y > H+50) this.reset();
  }
  draw() {
    const a = this.life / this.maxLife;
    if (this.trail.length > 2) {
      ctx.beginPath(); ctx.moveTo(this.trail[0][0], this.trail[0][1]);
      this.trail.forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.strokeStyle = `rgba(255,255,255,${a*0.15})`; ctx.lineWidth = this.sz * 0.4; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(this.x, this.y, this.sz, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${a*0.88})`; ctx.fill();
  }
}

function resetParticles() {
  particles = [];
  for (let i = 0; i < Math.floor(700 * densityFactor); i++) particles.push(new P());
}

function loop() {
  ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.fillRect(0, 0, W, H);
  buildAnchors(); drawReference();
  particles.forEach(p => { p.update(); p.draw(); });
  vhx = mx - pmx; vhy = my - pmy;
  swipeActive = Math.abs(vhx) > 7 && Math.abs(vhx) > Math.abs(vhy) * 1.3;
  if (swipeActive) leg('swipe', true); else leg('swipe', false);
  pmx = mx; pmy = my; frame++;
  requestAnimationFrame(loop);
}

// Callbacks for camera.js
function onExpand() { resetParticles(); }
function onContract() { resetParticles(); }
function onReset() { resetParticles(); }
function onDensityChange() { resetParticles(); }

function init() {
  canvas = document.getElementById('c');
  ctx = canvas.getContext('2d');
  resize(); resetParticles(); loop();
  window.addEventListener('resize', resize);
  canvas.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  canvas.addEventListener('touchmove', e => { e.preventDefault(); mx = e.touches[0].clientX; my = e.touches[0].clientY; }, { passive: false });
  initKeyboard();
  initCamera();
}
