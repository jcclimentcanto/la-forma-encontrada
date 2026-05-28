
let W, H, frame = 0;
let mx, my, pmx, pmy, vhx = 0, vhy = 0;
let expandFactor = 1.0, densityFactor = 1.0;
let swipeActive = false;
let canvas, ctx;
let rects = [], splitTimer = 0;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  mx = W/2; my = H/2; pmx = W/2; pmy = H/2;
  buildRects();
}

function buildRects() {
  rects = [];
  let rngS = 42;
  const rng = () => { rngS = (rngS * 16807) % 2147483647; return (rngS - 1) / 2147483646; };
  function subdiv(x1, y1, x2, y2, d) {
    if (d === 0 || (x2-x1) < 40 || (y2-y1) < 40) { rects.push({ x1,y1,x2,y2,alpha:0,targetAlpha:0.05+d*0.015,depth:d }); return; }
    rects.push({ x1,y1,x2,y2,alpha:0,targetAlpha:0.05+d*0.015,depth:d });
    if (rng() > 0.4) {
      if ((x2-x1) > (y2-y1)) { const s = x1+(x2-x1)*(0.3+rng()*0.4); subdiv(x1,y1,s,y2,d-1); subdiv(s,y1,x2,y2,d-1); }
      else { const s = y1+(y2-y1)*(0.3+rng()*0.4); subdiv(x1,y1,x2,s,d-1); subdiv(x1,s,x2,y2,d-1); }
    }
  }
  subdiv(20, 20, W-20, H-20, 7);
}

function loop() {
  ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(0, 0, W, H);
  // Fade in rects progressively
  splitTimer++;
  if (splitTimer % 3 === 0) {
    const idx = Math.floor(splitTimer / 3) % rects.length;
    rects[idx].targetAlpha = 0.05 + rects[idx].depth * 0.015;
  }
  rects.forEach(r => {
    r.alpha += (r.targetAlpha - r.alpha) * 0.05;
    // Hand influence — brighten nearby rects
    const rcx = (r.x1+r.x2)/2, rcy = (r.y1+r.y2)/2;
    const d = Math.sqrt((rcx-mx)**2 + (rcy-my)**2) + 1;
    const boost = Math.max(0, 1 - d/(200*expandFactor)) * 0.3;
    ctx.strokeStyle = `rgba(255,255,255,${r.alpha + boost})`;
    ctx.lineWidth = Math.max(0.3, r.depth * 0.2);
    const pad = swipeActive ? Math.max(0,1-Math.abs(rcx-mx)/400)*vhx*0.05 : 0;
    ctx.strokeRect(r.x1+pad, r.y1, r.x2-r.x1, r.y2-r.y1);
  });
  vhx = mx - pmx; vhy = my - pmy;
  swipeActive = Math.abs(vhx) > 7 && Math.abs(vhx) > Math.abs(vhy) * 1.3;
  if (swipeActive) leg('swipe', true); else leg('swipe', false);
  pmx = mx; pmy = my; frame++;
  requestAnimationFrame(loop);
}

function onExpand() {}
function onContract() {}
function onReset() { buildRects(); splitTimer = 0; }
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
