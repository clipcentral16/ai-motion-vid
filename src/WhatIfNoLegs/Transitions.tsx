import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FPS, POOF_SECONDS, SCENE_STARTS } from "./constants";

const HALF = 7; // frames either side of the cut
const COLORS = ["#ffd93d", "#ff6b9d", "#4dd4ff", "#7dff8a", "#c77dff"];

/** Colourful diagonal swipe that hides each cut, plus a white flash on the poof. */
export const Transitions: React.FC = () => {
  const frame = useCurrentFrame();
  const poofFrame = SCENE_STARTS[1] + POOF_SECONDS * FPS;
  const flash = interpolate(frame, [poofFrame, poofFrame + 2, poofFrame + 10], [0, 0.85, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      {SCENE_STARTS.slice(1).map((cut, i) => {
        const p = (frame - (cut - HALF)) / (HALF * 2);
        if (p <= 0 || p >= 1) return null;
        const x = interpolate(p, [0, 1], [-2600, 2600]);
        return (
          <div
            key={cut}
            style={{
              position: "absolute",
              top: -200,
              bottom: -200,
              left: "50%",
              width: 2900,
              marginLeft: -1450,
              transform: `translateX(${x}px) skewX(-14deg)`,
              display: "flex",
            }}
          >
            <div style={{ flex: 1, background: COLORS[(i + 1) % COLORS.length] }} />
            <div style={{ flex: 6, background: COLORS[i % COLORS.length] }} />
            <div style={{ flex: 1, background: "white" }} />
          </div>
        );
      })}
      <AbsoluteFill style={{ background: "white", opacity: flash }} />
    </AbsoluteFill>
  );
};
