import { useMemo } from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";

// Caption data in @remotion/captions format. In a real project these would
// come from a transcription (e.g. @remotion/install-whisper-cpp) JSON file.
const captions: Caption[] = [
  { text: "Hello", startMs: 300, endMs: 800, timestampMs: 550, confidence: 1 },
  { text: " from", startMs: 800, endMs: 1200, timestampMs: 1000, confidence: 1 },
  { text: " Three.js", startMs: 1200, endMs: 2000, timestampMs: 1600, confidence: 1 },
  { text: " inside", startMs: 2400, endMs: 2900, timestampMs: 2650, confidence: 1 },
  { text: " Remotion", startMs: 2900, endMs: 3800, timestampMs: 3350, confidence: 1 },
  { text: " rendered", startMs: 4000, endMs: 4600, timestampMs: 4300, confidence: 1 },
  { text: " to", startMs: 4600, endMs: 4900, timestampMs: 4750, confidence: 1 },
  { text: " MP4!", startMs: 4900, endMs: 5800, timestampMs: 5350, confidence: 1 },
];

const Page: React.FC<{
  page: ReturnType<typeof createTikTokStyleCaptions>["pages"][number];
}> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeMs = (frame / fps) * 1000 + page.startMs;

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 70 }}>
      <div
        style={{
          fontFamily: "Helvetica, Arial, sans-serif",
          fontSize: 64,
          fontWeight: 800,
          color: "white",
          textShadow: "0 4px 16px rgba(0,0,0,0.8)",
          whiteSpace: "pre",
        }}
      >
        {page.tokens.map((t) => {
          const active = t.fromMs <= timeMs && t.toMs > timeMs;
          return (
            <span key={t.fromMs} style={{ color: active ? "#ffd84d" : "white" }}>
              {t.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC = () => {
  const { fps } = useVideoConfig();
  const { pages } = useMemo(
    () => createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: 1200 }),
    [],
  );

  return (
    <AbsoluteFill>
      {pages.map((page, i) => {
        const next = pages[i + 1];
        const from = Math.round((page.startMs / 1000) * fps);
        const endMs = next ? next.startMs : page.startMs + page.durationMs;
        const duration = Math.max(1, Math.round((endMs / 1000) * fps) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={duration} layout="none">
            <Page page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
