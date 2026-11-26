import narration from "./narration.json";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Seconds per scene (from the voice lengths). Keep in sync with
// scripts/narration/flyingcars.json and the score (generate-audio.mjs flyingcars).
export const SCENE_SECONDS = [4.5, 4.7, 4.6, 4.0, 4.2, 5.4, 3.2, 3.6, 4.8, 3.0, 3.4, 4.0] as const;
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
  flying: wordAt(0, "flying"),
  amazing: wordAt(1, "amazing"),
  forty: wordAt(1, "forty"),
  four: wordAt(1, "four"),
  billion: wordAt(2, "billion"),
  sky: wordAt(2, "sky"),
  jam: wordAt(3, "jam"),
  three: wordAt(3, "three"),
  lanes: wordAt(4, "lanes"),
  heights: wordAt(4, "heights"),
  dead: wordAt(5, "dead"),
  brick: wordAt(5, "brick"),
  parachute: wordAt(5, "parachute"),
  worst: wordAt(6, "worst"),
  empty: wordAt(7, "empty"),
  parks: wordAt(7, "parks"),
  mountains: wordAt(8, "mountains"),
  islands: wordAt(8, "islands"),
  roof: wordAt(9, "roof"),
  driveway: wordAt(9, "driveway"),
  ninety: wordAt(10, "ninety"),
  would: wordAt(11, "would"),
  car: wordAt(11, "car"),
};

export const SKIES = {
  dawn: { top: "#5b7fd6", horizon: "#ffd1a1" },
  day: { top: "#3c9df0", horizon: "#bfe6ff" },
  busy: { top: "#6a8fb8", horizon: "#f0d9b5" },
  ocean: { top: "#2f8fe8", horizon: "#d4f1ff" },
  sunset: { top: "#4a3b8f", horizon: "#ffa86b" },
};
