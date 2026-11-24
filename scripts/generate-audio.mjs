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

import { writeFileSync, mkdirSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const SR = 44100;
const SET = process.argv[2] ?? "no-legs";
const OUT_NAME = { nuke: "whatif-nuke", jupiter: "jupiter" }[SET] ?? "whatif";
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

// Alien vanishing: descending warble that fizzles out.
const vanish = () => {
  const d = 0.8;
  const buf = stereo(d);
  let ph = 0, lp = 0;
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    const f = 900 * Math.exp(-t * 3.5) + 60 * Math.sin(TAU * 25 * t);
    ph += (TAU * f) / SR;
    lp += lpCoef(3000) * (noise() - lp);
    const env = Math.min(1, t / 0.01) * Math.exp(-t * 4);
    add(buf, i, (Math.sign(Math.sin(ph)) * 0.25 + lp * 0.6 * Math.exp(-t * 6)) * env, Math.sin(t * 20) * 0.3);
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

// Dark score, 32.5s. Section times (s) match src/JupiterIncident/constants.ts.
const darkScore = () => {
  const DURATION = 32.5;
  const HEARTBEAT_FROM = 9.5;
  const RISER_FROM = 14;
  const SILENCE_FROM = 17.1; // radio cuts out
  const ACTION_FROM = 18.5;
  const SAD_FROM = 23.5;
  const HERO_FROM = 28;
  const buf = stereo(DURATION);

  // Low dissonant drone (A + B-flat) with slow swell, until the action.
  let lp = 0;
  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    let v = 0;
    if (t < SILENCE_FROM) {
      const sw = 0.6 + 0.4 * Math.sin(TAU * 0.12 * t);
      for (const f of [55, 58.27, 110, 116.54]) v += ((f * t) % 1) * 2 - 1;
      lp += lpCoef(220 + 160 * sw) * (v - lp);
      let g = 0.09 * sw * Math.min(1, t / 1.5);
      if (t >= RISER_FROM) g *= 1 + (t - RISER_FROM) * 0.5;
      add(buf, i, lp * g, Math.sin(t * 0.2) * 0.3);
    }
  }
  // Riser before the radio cuts: rising filtered noise
  let rl = 0;
  for (let i = Math.round(RISER_FROM * SR); i < Math.round(SILENCE_FROM * SR); i++) {
    const t = i / SR - RISER_FROM;
    const span = SILENCE_FROM - RISER_FROM;
    rl += lpCoef(300 + 5000 * (t / span) ** 2) * (noise() - rl);
    add(buf, i, rl * 0.35 * (t / span));
  }
  // Heartbeat
  const thump = (start, g) => {
    let ph = 0;
    for (let j = 0; j < 0.25 * SR; j++) {
      const t = j / SR;
      ph += (TAU * (45 + 30 * Math.exp(-t * 25))) / SR;
      add(buf, Math.round((start + t) * SR), Math.sin(ph) * Math.exp(-t * 14) * g);
    }
  };
  for (let t = HEARTBEAT_FROM; t < SILENCE_FROM - 0.4; t += 0.8 - Math.min(0.3, (t - HEARTBEAT_FROM) * 0.04)) {
    thump(t, 0.9);
    thump(t + 0.22, 0.6);
  }
  // Action: driving drums + ostinato
  const kick = (start) => {
    let ph = 0;
    for (let j = 0; j < 0.3 * SR; j++) {
      const t = j / SR;
      ph += (TAU * (48 + 100 * Math.exp(-t * 30))) / SR;
      add(buf, Math.round((start + t) * SR), Math.sin(ph) * Math.exp(-t * 10) * 0.9);
    }
  };
  const snare = (start) => {
    let l = 0;
    for (let j = 0; j < 0.18 * SR; j++) {
      const t = j / SR;
      const n = noise();
      l += lpCoef(1500) * (n - l);
      add(buf, Math.round((start + t) * SR), (n - l) * Math.exp(-t * 20) * 0.5);
    }
  };
  const pluck = (start, f, g) => {
    let l = 0, ph = 0;
    for (let j = 0; j < 0.18 * SR; j++) {
      const t = j / SR;
      ph += f / SR;
      l += lpCoef(900 * Math.exp(-t * 10) + 200) * (((ph % 1) * 2 - 1) - l);
      add(buf, Math.round((start + t) * SR), l * Math.exp(-t * 9) * g, -0.2);
    }
  };
  const step = 60 / 140 / 2; // 140 BPM eighths
  const riff = [55, 55, 65.41, 55, 73.42, 55, 65.41, 61.74];
  for (let k = 0, t = ACTION_FROM; t < SAD_FROM - 0.2; k++, t += step) {
    if (k % 2 === 0) kick(t);
    if (k % 4 === 2) snare(t);
    pluck(t, riff[k % 8] * 2, 0.45);
  }
  // Sad pad, then a heroic major swell
  let pl = 0;
  for (let i = Math.round(SAD_FROM * SR); i < buf[0].length; i++) {
    const t = i / SR;
    const hero = t >= HERO_FROM;
    const chord = hero ? [146.83, 185.0, 220.0, 293.66] : [110, 130.81, 164.81];
    let v = 0;
    for (const f of chord) for (const det of [0.996, 1.004]) v += ((f * det * t) % 1) * 2 - 1;
    pl += lpCoef(hero ? 1400 : 600) * (v - pl);
    const g = hero ? 0.06 * Math.min(1, (t - HERO_FROM) / 1.2) : 0.045 * Math.min(1, (t - SAD_FROM) / 1);
    add(buf, i, pl * g, Math.sin(t * 0.4) * 0.3);
  }
  // Timpani roll into the hero swell
  for (let t = HERO_FROM - 0.6; t < HERO_FROM + 0.2; t += 0.07) thump(t, 0.25 + (t - HERO_FROM + 0.6) * 0.6);

  for (let i = 0; i < buf[0].length; i++) {
    const t = i / SR;
    const g = Math.min(1, t / 0.5) * Math.min(1, Math.max(0, (DURATION - t) / 1.8));
    buf[0][i] *= g;
    buf[1][i] *= g;
  }
  writeWav("score", buf, 0.8);
};

if (SET === "jupiter") {
  whoosh();
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
