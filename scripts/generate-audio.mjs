// Synthesises the background beat and sound effects for the "What if" video.
// Pure Node (no samples, no dependencies) so every sound is reproducible and
// royalty-free. Writes WAVs, then converts them to MP3 with ffmpeg if present.
//
//   node scripts/generate-audio.mjs
//
//   node scripts/generate-audio.mjs nuke
//
// Output: public/whatif/*.mp3 (default, "What if everyone lost their legs?")
//         public/whatif-nuke/*.mp3 (nuke: tense score + siren, boom, ...)
//   node scripts/generate-audio.mjs jupiter
//         public/jupiter/*.mp3 (dark score, radio static, flatline, gunshots...)
//   node scripts/generate-audio.mjs asteroid
//         public/asteroid/*.mp3 (ominous-to-hype score, boost, ball hit, ding...)

import { writeFileSync, mkdirSync, unlinkSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const SR = 44100;
const SET = process.argv[2] ?? "no-legs";
const OUT_NAME = { nuke: "whatif-nuke", jupiter: "jupiter", asteroid: "asteroid", dumbtown: "dumbtown" }[SET] ?? "whatif";
const OUT = join(process.cwd(), "public", OUT_NAME);
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
    console.log(`wrote public/${OUT_NAME}/${name}.mp3`);
  } catch {
    console.log(`wrote public/${OUT_NAME}/${name}.wav (ffmpeg not found, kept WAV)`);
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
// 120 BPM, I–V–vi–IV in C. No kick in the intro and one silent beat right
// before the "poof" (5s), so the drums drop in exactly on the poof.
// Keep DURATION / POOF in sync with src/WhatIfNoLegs/constants.ts.
const music = () => {
  const DURATION = 25.5;
  const BPM = 120;
  const beat = 60 / BPM;
  const bar = beat * 4;
  const POOF = 5;
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
    const intro = t < POOF;
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

// ---------- "What if North Korea started nuking everyone?" ----------

// Air-raid siren: slow rising/falling wail with a little vibrato.
const siren = () => {
  const d = 4.2;
  const buf = stereo(d);
  let ph = 0;
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    const wail = 0.5 - 0.5 * Math.cos((TAU * t) / 3.2); // 0..1..0 over 3.2s
    const f = 330 + 420 * wail + 6 * Math.sin(TAU * 5 * t);
    ph += (TAU * f) / SR;
    const env = Math.min(1, t / 0.3) * Math.min(1, (d - t) / 0.4);
    const v = Math.sin(ph) * 0.7 + Math.sin(ph * 2) * 0.2 + Math.sin(ph * 3) * 0.1;
    add(buf, i, v * env * 0.8, Math.sin(t * 0.8) * 0.4);
  }
  writeWav("siren", buf);
};

// Rocket launch: low roaring noise that swells and crackles.
const rumble = () => {
  const d = 3.6;
  const buf = stereo(d);
  let lp = 0, lp2 = 0;
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    const n = noise();
    lp += lpCoef(220) * (n - lp);
    lp2 += lpCoef(1400) * (n - lp2);
    const crackle = rand() < 0.002 ? noise() * 2 : 0;
    const env = Math.min(1, t / 0.6) * Math.min(1, (d - t) / 1.2);
    add(buf, i, (lp * 3 + lp2 * 0.5 + crackle * 0.3) * env, Math.sin(t * 1.3) * 0.2);
  }
  writeWav("rumble", buf);
};

// Interceptor: rising "zap" then a crisp pop.
const zap = () => {
  const d = 0.9;
  const buf = stereo(d);
  let ph = 0, lp = 0;
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    let v = 0;
    if (t < 0.45) {
      const f = 400 + 2200 * (t / 0.45) ** 2;
      ph += (TAU * f) / SR;
      v += Math.sin(ph) * 0.35 * (t / 0.45);
    } else {
      const lt = t - 0.45;
      lp += lpCoef(2500 * Math.exp(-lt * 6) + 200) * (noise() - lp);
      v += lp * Math.exp(-lt * 9) * 2.4 + Math.sin(TAU * 90 * lt) * Math.exp(-lt * 14);
    }
    add(buf, i, v, -0.3 + 0.6 * (t / d));
  }
  writeWav("zap", buf);
};

// Distant nuclear blast: deep sub thump + long rolling rumble.
const boom = () => {
  const d = 4.5;
  const buf = stereo(d);
  let lp = 0, lp2 = 0, ph = 0;
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    const n = noise();
    lp += lpCoef(160 + 900 * Math.exp(-t * 3)) * (n - lp);
    lp2 += lpCoef(90) * (lp - lp2);
    const f = 28 + 40 * Math.exp(-t * 4);
    ph += (TAU * f) / SR;
    const thump = Math.sin(ph) * Math.exp(-t * 1.6) * 1.2;
    const roll = (lp * 1.6 + lp2 * 3) * Math.min(1, t / 0.02) * Math.exp(-t * 0.75);
    add(buf, i, thump + roll, Math.sin(t * 2.1) * 0.3);
  }
  writeWav("boom", buf);
};

