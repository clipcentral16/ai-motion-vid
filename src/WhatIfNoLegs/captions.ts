import type { Caption } from "@remotion/captions";
import { FPS, POOF_SECONDS, SCENE_STARTS } from "./constants";

type Line = { scene: number; words: string[]; startSec: number; gapSec?: number; pauses?: Record<number, number> };

// One caption per scene. Words pop in one by one starting at `startSec`
// (seconds into the scene). `pauses` adds extra delay before a word index.
const LINES: Line[] = [
  { scene: 0, words: ["What", "if", "everyone", "lost", "their", "legs?"], startSec: 0.35, gapSec: 0.24 },
  { scene: 1, words: ["Overnight…", "gone."], startSec: POOF_SECONDS + 0.45, pauses: { 1: 0.55 } },
  { scene: 2, words: ["Office", "chairs", "become", "the", "#1", "car"], startSec: 0.35, gapSec: 0.22 },
  { scene: 3, words: ["Sports", "would", "never", "be", "the", "same"], startSec: 0.35, gapSec: 0.22 },
  { scene: 4, words: ["Stairs?", "Banned."], startSec: 0.4, pauses: { 1: 0.5 } },
  { scene: 5, words: ["Would", "you", "survive?", "Comment", "below", "👇"], startSec: 1.6, gapSec: 0.26, pauses: { 3: 0.45 } },
];

const ms = (frames: number) => (frames / FPS) * 1000;

/** Captions grouped per scene, in @remotion/captions format (absolute ms). */
export const CAPTION_LINES: Caption[][] = LINES.map((line) => {
  const sceneMs = ms(SCENE_STARTS[line.scene]);
  let at = sceneMs + line.startSec * 1000;
  return line.words.map((word, i) => {
    at += (line.pauses?.[i] ?? 0) * 1000;
    const startMs = at;
    at += (line.gapSec ?? 0.3) * 1000;
    return {
      // Leading space marks a word boundary; createTikTokStyleCaptions starts
      // a new page only on tokens that begin with a space.
      text: ` ${word}`,
      startMs,
      endMs: startMs + 400,
      timestampMs: startMs,
      confidence: 1,
    };
  });
});
