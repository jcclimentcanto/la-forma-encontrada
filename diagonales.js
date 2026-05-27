
let W, H, frame = 0;
let mx, my, pmx, pmy, vhx = 0, vhy = 0;
let expandFactor = 1.0, densityFactor = 1.0;
let swipeActive = false;
let canvas, ctx;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  mx = W/2; my = H/2; pmx = W/2; pmy = H/2;
}

function loop() {
  ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(0, 0, W, H);
  const step = Math.min(W,H) * 0.1 / densityFactor;
  const rot = frame * 0.003 * expandFactor;
  // Hand distortion angle
  const hdx = mx - W/2, hdy = my - H/2;
  const hAngle = Math.atan2(hdy, hdx) * 0.3;
  const hDist = Math.sqrt(hdx*hdx+hdy*hdy);
  const hStrength = Math.min(hDist/400, 1) * 0.4;
  // Swipe adds rotation
  const swipeRot = swipeActive ? vhx * 0.002 : 0;
  for (let i = -H; i < W + H; i += step) {
    const alpha = 0.06 + Math.sin(i * 0.01 + frame * 0.02) * 0.03;
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.lineWidth = 0.7;
    const angle1 = Math.PI/4 + rot + hAngle * hStrength + swipeRot;
    const angle2 = -Math.PI/4 + rot - hAngle * hStrength + swipeRot;
    const cos1 = Math.cos(angle1), sin1 = Math.sin(angle1);
    const cos2 = Math.cos(angle2), sin2 = Math.sin(angle2);
    const len = Math.max(W, H) * 1.5;
    ctx.beginPath(); ctx.moveTo(i - cos1*len, H/2 - sin1*len); ctx.lineTo(i + cos1*len, H/2 + sin1*len); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i - cos2*len, H/2 - sin2*len); ctx.lineTo(i + cos2*len, H/2 + sin2*len); ctx.stroke();
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