// Cold wind: slowly modulated band-passed noise.
const wind = () => {
  const d = 4.5;
  const buf = stereo(d);
  let low = 0, band = 0;
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    const fc = 500 + 350 * Math.sin(TAU * 0.35 * t) + 150 * Math.sin(TAU * 0.9 * t);
    const f = 2 * Math.sin((Math.PI * fc) / SR);
    const high = noise() - low - 0.25 * band;
    band += f * high;
    low += f * band;
    const env = Math.min(1, t / 0.8) * Math.min(1, (d - t) / 1) * (0.7 + 0.3 * Math.sin(TAU * 0.5 * t));
    add(buf, i, band * env, Math.sin(t * 0.6) * 0.5);
  }
  writeWav("wind", buf);
};

// Tense score, 25s at 100 BPM in A minor (Am–F–Dm–E). Pulsing bass, toms and
// a ticking clock until the blast (12.6s), then only a dark pad through the
// "nuclear winter", with the pulse returning quietly for the ending.
const tenseMusic = () => {
  const DURATION = 25;
  const BLAST = 12.6;
  const WINTER_END = 20;
  const beat = 60 / 100;
  const bar = beat * 4;
  const buf = stereo(DURATION);
  const chords = [
    { bass: 55.0, pad: [220.0, 261.63, 329.63] }, // Am
    { bass: 43.65, pad: [174.61, 220.0, 261.63] }, // F
    { bass: 36.71, pad: [146.83, 174.61, 220.0] }, // Dm
    { bass: 41.2, pad: [164.81, 207.65, 246.94] }, // E
  ];
  const drums = (t) => t < BLAST - 0.25 || t >= WINTER_END;
  const drumGain = (t) => (t >= WINTER_END ? 0.55 : 1);

  const tom = (start, f0, g) => {
    let ph = 0;
    for (let j = 0; j < 0.5 * SR; j++) {
      const t = j / SR;
      ph += (TAU * (f0 + f0 * 0.6 * Math.exp(-t * 20))) / SR;
      add(buf, Math.round((start + t) * SR), (Math.sin(ph) * Math.exp(-t * 6) + noise() * 0.08 * Math.exp(-t * 30)) * 0.8 * g);
    }
  };
  const tick = (start, g) => {
    let lp = 0;
    for (let j = 0; j < 0.03 * SR; j++) {
      const t = j / SR;
      const n = noise();
      lp += lpCoef(6000) * (n - lp);
      add(buf, Math.round((start + t) * SR), (n - lp) * Math.exp(-t * 120) * 0.25 * g, 0.4);
    }
  };
  const bassNote = (start, f, len, g) => {
    let lp = 0, ph = 0;
    for (let j = 0; j < len * SR; j++) {
      const t = j / SR;
      ph += f / SR;
      const saw = (ph % 1) * 2 - 1;
      lp += lpCoef(300 + 500 * Math.exp(-t * 14)) * (saw - lp);
      add(buf, Math.round((start + t) * SR), lp * Math.min(1, t / 0.005) * Math.exp(-t * 4) * 0.5 * g);
    }
  };

  // Drums, ticks and bass pulse
  for (let s = 0; s * (beat / 4) < DURATION; s++) {
    const t = s * (beat / 4);
    const step = s % 16;
    const chord = chords[Math.floor(t / bar) % 4];
    if (!drums(t)) continue;
    const g = drumGain(t);
    if (step === 0 || step === 6 || step === 10) tom(t, step === 0 ? 70 : 95, g);
    if (step % 2 === 1) tick(t, g);
    if (step % 2 === 0) bassNote(t, chord.bass * 2, beat / 2 - 0.02, g * (t >= WINTER_END ? 0.7 : 1));
  }

  // Pad: detuned saws through a slow low-pass, swelling per bar
  let lp = 0;
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    const chord = chords[Math.floor(t / bar) % 4];
    let v = 0;
    for (const f of chord.pad) for (const det of [0.995, 1.005]) v += ((f * det * t) % 1) * 2 - 1;
    lp += lpCoef(700 + 300 * Math.sin(TAU * 0.1 * t)) * (v - lp);
    const inBar = (t % bar) / bar;
    const swell = 0.55 + 0.45 * Math.sin(Math.PI * inBar);
    const winter = t >= BLAST && t < WINTER_END ? 1.4 : 1;
    add(buf, i, lp * 0.05 * swell * winter, Math.sin(t * 0.3) * 0.3);
  }

  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    const g = Math.min(1, t / 0.4) * Math.min(1, Math.max(0, (DURATION - t) / 2));
    buf[0][i] *= g;
    buf[1][i] *= g;
  }
  writeWav("score", buf, 0.8);
};

// ---------- "The 2011 Jupiter Incident" ----------

