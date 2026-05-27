
let W, H, frame = 0;
let mx, my, pmx, pmy, vhx = 0, vhy = 0;
let expandFactor = 1.0, densityFactor = 1.0;
let swipeActive = false, swipeImpulse = { x: 0, y: 0, active: false };
let canvas, ctx;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  mx = W/2; my = H/2; pmx = W/2; pmy = H/2;
}

function loop() {
  ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, 0, W, H);
  const numLines = Math.floor(40 * densityFactor + 20);
  for (let i = 0; i < numLines; i++) {
    const yBase = H * (0.05 + i / numLines * 0.9);
    const freq = (0.004 + i * 0.0001) / expandFactor;
    const amp = (20 + i * 0.5) * expandFactor;
    const phase = frame * (0.006 + i * 0.0002);
    const alpha = 0.08 + (i / numLines) * 0.25;
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 4) {
      // Hand influence — distort wave near cursor
      const hdx = x - mx, hdy = yBase - my;
      const hd = Math.sqrt(hdx*hdx + hdy*hdy) + 1;
      const hInfluence = Math.max(0, 1 - hd / (180 * expandFactor)) * 60 * expandFactor;
      // Swipe impulse
      const sInfluence = swipeActive ? Math.max(0, 1 - Math.abs(x - mx) / 400) * vhx * 0.3 : 0;
      const y = yBase + amp * Math.sin(freq * x + phase) + hdy/hd * hInfluence + sInfluence;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  vhx = mx - pmx; vhy = my - pmy;
  swipeActive = Math.abs(vhx) > 7 && Math.abs(vhx) > Math.abs(vhy) * 1.3;
  if (swipeActive) leg('swipe', true); else leg('swipe', false);
  pmx = mx; pmy = my; frame++;
  requestAnimationFrame(loop);
}

function onExpand() {}
function onContract() {}
function onReset() {}
function onDensityChange() {}

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
