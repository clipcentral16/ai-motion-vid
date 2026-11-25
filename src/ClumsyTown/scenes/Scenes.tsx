import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BlockCharacter, type Look } from "../../shared/blocky/BlockCharacter";
import { BlockCanvas, BlockLights, Grass, House, LampPost, Road, StormClouds, Townhouse, Tree } from "../../shared/blocky/Environment";
import { balance, blend, cheer, flail, handsOnHips, holdUp, idle, sad, scared, sit, splat, tuck, walk, type Pose } from "../../shared/blocky/poses";
import { Rain, ShopDoor, Sign } from "../../shared/blocky/TownProps";
import { CameraRig, punchFov, type Vec3 } from "../../shared/three/World";
import { BEAT, SKIES } from "../constants";
import { BananaPeel, Castle, CoffeeCup, Confetti, GrandStairs, JudgesTable, PlateStack, STAIRS, Splash, Throne, stairTopY } from "../three/ClumsyProps";

export { S0Skyline } from "../../DumbTown/scenes/Scenes";

// ---------- Cast ----------
export const MAX: Look = { skin: "#f2c9a0", shirt: "#e63946", pants: "#1e2a36", shoes: "#ffffff", hair: "spiky", hairColor: "#f2d36b", top: "hoodie", sleeves: "long", jeans: true, build: "kid" };
const TRIPPER: Look = { skin: "#c68642", shirt: "#7d8591", pants: "#2f4b7c", shoes: "#2b2f36", hair: "buzz", hairColor: "#1b1b1f", top: "jacket", jacket: "#5c6470", sleeves: "long", jeans: true };
const SPILLER: Look = { skin: "#f2c9a0", shirt: "#ffffff", pants: "#c8a77a", shoes: "#d93636", hair: "long", hairColor: "#c98a3a", sleeves: "short" };
const KING: Look = { skin: "#f2c9a0", shirt: "#ffffff", pants: "#4a4e69", shoes: "#1b1b1f", hair: "curly", hairColor: "#8a8a8a", top: "jacket", jacket: "#6a2c91", sleeves: "long", crown: true };
const FANS: Look[] = [
  { skin: "#e0ac69", shirt: "#ffcc2e", pants: "#6b7a3a", shoes: "#d93636", hair: "spiky", hairColor: "#2a1d17", top: "hoodie" },
  { skin: "#f2c9a0", shirt: "#ff8fc0", pants: "#b48ae0", shoes: "#ffffff", hair: "ponytails", hairColor: "#f5d36b", sleeves: "short", build: "kid", accent: "#ff4fa3" },
  { skin: "#8d5524", shirt: "#3ddc84", pants: "#2f4b7c", shoes: "#2b2f36", hair: "curly", hairColor: "#1b1b1f", jeans: true },
  { skin: "#f2c9a0", shirt: "#4cc9f0", pants: "#3a3a3a", shoes: "#ffffff", hair: "cap", hairColor: "#6b3a1e" },
];

const WALLS = ["#f4c7a1", "#f6e3b0", "#f2b5a7", "#dfe8f0", "#f7d6c0", "#e9c3d6", "#cfe3c3"];

const useT = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  return { frame, fps, t: frame / fps, p: interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.sin) }) };
};
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Rotate a whole character around a pivot `pivot` studs above its feet:
 * `pitch` > 0 tips it forward (faceplant), < 0 backward (backflip).
 * `heading` turns it to face a direction first.
 */
const Tumble: React.FC<{ position: Vec3; heading: number; pitch: number; pivot?: number; children: React.ReactNode }> = ({ position, heading, pitch, pivot = 0, children }) => (
  <group position={[position[0], position[1] + pivot, position[2]]} rotation={[0, heading, 0]}>
    <group rotation={[pitch, 0, 0]}>
      <group position={[0, -pivot, 0]}>{children}</group>
    </group>
  </group>
);

