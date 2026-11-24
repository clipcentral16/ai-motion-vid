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

export const SKY_TOP = "#3fa9f5";
export const SKY_HORIZON = "#bfe8ff";

export const SHIRT_COLORS = [
  "#ff5a5f", "#ffb400", "#00a699", "#7b61ff", "#ff7eb6",
  "#3ddc97", "#ff8c42", "#2ec4ff", "#f9d923", "#e84393",
];
export const SKIN_COLORS = ["#ffd7b5", "#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#ffe0c4"];
export const BUILDING_COLORS = [
  "#ff6b6b", "#ffd93d", "#6bcB77", "#4d96ff", "#c77dff",
  "#ff9f68", "#5ee7df", "#f78fb3", "#ffc75f", "#845ec2",
];