// Radio static: hissy band-limited noise with random crackles.
const radioStatic = () => {
  const d = 3;
  const buf = stereo(d);
  let lp = 0;
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    const n = noise();
    lp += lpCoef(3500) * (n - lp);
    const hiss = (lp - 0.3 * n) * 0.5;
    const crackle = rand() < 0.0015 ? noise() * 3 : 0;
    const wobble = 0.7 + 0.3 * Math.sin(TAU * 0.7 * t) * Math.sin(TAU * 3.1 * t);
    const env = Math.min(1, t / 0.05) * Math.min(1, (d - t) / 0.1);
    add(buf, i, (hiss * wobble + crackle) * env);
  }
  writeWav("static", buf);
};

// Walkie-talkie squelch: click + short noise burst.
const squelch = () => {
  const d = 0.25;
  const buf = stereo(d);
  let lp = 0;
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    lp += lpCoef(4000) * (noise() - lp);
    const click = t < 0.004 ? (1 - t / 0.004) * 1.5 : 0;
    add(buf, i, click + lp * Math.exp(-t * 18) * 1.4);
  }
  writeWav("squelch", buf);
};

// Static burst, then a long flatline beep.
const flatline = () => {
  const d = 2.6;
  const buf = stereo(d);
  let lp = 0;
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    let v = 0;
    if (t < 0.45) {
      lp += lpCoef(5000) * (noise() - lp);
      v = (lp * 1.6 + (rand() < 0.01 ? noise() * 2 : 0)) * (1 - t / 0.45);
    }
    if (t >= 0.4) {
      const lt = t - 0.4;
      const env = Math.min(1, lt / 0.01) * Math.min(1, (d - t) / 0.4);
      v += Math.sin(TAU * 1000 * lt) * 0.55 * env;
    }
    add(buf, i, v);
  }
  writeWav("flatline", buf);
};

// Punchy cartoon gunshot.
const gunshot = () => {
  const d = 0.6;
  const buf = stereo(d);
  let lp = 0, ph = 0;
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    lp += lpCoef(6000 * Math.exp(-t * 25) + 300) * (noise() - lp);
    ph += (TAU * (60 + 120 * Math.exp(-t * 40))) / SR;
    const v = lp * Math.exp(-t * 14) * 2 + Math.sin(ph) * Math.exp(-t * 18) * 1.2;
    add(buf, i, v, (rand() - 0.5) * 0.2);
  }
  writeWav("gunshot", buf);
};

// A key dissolving: dark downward hiss with a sub drop (no bouncy warble).
const vanish = () => {
  const d = 1.0;
  const buf = stereo(d);
  let lp = 0, ph = 0;
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    lp += lpCoef(2600 * Math.exp(-t * 3) + 120) * (noise() - lp);
    ph += (TAU * (70 * Math.exp(-t * 2.5) + 25)) / SR;
    const env = Math.min(1, t / 0.02) * Math.exp(-t * 3.2);
    add(buf, i, (lp * 0.9 + Math.sin(ph) * 0.6) * env, Math.sin(t * 7) * 0.25);
  }
  writeWav("vanish", buf);
};

// Ship alarm: two-tone klaxon.
const alarm = () => {
  const d = 3.2;
  const buf = stereo(d);
  let ph = 0, lp = 0;
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    const f = Math.floor(t / 0.4) % 2 ? 620 : 470;
    ph += f / SR;
    const sq = (ph % 1) < 0.5 ? 1 : -1;
    lp += lpCoef(1600) * (sq - lp);
    const env = Math.min(1, t / 0.05) * Math.min(1, (d - t) / 0.3);
    add(buf, i, lp * env * 0.6, 0.2);
  }
  writeWav("alarm", buf);
};

