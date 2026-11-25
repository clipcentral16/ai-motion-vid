import narration from "./narration.json";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Seconds per scene (from the voice lengths). Keep in sync with
// scripts/narration/clumsytown.json and the score (generate-audio.mjs clumsytown).
export const SCENE_SECONDS = [4.0, 3.2, 3.5, 4.0, 3.4, 2.8, 4.8, 3.0, 7.2, 3.7, 5.4, 4.5] as const;
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
  trip: wordAt(1, "nothing") - 0.15,
  crown: wordAt(1, "crown"),
  spill: wordAt(2, "coffee"),
  parade: wordAt(2, "parade"),
  balance: wordAt(5, "balance"),
  banana: wordAt(6, "banana"),
  perfectPose: wordAt(6, "perfect"),
  hundred: wordAt(8, "hundred"),
  tripped: wordAt(8, "tripped"),
  backflip: wordAt(8, "backflip"),
  judges: wordAt(10, "judges"),
  clumsiest: wordAt(10, "clumsiest"),
  king: wordAt(11, "king"),
};

export const SKIES = {
  storm: { top: "#141220", horizon: "#3b3550" },
  day: { top: "#3c9df0", horizon: "#bfe6ff" },
  rain: { top: "#1a1a24", horizon: "#4a4c5c" },
  royal: { top: "#3a2a7a", horizon: "#ffcf8b" },
  arena: { top: "#1b1035", horizon: "#5a2a6a" },
};
