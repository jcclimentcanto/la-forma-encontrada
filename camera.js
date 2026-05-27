// LA FORMA ENCONTRADA — Camera & Gesture Detection
// Shared across all experience pages

let gestureBuffer = [];
const DEBOUNCE_FRAMES = 10;

async function initCamera() {
  try {
    const video = document.getElementById('video');
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 640, height: 480 }
    });
    video.srcObject = stream;
    await video.play();
    status('CARGANDO...');

    const hands = new Hands({
      locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
    });
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.75,
      minTrackingConfidence: 0.6
    });

    hands.onResults(r => {
      status('');
      if (r.multiHandLandmarks && r.multiHandLandmarks.length > 0) {
        const lm = r.multiHandLandmarks[0];
        mx = (1 - lm[9].x) * W;
        my = lm[9].y * H;

        // Swipe has priority — ignore posture gestures during swipe
        if (!swipeActive) {
          applyGesture(detectGesture(lm));
        } else {
          ['open', 'fist', 'pinch'].forEach(id => leg(id, false));
          lastGesture = '';
          gestureBuffer = [];
        }

        // Two hands — density control
        if (r.multiHandLandmarks.length > 1) {
          const lm2 = r.multiHandLandmarks[1];
          const dx = lm[9].x - lm2[9].x;
          const dy = lm[9].y - lm2[9].y;
          const nd = Math.max(0.3, Math.min(2.2, Math.sqrt(dx * dx + dy * dy) * 4));
          if (Math.abs(nd - densityFactor) > 0.15) {
            densityFactor = nd;
            onDensityChange();
            status('DENSIDAD ' + Math.round(nd * 100) + '%');
            leg('hands2', true);
          } else {
            leg('hands2', false);
          }
        }
      } else {
        lastGesture = '';
        gestureBuffer = [];
        ['open', 'fist', 'pinch'].forEach(id => leg(id, false));
      }
    });

    const cam = new Camera(video, {
      onFrame: async () => await hands.send({ image: video }),
      width: 640, height: 480
    });
    cam.start();
    status('GESTOS ACTIVOS');

  } catch (e) {
    status('MODO RATON — + / - / R');
  }
}

function detectGesture(lm) {
  const tips = [8, 12, 16, 20];
  const mids = [6, 10, 14, 18];
  const ext = tips.map((t, i) => lm[t].y < lm[mids[i]].y);
  const n = ext.filter(Boolean).length;
  const thumb = lm[4].x < lm[3].x;
  const pdx = lm[4].x - lm[8].x;
  const pdy = lm[4].y - lm[8].y;
  if (Math.sqrt(pdx * pdx + pdy * pdy) < 0.055) return 'pinch';
  if (n === 0 && !thumb) return 'fist';
  if (n >= 4) return 'open';
  return 'none';
}

let lastGesture = '';

function applyGesture(g) {
  gestureBuffer.push(g);
  if (gestureBuffer.length > DEBOUNCE_FRAMES) gestureBuffer.shift();

  // Dominant gesture must appear in 70% of recent frames
  const counts = {};
  gestureBuffer.forEach(x => counts[x] = (counts[x] || 0) + 1);
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const stable = dominant && dominant[1] >= DEBOUNCE_FRAMES * 0.7 ? dominant[0] : 'none';

  ['open', 'fist', 'pinch'].forEach(id => leg(id, false));
  if (stable !== 'none') leg(stable, true);
  if (stable === lastGesture) return;
  lastGesture = stable;

  if (stable === 'open') {
    expandFactor = Math.min(1.9, expandFactor + 0.12);
    status('EXPANDIENDO');
    onExpand();
  } else if (stable === 'fist') {
    expandFactor = Math.max(0.3, expandFactor - 0.12);
    status('CONTRAYENDO');
    onContract();
  } else if (stable === 'pinch') {
    expandFactor = 1.0;
    densityFactor = 1.0;
    status('RESET');
    onReset();
  }
}

// Keyboard fallback
function initKeyboard() {
  document.addEventListener('keydown', e => {
    if (e.key === '+' || e.key === '=') { expandFactor = Math.min(1.9, expandFactor + 0.12); status('EXPANDIENDO'); onExpand(); }
    if (e.key === '-') { expandFactor = Math.max(0.3, expandFactor - 0.12); status('CONTRAYENDO'); onContract(); }
    if (e.key === 'r' || e.key === 'R') { expandFactor = 1.0; densityFactor = 1.0; status('RESET'); onReset(); }
  });
}
