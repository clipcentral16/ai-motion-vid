import { AbsoluteFill, Easing, Sequence, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { BlockCharacter, type Look } from "../shared/blocky/BlockCharacter";
import {
  BlockCanvas,
  BlockLights,
  BrickWing,
  Grass,
  House,
  LampPost,
  Road,
  Shop,
  StormClouds,
  Tower,
  Townhouse,
  Tree,
  Van,
} from "../shared/blocky/Environment";
import { armsCrossed, handsOnHips, idle, sad, walk, wave } from "../shared/blocky/poses";
import { Transitions } from "../shared/Transitions";
import { CameraRig, type Vec3 } from "../shared/three/World";

// Style test for the new "blocky" look: jointed characters with face
// expressions, real shadows, textured buildings. Three shots, 4s each.
export const SHOT = 120;
export const STYLE_TEST_FRAMES = SHOT * 3;

const WALLS = ["#f4c7a1", "#f6e3b0", "#f2b5a7", "#dfe8f0", "#f7d6c0", "#e9c3d6", "#cfe3c3"];

// ---------- Shot 1: city skyline under storm clouds ----------
const towers = Array.from({ length: 30 }).map((_, i) => ({
  x: (random(`tx${i}`) - 0.5) * 130,
  z: -30 - random(`tz${i}`) * 70,
  w: 9 + random(`tw${i}`) * 7,
  h: 45 + Math.pow(random(`th${i}`), 1.4) * 85,
  hue: 195 + random(`tc${i}`) * 30,
  setbacks: random(`ts${i}`) < 0.3 ? 2 : random(`ts${i}`) < 0.5 ? 1 : 0,
  round: random(`tr${i}`) < 0.15,
  crown: random(`tk${i}`) < 0.1 ? "#d9b54a" : undefined,
}));

const Skyline: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.sin) });
  const a = interpolate(p, [0, 1], [0.5, 0.28]);
  const cam: Vec3 = [Math.sin(a) * 175, interpolate(p, [0, 1], [70, 62]), Math.cos(a) * 175 + 20];
  return (
    <BlockCanvas skyTop="#1d1a24" skyHorizon="#4a4656" fov={48}>
      <CameraRig position={cam} target={[0, 48, -30]} />
      <BlockLights sun={[60, 90, 50]} target={[0, 0, -20]} area={110} sunIntensity={2.3} sky="#dfe6ff" ground="#4b7a35" fill={1.4} />
      <Grass size={900} />
      <Road length={240} position={[0, 0, 22]} rotationY={Math.PI / 2} width={10} sidewalk={4} />
      {Array.from({ length: 22 }).map((_, i) => (
        <Townhouse key={`a${i}`} position={[-104 + i * 9.6, 0, 36]} w={9} d={10} h={9 + (i % 3) * 3} wall={WALLS[i % WALLS.length]} />
      ))}
      {Array.from({ length: 20 }).map((_, i) => (
        <Townhouse key={`b${i}`} position={[-96 + i * 9.6, 0, 12]} w={9} d={10} h={10 + ((i + 1) % 3) * 4} wall={WALLS[(i + 3) % WALLS.length]} />
      ))}
      {Array.from({ length: 12 }).map((_, i) => (
        <Tree key={`t${i}`} position={[-90 + i * 16, 0, 24]} size={1.3} />
      ))}
      {towers.map((t, i) => (
        <Tower key={i} position={[t.x, 0, t.z]} w={t.w} d={t.w} h={t.h} hue={t.hue} setbacks={t.setbacks} round={t.round} crown={t.crown} />
      ))}
      <StormClouds y={115} area={520} z={160} count={140} />
    </BlockCanvas>
  );
};

// ---------- Shot 2: someone walking down a bright city street ----------
const WALKER: Look = { skin: "#d9a066", shirt: "#e9e2d0", pants: "#c8a77a", shoes: "#2b2f36", hair: "spiky", hairColor: "#f2d36b", sleeves: "long", top: "jacket", jacket: "#5a4632" };
const PASSER: Look = { skin: "#f2c9a0", shirt: "#e8e8e8", pants: "#2f4b7c", shoes: "#ffffff", hair: "cap", hairColor: "#6b3a1e", sleeves: "short", jeans: true };