const StreetSet: React.FC<{ sky?: { top: string; horizon: string }; target?: Vec3; storm?: boolean; children: React.ReactNode; cam: Vec3; look: Vec3 }> = ({
  sky = SKIES.day,
  target = [0, 0, 0],
  storm = false,
  cam,
  look,
  children,
}) => {
  const { frame, fps } = useT();
  return (
    <BlockCanvas skyTop={sky.top} skyHorizon={sky.horizon} fov={50}>
      <CameraRig position={cam} target={look} fov={punchFov(frame, fps, 50)} />
      <BlockLights sun={[-30, 60, 40]} target={target} area={35} />
      <Grass size={400} />
      <Road length={200} position={[0, 0, 8]} rotationY={Math.PI / 2} width={10} sidewalk={6} />
      {Array.from({ length: 9 }).map((_, i) => (
        <Townhouse key={i} position={[-44 + i * 11, 0, -6]} w={10} d={10} h={10 + (i % 3) * 4} wall={WALLS[i % WALLS.length]} />
      ))}
      <LampPost position={[6, 0.3, 1.5]} />
      {storm ? <StormClouds y={42} area={240} z={70} count={90} /> : null}
      {children}
    </BlockCanvas>
  );
};

// ---------- 1: trip over nothing -> crown ----------
export const S1Trip: React.FC = () => {
  const { t } = useT();
  const s = t - BEAT.trip;
  const x = -12 + Math.min(t, BEAT.trip) * 4.4 + (s > 0 ? Math.min(1.6, s * 4) : 0);
  const pitch = s > 0 ? interpolate(s, [0, 0.35, 0.45, 0.55], [0, Math.PI / 2 + 0.08, Math.PI / 2 - 0.05, Math.PI / 2], clamp) : 0;
  const pose: Pose = s < 0 ? walk(t * 9.5) : s < 0.4 ? flail(t) : splat(t);
  const crowned = t > BEAT.crown;
  // Crown drops onto his head (head is ~4.7 studs ahead of his feet when lying).
  const crownDrop = interpolate(t, [BEAT.crown - 0.45, BEAT.crown], [12, 0.9], { ...clamp, easing: Easing.in(Easing.quad) });
  return (
    <StreetSet cam={[x + 2, 6, 21]} look={[x + 2.4, 2.4, 2.5]} target={[x, 0, 2]}>
      <Tumble position={[x, 0.3, 2.5]} heading={Math.PI / 2} pitch={pitch} pivot={0.25}>
        <BlockCharacter look={{ ...TRIPPER, crown: crowned }} pose={pose} expression={s < 0 ? "neutral" : crowned ? "grin" : "shocked"} t={t} />
      </Tumble>
      {!crowned && t > BEAT.crown - 0.45 ? (
        <mesh position={[x + 4.9, crownDrop, 2.5]} castShadow>
          <cylinderGeometry args={[0.72, 0.68, 0.5, 16, 1, true]} />
          <meshStandardMaterial color="#ffcc33" metalness={0.7} roughness={0.25} side={2} />
        </mesh>
      ) : null}
    </StreetSet>
  );
};

