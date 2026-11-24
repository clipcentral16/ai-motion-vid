export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Seconds per scene. Keep in sync with scripts/narration/jupiter.json and the
// score in scripts/generate-audio.mjs (jupiter set).
export const SCENE_SECONDS = [5, 4.5, 4.5, 4.5, 5, 4.5, 4.5] as const;
export const SCENE_FRAMES = SCENE_SECONDS.map((s) => Math.round(s * FPS));
export const SCENE_STARTS = SCENE_FRAMES.map((_, i) => SCENE_FRAMES.slice(0, i).reduce((a, b) => a + b, 0));
export const TOTAL_FRAMES = SCENE_FRAMES.reduce((a, b) => a + b, 0);

// Scene 4 (index 3): the engineer's radio cuts to static, then the flatline.
export const SIGNAL_LOST = 3.1;

// Scene 5 (index 4): CaseOh's shots (seconds into the scene). One alien per shot.
export const SHOTS = [1.35, 1.75, 2.15, 2.6, 3.0, 3.45];

// Scene 6 (index 5): when the "TRUE HERO" badge appears.
export const HERO_BADGE = 2.6;

export const SKIES = {
  space: { top: "#000000", horizon: "#07060d" },
  moon: { top: "#020208", horizon: "#1a1420" },
  ship: { top: "#030305", horizon: "#0b0a10" },
};
export const SWIPES = ["#2a0c12", "#7a1020", "#0d0d12", "#3b0a5c", "#141018"];
