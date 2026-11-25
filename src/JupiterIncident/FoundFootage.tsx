import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { SCENE_STARTS, SIGNAL_LOST, TOTAL_FRAMES } from "./constants";

const MONO = "'JetBrains Mono', 'DejaVu Sans Mono', monospace";

/** Film grain, scanlines, vignette and a "recovered mission log" HUD over everything. */
export const FoundFootage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const lostFrom = SCENE_STARTS[3] + Math.round(SIGNAL_LOST * fps);
  const lostTo = SCENE_STARTS[4];
  const signalLost = frame >= lostFrom && frame < lostTo;
  const secs = Math.floor(t);
  const tc = `T+00:${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}:${String(frame % fps).padStart(2, "0")}`;
  const recOn = Math.floor(t * 1.5) % 2 === 0;
  const fadeOut = interpolate(frame, [TOTAL_FRAMES - 20, TOTAL_FRAMES], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Grain: SVG turbulence re-seeded every frame (deterministic) */}
      <AbsoluteFill style={{ opacity: 0.16, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%">
          <filter id={`grain${frame}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#grain${frame})`} />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 2px, transparent 2px, transparent 5px)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 48%, rgba(0,0,0,0.75) 100%)" }} />

      {/* HUD */}
      <div style={{ position: "absolute", top: 120, left: 60, right: 60, display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 34, color: "rgba(220,235,225,0.85)", letterSpacing: "0.06em", opacity: fadeOut }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ width: 22, height: 22, borderRadius: 11, background: recOn ? "#ff2a2a" : "transparent", display: "inline-block" }} />
            REC
          </div>
          <div style={{ fontSize: 26, opacity: 0.7, marginTop: 6 }}>MISSION LOG · RECOVERED</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div>JUPITER I · 2011</div>
          <div style={{ fontSize: 26, opacity: 0.7, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{tc}</div>
        </div>
      </div>

      {/* Glitch bars around the radio cut */}
      {Math.abs(frame - lostFrom) < 8 || (frame > SCENE_STARTS[2] + 20 && frame < SCENE_STARTS[2] + 30)
        ? Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${random(`gy${frame}-${i}`) * 100}%`,
                height: 10 + random(`gh${frame}-${i}`) * 70,
                background: i % 2 ? "rgba(255,40,60,0.35)" : "rgba(80,255,200,0.25)",
                transform: `translateX(${(random(`gx${frame}-${i}`) - 0.5) * 160}px)`,
                mixBlendMode: "screen",
              }}
            />
          ))
        : null}

      {/* Signal lost: black screen, flatline trace */}
      {signalLost ? (
        <AbsoluteFill style={{ background: "#020303", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 40 }}>
          <svg width="900" height="200" viewBox="0 0 900 200">
            <polyline
              points={`0,100 ${Math.min(900, ((frame - lostFrom) / 6) * 140)},100`}
              stroke="#39ff88"
              strokeWidth="6"
              fill="none"
              style={{ filter: "drop-shadow(0 0 10px #39ff88)" }}
            />
          </svg>
          <div style={{ fontFamily: MONO, fontSize: 70, color: "#ff3b3b", letterSpacing: "0.18em", opacity: Math.floor((frame - lostFrom) / 8) % 2 ? 1 : 0.35 }}>
            SIGNAL LOST
          </div>
          <div style={{ fontFamily: MONO, fontSize: 32, color: "rgba(220,235,225,0.6)", letterSpacing: "0.1em" }}>SPEED · NO VITAL SIGNS</div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
