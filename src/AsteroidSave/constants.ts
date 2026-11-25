import narration from "./narration.json";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Seconds per scene. Keep in sync with scripts/narration/asteroid.json and
// STARTS in hypeScore (scripts/generate-audio.mjs).
export const SCENE_SECONDS = [4.5, 4.5, 4.5, 5, 5, 4.5, 4] as const;
export const SCENE_FRAMES = SCENE_SECONDS.map((s) => Math.round(s * FPS));
export const SCENE_STARTS = SCENE_FRAMES.map((_, i) => SCENE_FRAMES.slice(0, i).reduce((a, b) => a + b, 0));
export const TOTAL_FRAMES = SCENE_FRAMES.reduce((a, b) => a + b, 0);

/** Seconds into `scene` when word `idx` of that scene's narration is spoken. */
const wordAt = (scene: number, idx: number) => {
  const line = narration.lines.find((l) => l.scene === scene)!;
  return line.start + line.words[idx].start;
};

// The big moments land on the narrator's words (the score uses the same timings).
export const AIR_ROLL = wordAt(3, 1); // "air rolled"
export const CATCH = wordAt(3, 4); // "caught"
export const RESET = wordAt(4, 1); // "reset"
export const FLICK = wordAt(4, 3); // "FLICK!"

// Scene 3: Zen jumps in, the car takes off.
export const JUMP_IN = 1.5;
export const LIFTOFF = 2.0;

export const SKIES = {
  space: { top: "#000000", horizon: "#050816" },
  doom: { top: "#2a0505", horizon: "#ff6a2a" },
  dusk: { top: "#1a1033", horizon: "#ff7a45" },
  high: { top: "#02030b", horizon: "#2b5fb5" },
  saved: { top: "#2f8fe8", horizon: "#bfe8ff" },
};

// Per cut: dips to black while it's scary, colour swipes once the hype starts.
export const CUT_MODES = ["dip", "swipe", "swipe", "swipe", "swipe", "swipe"] as const;
export const SWIPES = ["#ffd166", "#ff4d4d", "#3a86ff", "#ffd166", "#06d6a0", "#ff4d4d"];
