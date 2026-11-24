import type { Caption } from "@remotion/captions";
import { FPS, SCENE_STARTS } from "./constants";
import narration from "./narration.json";

// Captions follow the narrator word for word. narration.json is written by
// scripts/generate-narration.py from Microsoft Edge TTS word boundaries, so
// each word pops in at the moment it is spoken.

export type NarrationLine = (typeof narration.lines)[number];
export const NARRATION_LINES: NarrationLine[] = narration.lines;

const sceneMs = (scene: number) => (SCENE_STARTS[scene] / FPS) * 1000;

/** Absolute start of a narration clip, in ms. */
export const lineStartMs = (line: NarrationLine) => sceneMs(line.scene) + line.start * 1000;

/** Start times (ms) of the words to highlight, e.g. "LEGS?", "BANNED." */
export const EMPHASIS_STARTS = new Set(
  NARRATION_LINES.flatMap((line) => line.words.filter((w) => w.emphasis).map((w) => lineStartMs(line) + w.start * 1000)),
);

/** Captions grouped per scene, in @remotion/captions format (absolute ms). */
export const CAPTION_LINES: Caption[][] = NARRATION_LINES.map((line) => {
  const base = lineStartMs(line);
  const spoken: Caption[] = line.words.map((w) => ({
    // Leading space marks a word boundary; createTikTokStyleCaptions starts
    // a new page only on tokens that begin with a space.
    text: ` ${w.text}`,
    startMs: base + w.start * 1000,
    endMs: base + w.end * 1000,
    timestampMs: base + w.start * 1000,
    confidence: 1,
  }));
  const lastEnd = spoken[spoken.length - 1].endMs;
  const extra: Caption[] = line.extra.map((text, i) => ({
    text: ` ${text}`,
    startMs: lastEnd + 120 + i * 200,
    endMs: lastEnd + 520 + i * 200,
    timestampMs: lastEnd + 120 + i * 200,
    confidence: 1,
  }));
  return [...spoken, ...extra];
});