// Score for the Jupiter incident, 32.5s: calm space ambience at first, turning
// dangerous when the keys appear (9.5s), silence when Speed's radio cuts out,
// heavy dark drums for the fight, a sad pad, then a solemn hero swell.
// Section times match src/JupiterIncident/constants.ts; the radio cut is read
// from the narration timings.
const darkScore = () => {
  const DURATION = 32.5;
  const DANGER_FROM = 9.5;
  const narr = JSON.parse(readFileSync(join(process.cwd(), "src", "JupiterIncident", "narration.json"), "utf8"));
  const speed = narr.lines.find((l) => l.scene === 3);
  const SILENCE_FROM = 14 + speed.start + speed.words[speed.words.length - 1].end + 0.02;
  const ACTION_FROM = 18.5;
  const SAD_FROM = 23.5;
  const HERO_FROM = 28;
  const buf = stereo(DURATION);
  const danger = (t) => Math.min(1, Math.max(0, (t - DANGER_FROM + 0.5) / 2));

  // Calm: a soft, airy Dmaj9 pad with slow breathing, fading out as danger rises.
  let cl = 0;
  for (let i = 0; i < Math.round(SILENCE_FROM * SR); i++) {
    const t = i / SR;
    const calm = 1 - danger(t);
    if (calm <= 0) continue;
    let v = 0;
    for (const f of [146.83, 220.0, 277.18, 329.63, 369.99]) v += Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2.003 * t);
    cl += lpCoef(900) * (v - cl);
    const breathe = 0.65 + 0.35 * Math.sin(TAU * 0.11 * t);
    add(buf, i, cl * 0.022 * breathe * calm * Math.min(1, t / 2), Math.sin(t * 0.25) * 0.4);
  }
  // Gentle chimes in the calm part
  for (const [at, f] of [[1.2, 880], [3.6, 739.99], [6.0, 659.25], [8.2, 587.33]]) {
    for (let j = 0; j < 2.5 * SR; j++) {
      const t = j / SR;
      add(buf, Math.round((at + t) * SR), (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * f * 2.76 * t)) * Math.exp(-t * 1.6) * 0.07, -0.3);
    }
  }
  // Danger: low dissonant drone (A + B-flat) swelling in, until the radio cut.
  let lp = 0;
  for (let i = 0; i < Math.round(SILENCE_FROM * SR); i++) {
    const t = i / SR;
    const g0 = danger(t);
    if (g0 <= 0) continue;
    const sw = 0.6 + 0.4 * Math.sin(TAU * 0.12 * t);
    let v = 0;
    for (const f of [55, 58.27, 110, 116.54]) v += ((f * t) % 1) * 2 - 1;
    lp += lpCoef(220 + 160 * sw) * (v - lp);
    let g = 0.1 * sw * g0;
    if (t >= 14) g *= 1 + (t - 14) * 0.5;
    add(buf, i, lp * g, Math.sin(t * 0.2) * 0.3);
  }
  // Riser into the radio cut
  let rl = 0;
  for (let i = Math.round(14 * SR); i < Math.round(SILENCE_FROM * SR); i++) {
    const t = i / SR - 14;
    const span = SILENCE_FROM - 14;
    rl += lpCoef(300 + 5000 * (t / span) ** 2) * (noise() - rl);
    add(buf, i, rl * 0.35 * (t / span));
  }
  // Heartbeat once the keys appear
  const thump = (start, g) => {
    let ph = 0;
    for (let j = 0; j < 0.25 * SR; j++) {
      const t = j / SR;
      ph += (TAU * (45 + 30 * Math.exp(-t * 25))) / SR;
      add(buf, Math.round((start + t) * SR), Math.sin(ph) * Math.exp(-t * 14) * g);
    }
  };
  for (let t = DANGER_FROM + 0.6; t < SILENCE_FROM - 0.4; t += 0.8 - Math.min(0.3, (t - DANGER_FROM) * 0.04)) {
    thump(t, 0.9);
    thump(t + 0.22, 0.6);
  }
  // Fight: heavy low taiko hits and a growling bass pulse (no melodic riff).
  const taiko = (start, f0, g) => {
    let ph = 0;
    for (let j = 0; j < 0.6 * SR; j++) {
      const t = j / SR;
      ph += (TAU * (f0 + f0 * 0.8 * Math.exp(-t * 18))) / SR;
      add(buf, Math.round((start + t) * SR), (Math.sin(ph) * Math.exp(-t * 5) + noise() * 0.12 * Math.exp(-t * 25)) * g);
    }
  };
  const step = 60 / 120 / 2;
  const pattern = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0];
  let bl = 0;
  for (let k = 0, t = ACTION_FROM; t < SAD_FROM - 0.3; k++, t += step) {
    if (pattern[k % 16]) taiko(t, k % 16 === 0 ? 50 : 70, 0.85);
  }
  for (let i = Math.round(ACTION_FROM * SR); i < Math.round((SAD_FROM - 0.2) * SR); i++) {
    const t = i / SR;
    const saw = ((36.71 * t) % 1) * 2 - 1 + (((36.9 * t) % 1) * 2 - 1);
    bl += lpCoef(180 + 120 * Math.abs(Math.sin(TAU * 2 * t))) * (saw - bl);
    add(buf, i, bl * 0.18 * Math.min(1, (t - ACTION_FROM) / 0.5));
  }
  // Sad pad, then a slow, solemn hero swell
  let pl = 0;
  for (let i = Math.round(SAD_FROM * SR); i < buf[0].length; i++) {
    const t = i / SR;
    const hero = t >= HERO_FROM;
    const chord = hero ? [73.42, 146.83, 220.0, 293.66, 369.99] : [110, 130.81, 164.81];
    let v = 0;
    for (const f of chord) for (const det of [0.996, 1.004]) v += ((f * det * t) % 1) * 2 - 1;
    pl += lpCoef(hero ? 900 : 600) * (v - pl);
    const g = hero ? 0.05 * Math.min(1, (t - HERO_FROM) / 2) : 0.045 * Math.min(1, (t - SAD_FROM) / 1);
    add(buf, i, pl * g, Math.sin(t * 0.4) * 0.3);
  }
  for (let t = HERO_FROM - 0.6; t < HERO_FROM + 0.2; t += 0.07) thump(t, 0.2 + (t - HERO_FROM + 0.6) * 0.5);

  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    const g = Math.min(1, t / 1.5) * Math.min(1, Math.max(0, (DURATION - t) / 1.8));
    buf[0][i] *= g;
    buf[1][i] *= g;
  }
  writeWav("score", buf, 0.8);
};

// ---------- "What if an asteroid was about to hit Earth?" ----------

