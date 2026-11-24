import type { Caption } from "@remotion/captions";

// Narration data written by scripts/generate-narration.py: one voice clip per
// scene plus the time of every spoken word (Microsoft Edge TTS boundaries).

export type NarrationWord = { spoken: string; text: string; start: number; end: number; emphasis?: boolean };
export type CaptionTone = "narrator" | "radio" | "alien" | "hero" | "weak";
export type NarrationLine = {
  scene: number;
  file: string;
  start: number;
  duration: number;
  words: NarrationWord[];
  extra: string[];
  speaker?: string;
  tone?: string;
};
/** Per-caption-page styling, keyed by the page's first word start (ms). */
export type PageMeta = { speaker?: string; tone?: CaptionTone };
export type Narration = { voice: string; rate: string; lines: NarrationLine[] };

export type VoiceClip = { from: number; to: number; src: string };

/**
 * Turns narration data into captions that match the voice word for word,
 * the set of highlighted words, and the voice clips' frame ranges.
 */
export const buildNarration = (narration: Narration, sceneStarts: number[], fps: number) => {
  const lineStartMs = (line: NarrationLine) => (sceneStarts[line.scene] / fps) * 1000 + line.start * 1000;

  const emphasis = new Set(
    narration.lines.flatMap((line) => line.words.filter((w) => w.emphasis).map((w) => lineStartMs(line) + w.start * 1000)),
  );

  const captionLines: Caption[][] = narration.lines.map((line) => {
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

  const voiceClips: VoiceClip[] = narration.lines.map((line) => {
    const from = Math.round((lineStartMs(line) / 1000) * fps);
    return { from, to: from + Math.ceil(line.duration * fps), src: line.file };
  });

  const pageMeta = new Map<number, PageMeta>(
    narration.lines.map((line) => [lineStartMs(line) + line.words[0].start * 1000, { speaker: line.speaker, tone: line.tone as CaptionTone | undefined }]),
  );

  return { captionLines, emphasis, voiceClips, pageMeta };
};
