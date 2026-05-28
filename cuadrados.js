
let W, H, frame = 0;
let mx, my, pmx, pmy, vhx = 0, vhy = 0;
let expandFactor = 1.0, densityFactor = 1.0;
let swipeActive = false;
let canvas, ctx;
let gridNodes = [], GCOLS, GROWS;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  mx = W/2; my = H/2; pmx = W/2; pmy = H/2;
  buildGrid();
}

function buildGrid() {
  GCOLS = Math.round(12 * densityFactor + 4);
  GROWS = Math.round(9 * densityFactor + 3);
  gridNodes = [];
  for (let row = 0; row <= GROWS; row++) {
    for (let col = 0; col <= GCOLS; col++) {
      gridNodes.push({
        bx: col * W / GCOLS,
        by: row * H / GROWS,
        x: col * W / GCOLS,
        y: row * H / GROWS,
        phase: (col + row) * 0.4
      });
    }
  }
}

function getGNode(col, row) { return gridNodes[row * (GCOLS + 1) + col]; }

function updateGrid() {
  gridNodes.forEach(n => {
    // Fabric wave — sinusoidal undulation
    const waveX = Math.sin(n.bx / W * Math.PI * 2 * expandFactor + frame * 0.02 + n.phase) * 12 * expandFactor;
    const waveY = Math.cos(n.by / H * Math.PI * 2 * expandFactor + frame * 0.015 + n.phase) * 8 * expandFactor;
    // Hand push
    const dx = n.bx - mx, dy = n.by - my, d = Math.sqrt(dx*dx+dy*dy) + 1;
    const inf = Math.max(0, 1 - d / (160 * expandFactor)) ** 2 * 50 * expandFactor;
    // Swipe
    const sw = swipeActive ? Math.max(0, 1 - Math.abs(n.bx - mx) / 350) * vhx * 0.4 : 0;
    n.x = n.bx + waveX + dx/d * inf + sw;
    n.y = n.by + waveY + dy/d * inf * 0.5;
  });
}

function drawGrid() {
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, 0, W, H);
  for (let row = 0; row <= GROWS; row++) {
    ctx.beginPath();
    for (let col = 0; col <= GCOLS; col++) {
      const n = getGNode(col, row);
      const alpha = 0.1 + (row / GROWS) * 0.25;
      if (col === 0) { ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.lineWidth = 0.8; ctx.moveTo(n.x, n.y); }
      else ctx.lineTo(n.x, n.y);
    }
    ctx.stroke();
  }
  for (let col = 0; col <= GCOLS; col++) {
    ctx.beginPath();
    for (let row = 0; row <= GROWS; row++) {
      const n = getGNode(col, row);
      const alpha = 0.1 + (col / GCOLS) * 0.25;
      if (row === 0) { ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.lineWidth = 0.8; ctx.moveTo(n.x, n.y); }
      else ctx.lineTo(n.x, n.y);
    }
    ctx.stroke();
  }
}

function loop() {
  updateGrid(); drawGrid();
  vhx = mx - pmx; vhy = my - pmy;
  swipeActive = Math.abs(vhx) > 7 && Math.abs(vhx) > Math.abs(vhy) * 1.3;
  if (swipeActive) leg('swipe', true); else leg('swipe', false);
  pmx = mx; pmy = my; frame++;
  requestAnimationFrame(loop);
}

function onExpand() {}
function onContract() {}
function onReset() { buildGrid(); }
function onDensityChange() { buildGrid(); }

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