// Rocket boost: roaring hiss with a crackly edge.
const boost = () => {
  const d = 2.5;
  const buf = stereo(d);
  let lp = 0, lp2 = 0;
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    const n = noise();
    lp += lpCoef(2600) * (n - lp);
    lp2 += lpCoef(300) * (n - lp2);
    const env = Math.min(1, t / 0.08) * Math.min(1, (d - t) / 0.5);
    add(buf, i, (lp * 0.7 + lp2 * 1.6 + (rand() < 0.003 ? noise() : 0)) * env, Math.sin(t * 2) * 0.3);
  }
  writeWav("boost", buf);
};

// Big ball hit: punchy sub boom + bright smack.
const ballHit = () => {
  const d = 1.4;
  const buf = stereo(d);
  let ph = 0, lp = 0;
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    ph += (TAU * (40 + 140 * Math.exp(-t * 22))) / SR;
    lp += lpCoef(8000 * Math.exp(-t * 30) + 400) * (noise() - lp);
    add(buf, i, Math.sin(ph) * Math.exp(-t * 3.5) * 1.3 + lp * Math.exp(-t * 18) * 1.2);
  }
  writeWav("hit", buf);
};

// Soft catch: muffled thud, everything stops.
const catchThud = () => {
  const d = 0.9;
  const buf = stereo(d);
  let ph = 0, lp = 0;
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    ph += (TAU * (55 + 40 * Math.exp(-t * 20))) / SR;
    lp += lpCoef(600) * (noise() - lp);
    add(buf, i, Math.sin(ph) * Math.exp(-t * 6) + lp * Math.exp(-t * 10) * 0.8);
  }
  writeWav("catch", buf);
};

// Flip reset sparkle: quick rising chime.
const ding = () => {
  const d = 1.0;
  const buf = stereo(d);
  const notes = [1318.5, 1760, 2637];
  notes.forEach((f, k) => {
    for (let j = 0; j < 0.8 * SR; j++) {
      const t = j / SR;
      add(buf, Math.round((k * 0.06 + t) * SR), (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2.01 * t)) * Math.exp(-t * 5) * 0.4, (k - 1) * 0.4);
    }
  });
  writeWav("ding", buf);
};

// Applause: many random claps.
const applause = () => {
  const d = 4;
  const buf = stereo(d);
  for (let c = 0; c < 900; c++) {
    const at = rand() * (d - 0.2);
    const pan = rand() * 1.6 - 0.8;
    const g = 0.15 + rand() * 0.2;
    let lp = 0;
    for (let j = 0; j < 0.03 * SR; j++) {
      const t = j / SR;
      const n = noise();
      lp += lpCoef(2500) * (n - lp);
      add(buf, Math.round((at + t) * SR), (n - lp * 0.5) * Math.exp(-t * 160) * g, pan);
    }
  }
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.4) * Math.min(1, (d - t) / 1.2);
    buf[0][i] *= env;
    buf[1][i] *= env;
  }
  writeWav("applause", buf);
};

