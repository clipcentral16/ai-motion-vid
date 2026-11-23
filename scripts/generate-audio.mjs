// Synthesises the background beat and sound effects for the "What if" video.
// Pure Node (no samples, no dependencies) so every sound is reproducible and
// royalty-free. Writes WAVs, then converts them to MP3 with ffmpeg if present.
//
//   node scripts/generate-audio.mjs
//
// Output: public/whatif/*.mp3

import { writeFileSync, mkdirSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const SR = 44100;
const OUT = join(process.cwd(), "public", "whatif");
mkdirSync(OUT, { recursive: true });

// ---------- helpers ----------
const mulberry32 = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rand = mulberry32(1234);
const noise = () => rand() * 2 - 1;
const TAU = Math.PI * 2;
const lpCoef = (fc) => 1 - Math.exp((-TAU * fc) / SR);

const stereo = (seconds) => [
  new Float32Array(Math.ceil(seconds * SR)),
  new Float32Array(Math.ceil(seconds * SR)),
];

const add = (buf, i, v, pan = 0) => {
  if (i < 0 || i >= buf[0].length) return;
  buf[0][i] += v * Math.min(1, 1 - pan);
  buf[1][i] += v * Math.min(1, 1 + pan);
};

const writeWav = (name, buf, peak = 0.89) => {
  let max = 0;
  for (const ch of buf) for (const v of ch) max = Math.max(max, Math.abs(v));
  const gain = max > 0 ? peak / max : 1;
  const n = buf[0].length;
  const data = Buffer.alloc(44 + n * 4);
  data.write("RIFF", 0);
  data.writeUInt32LE(36 + n * 4, 4);
  data.write("WAVEfmt ", 8);
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20);
  data.writeUInt16LE(2, 22);
  data.writeUInt32LE(SR, 24);
  data.writeUInt32LE(SR * 4, 28);
  data.writeUInt16LE(4, 32);
  data.writeUInt16LE(16, 34);
  data.write("data", 36);
  data.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 2; c++) {
      const s = Math.max(-1, Math.min(1, buf[c][i] * gain));
      data.writeInt16LE(Math.round(s * 32767), 44 + i * 4 + c * 2);
    }
  }
  const wav = join(OUT, `${name}.wav`);
  writeFileSync(wav, data);
  try {
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", wav, "-b:a", "192k", join(OUT, `${name}.mp3`)]);
    unlinkSync(wav);
    console.log(`wrote public/whatif/${name}.mp3`);
  } catch {
    console.log(`wrote public/whatif/${name}.wav (ffmpeg not found, kept WAV)`);
  }
};

// ---------- sound effects ----------

// Cartoon "poof": filtered noise burst with a falling cutoff + low thump.
const poof = () => {
  const d = 0.8;
  const buf = stereo(d);
  let lp = 0, lp2 = 0, ph = 0;
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.006) * Math.exp(-t * 6.5);
    const fc = 4500 * Math.exp(-t * 5) + 250;
    lp += lpCoef(fc) * (noise() - lp);
    lp2 += lpCoef(fc) * (lp - lp2);
    const f = 50 + 110 * Math.exp(-t * 18);
    ph += (TAU * f) / SR;
    const thump = Math.sin(ph) * Math.exp(-t * 14) * 0.9;
    const v = lp2 * env * 2.2 + thump;
    add(buf, i, v, Math.sin(t * 9) * 0.25);
  }
  writeWav("poof", buf);
};

// Whoosh: band-passed noise sweeping up then down, panning across.
const whoosh = () => {
  const d = 0.75;
  const buf = stereo(d);
  let low = 0, band = 0;
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    const x = t / d;
    const env = Math.pow(Math.sin(Math.PI * Math.min(1, x)), 1.6);
    const fc = 300 + 2600 * Math.sin(Math.PI * Math.min(1, x * 1.1));
    // Chamberlin state-variable filter (band-pass output)
    const f = 2 * Math.sin((Math.PI * fc) / SR);
    const q = 0.5;
    const high = noise() - low - q * band;
    band += f * high;
    low += f * band;
    add(buf, i, band * env, -0.8 + 1.6 * x);
  }
  writeWav("whoosh", buf);
};

// Springy "boing" for the bounce when characters land.
const boing = () => {
  const d = 0.7;
  const buf = stereo(d);
  let ph = 0;
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    const f = 160 + 90 * t + 70 * Math.sin(TAU * 13 * t) * Math.exp(-t * 3);
    ph += (TAU * f) / SR;
    const env = Math.min(1, t / 0.005) * Math.exp(-t * 4.5);
    add(buf, i, (Math.sin(ph) + 0.3 * Math.sin(ph * 2)) * env);
  }
  writeWav("boing", buf);
};

// Double car-horn honk (two detuned square tones).
const honk = () => {
  const d = 0.75;
  const buf = stereo(d);
  let lp = 0;
  const notes = [
    [0.0, 0.16],
    [0.24, 0.42],
  ];
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    let v = 0;
    for (const [s, e] of notes) {
      if (t >= s && t < e) {
        const lt = t - s;
        const env = Math.min(1, lt / 0.01) * Math.min(1, (e - t) / 0.02);
        v += (Math.sign(Math.sin(TAU * 415 * lt)) + Math.sign(Math.sin(TAU * 522 * lt))) * 0.5 * env;
      }
    }
    lp += lpCoef(1800) * (v - lp);
    add(buf, i, lp, 0.3);
  }
  writeWav("honk", buf);
};

