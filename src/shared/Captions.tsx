import { useMemo } from "react";
import { AbsoluteFill, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { CaptionTone, PageMeta } from "./narration";
import { createTikTokStyleCaptions, type Caption, type TikTokPage } from "@remotion/captions";
import { loadFont } from "@remotion/fonts";

const FONT = "Lilita One";
loadFont({ family: FONT, url: staticFile("fonts/LilitaOne-Regular.ttf") });

const isEmoji = (s: string) => /\p{Extended_Pictographic}/u.test(s);

const TONES: Record<CaptionTone, { color: string; chip: string; chipText: string; size: number; jitter: number }> = {
  narrator: { color: "white", chip: "#1d1b26", chipText: "#ffffff", size: 100, jitter: 0 },
  radio: { color: "#c4ffd2", chip: "#12351f", chipText: "#7dffa6", size: 92, jitter: 1.2 },
  alien: { color: "#ff4a4a", chip: "#3a0a0f", chipText: "#ff6b6b", size: 104, jitter: 6 },
  hero: { color: "white", chip: "#3d2c00", chipText: "#ffd166", size: 104, jitter: 0 },
  weak: { color: "#d9d4cf", chip: "#26232b", chipText: "#bdb6ae", size: 82, jitter: 0.6 },
  panic: { color: "#ffffff", chip: "#5c0a0a", chipText: "#ff8a8a", size: 112, jitter: 7 },
};

const Page: React.FC<{ page: TikTokPage; durationInFrames: number; emphasis: Set<number>; meta?: PageMeta }> = ({
  page,
  durationInFrames,
  emphasis,
  meta,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tone = TONES[meta?.tone ?? "narrator"];
  // Glitchy shake for radio / alien lines (deterministic per frame).
  const jx = tone.jitter ? (random(`jx${page.startMs}-${frame}`) - 0.5) * tone.jitter * 2 : 0;
  const jy = tone.jitter ? (random(`jy${page.startMs}-${frame}`) - 0.5) * tone.jitter : 0;
  const exit = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 360, flexDirection: "column", gap: 18 }}>
      {meta?.speaker ? (
        <div
          style={{
            fontFamily: `'${FONT}', sans-serif`,
            fontSize: 44,
            letterSpacing: "0.08em",
            color: tone.chipText,
            background: tone.chip,
            border: `4px solid ${tone.chipText}`,
            borderRadius: 14,
            padding: "6px 22px",
            opacity: exit * Math.min(1, frame / 4),
            transform: `translate(${jx}px, ${jy}px)`,
          }}
        >
          {meta.speaker}
        </div>
      ) : null}
      <div
        style={{
          fontFamily: `'${FONT}', 'Noto Color Emoji', sans-serif`,
          fontSize: tone.size,
          lineHeight: 1.08,
          color: tone.color,
          textAlign: "center",
          maxWidth: 1000,
          textTransform: "uppercase",
          opacity: exit,
          transform: `translate(${jx}px, ${jy}px) scale(${0.85 + 0.15 * exit})`,
        }}
      >
        {page.tokens.map((token, i) => {
          const startFrame = ((token.fromMs - page.startMs) / 1000) * fps;
          const pop = spring({ frame: frame - startFrame, fps, config: { damping: 9, stiffness: 220, mass: 0.6 } });
          const visible = frame >= startFrame;
          const word = token.text.trim();
          const emoji = isEmoji(word);
          const emph = emphasis.has(token.fromMs);
          // Highlighted words land bigger, in yellow, with a little wobble.
          const wobble = emph && visible ? Math.sin((frame - startFrame) / 3) * 4 * Math.exp(-(frame - startFrame) / 18) : 0;
          return (
            <span key={i}>
              {i > 0 ? " " : ""}
              <span
                style={{
                  display: "inline-block",
                  opacity: visible ? 1 : 0,
                  color: emph ? (meta?.tone === "alien" ? "#ff1f1f" : "#ffd93d") : tone.color,
                  fontSize: emph ? "1.22em" : undefined,
                  transform: `scale(${visible ? pop : 0}) rotate(${(1 - Math.min(1, pop)) * (i % 2 ? 8 : -8) + wobble}deg)`,
                  WebkitTextStroke: emoji ? undefined : "18px black",
                  paintOrder: "stroke fill",
                  textShadow: emoji ? undefined : "0 10px 0 rgba(0,0,0,0.45)",
                }}
              >
                {word}
              </span>
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/**
 * Big bold outlined captions, centred near the bottom, popping in word by
 * word. `lines` holds one Caption[] per scene; each stays up until its
 * scene ends. Words whose start (ms) is in `emphasis` are highlighted.
 */
export const CaptionTrack: React.FC<{
  lines: Caption[][];
  emphasis: Set<number>;
  sceneStarts: number[];
  totalFrames: number;
  pageMeta?: Map<number, PageMeta>;
}> = ({ lines, emphasis, sceneStarts, totalFrames, pageMeta }) => {
  const { fps } = useVideoConfig();
  // Build pages per scene so one scene's words never spill into another's page.
  const pages = useMemo(
    () => lines.flatMap((captions) => createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: 10000 }).pages),
    [lines],
  );

  return (
    <AbsoluteFill>
      {pages.map((page, i) => {
        const from = Math.round((page.startMs / 1000) * fps);
        // Each caption stays up until its scene ends or the next caption starts.
        const sceneEnd = [...sceneStarts.slice(1), totalFrames].find((s) => s > from) ?? totalFrames;
        const next = pages[i + 1] ? Math.round((pages[i + 1].startMs / 1000) * fps) : totalFrames;
        const duration = Math.min(sceneEnd, next) - from;
        return (
          <Sequence key={i} from={from} durationInFrames={duration} layout="none">
            <Page page={page} durationInFrames={duration} emphasis={emphasis} meta={pageMeta?.get(page.startMs)} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
