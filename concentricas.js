
let W, H, frame = 0;
let mx, my, pmx, pmy, vhx = 0, vhy = 0;
let expandFactor = 1.0, densityFactor = 1.0;
let swipeActive = false;
let canvas, ctx;
let rings = [];

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  mx = W/2; my = H/2; pmx = W/2; pmy = H/2;
  buildRings();
}

function buildRings() {
  rings = [];
  const maxR = Math.max(W, H) * 0.7;
  const step = maxR / (Math.floor(14 * densityFactor) + 6);
  for (let r = step; r < maxR; r += step) {
    rings.push({ baseR: r, phase: Math.random() * Math.PI * 2, speed: 0.008 + Math.random() * 0.006 });
  }
}

function loop() {
  ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(0, 0, W, H);
  const cx = W/2, cy = H/2;
  rings.forEach((ring, i) => {
    const pulse = Math.sin(frame * ring.speed + ring.phase) * 18 * expandFactor;
    const r = ring.baseR * expandFactor + pulse;
    // Hand deformation — push rings away from cursor
    const hdx = cx - mx, hdy = cy - my;
    const hd = Math.sqrt(hdx*hdx + hdy*hdy) + 1;
    const deform = Math.max(0, 1 - ring.baseR / (300 * expandFactor)) * 40 * expandFactor;
    const alpha = Math.max(0.04, 0.18 - (ring.baseR / Math.max(W,H)) * 0.3);
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2; a += 0.05) {
      const px = cx + (r + deform * Math.cos(a - Math.atan2(hdy, hdx))) * Math.cos(a);
      const py = cy + (r * 0.85 + deform * 0.5 * Math.sin(a - Math.atan2(hdy, hdx))) * Math.sin(a);
      a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.stroke();
  });
  // Swipe ripple
  if (swipeActive) {
    ctx.strokeStyle = `rgba(192,72,40,0.2)`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(mx, my, 20, 0, Math.PI * 2); ctx.stroke();
  }
  vhx = mx - pmx; vhy = my - pmy;
  swipeActive = Math.abs(vhx) > 7 && Math.abs(vhx) > Math.abs(vhy) * 1.3;
  if (swipeActive) leg('swipe', true); else leg('swipe', false);
  pmx = mx; pmy = my; frame++;
  requestAnimationFrame(loop);
}

function onExpand() {}
function onContract() {}
function onReset() { buildRings(); }
function onDensityChange() { buildRings(); }

function init() {
  canvas = document.getElementById('c');
  ctx = canvas.getContext('2d');
  resize(); loop();
  window.addEventListener('resize', resize);
  canvas.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  canvas.addEventListener('touchmove', e => { e.preventDefault(); mx = e.touches[0].clientX; my = e.touches[0].clientY; }, { passive: false });
  initKeyboard();
  initCamera();
}