// Score, 32s: ominous space drone -> panic drums -> hype build when Zen
// takes the car -> record-stop on the catch -> riser -> drop on the flick.
// Catch/flick times come from the narration timings.
const hypeScore = () => {
  const DURATION = 32;
  const STARTS = [0, 4.5, 9, 13.5, 18.5, 23.5, 28];
  const narr = JSON.parse(readFileSync(join(process.cwd(), "src", "AsteroidSave", "narration.json"), "utf8"));
  const word = (scene, idx) => {
    const l = narr.lines.find((x) => x.scene === scene);
    return STARTS[scene] + l.start + l.words[idx].start;
  };
  const CATCH = word(3, 4); // "caught"
  const FLICK = word(4, 3); // "FLICK!"
  const PANIC = STARTS[1];
  const BUILD = STARTS[2];
  const buf = stereo(DURATION);
  const stopped = (t) => (t >= CATCH && t < CATCH + 0.7) || (t >= FLICK - 0.35 && t < FLICK);

  // Ominous drone (space + panic)
  let dl = 0;
  for (let i = 0; i < Math.round(BUILD * SR); i++) {
    const t = i / SR;
    let v = 0;
    for (const f of [41.2, 43.65, 82.41, 87.31]) v += ((f * t) % 1) * 2 - 1;
    dl += lpCoef(200 + 150 * Math.sin(TAU * 0.2 * t)) * (v - dl);
    const g = 0.1 * Math.min(1, t / 2) * (t > PANIC ? 1.5 : 1) * Math.min(1, (BUILD + 0.3 - t) / 0.6);
    add(buf, i, dl * g, Math.sin(t * 0.3) * 0.3);
  }
  const tom = (start, f0, g) => {
    let ph = 0;
    for (let j = 0; j < 0.45 * SR; j++) {
      const t = j / SR;
      ph += (TAU * (f0 + f0 * 0.7 * Math.exp(-t * 20))) / SR;
      add(buf, Math.round((start + t) * SR), (Math.sin(ph) * Math.exp(-t * 6) + noise() * 0.1 * Math.exp(-t * 30)) * g);
    }
  };
  for (let t = PANIC; t < BUILD - 0.2; t += 0.375) tom(t, 60 + (Math.round((t - PANIC) / 0.375) % 4 === 0 ? 0 : 20), 0.7);

  // Hype section at 128 BPM
  const beat = 60 / 128;
  const kick = (start, g = 1) => {
    let ph = 0;
    for (let j = 0; j < 0.3 * SR; j++) {
      const t = j / SR;
      ph += (TAU * (45 + 110 * Math.exp(-t * 32))) / SR;
      add(buf, Math.round((start + t) * SR), Math.sin(ph) * Math.exp(-t * 9) * 0.95 * g);
    }
  };
  const clap = (start) => {
    let lp = 0;
    for (let j = 0; j < 0.2 * SR; j++) {
      const t = j / SR;
      const n = noise();
      lp += lpCoef(1300) * (n - lp);
      add(buf, Math.round((start + t) * SR), (n - lp) * Math.exp(-t * 20) * 0.5);
    }
  };
  const hat = (start) => {
    let lp = 0;
    for (let j = 0; j < 0.05 * SR; j++) {
      const t = j / SR;
      const n = noise();
      lp += lpCoef(7000) * (n - lp);
      add(buf, Math.round((start + t) * SR), (n - lp) * Math.exp(-t * 60) * 0.22, -0.3);
    }
  };
  const chords = [
    [220.0, 261.63, 329.63], // Am
    [174.61, 220.0, 261.63], // F
    [196.0, 246.94, 293.66], // G
    [164.81, 207.65, 246.94], // E
  ];
  const bassRoots = [55, 43.65, 49, 41.2];
  const saw = (start, tones, len, g) => {
    let lp = 0;
    for (let j = 0; j < len * SR; j++) {
      const t = j / SR;
      let v = 0;
      for (const f of tones) for (const det of [0.993, 1, 1.007]) v += ((f * det * t) % 1) * 2 - 1;
      lp += lpCoef(2400) * (v - lp);
      add(buf, Math.round((start + t) * SR), lp * Math.min(1, t / 0.01) * Math.exp(-t * 2.5) * g, 0.15);
    }
  };
  const bass = (start, f, len) => {
    let lp = 0, ph = 0;
    for (let j = 0; j < len * SR; j++) {
      const t = j / SR;
      ph += f / SR;
      lp += lpCoef(400) * ((((ph % 1) < 0.5) ? 1 : -1) - lp);
      add(buf, Math.round((start + t) * SR), lp * Math.exp(-t * 4) * 0.45);
    }
  };
  for (let b = 0; BUILD + b * beat < DURATION; b++) {
    const t = BUILD + b * beat;
    if (stopped(t)) continue;
    const bar = Math.floor(b / 4);
    const chord = chords[bar % 4];
    const dropped = t >= FLICK;
    const build = !dropped;
    // Build: 4-on-floor kick + rising arp. Drop: full mix.
    kick(t, build ? 0.8 : 1);
    if (!stopped(t + beat / 2)) hat(t + beat / 2);
    if (dropped) {
      if (b % 2 === 1) clap(t);
      if (b % 4 === 0) saw(t, chord, beat * 4, 0.06);
      bass(t, bassRoots[bar % 4] * 2, beat * 0.9);
      if (!stopped(t + beat / 2)) bass(t + beat / 2, bassRoots[bar % 4] * 2, beat * 0.45);
    } else {
      // rising arpeggio, louder as the flick approaches
      const g = 0.05 + 0.08 * Math.min(1, (t - BUILD) / (FLICK - BUILD));
      for (let k = 0; k < 2; k++) {
        const tt = t + (k * beat) / 2;
        if (stopped(tt)) continue;
        const f = chord[(b * 2 + k) % 3] * 2;
        for (let j = 0; j < 0.18 * SR; j++) {
          const x = j / SR;
          add(buf, Math.round((tt + x) * SR), (((f * x) % 1) * 2 - 1) * Math.exp(-x * 12) * g, -0.2);
        }
      }
    }
  }
  // Riser into the flick
  let rl = 0;
  for (let i = Math.round((CATCH + 0.7) * SR); i < Math.round((FLICK - 0.35) * SR); i++) {
    const t = i / SR;
    const u = (t - CATCH - 0.7) / (FLICK - 0.35 - CATCH - 0.7);
    rl += lpCoef(300 + 7000 * u * u) * (noise() - rl);
    add(buf, i, rl * 0.4 * u);
  }

  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    const g = Math.min(1, t / 1) * Math.min(1, Math.max(0, (DURATION - t) / 2));
    buf[0][i] *= g;
    buf[1][i] *= g;
  }
  writeWav("score", buf, 0.8);
};

// ---------- "In this town, you get paid for being dumb" ----------

const tone = (buf, start, f, len, g, type = "sine", decay = 6, pan = 0) => {
  let ph = 0;
  for (let j = 0; j < len * SR; j++) {
    const t = j / SR;
    ph += f / SR;
    const x = ph % 1;
    const w = type === "sine" ? Math.sin(TAU * x) : type === "square" ? (x < 0.5 ? 1 : -1) : x * 2 - 1;
    add(buf, Math.round((start + t) * SR), w * Math.min(1, t / 0.004) * Math.exp(-t * decay) * g, pan);
  }
};