const Street: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const speed = 6; // studs per second
  const z = -26 + t * speed;
  const phase = (t * speed * 2 * Math.PI) / 6.6;
  const cam: Vec3 = [8.5 + Math.sin(t * 0.5) * 0.6, 3.6, z + 15];
  return (
    <BlockCanvas skyTop="#3c9df0" skyHorizon="#bfe6ff" fov={56}>
      <CameraRig position={cam} target={[9.5, 6.5, z - 8]} />
      <BlockLights sun={[-40, 70, 30]} target={[9, 0, z - 10]} area={50} sunIntensity={2.8} />
      <Grass size={600} position={[0, -0.01, 0]} />
      <Road length={260} position={[0, 0, -40]} width={14} sidewalk={8} />
      {/* Right side: shops and apartments; left side: apartments and a van */}
      {Array.from({ length: 9 }).map((_, i) => (
        <group key={i}>
          {i % 2 ? (
            <Shop position={[17.5, 0, -10 - i * 13]} w={12} h={12} wall={WALLS[i % WALLS.length]} awning="#2fa86b" rotationY={-Math.PI / 2} />
          ) : (
            <Townhouse position={[18, 0, -10 - i * 13]} w={12} d={10} h={18 + (i % 3) * 5} wall={WALLS[(i + 2) % WALLS.length]} rotationY={-Math.PI / 2} />
          )}
          <Townhouse position={[-18, 0, -12 - i * 13]} w={12} d={10} h={15 + ((i + 1) % 3) * 6} wall={WALLS[(i + 4) % WALLS.length]} rotationY={Math.PI / 2} />
        </group>
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <Tower key={`tw${i}`} position={[-60 + i * 13, 0, -150 - (i % 3) * 20]} w={11} d={11} h={70 + (i % 4) * 25} hue={200 + i * 3} setbacks={i % 3 === 0 ? 1 : 0} round={i === 4} />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <LampPost key={`l${i}`} position={[11, 0.3, -6 - i * 16]} rotationY={Math.PI} />
      ))}
      <Van position={[4, 0, -30]} />
      <Van position={[-4, 0, -62]} color="#ff7a59" rotationY={Math.PI} />
      <BlockCharacter look={WALKER} pose={walk(phase)} expression="neutral" t={t} position={[9.5, 0.3, z]} />
      <BlockCharacter look={PASSER} pose={walk(phase * 0.95 + 1.3)} expression="happy" t={t} seed={3} position={[13, 0.3, -6 - t * 5.4]} rotationY={Math.PI} />
    </BlockCanvas>
  );
};

// ---------- Shot 3: a family in front of their house ----------
const FAMILY: { look: Look; x: number; z: number; pose: typeof idle; expr: "grin" | "happy" | "sad" | "angry"; scale: number; rot: number }[] = [
  { look: { skin: "#f2c9a0", shirt: "#1f3a6b", pants: "#2f4b7c", shoes: "#d9a441", hair: "buzz", hairColor: "#2a1d17", top: "jacket", jacket: "#7d8591", sleeves: "long", jeans: true }, x: -5.6, z: 2, pose: handsOnHips, expr: "grin", scale: 1.05, rot: 0.15 },
  { look: { skin: "#f2c9a0", shirt: "#ffcc2e", pants: "#6b7a3a", shoes: "#d93636", hair: "spiky", hairColor: "#d9612a", top: "hoodie", sleeves: "long", build: "kid" }, x: -2.0, z: 3, pose: wave, expr: "happy", scale: 1, rot: 0.05 },
  { look: { skin: "#f2c9a0", shirt: "#ff8fc0", pants: "#b48ae0", shoes: "#ffffff", hair: "ponytails", hairColor: "#f5d36b", sleeves: "short", build: "kid", accent: "#ff4fa3" }, x: 1.4, z: 3, pose: sad, expr: "sad", scale: 0.86, rot: -0.05 },
  { look: { skin: "#f2c9a0", shirt: "#f4efe6", pants: "#3a5f9a", shoes: "#f4efe6", hair: "long", hairColor: "#5a3a26", top: "jacket", jacket: "#f07a4a", sleeves: "long", jeans: true }, x: 5.2, z: 2, pose: armsCrossed, expr: "angry", scale: 1.0, rot: -0.2 },
];

const Family: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.sin) });
  const cam: Vec3 = [interpolate(p, [0, 1], [-1.5, 0.5]), interpolate(p, [0, 1], [6, 5.5]), interpolate(p, [0, 1], [29, 25])];
  return (
    <BlockCanvas skyTop="#141220" skyHorizon="#3b3550" fov={50}>
      <CameraRig position={cam} target={[0, 6.2, 0]} />
      <BlockLights sun={[25, 50, 45]} target={[0, 0, 0]} area={30} sunIntensity={2.4} sky="#e6ecff" ground="#4f8a3a" fill={1.5} />
      <Grass size={400} />
      <House position={[0, 0, -10]} w={18} d={12} h={15} />
      <BrickWing position={[16, 0, -13]} />
      <House position={[-21, 0, -14]} w={14} d={12} h={18} siding="#c9d6e3" roof="#8a4a3a" />
      <StormClouds y={42} area={240} z={70} count={90} />
      {FAMILY.map((m, i) => (
        <BlockCharacter key={i} look={m.look} pose={m.pose(t, i * 1.7)} expression={m.expr} t={t} seed={i} position={[m.x, 0, m.z]} rotationY={m.rot} scale={m.scale} />
      ))}
    </BlockCanvas>
  );
};

export const StyleTest: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Sequence durationInFrames={SHOT} name="Skyline">
      <Skyline />
    </Sequence>
    <Sequence from={SHOT} durationInFrames={SHOT} name="Street">
      <Street />
    </Sequence>
    <Sequence from={SHOT * 2} durationInFrames={SHOT} name="Family">
      <Family />
    </Sequence>
    <Transitions sceneStarts={[0, SHOT, SHOT * 2]} mode="dip" />
  </AbsoluteFill>
);
