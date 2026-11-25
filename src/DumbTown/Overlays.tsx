import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import { BEAT, SCENE_STARTS, TOTAL_FRAMES } from "./constants";

const FONT = "Lilita One";
loadFont({ family: FONT, url: staticFile("fonts/LilitaOne-Regular.ttf") });

/** Absolute seconds; scene index past the last one means the end of the video. */
const at = (scene: number, sec: number) => (scene < SCENE_STARTS.length ? SCENE_STARTS[scene] : TOTAL_FRAMES) / 30 + sec;

/** Shows children between `from` and `to` (seconds), popping in and fading out. */
const Pop: React.FC<{ from: number; to: number; children: (pop: number, out: number, local: number) => React.ReactNode }> = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f0 = Math.round(from * fps);
  const f1 = Math.round(to * fps);
  if (frame < f0 || frame >= f1) return null;
  const pop = spring({ frame: frame - f0, fps, config: { damping: 9, stiffness: 160 } });
  const out = interpolate(frame, [f1 - 5, f1], [1, 0], { extrapolateLeft: "clamp" });
  return <>{children(pop, out, (frame - f0) / fps)}</>;
};

/** A graded test paper held up to the camera. */
const Paper: React.FC<{ grade: string; color: string; note: string; tilt: number; pop: number; out: number }> = ({ grade, color, note, tilt, pop, out }) => (
  <div
    style={{
      position: "absolute",
      top: 230,
      left: "50%",
      width: 470,
      height: 600,
      marginLeft: -235,
      background: "#fbfbf6",
      borderRadius: 10,
      boxShadow: "0 24px 50px rgba(0,0,0,0.45)",
      transform: `scale(${0.4 + 0.6 * pop}) rotate(${tilt * (2 - pop)}deg)`,
      opacity: out,
      backgroundImage: "repeating-linear-gradient(0deg, transparent 0, transparent 46px, #c9dcf5 46px, #c9dcf5 49px)",
      overflow: "hidden",
    }}
  >
    <div style={{ position: "absolute", left: 60, top: 0, bottom: 0, width: 3, background: "#f2a0a0" }} />
    <div style={{ position: "absolute", top: 40, left: 86, fontFamily: `'${FONT}', sans-serif`, fontSize: 40, color: "#33415c" }}>MATHS TEST</div>
    <div style={{ position: "absolute", top: 105, left: 86, right: 30, fontFamily: "'DejaVu Sans', sans-serif", fontSize: 26, color: "#4a5568", lineHeight: "49px" }}>
      1. 7 × 8 = ____
      <br />
      2. 144 ÷ 12 = ____
      <br />
      3. Solve for x
    </div>
    <div
      style={{
        position: "absolute",
        bottom: 60,
        right: 40,
        fontFamily: `'${FONT}', sans-serif`,
        fontSize: 190,
        color,
        transform: "rotate(-12deg)",
        lineHeight: 1,
      }}
    >
      {grade}
    </div>
    <div style={{ position: "absolute", bottom: 50, left: 70, fontFamily: `'${FONT}', sans-serif`, fontSize: 44, color, transform: "rotate(-6deg)" }}>{note}</div>
    <div style={{ position: "absolute", bottom: 40, right: 26, width: 300, height: 230, border: `10px solid ${color}`, borderRadius: "50%", transform: "rotate(-12deg)", opacity: 0.85 }} />
  </div>
);

const Chip: React.FC<{ text: string; color: string; top: number; pop: number; out: number; rise?: number; size?: number }> = ({ text, color, top, pop, out, rise = 0, size = 120 }) => (
  <div
    style={{
      position: "absolute",
      top: top - rise,
      left: 0,
      right: 0,
      textAlign: "center",
      fontFamily: `'${FONT}', 'Noto Color Emoji', sans-serif`,
      fontSize: size,
      color,
      WebkitTextStroke: "14px #13140e",
      paintOrder: "stroke fill",
      textShadow: "0 10px 0 rgba(0,0,0,0.4)",
      transform: `scale(${0.3 + 0.7 * pop}) rotate(${(1 - pop) * 10}deg)`,
      opacity: out,
    }}
  >
    {text}
  </div>
);

