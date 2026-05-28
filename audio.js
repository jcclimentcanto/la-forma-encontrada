// LA FORMA ENCONTRADA — Generative Audio Engine
// Uses Tone.js — loaded via CDN in each HTML page

let audioStarted = false;
let masterGain, reverb, delay;
let droneSynths = [], melodySynth, padSynth;
let audioMode = 'triangulo';
let melodyInterval = null;

// Pentatonic scale — no dissonance, never sounds cheap
const PENTATONIC = ['D3','F3','G3','A3','C4','D4','F4','G4','A4','C5','D5','F5'];
const DRONE_FREQS = { triangulo: ['D2','A2','D3'], waves: ['A1','E2','A2'], poligonos: ['F2','C3','F3'], estruturas: ['G1','D2','G2'], concentricas: ['C2','G2','C3'], parabolas: ['E2','B2','E3'], diagonales: ['B1','F2','B2'], cuadrados: ['A1','E2','B2'] };

async function startAudio(mode) {
  if (audioStarted) return;
  audioMode = mode || 'triangulo';

  await Tone.start();
  audioStarted = true;

  // Master chain: reverb + delay for that Ólafur Arnalds feel
  reverb = new Tone.Reverb({ decay: 6, preDelay: 0.1, wet: 0.65 }).toDestination();
  delay  = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.3, wet: 0.2 }).connect(reverb);
  masterGain = new Tone.Gain(0.7).connect(delay);

  // Drone layer — sustained low tones, barely audible
  const freqs = DRONE_FREQS[audioMode] || DRONE_FREQS.triangulo;
  droneSynths = freqs.map((note, i) => {
    const synth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 4, decay: 0, sustain: 1, release: 6 }
    }).connect(masterGain);
    synth.volume.value = -22 - i * 4;
    synth.triggerAttack(note);
    return synth;
  });

  // Pad layer — soft chords
  padSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 2.5, decay: 1, sustain: 0.6, release: 5 }
  }).connect(masterGain);
  padSynth.volume.value = -28;

  // Melody layer — sparse piano-like notes
  melodySynth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.04, decay: 0.8, sustain: 0.2, release: 3.5 }
  }).connect(masterGain);
  melodySynth.volume.value = -14;

  startMelody();
}

function startMelody() {
  if (melodyInterval) clearInterval(melodyInterval);

  // Notes appear slowly and randomly — never mechanical
  function playNote() {
    if (!audioStarted) return;
    const note = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];
    melodySynth.triggerAttackRelease(note, '2n');

    // Occasionally add a soft pad chord
    if (Math.random() < 0.3) {
      const root = PENTATONIC[Math.floor(Math.random() * 8)];
      const fifth = Tone.Frequency(root).transpose(7).toNote();
      padSynth.triggerAttackRelease([root, fifth], '1n', Tone.now() + 0.5);
    }

    // Next note in 3-9 seconds — irregular timing feels human
    const next = 3000 + Math.random() * 6000;
    melodyTimeout = setTimeout(playNote, next);
  }

  let melodyTimeout = setTimeout(playNote, 1500);
}

// React to hand gestures
function audioOnExpand() {
  if (!audioStarted) return;
  masterGain.gain.rampTo(0.9, 1.5);
  // Higher register notes when expanding
  const note = PENTATONIC[8 + Math.floor(Math.random() * 4)];
  melodySynth.triggerAttackRelease(note, '4n');
}

function audioOnContract() {
  if (!audioStarted) return;
  masterGain.gain.rampTo(0.5, 2);
  const note = PENTATONIC[Math.floor(Math.random() * 4)];
  melodySynth.triggerAttackRelease(note, '2n');
}

function audioOnReset() {
  if (!audioStarted) return;
  // Brief silence then restart
  masterGain.gain.rampTo(0, 0.8);
  setTimeout(() => { masterGain.gain.rampTo(0.7, 2); startMelody(); }, 1000);
}

function audioOnSwipe(speed) {
  if (!audioStarted) return;
  // Swipe creates a whoosh — brief pitch bend
  const vel = Math.min(Math.abs(speed) / 30, 1);
  if (vel > 0.3) {
    const note = PENTATONIC[3 + Math.floor(Math.random() * 5)];
    melodySynth.triggerAttackRelease(note, '8n');
  }
}

// Hand proximity to anchors — subtle volume modulation
function audioOnHandMove(distToAnchor) {
  if (!audioStarted || !droneSynths.length) return;
  const proximity = Math.max(0, 1 - distToAnchor / 400);
  droneSynths[0]?.volume.rampTo(-22 + proximity * 8, 0.3);
}

function stopAudio() {
  if (!audioStarted) return;
  droneSynths.forEach(s => s.triggerRelease());
  masterGain.gain.rampTo(0, 2);
  audioStarted = false;
}
