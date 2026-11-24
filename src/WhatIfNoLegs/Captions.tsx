import { useMemo } from "react";
import { AbsoluteFill, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { createTikTokStyleCaptions, type TikTokPage } from "@remotion/captions";
import { loadFont } from "@remotion/fonts";
import { CAPTION_LINES, EMPHASIS_STARTS } from "./captions";
import { SCENE_STARTS, TOTAL_FRAMES } from "./constants";

const FONT = "Lilita One";
loadFont({ family: FONT, url: staticFile("fonts/LilitaOne-Regular.ttf") });

const isEmoji = (s: string) => /\p{Extended_Pictographic}/u.test(s);

const Page: React.FC<{ page: TikTokPage; durationInFrames: number }> = ({ page, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 360 }}>
      <div
        style={{
          fontFamily: `'${FONT}', 'Noto Color Emoji', sans-serif`,
          fontSize: 100,
          lineHeight: 1.08,
          color: "white",
          textAlign: "center",
          maxWidth: 1000,
          textTransform: "uppercase",
          opacity: exit,
          transform: `scale(${0.85 + 0.15 * exit})`,
        }}
      >
        {page.tokens.map((token, i) => {
          const startFrame = ((token.fromMs - page.startMs) / 1000) * fps;
          const pop = spring({ frame: frame - startFrame, fps, config: { damping: 9, stiffness: 220, mass: 0.6 } });
          const visible = frame >= startFrame;
          const word = token.text.trim();
          const emoji = isEmoji(word);
          const emph = EMPHASIS_STARTS.has(token.fromMs);
          // Highlighted words land bigger, in yellow, with a little wobble.
          const wobble = emph && visible ? Math.sin((frame - startFrame) / 3) * 4 * Math.exp(-(frame - startFrame) / 18) : 0;
          return (
            <span key={i}>
              {i > 0 ? " " : ""}
              <span
                style={{
                  display: "inline-block",
                  opacity: visible ? 1 : 0,
                  color: emph ? "#ffd93d" : "white",
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

/** Big bold outlined captions, centred near the bottom, popping in word by word. */
export const Captions: React.FC = () => {
  const { fps } = useVideoConfig();
  // Build pages per scene so one scene's words never spill into another's page.
  const pages = useMemo(
    () => CAPTION_LINES.flatMap((captions) => createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: 10000 }).pages),
    [],
  );

  return (
    <AbsoluteFill>
      {pages.map((page, i) => {
        const from = Math.round((page.startMs / 1000) * fps);
        // Each caption stays up until the end of its scene.
        const sceneEnd = [...SCENE_STARTS.slice(1), TOTAL_FRAMES].find((s) => s > from) ?? TOTAL_FRAMES;
        const duration = sceneEnd - from;
        return (
          <Sequence key={i} from={from} durationInFrames={duration} layout="none">
            <Page page={page} durationInFrames={duration} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