/** Phone with a notification banner sliding in. */
const Phone: React.FC<{ local: number; pop: number; second: boolean }> = ({ local, pop, second }) => {
  const shake = local < 0.5 ? Math.sin(local * 90) * 10 * (1 - local * 2) : 0;
  return (
    <div style={{ position: "absolute", top: 170, left: "50%", marginLeft: -250, width: 500, height: 900, transform: `translateY(${(1 - pop) * 900}px) rotate(${shake * 0.3}deg) translateX(${shake}px)` }}>
      <div style={{ position: "absolute", inset: 0, background: "#16171c", borderRadius: 70, boxShadow: "0 30px 70px rgba(0,0,0,0.6)" }} />
      <div style={{ position: "absolute", inset: 18, borderRadius: 56, background: "linear-gradient(180deg, #4b6cb7 0%, #182848 100%)", overflow: "hidden" }}>
        <div style={{ textAlign: "center", marginTop: 70, color: "white", fontFamily: "'DejaVu Sans', sans-serif", fontSize: 96, fontWeight: 300 }}>9:41</div>
        <div style={{ margin: "40px 22px 0", background: "rgba(245,245,250,0.94)", borderRadius: 30, padding: "22px 24px", display: "flex", gap: 18, alignItems: "flex-start" }}>
          <div style={{ width: 70, height: 70, borderRadius: 16, background: "#ffd23f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: `'${FONT}', sans-serif`, fontSize: 44, color: "#1b1b1f", flex: "none" }}>D</div>
          <div style={{ fontFamily: "'DejaVu Sans', sans-serif", color: "#1b1b1f" }}>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.04em", color: "#5a5a66" }}>DUMB CENTRE · now</div>
            <div style={{ fontSize: 34, fontWeight: 700, marginTop: 6 }}>Congratulations, Bob! 🏆</div>
            <div style={{ fontSize: 30, marginTop: 8, lineHeight: 1.3 }}>
              {second ? (
                <>
                  0% dumb is the <b style={{ color: "#d62828" }}>DUMBEST score in history.</b> Your reward: <b>$1,000,000,000</b>
                </>
              ) : (
                "You've been selected for an award…"
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Overlays: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {/* 1: lowest score */}
    <Pop from={at(1, BEAT.zeroPaper)} to={at(1, BEAT.bonusCash)}>{(pop, out) => <Paper grade="0%" color="#d62828" note="see me" tilt={-14} pop={pop} out={out} />}</Pop>
    <Pop from={at(1, BEAT.bonusCash)} to={at(2, 0)}>{(pop, out, l) => <Chip text="+$1,000 BONUS" color="#7dff6a" top={420} pop={pop} out={out} rise={l * 60} size={110} />}</Pop>
    {/* 2: door */}
    <Pop from={at(2, BEAT.doorBonk)} to={at(2, BEAT.kaching)}>{(pop, out) => <Chip text="BONK!" color="#ffffff" top={380} pop={pop} out={out} size={150} />}</Pop>
    <Pop from={at(2, BEAT.kaching)} to={at(3, 0)}>{(pop, out, l) => <Chip text="+$500" color="#7dff6a" top={420} pop={pop} out={out} rise={l * 80} size={150} />}</Pop>
    {/* 3: classmate */}
    <Pop from={at(3, BEAT.classmateZero)} to={at(3, BEAT.mansion)}>{(pop, out) => <Paper grade="0%" color="#d62828" note="0/100" tilt={10} pop={pop} out={out} />}</Pop>
    {/* 5: A+ */}
    <Pop from={at(5, BEAT.aPlus)} to={at(6, 0)}>{(pop, out) => <Paper grade="A+" color="#2e9d4a" note="perfect!" tilt={-10} pop={pop} out={out} />}</Pop>
    {/* 7: 100% */}
    <Pop from={at(7, BEAT.hundred)} to={at(8, 0)}>{(pop, out) => <Paper grade="100%" color="#2e9d4a" note="TOP OF CLASS" tilt={12} pop={pop} out={out} />}</Pop>
    {/* 10: correct */}
    <Pop from={at(10, BEAT.pushReveal)} to={at(11, 0)}>
      {(pop, out) => (
        <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: out }}>
          <div
            style={{
              fontFamily: `'${FONT}', sans-serif`,
              fontSize: 130,
              color: "#2ecc71",
              border: "14px solid #2ecc71",
              borderRadius: 26,
              padding: "6px 40px",
              background: "rgba(255,255,255,0.9)",
              transform: `scale(${2.2 - 1.2 * pop}) rotate(-10deg)`,
            }}
          >
            CORRECT ✔
          </div>
        </div>
      )}
    </Pop>
    {/* 12: phone */}
    <Pop from={at(12, BEAT.phone - 0.1)} to={at(13, 0)}>{(pop, _out, l) => <Phone local={l} pop={pop} second={l > BEAT.dumbest - BEAT.phone} />}</Pop>
    {/* 13: billion */}
    <Pop from={at(13, BEAT.billion)} to={at(14, 0) + 0.2}>
      {(pop) => <Chip text="$1,000,000,000" color="#ffd23f" top={300} pop={pop} out={1} size={128} />}
    </Pop>
  </AbsoluteFill>
);