// Referee whistle: short pip then a long trilled blast.
const whistle = () => {
  const d = 1.0;
  const buf = stereo(d);
  let ph = 0;
  const parts = [
    [0.0, 0.14],
    [0.22, 0.85],
  ];
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    let env = 0;
    for (const [s, e] of parts) {
      if (t >= s && t < e) env = Math.min(1, (t - s) / 0.01) * Math.min(1, (e - t) / 0.03);
    }
    const trill = 0.65 + 0.35 * Math.sin(TAU * 32 * t);
    const f = 2900 + 120 * Math.sin(TAU * 32 * t);
    ph += (TAU * f) / SR;
    add(buf, i, (Math.sin(ph) * trill + noise() * 0.08) * env);
  }
  writeWav("whistle", buf);
};

// ---------- background beat ----------
// 120 BPM, I–V–vi–IV in C. Kick drops out for the intro and for one beat
// right before the "poof" (7.5s) so the poof lands on the drop.
const music = () => {
  const DURATION = 37;
  const BPM = 120;
  const beat = 60 / BPM;
  const bar = beat * 4;
  const POOF = 7.5;
  const buf = stereo(DURATION);

  const muted = (t) => t >= POOF - beat && t < POOF;

  const chords = [
    { bass: 65.41, tones: [261.63, 329.63, 392.0] }, // C
    { bass: 49.0, tones: [246.94, 293.66, 392.0] }, // G
    { bass: 55.0, tones: [220.0, 261.63, 329.63] }, // Am
    { bass: 43.65, tones: [220.0, 261.63, 349.23] }, // F
  ];

  const kick = (start) => {
    let ph = 0;
    for (let j = 0; j < 0.35 * SR; j++) {
      const t = j / SR;
      const f = 45 + 110 * Math.exp(-t * 30);
      ph += (TAU * f) / SR;
      add(buf, Math.round((start + t) * SR), Math.sin(ph) * Math.exp(-t * 9) * 0.9);
    }
  };
  const clap = (start) => {
    let lp = 0;
    for (let j = 0; j < 0.2 * SR; j++) {
      const t = j / SR;
      const n = noise();
      lp += lpCoef(1200) * (n - lp);
      const burst = t < 0.03 ? 0.6 + 0.4 * Math.sin(TAU * 110 * t) : 1;
      add(buf, Math.round((start + t) * SR), (n - lp) * Math.exp(-t * 22) * burst * 0.45, 0.1);
    }
  };
  const hat = (start, open = false) => {
    let lp = 0;
    const len = open ? 0.18 : 0.05;
    for (let j = 0; j < len * SR; j++) {
      const t = j / SR;
      const n = noise();
      lp += lpCoef(7000) * (n - lp);
      add(buf, Math.round((start + t) * SR), (n - lp) * Math.exp(-t * (open ? 18 : 70)) * 0.22, -0.3);
    }
  };
  const bassNote = (start, f, len) => {
    let lp = 0, ph = 0;
    for (let j = 0; j < len * SR; j++) {
      const t = j / SR;
      ph += f / SR;
      const sq = ph % 1 < 0.5 ? 1 : -1;
      lp += lpCoef(500 + 900 * Math.exp(-t * 20)) * (sq - lp);
      add(buf, Math.round((start + t) * SR), lp * Math.min(1, t / 0.004) * Math.exp(-t * 6) * 0.42);
    }
  };
  const stab = (start, tones) => {
    let lp = 0;
    for (let j = 0; j < 0.22 * SR; j++) {
      const t = j / SR;
      let v = 0;
      for (const f of tones) {
        for (const det of [0.996, 1.004]) v += ((f * det * t) % 1) * 2 - 1; // saw
      }
      lp += lpCoef(2200 * Math.exp(-t * 8) + 400) * (v - lp);
      add(buf, Math.round((start + t) * SR), lp * Math.exp(-t * 12) * 0.11, 0.25);
    }
  };
  const bell = (start, f) => {
    for (let j = 0; j < 0.3 * SR; j++) {
      const t = j / SR;
      const v = Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 3.01 * t) * Math.exp(-t * 20);
      add(buf, Math.round((start + t) * SR), v * Math.exp(-t * 10) * 0.12, -0.35);
    }
  };

  const arp = [0, 1, 2, 1, 2, 0, 1, 2]; // pattern over chord tones (in 8ths, octave up)

  for (let b = 0; b * beat < DURATION; b++) {
    const t = b * beat;
    const chord = chords[Math.floor(t / bar) % 4];
    const beatInBar = b % 4;
    const intro = t < 6;
    if (muted(t)) continue;

    if (!intro) kick(t);
    if (beatInBar === 1 || beatInBar === 3) clap(t);
    hat(t + beat / 2, beatInBar === 3 && !intro);
    if (!intro) hat(t + beat / 4);
    if (!intro) hat(t + (3 * beat) / 4);

    bassNote(t, chord.bass * 2, beat / 2 - 0.02);
    if (!muted(t + beat / 2)) bassNote(t + beat / 2, chord.bass * (beatInBar % 2 ? 4 : 2), beat / 2 - 0.02);
    stab(t + beat / 2, chord.tones);

    if (!intro) {
      for (let k = 0; k < 2; k++) {
        const step = (beatInBar * 2 + k) % 8;
        bell(t + (k * beat) / 2, chord.tones[arp[step]] * 2);
      }
    }
  }

  // Fade in/out
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    const g = Math.min(1, t / 0.3) * Math.min(1, Math.max(0, (DURATION - t) / 2.5));
    buf[0][i] *= g;
    buf[1][i] *= g;
  }
  writeWav("beat", buf, 0.8);
};

poof();
whoosh();
boing();
honk();
whistle();
music();