// ---------- 2: spill coffee -> parade ----------
export const S2Coffee: React.FC = () => {
  const { t } = useT();
  const s = t - BEAT.spill;
  // She walks along the sidewalk (+X), coffee held out in front.
  const z = 2.2;
  const x = -5 + Math.min(t, BEAT.spill) * 3;
  const tilt = s > 0 ? Math.min(2.2, s * 8) : 0;
  const pose: Pose = s < 0 ? blend(walk(t * 8), holdUp(t), 0.55) : t > BEAT.parade ? cheer(t, 2) : scared(t, 2);
  const cupPos: Vec3 = [x + 1.8, 4.3, z - 1.5];
  return (
    <StreetSet cam={[x + 1, 5, z + 16]} look={[x + 1, 3.6, z]} target={[x, 0, z]}>
      <BlockCharacter look={SPILLER} pose={pose} expression={s < 0 ? "happy" : t > BEAT.parade ? "grin" : "shocked"} t={t} position={[x, 0.3, z]} rotationY={s < 0 ? Math.PI / 2 : Math.PI / 2 - Math.min(1, s * 3) * 0.9} />
      {t < BEAT.parade ? (
        <group position={cupPos} rotation={[0, Math.PI / 2, 0]}>
          <CoffeeCup position={[0, 0, 0]} tilt={tilt} />
        </group>
      ) : null}
      <group position={[x + 1.8, 4.6, z - 1.5]} rotation={[0, -Math.PI / 2, 0]}>
        <Splash origin={[0, 0, 0]} s={s} />
      </group>
      {/* Brown stain on her shirt after the spill */}
      {s > 0.2 ? (
        <mesh position={[x + 0.3, 3.5, z + 0.6]}>
          <circleGeometry args={[Math.min(0.55, (s - 0.2) * 2), 16]} />
          <meshStandardMaterial color="#6b4a2b" roughness={0.4} />
        </mesh>
      ) : null}
      {t > BEAT.parade - 0.2
        ? FANS.map((f, i) => (
            <BlockCharacter key={i} look={f} pose={cheer(t, i)} expression="grin" t={t} seed={i} position={[x - 9 + i * 5 + (i > 1 ? 4 : 0), 0.3, 0.8 + (i % 2) * 1.5]} rotationY={0.25 * (1.5 - i)} />
          ))
        : null}
      <Confetti t={t} from={BEAT.parade - 0.1} center={[x, 0.3, z]} area={22} />
    </StreetSet>
  );
};

// ---------- 3: the current king ----------
export const S3King: React.FC = () => {
  const { frame, fps, t, p } = useT();
  return (
    <BlockCanvas skyTop={SKIES.royal.top} skyHorizon={SKIES.royal.horizon} fov={50}>
      <CameraRig position={[interpolate(p, [0, 1], [-14, -4]), interpolate(p, [0, 1], [16, 7]), interpolate(p, [0, 1], [48, 30])]} target={[0, 5, 10]} fov={punchFov(frame, fps, 50)} />
      <BlockLights sun={[-30, 60, 40]} target={[0, 0, 8]} area={45} sunColor="#ffe7b0" />
      <Grass size={500} />
      <Castle t={t} />
      <Throne position={[0, 0, 10]} />
      <BlockCharacter look={KING} pose={sit(t)} expression="smug" t={t} position={[0, 0.75, 10.1]} />
    </BlockCanvas>
  );
};

// ---------- 4: I'm Max ----------
export const S4Max: React.FC = () => {
  const { frame, fps, t, p } = useT();
  return (
    <BlockCanvas skyTop={SKIES.storm.top} skyHorizon={SKIES.storm.horizon} fov={50}>
      <CameraRig position={[interpolate(p, [0, 1], [-1, 0.5]), interpolate(p, [0, 1], [5.5, 4.8]), interpolate(p, [0, 1], [21, 15])]} target={[0, 5, 0]} fov={punchFov(frame, fps, 50)} />
      <BlockLights sun={[25, 50, 45]} target={[0, 0, 0]} area={30} />
      <Grass size={400} />
      <House position={[0, 0, -10]} w={18} d={12} h={15} siding="#f2b5a7" roof="#5a3a2a" door="#ffffff" shutters="#7a2a2a" />
      <Tree position={[-13, 0, -4]} size={1.3} />
      <StormClouds y={42} area={240} z={70} count={90} />
      <BlockCharacter look={MAX} pose={handsOnHips(t)} expression={t > 1.1 ? "smug" : "happy"} t={t} position={[0, 0, 3]} />
    </BlockCanvas>
  );
};

