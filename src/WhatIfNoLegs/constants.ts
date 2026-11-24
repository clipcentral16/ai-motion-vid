export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Seconds per scene, in order. Kept short and punchy (~4s each).
// Keep in sync with scripts/generate-narration.py and generate-audio.mjs.
export const SCENE_SECONDS = [4, 4.5, 4, 4, 4, 5] as const;
export const SCENE_FRAMES = SCENE_SECONDS.map((s) => Math.round(s * FPS));
export const SCENE_STARTS = SCENE_FRAMES.map((_, i) =>
  SCENE_FRAMES.slice(0, i).reduce((a, b) => a + b, 0),
);
export const TOTAL_FRAMES = SCENE_FRAMES.reduce((a, b) => a + b, 0);

// Scene 2: the moment the legs vanish (seconds from the start of scene 2).
// The background beat (scripts/generate-audio.mjs) drops out for one beat
// before this and the drums come in on it: 4s + 1s = 5s absolute.
export const POOF_SECONDS = 1.0;

export { SKY_TOP, SKY_HORIZON, SHIRT_COLORS, SKIN_COLORS, BUILDING_COLORS } from "../shared/palette";
