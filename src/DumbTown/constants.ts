import narration from "./narration.json";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Seconds per scene (from the voice lengths). Keep in sync with
// scripts/narration/dumbtown.json and the score (generate-audio.mjs dumbtown).
export const SCENE_SECONDS = [3.5, 3.8, 3.5, 4.8, 3.0, 2.8, 4.0, 3.2, 3.2, 3.0, 5.8, 3.2, 5.5, 4.5] as const;
export const SCENE_FRAMES = SCENE_SECONDS.map((s) => Math.round(s * FPS));
export const SCENE_STARTS = SCENE_FRAMES.map((_, i) => SCENE_FRAMES.slice(0, i).reduce((a, b) => a + b, 0));
export const TOTAL_FRAMES = SCENE_FRAMES.reduce((a, b) => a + b, 0);

/** Seconds into `scene` when the word starting with `prefix` is spoken (nth match). */
export const wordAt = (scene: number, prefix: string, nth = 0) => {
  const line = narration.lines.find((l) => l.scene === scene)!;
  const hits = line.words.filter((w) => w.text.toLowerCase().replace(/[^a-z0-9%-]/g, "").startsWith(prefix.toLowerCase()));
  return line.start + hits[Math.min(nth, hits.length - 1)].start;
};

// Story beats, timed to the narrator.
export const BEAT = {
  zeroPaper: wordAt(1, "lowest"),
  bonusCash: wordAt(1, "bonus"),
  doorBonk: wordAt(2, "pull") + 0.15,
  kaching: wordAt(2, "ka-ching"),
  classmateZero: wordAt(3, "zero"),
  mansion: wordAt(3, "now"),
  aPlus: wordAt(5, "everything"),
  forgot: wordAt(6, "forgot"),
  hundred: wordAt(7, "highest"),
  zeroDumb: wordAt(9, "zero"),
  pushDoor: wordAt(10, "pushed"),
  pushReveal: wordAt(10, "push", 1),
  phone: wordAt(12, "phone"),
  dumbest: wordAt(12, "dumbest"),
  billion: wordAt(13, "billion"),
};

export const SKIES = {
  storm: { top: "#141220", horizon: "#3b3550" },
  day: { top: "#3c9df0", horizon: "#bfe6ff" },
  indoor: { top: "#f3efe6", horizon: "#f3efe6" },
  rain: { top: "#1a1a24", horizon: "#4a4c5c" },
  gold: { top: "#2a1f5c", horizon: "#ffcf6b" },
};
