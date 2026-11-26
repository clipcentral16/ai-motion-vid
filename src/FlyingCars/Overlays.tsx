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

/** Strike-through "40 MIN" then "4 MIN". */
const Commute: React.FC<{ local: number; pop: number; out: number; fourAt: number }> = ({ local, pop, out, fourAt }) => {
  const strike = Math.max(0, Math.min(1, (local - (fourAt - 0.5)) * 4));
  return (
    <>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center", opacity: out }}>
        <span style={{ position: "relative", display: "inline-block", fontFamily: `'${FONT}', sans-serif`, fontSize: 120, color: "#ff5a5f", WebkitTextStroke: "14px #13140e", paintOrder: "stroke fill", transform: `scale(${0.3 + 0.7 * pop})` }}>
          🚗 40 MIN
          <span style={{ position: "absolute", left: -10, top: "48%", height: 22, width: `${strike * 105}%`, background: "#13140e", borderRadius: 10 }} />
        </span>
      </div>
    </>
  );
};

export const Overlays: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <Pop from={at(0, BEAT.flying + 0.3)} to={at(1, 0)}>{(pop, out) => <Chip text="WHAT IF? 🚗💨" color="#4fe3ff" top={330} pop={pop} out={out} size={130} />}</Pop>
    <Pop from={at(1, BEAT.forty - 0.1)} to={at(2, 0)}>{(pop, out, l) => <Commute local={l} pop={pop} out={out} fourAt={BEAT.four - BEAT.forty + 0.1} />}</Pop>
    <Pop from={at(1, BEAT.four)} to={at(2, 0)}>{(pop, out) => <Chip text="⚡ 4 MIN" color="#7dff6a" top={460} pop={pop} out={out} size={140} />}</Pop>
    <Pop from={at(2, BEAT.billion)} to={at(3, 0)}>{(pop, out) => <Chip text="1,400,000,000 CARS" color="#ffd23f" top={330} pop={pop} out={out} size={96} />}</Pop>
    <Pop from={at(3, BEAT.three)} to={at(4, 0)}>{(pop, out) => <Chip text="RUSH HOUR 3D 😤" color="#ff5a5f" top={330} pop={pop} out={out} size={120} />}</Pop>
    <Pop from={at(5, BEAT.dead)} to={at(5, BEAT.parachute - 0.4)}>{(pop, out) => <Chip text="🪫 0%" color="#ff4d4d" top={330} pop={pop} out={out} size={150} />}</Pop>
    <Pop from={at(5, BEAT.parachute - 0.3)} to={at(6, 0)}>{(pop, out) => <Chip text="🪂 SAFE!" color="#7dff6a" top={330} pop={pop} out={out} size={150} />}</Pop>
    <Pop from={at(6, BEAT.worst - 0.2)} to={at(7, 0)}>{(pop, out) => <Chip text="WORST YEAR EVER 🐦" color="#ffffff" top={330} pop={pop} out={out} size={104} />}</Pop>
    <Pop from={at(7, BEAT.parks)} to={at(8, 0)}>{(pop, out) => <Chip text="ROAD → PARK 🌳" color="#7dff6a" top={330} pop={pop} out={out} size={112} />}</Pop>
    <Pop from={at(8, BEAT.mountains)} to={at(9, 0)}>{(pop, out) => <Chip text="🏔️" color="#ffffff" top={320} pop={pop} out={out} size={150} />}</Pop>
    <Pop from={at(8, BEAT.islands)} to={at(9, 0)}>{(pop, out) => <Chip text="🏝️" color="#ffffff" top={480} pop={pop} out={out} size={150} />}</Pop>
    <Pop from={at(9, BEAT.driveway)} to={at(10, 0)}>{(pop, out) => <Chip text="ROOF = DRIVEWAY" color="#ffd23f" top={330} pop={pop} out={out} size={110} />}</Pop>
    <Pop from={at(10, BEAT.ninety)} to={at(11, 0)}>{(pop, out) => <Chip text="⏱️ 90 SEC 🍕" color="#ffd23f" top={330} pop={pop} out={out} size={130} />}</Pop>
    <Pop from={at(11, BEAT.car + 0.3)} to={at(12, 0) + 0.2}>{(pop) => <Chip text="WOULD YOU? 👇" color="#4fe3ff" top={300} pop={pop} out={1} size={140} />}</Pop>
  </AbsoluteFill>
);