const kaching = () => {
  const buf = stereo(1.2);
  // drawer thunk + bell + coin jingles
  let ph = 0;
  for (let j = 0; j < 0.15 * SR; j++) {
    const t = j / SR;
    ph += (TAU * (90 + 60 * Math.exp(-t * 30))) / SR;
    add(buf, j, Math.sin(ph) * Math.exp(-t * 25) * 0.8);
  }
  for (const [f, d] of [[2093, 0.12], [2637, 0.14]]) tone(buf, d, f, 1.0, 0.35, "sine", 4);
  for (let c = 0; c < 9; c++) tone(buf, 0.18 + c * 0.05 + rand() * 0.03, 3000 + rand() * 2500, 0.15, 0.12, "sine", 30, rand() - 0.5);
  writeWav("kaching", buf);
};
const bonk = () => {
  const buf = stereo(0.6);
  let ph = 0;
  for (let j = 0; j < 0.6 * SR; j++) {
    const t = j / SR;
    ph += (TAU * (320 * Math.exp(-t * 6) + 120)) / SR;
    add(buf, j, (Math.sin(ph) + 0.4 * Math.sin(ph * 2.7)) * Math.exp(-t * 9) * 0.9);
  }
  writeWav("bonk", buf);
};
const popSfx = () => {
  const buf = stereo(0.25);
  let ph = 0;
  for (let j = 0; j < 0.25 * SR; j++) {
    const t = j / SR;
    ph += (TAU * (300 + 1400 * Math.exp(-t * 40))) / SR;
    add(buf, j, Math.sin(ph) * Math.exp(-t * 22) * 0.8);
  }
  writeWav("pop", buf);
};
const dingSfx = () => {
  const buf = stereo(1.2);
  tone(buf, 0, 1046.5, 1.1, 0.5, "sine", 3);
  tone(buf, 0.09, 1568, 1.0, 0.4, "sine", 3);
  writeWav("ding", buf);
};
const gasp = () => {
  const buf = stereo(0.7);
  let lo = 0, band = 0;
  for (let j = 0; j < 0.7 * SR; j++) {
    const t = j / SR;
    const fc = 900 + 1400 * Math.min(1, t / 0.3);
    const f = 2 * Math.sin((Math.PI * fc) / SR);
    const hi = noise() - lo - 0.3 * band;
    band += f * hi;
    lo += f * band;
    const env = Math.min(1, t / 0.08) * Math.max(0, 1 - t / 0.55);
    add(buf, j, band * env * 0.9);
  }
  writeWav("gasp", buf);
};
const trombone = () => {
  const buf = stereo(2.6);
  const notes = [[0, 233.08, 0.45], [0.5, 220, 0.45], [1.0, 207.65, 0.45], [1.5, 196, 1.0]];
  for (const [st, f, len] of notes) {
    let ph = 0, lp = 0;
    for (let j = 0; j < len * SR; j++) {
      const t = j / SR;
      const vib = st === 1.5 ? 1 + 0.02 * Math.sin(TAU * 6 * t) : 1;
      ph += (f * vib) / SR;
      const saw = (ph % 1) * 2 - 1;
      lp += lpCoef(900) * (saw - lp);
      const env = Math.min(1, t / 0.04) * Math.min(1, (len - t) / 0.1);
      add(buf, Math.round((st + t) * SR), lp * env * 0.55);
    }
  }
  writeWav("trombone", buf);
};
const scan = () => {
  const buf = stereo(1.6);
  for (let k = 0; k < 7; k++) tone(buf, k * 0.18, 880 + k * 110, 0.1, 0.25, "square", 20);
  writeWav("scan", buf);
};
const buzzer = () => {
  const buf = stereo(0.9);
  let lp = 0, ph = 0;
  for (let j = 0; j < 0.8 * SR; j++) {
    const t = j / SR;
    ph += 110 / SR;
    lp += lpCoef(1200) * ((ph % 1 < 0.5 ? 1 : -1) - lp);
    add(buf, j, lp * Math.min(1, (0.8 - t) / 0.05) * 0.6);
  }
  writeWav("buzzer", buf);
};
const creak = () => {
  const buf = stereo(1.0);
  let lp = 0;
  for (let j = 0; j < 1.0 * SR; j++) {
    const t = j / SR;
    const f = 180 + 120 * Math.sin(TAU * 1.3 * t);
    const pulse = ((t * f) % 1) < 0.08 ? 1 : 0;
    lp += lpCoef(1800) * (pulse - lp);
    add(buf, j, lp * Math.sin(Math.PI * t) * 1.2);
  }
  writeWav("creak", buf);
};
const rainLoop = () => {
  const d = 6;
  const buf = stereo(d);
  let lp = 0;
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    const n = noise();
    lp += lpCoef(2500) * (n - lp);
    const drop = rand() < 0.002 ? noise() * 1.5 : 0;
    const env = Math.min(1, t / 0.6) * Math.min(1, (d - t) / 0.8);
    add(buf, i, (lp * 0.5 + (n - lp) * 0.15 + drop * 0.3) * env, (rand() - 0.5) * 0.4);
  }
  writeWav("rain", buf);
};
const phoneBuzz = () => {
  const buf = stereo(1.4);
  for (const st of [0, 0.55]) {
    let ph = 0;
    for (let j = 0; j < 0.4 * SR; j++) {
      const t = j / SR;
      ph += (TAU * 150) / SR;
      add(buf, Math.round((st + t) * SR), (Math.sin(ph) + 0.4 * Math.sign(Math.sin(ph * 2))) * Math.min(1, t / 0.01) * Math.min(1, (0.4 - t) / 0.02) * 0.6);
    }
  }
  writeWav("buzz", buf);
};

