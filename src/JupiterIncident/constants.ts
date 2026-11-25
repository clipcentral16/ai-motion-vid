import narration from "./narration.json";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Seconds per scene. Keep in sync with scripts/narration/jupiter.json and the
// score in scripts/generate-audio.mjs (jupiter set).
export const SCENE_SECONDS = [5, 4.5, 4.5, 4.5, 5, 4.5, 4.5] as const;
export const SCENE_FRAMES = SCENE_SECONDS.map((s) => Math.round(s * FPS));
export const SCENE_STARTS = SCENE_FRAMES.map((_, i) => SCENE_FRAMES.slice(0, i).reduce((a, b) => a + b, 0));
export const TOTAL_FRAMES = SCENE_FRAMES.reduce((a, b) => a + b, 0);

// Scene 4 (index 3): Speed's radio cuts to static right as his last word ends,
// then the flatline. Derived from the voice timings (scripts/narration/jupiter.json);
// the score (generate-audio.mjs) reads the same timings for its silence.
const speedLine = narration.lines.find((l) => l.scene === 3)!;
export const SIGNAL_LOST = Math.round((speedLine.start + speedLine.words[speedLine.words.length - 1].end + 0.02) * 100) / 100;

// Scene 5 (index 4): CaseOh's shots (seconds into the scene). One alien per shot.
export const SHOTS = [1.35, 1.75, 2.15, 2.6, 3.0, 3.45];

// Scene 6 (index 5): when the "TRUE HERO" badge appears.
export const HERO_BADGE = 2.6;

export const SKIES = {
  space: { top: "#000000", horizon: "#07060d" },
  moon: { top: "#020208", horizon: "#1a1420" },
  ship: { top: "#030305", horizon: "#0b0a10" },
};