// ---------- 5: balance anything ----------
export const S5Balance: React.FC = () => {
  const { t } = useT();
  const x = -6 + t * 2.2;
  const legs = walk(t * 5.5);
  const arms = balance(t);
  const pose: Pose = { ...legs, shoulderL: arms.shoulderL, shoulderR: arms.shoulderR, elbowL: arms.elbowL, elbowR: arms.elbowR, torsoRoll: arms.torsoRoll, head: { x: 0, y: 0, z: arms.head.z } };
  // Kid head-top is ~4.6 studs up; the stack rides along with the bob.
  const headTop = 0.3 + 1.44 + pose.bob * 0.72 + 3.2;
  return (
    <StreetSet cam={[x + 2, 5, 17]} look={[x + 0.5, 3.6, 2.6]} target={[x, 0, 2]}>
      <BlockCharacter look={MAX} pose={pose} expression="smug" t={t} position={[x, 0.3, 2.6]} rotationY={Math.PI / 2} />
      <PlateStack position={[x, headTop, 2.6]} wobble={t * 2.6} />
    </StreetSet>
  );
};

// ---------- 6: banana peel -> perfect pose ----------
export const S6Banana: React.FC = () => {
  const { t } = useT();
  const s = t - BEAT.banana;
  const peelX = 0;
  // Walk to the peel, then slide (fast, slowing) until the perfect pose.
  const slide = s > 0 ? 9 * (1 - Math.exp(-Math.min(s, BEAT.perfectPose - BEAT.banana) * 1.3)) : 0;
  const x = Math.min(t, BEAT.banana) * 3.2 - 2.1 * 1 + slide - (BEAT.banana * 3.2 - 2.1);
  const posed = t > BEAT.perfectPose;
  const spin = posed ? interpolate(t, [BEAT.perfectPose, BEAT.perfectPose + 0.35], [0, Math.PI * 2], clamp) : 0;
  const pose: Pose = s < 0 ? walk(t * 7) : !posed ? flail(t * 0.8) : handsOnHips(t);
  if (s > 0 && !posed) {
    pose.hipL = { x: -0.9, z: 0.4 };
    pose.hipR = { x: 0.5, z: 0.4 };
  }
  const heading = Math.PI / 2 + spin + (posed ? -Math.PI / 2 * Math.min(1, (t - BEAT.perfectPose) * 3) : 0);
  return (
    <StreetSet cam={[x + 1.5, 5.4, 18]} look={[x + 1, 3, 2.6]} target={[x, 0, 2]}>
      <BananaPeel position={[peelX + (s > 0 ? slide : 0), 0.32, 2.6]} />
      <BlockCharacter look={MAX} pose={pose} expression={s < 0 ? "smug" : posed ? "worried" : "shocked"} t={t} position={[x, 0.3 + (s > 0 && !posed ? 0.3 : 0), 2.6]} rotationY={heading} />
    </StreetSet>
  );
};

// ---------- 7: the Clumsy Championship ----------
export const S7Champ: React.FC = () => {
  const { frame, fps, t, p } = useT();
  const z = 16 - t * 3.4;
  return (
    <BlockCanvas skyTop={SKIES.arena.top} skyHorizon={SKIES.arena.horizon} fov={52}>
      <CameraRig position={[interpolate(p, [0, 1], [6, 3]), interpolate(p, [0, 1], [5, 7]), z + 12]} target={[0, 9, 0]} fov={punchFov(frame, fps, 52)} />
      <BlockLights sun={[25, 50, 45]} target={[0, 0, 4]} area={30} />
      <Grass size={300} />
      <Road length={120} position={[0, 0, 24]} rotationY={Math.PI / 2} width={12} sidewalk={14} />
      <ShopDoor position={[0, 0.3, 0]} sign={"CLUMSY\nCHAMPIONSHIP"} wall="#c77dff" open={-1.1} />
      <Sign text={"FALL DOWN.\nWIN BIG."} position={[-9.5, 4.5, 0.4]} size={[5.5, 3]} bg="#ffffff" fg="#d62828" />
      <StormClouds y={45} area={240} z={70} count={90} />
      <BlockCharacter look={MAX} pose={walk(t * 7.5)} expression="smug" t={t} position={[0, 0.3, z]} rotationY={Math.PI} />
    </BlockCanvas>
  );
};