// Playful score, 53.8s at 100 BPM in F major: marimba arpeggios, plucky bass,
// snaps and shaker. Sad and sparse for the walk home, building on the phone,
// then the full band for the billion.
const quirkyScore = () => {
  const SECS = [3.5, 3.8, 3.5, 4.8, 3.0, 2.8, 4.0, 3.2, 3.2, 3.0, 5.8, 3.2, 5.5, 4.5];
  const START = SECS.map((_, i) => SECS.slice(0, i).reduce((a, b) => a + b, 0));
  const DURATION = SECS.reduce((a, b) => a + b, 0);
  const SAD = START[11];
  const BUILD = START[12];
  const WIN = START[13];
  const beat = 60 / 100;
  const buf = stereo(DURATION);
  const happy = [
    [174.61, 220, 261.63, 349.23], // F
    [146.83, 174.61, 220, 293.66], // Dm
    [233.08, 293.66, 349.23, 466.16], // Bb
    [196, 261.63, 329.63, 392], // C
  ];
  const marimba = (st, f, g, pan) => {
    for (let j = 0; j < 0.4 * SR; j++) {
      const t = j / SR;
      const v = Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * f * 3.99 * t) * Math.exp(-t * 30);
      add(buf, Math.round((st + t) * SR), v * Math.exp(-t * 9) * g, pan);
    }
  };
  const snap = (st, g) => {
    let lp = 0;
    for (let j = 0; j < 0.06 * SR; j++) {
      const t = j / SR;
      const n = noise();
      lp += lpCoef(3000) * (n - lp);
      add(buf, Math.round((st + t) * SR), (n - lp) * Math.exp(-t * 60) * g, 0.2);
    }
  };
  const kick = (st, g) => {
    let ph = 0;
    for (let j = 0; j < 0.25 * SR; j++) {
      const t = j / SR;
      ph += (TAU * (50 + 90 * Math.exp(-t * 30))) / SR;
      add(buf, Math.round((st + t) * SR), Math.sin(ph) * Math.exp(-t * 11) * g);
    }
  };
  for (let k = 0; k * (beat / 2) < DURATION; k++) {
    const t = k * (beat / 2);
    const chord = happy[Math.floor(t / (beat * 4)) % 4];
    const sad = t >= SAD && t < BUILD;
    const build = t >= BUILD && t < WIN;
    const win = t >= WIN;
    if (sad) {
      if (k % 4 === 0) marimba(t, chord[0] * 0.5, 0.18, 0);
      continue;
    }
    if (build) {
      const u = (t - BUILD) / (WIN - BUILD);
      marimba(t, chord[k % 4] * 2, 0.08 + 0.12 * u, -0.2);
      if (k % 2 === 0) snap(t, 0.15 + 0.3 * u);
      continue;
    }
    marimba(t, chord[(k * 3) % 4] * 2, win ? 0.24 : 0.17, ((k % 3) - 1) * 0.3);
    if (k % 2 === 0) marimba(t, chord[0] * 0.5, 0.22, 0);
    if (k % 4 === 2) snap(t, 0.35);
    if (k % 4 === 0) kick(t, win ? 0.8 : 0.5);
    if (win && k % 2 === 1) snap(t, 0.2);
  }
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    const g = Math.min(1, t / 0.5) * Math.min(1, Math.max(0, (DURATION - t) / 2));
    buf[0][i] *= g;
    buf[1][i] *= g;
  }
  writeWav("score", buf, 0.8);
};

if (SET === "dumbtown") {
  whoosh();
  kaching();
  bonk();
  popSfx();
  dingSfx();
  gasp();
  trombone();
  scan();
  buzzer();
  creak();
  rainLoop();
  phoneBuzz();
  quirkyScore();
} else if (SET === "asteroid") {
  whoosh();
  siren();
  rumble();
  boom();
  boost();
  ballHit();
  catchThud();
  ding();
  applause();
  hypeScore();
} else if (SET === "jupiter") {
  radioStatic();
  squelch();
  flatline();
  gunshot();
  vanish();
  alarm();
  darkScore();
} else if (SET === "nuke") {
  whoosh();
  siren();
  rumble();
  zap();
  boom();
  wind();
  tenseMusic();
} else {
  poof();
  whoosh();
  boing();
  honk();
  whistle();
  music();
}
