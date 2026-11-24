export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Seconds per scene. Keep in sync with scripts/narration/nuke.json and the
// score in scripts/generate-audio.mjs (nuke set).
export const SCENE_SECONDS = [4, 4, 4, 4, 4, 5] as const;
export const SCENE_FRAMES = SCENE_SECONDS.map((s) => Math.round(s * FPS));
export const SCENE_STARTS = SCENE_FRAMES.map((_, i) => SCENE_FRAMES.slice(0, i).reduce((a, b) => a + b, 0));
export const TOTAL_FRAMES = SCENE_FRAMES.reduce((a, b) => a + b, 0);

// Scene 1: ignition and lift-off (seconds into the scene).
export const IGNITION = 0.35;
export const LIFTOFF = 0.95;

// Scene 3: interceptor hits (seconds into the scene). The third warhead gets through.
export const HITS = [1.3, 2.0];

// Scene 4: the distant flash, and when its shockwave reaches the hilltop.
// The score cuts out on the flash: 12s + 0.6s = 12.6s absolute.
export const BLAST = 0.6;
export const SHOCK_ARRIVES = 2.35;

// Moody palettes per scene.
export const SKIES = {
  sunset: { top: "#33407a", horizon: "#ff9d6c" },
  alarm: { top: "#4a1426", horizon: "#ff7a5c" },
  night: { top: "#050a1c", horizon: "#1c2d58" },
  dusk: { top: "#3a3f68", horizon: "#f4ad7c" },
  ash: { top: "#45464b", horizon: "#9a958d" },
  space: { top: "#010208", horizon: "#0b1236" },
};

export const SWIPES = ["#ef233c", "#ffb347", "#2b2d42", "#ff6b4a", "#8d99ae"];
