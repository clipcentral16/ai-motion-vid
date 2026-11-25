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
          <div style={{ width: 70, height: 70, borderRadius: 16, background: "#ffd23f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: `'${FONT}', sans-serif`, fontSize: 44, color: "#1b1b1f", flex: "none" }}>C</div>
          <div style={{ fontFamily: "'DejaVu Sans', sans-serif", color: "#1b1b1f" }}>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.04em", color: "#5a5a66" }}>CLUMSY CHAMPIONSHIP · now</div>
            <div style={{ fontSize: 34, fontWeight: 700, marginTop: 6 }}>Congratulations, Max! 👑</div>
            <div style={{ fontSize: 30, marginTop: 8, lineHeight: 1.3 }}>
              {second ? (
                <>
                  Never falling once is the <b style={{ color: "#d62828" }}>CLUMSIEST thing in history.</b> You are the new <b>KING</b>.
                </>
              ) : (
                "The judges have reviewed your run…"
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
    <Pop from={at(1, BEAT.crown)} to={at(2, 0)}>{(pop, out) => <Chip text="CROWNED 👑" color="#ffd23f" top={380} pop={pop} out={out} size={130} />}</Pop>
    <Pop from={at(2, BEAT.spill + 0.2)} to={at(2, BEAT.parade)}>{(pop, out) => <Chip text="SPLASH!" color="#c98a3a" top={380} pop={pop} out={out} size={140} />}</Pop>
    <Pop from={at(2, BEAT.parade)} to={at(3, 0)}>{(pop, out) => <Chip text="PARADE! 🎉" color="#7dff6a" top={380} pop={pop} out={out} size={140} />}</Pop>
    <Pop from={at(8, BEAT.backflip + 0.3)} to={at(9, 0)}>
      {(pop, out) => (
        <>
          <Chip text="10 / 10 / 10" color="#ffffff" top={300} pop={pop} out={out} size={120} />
          <Chip text="CLUMSINESS: 0%" color="#ff4d4d" top={450} pop={pop} out={out} size={96} />
        </>
      )}
    </Pop>
    <Pop from={at(10, BEAT.judges - 0.1)} to={at(11, 0)}>{(pop, _out, l) => <Phone local={l} pop={pop} second={l > BEAT.clumsiest - BEAT.judges} />}</Pop>
    <Pop from={at(11, BEAT.king)} to={at(12, 0) + 0.2}>{(pop) => <Chip text="KING MAX 👑" color="#ffd23f" top={300} pop={pop} out={1} size={150} />}</Pop>
  </AbsoluteFill>
);
