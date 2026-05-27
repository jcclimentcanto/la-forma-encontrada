// LA FORMA ENCONTRADA — Poligonos mode

let W, H, frame = 0;
let mx, my, pmx, pmy, vhx = 0, vhy = 0;
let expandFactor = 1.0, densityFactor = 1.0;
let nodes = [], COLS = 22, ROWS = 16;
let swipeActive = false, swipeWave = [];
let canvas, ctx;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  mx = W/2; my = H/2; pmx = W/2; pmy = H/2;
  buildGrid();
}

function buildGrid() {
  COLS = Math.round(18 * densityFactor + 4);
  ROWS = Math.round(12 * densityFactor + 4);
  nodes = [];
  for (let row = 0; row <= ROWS; row++) {
    for (let col = 0; col <= COLS; col++) {
      const bx = col * W / COLS;
      const by = row * H / ROWS;
      nodes.push({ bx, by, x: bx, y: by, phase: Math.random() * Math.PI * 2, amp: 8 + Math.random() * 14 });
    }
  }
  swipeWave = [];
}

function getNode(col, row) { return nodes[row * (COLS + 1) + col]; }

function updateNodes() {
  const cx = W/2, cy = H/2;
  nodes.forEach(n => {
    const breath = Math.sin(frame * 0.018 + n.phase) * n.amp * expandFactor;
    const breathX = (n.bx - cx) / (W/2) * breath;
    const breathY = (n.by - cy) / (H/2) * breath;
    const dx = n.bx - mx, dy = n.by - my, d = Math.sqrt(dx*dx+dy*dy) + 1;
    const inf = Math.max(0, 1 - d / (200 * expandFactor)) ** 2;
    const hx = (dx/d) * inf * 60 * expandFactor;
    const hy = (dy/d) * inf * 60 * expandFactor;
    let wx = 0, wy = 0;
    swipeWave.forEach(w => {
      const wd = Math.sqrt((n.bx-w.x)**2 + (n.by-w.y)**2) + 1;
      const wi = Math.max(0, 1 - wd/300) * w.strength * Math.sin(w.age * 0.15);
      wx += (vhx / (Math.abs(vhx)+1)) * wi * 40;
    });
    n.x = n.bx + breathX + hx + wx;
    n.y = n.by + breathY + hy + wy;
  });
  swipeWave = swipeWave.filter(w => w.strength > 0.01);
  swipeWave.forEach(w => { w.strength *= 0.94; w.age++; });
}

function drawGrid() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  for (let row = 0; row <= ROWS; row++) {
    ctx.beginPath();
    for (let col = 0; col <= COLS; col++) {
      const n = getNode(col, row);
      const alpha = 0.12 + (row/ROWS) * 0.28;
      if (col === 0) { ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.lineWidth = 0.7; ctx.moveTo(n.x, n.y); }
      else ctx.lineTo(n.x, n.y);
    }
    ctx.stroke();
  }
  for (let col = 0; col <= COLS; col++) {
    ctx.beginPath();
    for (let row = 0; row <= ROWS; row++) {
      const n = getNode(col, row);
      const alpha = 0.12 + (col/COLS) * 0.28;
      if (row === 0) { ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.lineWidth = 0.7; ctx.moveTo(n.x, n.y); }
      else ctx.lineTo(n.x, n.y);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 0.5;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if ((col + row) % 3 === 0) {
        const tl = getNode(col, row), br = getNode(col+1, row+1);
        ctx.beginPath(); ctx.moveTo(tl.x, tl.y); ctx.lineTo(br.x, br.y); ctx.stroke();
      }
    }
  }
}

function loop() {
  updateNodes(); drawGrid();
  vhx = mx - pmx; vhy = my - pmy;
  swipeActive = Math.abs(vhx) > 8 && Math.abs(vhx) > Math.abs(vhy) * 1.3;
  if (swipeActive) { swipeWave.push({ x: mx, y: my, strength: 1.0, age: 0 }); leg('swipe', true); }
  else leg('swipe', false);
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
