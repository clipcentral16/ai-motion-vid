import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

const HALF = 7; // frames either side of the cut
export const BRIGHT_SWIPES = ["#ffd93d", "#ff6b9d", "#4dd4ff", "#7dff8a", "#c77dff"];

export type Flash = { frame: number; color?: string; peak?: number; length?: number };

/**
 * Hides each scene cut: a diagonal colour swipe (`mode="swipe"`, playful) or
 * a quick dip to black (`mode="dip"`, for serious or scary videos). Plus
 * optional full-screen flashes.
 */
export type TransitionMode = "swipe" | "dip";

export const Transitions: React.FC<{ sceneStarts: number[]; colors?: string[]; flashes?: Flash[]; mode?: TransitionMode | TransitionMode[] }> = ({
  sceneStarts,
  colors = BRIGHT_SWIPES,
  flashes = [],
  mode = "swipe",
}) => {
  const frame = useCurrentFrame();
  const COLORS = colors;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      {sceneStarts.slice(1).map((cut, i) => {
        // `mode` can be one value for every cut, or one per cut.
        if ((Array.isArray(mode) ? mode[i] : mode) === "dip") {
          const o = interpolate(frame, [cut - 9, cut, cut + 9], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return o > 0 ? <AbsoluteFill key={cut} style={{ background: "#000", opacity: o }} /> : null;
        }
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
      {flashes.map((f) => {
        const len = f.length ?? 10;
        const opacity = interpolate(frame, [f.frame, f.frame + 2, f.frame + len], [0, f.peak ?? 0.85, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return opacity > 0 ? <AbsoluteFill key={f.frame} style={{ background: f.color ?? "white", opacity }} /> : null;
      })}
    </AbsoluteFill>
  );
};
