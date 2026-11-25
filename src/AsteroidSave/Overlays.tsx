import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import { AIR_ROLL, CATCH, FLICK, JUMP_IN, LIFTOFF, RESET, SCENE_STARTS } from "./constants";

const FONT = "Lilita One";
loadFont({ family: FONT, url: staticFile("fonts/LilitaOne-Regular.ttf") });

type Callout = { at: number; until: number; text: string; color: string; top: number; size?: number };

const sec = (scene: number, s: number) => SCENE_STARTS[scene] / 30 + s;

// Game-style callouts for each move.
const CALLOUTS: Callout[] = [
  { at: sec(3, AIR_ROLL - 0.1), until: sec(3, CATCH - 0.15), text: "AIR ROLL", color: "#66e0ff", top: 300, size: 110 },
  { at: sec(3, CATCH), until: sec(4, 0), text: "ZEN TOUCH!", color: "#ffd166", top: 300, size: 140 },
  { at: sec(4, RESET), until: sec(4, FLICK - 0.1), text: "FLIP RESET!", color: "#66e0ff", top: 300, size: 120 },
  { at: sec(4, FLICK), until: sec(5, 0), text: "MUSTY FLICK!", color: "#ff4d6d", top: 300, size: 140 },
  { at: sec(5, 0.4), until: sec(6, 0), text: "WHAT A SAVE!", color: "#ffd166", top: 330, size: 150 },
];

const CalloutText: React.FC<{ c: Callout }> = ({ c }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const from = Math.round(c.at * fps);
  const to = Math.round(c.until * fps);
  if (frame < from || frame >= to) return null;
  const pop = spring({ frame: frame - from, fps, config: { damping: 9, stiffness: 180 } });
  const out = interpolate(frame, [to - 5, to], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        top: c.top,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: `'${FONT}', sans-serif`,
        fontSize: c.size ?? 120,
        color: c.color,
        fontStyle: "italic",
        WebkitTextStroke: "14px #0b0b14",
        paintOrder: "stroke fill",
        textShadow: `0 0 40px ${c.color}99, 0 10px 0 rgba(0,0,0,0.5)`,
        transform: `translateX(${(1 - pop) * -300}px) skewX(-10deg) scale(${0.6 + 0.4 * pop})`,
        opacity: out,
        letterSpacing: "0.02em",
      }}
    >
      {c.text}
    </div>
  );
};

/** Boost gauge in the corner while Zen is flying (scenes 3–5). */
const BoostMeter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const from = SCENE_STARTS[2] + Math.round(LIFTOFF * fps) - 6;
  const to = SCENE_STARTS[5];
  if (frame < from || frame >= to) return null;
  const t = (frame - from) / fps;
  const value = Math.max(12, Math.round(100 - t * 9 + 6 * Math.sin(t * 2)));
  const r = 92;
  const c = 2 * Math.PI * r;
  const appear = spring({ frame: frame - from, fps, config: { damping: 12 } });
  return (
    <div style={{ position: "absolute", right: 60, bottom: 150, width: 240, height: 240, transform: `scale(${appear})` }}>
      <svg width="240" height="240" viewBox="0 0 240 240">
        <circle cx="120" cy="120" r={r} stroke="rgba(0,0,0,0.55)" strokeWidth="30" fill="rgba(0,0,0,0.35)" />
        <circle
          cx="120"
          cy="120"
          r={r}
          stroke="#ffb703"
          strokeWidth="22"
          fill="none"
          strokeDasharray={`${(c * value) / 100} ${c}`}
          transform="rotate(-90 120 120)"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 10px #ff8800)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: `'${FONT}', sans-serif`, color: "white" }}>
        <div style={{ fontSize: 72, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 26, letterSpacing: "0.2em", opacity: 0.8 }}>BOOST</div>
      </div>
    </div>
  );
};

const Tag: React.FC<{ text: string; color: string; x: number; y: number; from: number; to: number }> = ({ text, color, x, y, from, to }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < from || frame >= to) return null;
  const pop = spring({ frame: frame - from, fps, config: { damping: 10 } });
  const out = interpolate(frame, [to - 5, to], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -100%) scale(${pop})`, opacity: out, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontFamily: `'${FONT}', sans-serif`, fontSize: 46, color: "#111", background: color, padding: "8px 22px", borderRadius: 14, border: "4px solid #111", letterSpacing: "0.06em" }}>{text}</div>
      <div style={{ width: 0, height: 0, borderLeft: "18px solid transparent", borderRight: "18px solid transparent", borderTop: `22px solid ${color}` }} />
    </div>
  );
};

const EndTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const from = SCENE_STARTS[6] + 4;
  if (frame < from) return null;
  const pop = spring({ frame: frame - from, fps, config: { damping: 11, stiffness: 120 } });
  return (
    <div style={{ position: "absolute", top: 260, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transform: `scale(${0.6 + 0.4 * pop})`, opacity: Math.min(1, pop * 1.5) }}>
      <div style={{ fontFamily: `'${FONT}', sans-serif`, fontSize: 64, color: "#ffffff", letterSpacing: "0.12em", WebkitTextStroke: "10px #0b0b14", paintOrder: "stroke fill" }}>EARTH SAVED BY</div>
      <div style={{ fontFamily: `'${FONT}', sans-serif`, fontSize: 230, lineHeight: 0.95, color: "#ffd60a", fontStyle: "italic", WebkitTextStroke: "16px #0b0b14", paintOrder: "stroke fill", textShadow: "0 0 50px rgba(255,214,10,0.6)" }}>ZEN</div>
    </div>
  );
};

export const Overlays: React.FC = () => {
  const { fps } = useVideoConfig();
  const s2 = SCENE_STARTS[2];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Tag text="ELON'S FLYING CAR" color="#ffd166" x={590} y={820} from={s2 + 6} to={s2 + Math.round((LIFTOFF + 0.3) * fps)} />
      <Tag text="ZEN" color="#ffd60a" x={250} y={760} from={s2 + 10} to={s2 + Math.round((JUMP_IN - 0.1) * fps)} />
      {CALLOUTS.map((c) => (
        <CalloutText key={c.text} c={c} />
      ))}
      <BoostMeter />
      <EndTitle />
    </AbsoluteFill>
  );
};