// ---------- 8: 100 stairs -> perfect backflip ----------
const LAND_Z = STAIRS.steps * STAIRS.run + 3;
const FLIGHT = 1.75;

export const S8Stairs: React.FC = () => {
  const { frame, fps, t } = useT();
  const s = t - BEAT.tripped;
  const u = Math.min(1, Math.max(0, s / FLIGHT));
  // Arc from the top edge to the floor at the bottom.
  const z = s < 0 ? -1.5 : interpolate(u, [0, 1], [-0.5, LAND_Z]);
  const y = s < 0 ? stairTopY : stairTopY * (1 - u) + 9 * Math.sin(Math.PI * u);
  const pitch = s < 0 ? 0 : -Math.PI * 2 * (u < 1 ? (1 - Math.cos(Math.PI * u)) / 2 : 1);
  const landed = s >= FLIGHT;
  const pose: Pose = s < 0 ? idle(t) : s < 0.25 ? flail(t) : !landed ? tuck(t) : t > BEAT.backflip + 0.3 ? sad(t) : cheer(0);
  // Camera: from the bottom looking up at the tiny figure, then follows the flip.
  const follow = interpolate(s, [-0.2, 0.3], [0, 1], clamp);
  const cam: Vec3 = [interpolate(follow, [0, 1], [10, 26]), interpolate(follow, [0, 1], [6, y * 0.6 + 6]), interpolate(follow, [0, 1], [LAND_Z + 16, z + 8])];
  const target: Vec3 = [0, interpolate(follow, [0, 1], [stairTopY + 2, y + 2]), interpolate(follow, [0, 1], [-1, z])];
  return (
    <BlockCanvas skyTop={SKIES.arena.top} skyHorizon={SKIES.arena.horizon} fov={55}>
      <CameraRig position={cam} target={target} fov={punchFov(frame, fps, 55)} />
      <BlockLights sun={[40, 80, 30]} target={[0, 0, LAND_Z / 2]} area={60} sunColor="#ffe7d0" fill={1.6} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, LAND_Z / 2]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#3a2a5a" roughness={0.8} />
      </mesh>
      <GrandStairs />
      <Sign text={"FINAL TEST:\n100 STAIRS"} position={[0, stairTopY + 7, -6]} size={[12, 4]} bg="#ffcc33" fg="#1b1b1f" />
      <JudgesTable position={[0, 0, LAND_Z + 9]} scores={t > BEAT.backflip + 0.2} rotationY={Math.PI} />
      {[-5, 0, 5].map((xx, i) => (
        <BlockCharacter key={i} look={FANS[(i + 2) % FANS.length]} pose={t > BEAT.backflip + 0.2 ? holdUp(t, i) : sit(t, i)} expression={t > BEAT.backflip ? "shocked" : "neutral"} t={t} seed={i} position={[xx, 0, LAND_Z + 11]} rotationY={Math.PI} />
      ))}
      <Tumble position={[0, y, z]} heading={0} pitch={pitch} pivot={2.2}>
        <BlockCharacter look={MAX} pose={pose} expression={s < 0 ? "smug" : landed ? (t > BEAT.backflip + 0.3 ? "sad" : "shocked") : "scared"} t={t} />
      </Tumble>
    </BlockCanvas>
  );
};

// ---------- 9: home, defeated ----------
export const S9Home: React.FC = () => {
  const { frame, fps, t } = useT();
  const x = -12 + t * 3;
  return (
    <BlockCanvas skyTop={SKIES.rain.top} skyHorizon={SKIES.rain.horizon} fov={50} exposure={0.9}>
      <CameraRig position={[x + 4, 5, 15]} target={[x + 1, 4.5, 0]} fov={punchFov(frame, fps, 50)} />
      <BlockLights sun={[20, 50, 40]} target={[x, 0, 0]} area={30} sunIntensity={0.9} fill={1.3} sky="#9aa3c0" ground="#3a4a3a" fog={{ color: "#4a4c5c", near: 30, far: 120 }} />
      <Grass size={300} />
      <Road length={200} position={[0, 0, 8]} rotationY={Math.PI / 2} width={10} sidewalk={6} />
      {Array.from({ length: 8 }).map((_, i) => (
        <Townhouse key={i} position={[-40 + i * 11, 0, -6]} w={10} d={10} h={10 + (i % 3) * 4} wall={WALLS[i % WALLS.length]} />
      ))}
      <StormClouds y={40} area={240} z={70} count={90} color="#2a2833" />
      <Rain t={t} center={[x, 0, 4]} />
      <BlockCharacter look={MAX} pose={blend(walk(t * 5.5), sad(t), 0.45)} expression="sad" t={t} position={[x, 0.3, 2.5]} rotationY={Math.PI / 2} />
    </BlockCanvas>
  );
};

