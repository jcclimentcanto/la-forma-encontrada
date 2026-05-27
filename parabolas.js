
let W, H, frame = 0;
let mx, my, pmx, pmy, vhx = 0, vhy = 0;
let expandFactor = 1.0, densityFactor = 1.0;
let swipeActive = false;
let canvas, ctx;
let curves = [];

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  mx = W/2; my = H/2; pmx = W/2; pmy = H/2;
  buildCurves();
}

function buildCurves() {
  curves = [];
  const n = Math.floor(10 * densityFactor + 6);
  for (let i = 0; i < n; i++) {
    curves.push({
      vx: W * (0.1 + i / n * 0.8),
      vy: H * (0.5 + (Math.random()-0.5) * 0.4),
      a: 0.0003 + Math.random() * 0.0004,
      phase: Math.random() * Math.PI * 2,
      speed: 0.008 + Math.random() * 0.006
    });
  }
}

function loop() {
  ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(0, 0, W, H);
  curves.forEach((c, i) => {
    // Animate vertex position — curves oscillate like strings
    const vy = c.vy + Math.sin(frame * c.speed + c.phase) * 40 * expandFactor;
    const a = c.a / expandFactor;
    const alpha = 0.06 + (i / curves.length) * 0.18;
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.lineWidth = 0.8;
    ctx.beginPath(); let started = false;
    for (let x = 0; x <= W; x += 4) {
      // Hand attraction — pull curve toward cursor
      const hdx = x - mx, hdy = vy - my;
      const hd = Math.sqrt(hdx*hdx + hdy*hdy) + 1;
      const pull = Math.max(0, 1 - hd/(200*expandFactor)) * 60 * expandFactor;
      // Swipe
      const sw = swipeActive ? Math.max(0, 1-Math.abs(x-mx)/400) * vhx * 0.3 : 0;
      const y = vy + a * (x - c.vx) ** 2 - pull * (hdy/hd) + sw;
      if (y >= -50 && y <= H+50) { started ? ctx.lineTo(x, y) : ctx.moveTo(x, y); started = true; }
      else started = false;
    }
    ctx.stroke();
  });
  vhx = mx - pmx; vhy = my - pmy;
  swipeActive = Math.abs(vhx) > 7 && Math.abs(vhx) > Math.abs(vhy) * 1.3;
  if (swipeActive) leg('swipe', true); else leg('swipe', false);
  pmx = mx; pmy = my; frame++;
  requestAnimationFrame(loop);
}

function onExpand() {}
function onContract() {}
function onReset() { buildCurves(); }
function onDensityChange() { buildCurves(); }

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