// ---------- 10: the call ----------
export const S10Phone: React.FC = () => {
  const { frame, fps, t } = useT();
  const shocked = t > BEAT.clumsiest;
  return (
    <BlockCanvas skyTop={SKIES.rain.top} skyHorizon={SKIES.rain.horizon} fov={46} exposure={0.95}>
      <CameraRig position={[2, 5.2, 11]} target={[0, 4.2, 0]} fov={punchFov(frame, fps, 46) - (shocked ? 6 : 0)} />
      <BlockLights sun={[20, 50, 40]} target={[0, 0, 0]} area={25} sunIntensity={1} fill={1.4} sky="#9aa3c0" ground="#3a4a3a" fog={{ color: "#4a4c5c", near: 30, far: 120 }} />
      <Grass size={200} />
      <Townhouse position={[-6, 0, -10]} w={10} d={10} h={14} wall="#f6e3b0" />
      <Townhouse position={[6, 0, -10]} w={10} d={10} h={11} wall="#f2b5a7" />
      <StormClouds y={40} area={200} z={70} count={80} color="#2a2833" />
      <Rain t={t} center={[0, 0, 2]} area={30} />
      <BlockCharacter look={MAX} pose={t > BEAT.judges ? holdUp(t, 6) : sad(t)} expression={shocked ? "shocked" : t > BEAT.judges ? "worried" : "sad"} t={t} position={[0, 0, 0]} />
    </BlockCanvas>
  );
};

// ---------- 11: King Max ----------
export const S11Crowned: React.FC = () => {
  const { frame, fps, t, p } = useT();
  const crowned = t > BEAT.king - 0.15;
  return (
    <BlockCanvas skyTop={SKIES.royal.top} skyHorizon={SKIES.royal.horizon} fov={50}>
      <CameraRig position={[interpolate(p, [0, 1], [5, -3]), interpolate(p, [0, 1], [12, 15]), interpolate(p, [0, 1], [34, 42])]} target={[0, 4.5, 12]} fov={punchFov(frame, fps, 50)} />
      <BlockLights sun={[-30, 60, 40]} target={[0, 0, 12]} area={45} sunColor="#ffe7b0" />
      <Grass size={500} />
      <Castle t={t} />
      <Throne position={[0, 0, 10]} />
      <BlockCharacter look={{ ...MAX, crown: crowned }} pose={crowned ? cheer(t) : sit(t)} expression={crowned ? "grin" : "shocked"} t={t} position={[0, crowned ? 2.2 : 0.75 + 0.2, crowned ? 11 : 10.1]} />
      <BlockCharacter look={KING} pose={holdUp(t, 3)} expression="happy" t={t} seed={3} position={[5, 0, 12]} rotationY={-0.8} />
      {FANS.map((f, i) => (
        <BlockCharacter key={i} look={f} pose={cheer(t, i)} expression="grin" t={t} seed={i} position={[-12 + i * 6.5 + (i > 1 ? 5 : 0), 0, 18 + (i % 2) * 2]} rotationY={Math.PI + 0.25 * (i - 1.5)} />
      ))}
      <Confetti t={t} from={BEAT.king - 0.2} center={[0, 0, 14]} area={28} count={200} height={24} />
    </BlockCanvas>
  );
};
