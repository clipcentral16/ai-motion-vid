import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { BlockCharacter, type Look } from "../../shared/blocky/BlockCharacter";
import { BlockCanvas, BlockLights, Grass, House, LampPost, Road, StormClouds, Tower, Townhouse, Tree, Van } from "../../shared/blocky/Environment";
import { blend, cheer, handsOnHips, headInHands, holdUp, idle, lounge, push, sad, scared, sit, walk } from "../../shared/blocky/poses";
import { CameraRig, punchFov, type Vec3 } from "../../shared/three/World";
import { BEAT, SKIES } from "../constants";
import { Classroom, Mansion, MoneyRain, Rain, Scanner, ShopDoor, Sign } from "../../shared/blocky/TownProps";

// ---------- Cast ----------
export const BOB: Look = { skin: "#f2c9a0", shirt: "#3f7fd6", pants: "#2f4b7c", shoes: "#ffffff", hair: "spiky", hairColor: "#6b3a1e", top: "hoodie", sleeves: "long", jeans: true, build: "kid" };
const RICH: Look = { skin: "#d9a066", shirt: "#3ddc84", pants: "#c8a77a", shoes: "#ff5a5f", hair: "cap", hairColor: "#d9612a", sleeves: "short", build: "kid" };
const TEACHER: Look = { skin: "#f2c9a0", shirt: "#ffffff", pants: "#4a4e69", shoes: "#1b1b1f", hair: "long", hairColor: "#2a1d17", top: "jacket", jacket: "#8e5cd9", sleeves: "long" };
const PUSHER: Look = { skin: "#c68642", shirt: "#ff8c42", pants: "#2f4b7c", shoes: "#2b2f36", hair: "curly", hairColor: "#1b1b1f", sleeves: "short", jeans: true };
const STAFF: Look = { skin: "#f2c9a0", shirt: "#2ec4b6", pants: "#5c6470", shoes: "#1b1b1f", hair: "buzz", hairColor: "#c9c4bd", top: "jacket", jacket: "#f4f4f4", sleeves: "long" };
const PUPILS: Look[] = [
  { skin: "#e0ac69", shirt: "#ffcc2e", pants: "#6b7a3a", shoes: "#d93636", hair: "spiky", hairColor: "#2a1d17", top: "hoodie", build: "kid" },
  { skin: "#f2c9a0", shirt: "#ff8fc0", pants: "#b48ae0", shoes: "#ffffff", hair: "ponytails", hairColor: "#f5d36b", sleeves: "short", build: "kid", accent: "#ff4fa3" },
  { skin: "#8d5524", shirt: "#e8e8e8", pants: "#2f4b7c", shoes: "#2b2f36", hair: "curly", hairColor: "#1b1b1f", build: "kid" },
  { skin: "#f2c9a0", shirt: "#c0392b", pants: "#3a3a3a", shoes: "#ffffff", hair: "long", hairColor: "#c98a3a", build: "kid" },
];

const useT = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  return { frame, fps, t: frame / fps, p: interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.sin) }) };
};

// ---------- 0: skyline ----------
const WALLS = ["#f4c7a1", "#f6e3b0", "#f2b5a7", "#dfe8f0", "#f7d6c0", "#e9c3d6", "#cfe3c3"];
const towers = Array.from({ length: 30 }).map((_, i) => ({
  x: (random(`dtx${i}`) - 0.5) * 130,
  z: -30 - random(`dtz${i}`) * 70,
  w: 9 + random(`dtw${i}`) * 7,
  h: 45 + Math.pow(random(`dth${i}`), 1.4) * 85,
  hue: 195 + random(`dtc${i}`) * 30,
  setbacks: random(`dts${i}`) < 0.3 ? 2 : random(`dts${i}`) < 0.5 ? 1 : 0,
  round: random(`dtr${i}`) < 0.15,
  crown: random(`dtk${i}`) < 0.1 ? "#d9b54a" : undefined,
}));

export const S0Skyline: React.FC = () => {
  const { frame, fps, p } = useT();
  const a = interpolate(p, [0, 1], [0.5, 0.25]);
  const cam: Vec3 = [Math.sin(a) * 175, interpolate(p, [0, 1], [72, 60]), Math.cos(a) * 175 + 20];
  return (
    <BlockCanvas skyTop={SKIES.storm.top} skyHorizon={SKIES.storm.horizon} fov={48}>
      <CameraRig position={cam} target={[0, 48, -30]} fov={punchFov(frame, fps, 48, 0, 6)} />
      <BlockLights sun={[60, 90, 50]} target={[0, 0, -20]} area={110} />
      <Grass size={900} />
      <Road length={240} position={[0, 0, 22]} rotationY={Math.PI / 2} width={10} sidewalk={4} />
      {Array.from({ length: 22 }).map((_, i) => (
        <Townhouse key={`a${i}`} position={[-104 + i * 9.6, 0, 36]} w={9} d={10} h={9 + (i % 3) * 3} wall={WALLS[i % WALLS.length]} />
      ))}
      {Array.from({ length: 20 }).map((_, i) => (
        <Townhouse key={`b${i}`} position={[-96 + i * 9.6, 0, 12]} w={9} d={10} h={10 + ((i + 1) % 3) * 4} wall={WALLS[(i + 3) % WALLS.length]} />
      ))}
      {towers.map((tw, i) => (
        <Tower key={i} position={[tw.x, 0, tw.z]} w={tw.w} d={tw.w} h={tw.h} hue={tw.hue} setbacks={tw.setbacks} round={tw.round} crown={tw.crown} />
      ))}
      <StormClouds y={115} area={520} z={160} count={140} />
    </BlockCanvas>
  );
};

/** Classroom shot looking at the board, with a camera move. */
/** Desks only along the sides, leaving the middle clear for standing shots. */
const SIDE_DESKS: Vec3[] = [
  [-10, 0, -3],
  [10, 0, -3],
  [-10, 0, 7],
  [10, 0, 7],
];

const ClassShot: React.FC<{ cam: Vec3; target: Vec3; children: React.ReactNode; board?: string; desks?: Vec3[] }> = ({ cam, target, children, board, desks }) => {
  const { frame, fps } = useT();
  return (
    <BlockCanvas skyTop={SKIES.indoor.top} skyHorizon={SKIES.indoor.horizon} fov={52}>
      <CameraRig position={cam} target={target} fov={punchFov(frame, fps, 52, 0, 8)} />
      <BlockLights sun={[-20, 40, 25]} target={[0, 0, 0]} area={30} sunIntensity={1.6} fill={2.1} sky="#fff7e8" ground="#c9a77a" />
      <Classroom board={board} desks={desks} />
      {children}
    </BlockCanvas>
  );
};

// ---------- 1: lowest score = bonus ----------
export const S1Bonus: React.FC = () => {
  const { t, p } = useT();
  const happy = t > BEAT.zeroPaper + 0.3;
  return (
    <ClassShot cam={[interpolate(p, [0, 1], [3, 1.5]), 5.6, interpolate(p, [0, 1], [18, 14])]} target={[0, 3.6, 2]} board={"PAYDAY FOR\nLOWEST SCORE"} desks={SIDE_DESKS}>
      <BlockCharacter look={RICH} pose={happy ? cheer(t, 1) : holdUp(t, 1)} expression={happy ? "grin" : "happy"} t={t} position={[0, 0, 4]} />
      {[-10, 10].map((x, i) => (
        <BlockCharacter key={x} look={PUPILS[i]} pose={sit(t, i + 3)} expression="shocked" t={t} seed={i + 4} position={[x, 0, 9.6]} rotationY={Math.PI + (x < 0 ? -0.6 : 0.6)} />
      ))}
      <MoneyRain t={t} from={BEAT.bonusCash - 0.3} center={[0, 0, 4]} area={14} />
    </ClassShot>
  );
};

// ---------- 2: push the PULL door ----------
export const S2Door: React.FC = () => {
  const { frame, fps, t } = useT();
  const hit = t - BEAT.doorBonk;
  const recoil = hit > 0 ? Math.exp(-hit * 4) * Math.sin(hit * 14) * 0.35 : 0;
  const walkIn = interpolate(t, [0, BEAT.doorBonk - 0.4], [0, 1], { extrapolateRight: "clamp" });
  const z = 8 - walkIn * 5.6 + (hit > 0 ? Math.min(0.6, hit * 3) : 0);
  const pose = hit < -0.4 ? walk(t * 9) : hit < 0.6 ? blend(push(t, 1), push(t, 0.3), Math.max(0, hit)) : t > BEAT.kaching ? cheer(t, 2) : idle(t, 2);
  pose.lean += recoil;
  return (
    <BlockCanvas skyTop={SKIES.day.top} skyHorizon={SKIES.day.horizon} fov={50}>
      <CameraRig position={[9 + Math.sin(t * 40) * (hit > 0 ? 0.05 * Math.exp(-hit * 5) : 0), 6, 16]} target={[0, 5, 1]} fov={punchFov(frame, fps, 50)} />
      <BlockLights sun={[-30, 60, 40]} target={[0, 0, 4]} area={30} />
      <Grass size={300} />
      <Road length={120} position={[0, 0, 20]} rotationY={Math.PI / 2} width={12} sidewalk={10} />
      <ShopDoor position={[0, 0.3, 0]} sign="SHOP" doorSign="PULL" />
      <LampPost position={[10, 0.3, 6]} />
      <BlockCharacter look={PUSHER} pose={pose} expression={hit > 0 && t < BEAT.kaching ? "shocked" : t > BEAT.kaching ? "grin" : "neutral"} t={t} position={[0, 0.3, z]} rotationY={Math.PI} />
      <MoneyRain t={t} from={BEAT.kaching - 0.2} center={[0, 0.3, 4]} area={12} count={60} height={16} />
    </BlockCanvas>
  );
};

// ---------- 3: classmate's mansion ----------
export const S3Mansion: React.FC = () => {
  const { frame, fps, t, p } = useT();
  const cam: Vec3 = [interpolate(p, [0, 1], [-30, -16]), interpolate(p, [0, 1], [26, 10]), interpolate(p, [0, 1], [52, 30])];
  return (
    <BlockCanvas skyTop={SKIES.day.top} skyHorizon={SKIES.day.horizon} fov={50}>
      <CameraRig position={cam} target={[-6, 4, 10]} fov={punchFov(frame, fps, 50)} />
      <BlockLights sun={[-30, 60, 40]} target={[0, 0, 5]} area={45} />
      <Grass size={500} />
      <Mansion />
      <BlockCharacter look={{ ...RICH, sunglasses: true }} pose={lounge(t, 1)} expression="smug" t={t} position={[-9, 1.4, 13.5]} rotationY={0} />
      <MoneyRain t={t} from={BEAT.mansion} center={[-6, 0.4, 12]} area={20} count={50} height={18} />
    </BlockCanvas>
  );
};

// ---------- 4: I'm Bob ----------
export const S4Bob: React.FC = () => {
  const { frame, fps, t, p } = useT();
  return (
    <BlockCanvas skyTop={SKIES.storm.top} skyHorizon={SKIES.storm.horizon} fov={50}>
      <CameraRig position={[interpolate(p, [0, 1], [-1, 0.5]), interpolate(p, [0, 1], [5.5, 4.8]), interpolate(p, [0, 1], [21, 15])]} target={[0, 5, 0]} fov={punchFov(frame, fps, 50)} />
      <BlockLights sun={[25, 50, 45]} target={[0, 0, 0]} area={30} />
      <Grass size={400} />
      <House position={[0, 0, -10]} w={18} d={12} h={15} siding="#cfe3c3" roof="#8a4a3a" door="#ffffff" shutters="#3f7f4a" />
      <Tree position={[-13, 0, -4]} size={1.3} />
      <StormClouds y={42} area={240} z={70} count={90} />
      <BlockCharacter look={BOB} pose={handsOnHips(t)} expression={t > 1.3 ? "smug" : "happy"} t={t} position={[0, 0, 3]} />
    </BlockCanvas>
  );
};

// ---------- 5: I get everything right ----------
export const S5Smart: React.FC = () => {
  const { t, p } = useT();
  return (
    <ClassShot cam={[interpolate(p, [0, 1], [-2, 0]), 5.4, interpolate(p, [0, 1], [16, 12.5])]} target={[0, 3.4, 3]} board="QUIZ RESULTS" desks={SIDE_DESKS}>
      <BlockCharacter look={BOB} pose={holdUp(t, 2)} expression="smug" t={t} position={[0, 0, 4]} />
    </ClassShot>
  );
};

// ---------- 6: forgot the test ----------
// Rows of desks, minus the one directly in front of Bob so the camera can get close.
const CLASS_DESKS: Vec3[] = [-7, 0, 7].flatMap((x) => [-4, 4, 12].map((z) => [x, 0, z] as Vec3)).filter(([x, , z]) => !(x === 0 && z === -4));
export const S6Forgot: React.FC = () => {
  const { t } = useT();
  // Start on the board, whip to Bob's face as he realises.
  const look = interpolate(t, [BEAT.forgot - 0.1, BEAT.forgot + 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const target: Vec3 = [0, 8 * (1 - look) + 3.4 * look, -12 * (1 - look) + 6.6 * look];
  const shocked = t > BEAT.forgot;
  return (
    <ClassShot cam={[4 - look * 2.5, 7 - look * 0.6, -4 + look * 5.5]} target={target} board="TEST TODAY!" desks={CLASS_DESKS}>
      <BlockCharacter look={BOB} pose={shocked ? blend(sit(t), headInHands(t), 0.0) : sit(t)} expression={shocked ? "scared" : "neutral"} t={t} position={[0, 0, 6.6]} rotationY={Math.PI} />
      {[[-7, 6.6], [7, 6.6], [-7, -1.4], [7, -1.4]].map(([x, z], i) => (
        <BlockCharacter key={i} look={PUPILS[i]} pose={sit(t, i)} expression="neutral" t={t} seed={i} position={[x, 0, z]} rotationY={Math.PI} />
      ))}
    </ClassShot>
  );
};

// ---------- 7: highest score ----------
export const S7Highest: React.FC = () => {
  const { t, p } = useT();
  return (
    <ClassShot cam={[interpolate(p, [0, 1], [2, 0]), 5.8, interpolate(p, [0, 1], [18, 14.5])]} target={[-1, 3.8, 3]} board={"TOP SCORE:\nBOB 100%"} desks={SIDE_DESKS}>
      <BlockCharacter look={TEACHER} pose={holdUp(t, 3)} expression="happy" t={t} seed={2} position={[-4.2, 0, 4]} rotationY={0.9} />
      <BlockCharacter look={BOB} pose={t > BEAT.hundred ? sad(t) : idle(t)} expression={t > BEAT.hundred ? "sad" : "worried"} t={t} position={[1.8, 0, 5]} rotationY={-0.5} />
    </ClassShot>
  );
};

// ---------- 8: the Dumb Centre ----------
export const S8Centre: React.FC = () => {
  const { frame, fps, t, p } = useT();
  const z = 16 - t * 3.4;
  return (
    <BlockCanvas skyTop={SKIES.storm.top} skyHorizon={SKIES.storm.horizon} fov={52}>
      <CameraRig position={[interpolate(p, [0, 1], [6, 3]), interpolate(p, [0, 1], [5, 6.5]), z + 12]} target={[0, 8, 0]} fov={punchFov(frame, fps, 52)} />
      <BlockLights sun={[25, 50, 45]} target={[0, 0, 4]} area={30} />
      <Grass size={300} />
      <Road length={120} position={[0, 0, 24]} rotationY={Math.PI / 2} width={12} sidewalk={14} />
      <ShopDoor position={[0, 0.3, 0]} sign="DUMB CENTRE" wall="#f2b5a7" open={-1.1} />
      <Sign text={"ALL DUMB\nWELCOME"} position={[-9, 4, 0.4]} size={[5, 3]} bg="#ffffff" fg="#d62828" />
      <StormClouds y={45} area={240} z={70} count={90} />
      <BlockCharacter look={BOB} pose={walk(t * 7.5)} expression="neutral" t={t} position={[0, 0.3, z]} rotationY={Math.PI} />
    </BlockCanvas>
  );
};

// ---------- 9: zero percent dumb ----------
export const S9Scan: React.FC = () => {
  const { frame, fps, t, p } = useT();
  const done = t > BEAT.zeroDumb;
  return (
    <BlockCanvas skyTop="#d8dde6" skyHorizon="#eef1f5" fov={50}>
      <CameraRig position={[interpolate(p, [0, 1], [-4, -2]), interpolate(p, [0, 1], [8, 7]), interpolate(p, [0, 1], [24, 19])]} target={[0, 8, 0]} fov={punchFov(frame, fps, 50)} />
      <BlockLights sun={[20, 40, 30]} target={[0, 0, 0]} area={25} sunIntensity={1.6} fill={2.1} sky="#ffffff" ground="#9aa3ad" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#e4e8ee" roughness={0.4} />
      </mesh>
      <mesh position={[0, 10, -8]} receiveShadow>
        <boxGeometry args={[80, 20, 0.5]} />
        <meshStandardMaterial color="#f4f6f9" roughness={0.9} />
      </mesh>
      <Sign text="DUMB-O-METER" position={[-10, 13, -7.6]} size={[9, 2.4]} bg="#ffd23f" fg="#1b1b1f" />
      <Scanner position={[0, 0, 0]} screen={done ? "0% DUMB" : t > 0.4 ? "SCANNING..." : "READY"} lit={Math.abs(Math.sin(t * 8)) * (done ? 0 : 1)} />
      <BlockCharacter look={BOB} pose={done ? sad(t) : idle(t)} expression={done ? "sad" : "worried"} t={t} position={[0, 0, 0]} />
      <BlockCharacter look={STAFF} pose={holdUp(t, 4)} expression={done ? "shocked" : "neutral"} t={t} seed={5} position={[7.5, 0, 3]} rotationY={-0.7} />
    </BlockCanvas>
  );
};

// ---------- 10: the impossible test ----------
export const S10Impossible: React.FC = () => {
  const { frame, fps, t } = useT();
  const pushT = t - BEAT.pushDoor;
  const open = pushT > 0 ? -Math.min(1.35, pushT * 2.2) : 0;
  const walkIn = interpolate(t, [0, 1.4], [0, 1], { extrapolateRight: "clamp" });
  const z = 9 - walkIn * 6 - (pushT > 0.4 ? Math.min(2, (pushT - 0.4) * 2) : 0);
  const reveal = t > BEAT.pushReveal;
  const pose = t < 1.4 ? walk(t * 8) : pushT < -0.3 ? idle(t) : pushT < 0.8 ? push(t, Math.min(1, (pushT + 0.3) * 3)) : reveal ? headInHands(t) : idle(t);
  const camT = interpolate(t, [BEAT.pushReveal - 0.2, BEAT.pushReveal + 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <BlockCanvas skyTop="#d8dde6" skyHorizon="#eef1f5" fov={50}>
      <CameraRig position={[8 - camT * 6, 6.5 - camT * 1, 17 - camT * 2]} target={[0, 5.5, 2 + camT * 2]} fov={punchFov(frame, fps, 50)} />
      <BlockLights sun={[20, 40, 30]} target={[0, 0, 2]} area={28} sunIntensity={1.7} fill={2.0} sky="#ffffff" ground="#9aa3ad" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#e4e8ee" roughness={0.4} />
      </mesh>
      <ShopDoor position={[0, 0, 0]} sign="FINAL TEST" wall="#dfe8f0" noHandle doorSign="PULL" open={open} />
      <Sign text={"NOBODY HAS\nEVER PASSED"} position={[-9.5, 5, 0.3]} size={[5.5, 3]} bg="#1b1b1f" fg="#ffd23f" />
      <BlockCharacter look={BOB} pose={pose} expression={reveal ? "shocked" : pushT > 0 ? "smug" : "neutral"} t={t} position={[0, 0, z]} rotationY={reveal ? Math.PI * 0.15 : Math.PI} />
    </BlockCanvas>
  );
};

// ---------- 11: walking home defeated, in the rain ----------
export const S11Home: React.FC = () => {
  const { frame, fps, t } = useT();
  const x = -12 + t * 3;
  const pose = blend(walk(t * 5.5), sad(t), 0.45);
  return (
    <BlockCanvas skyTop={SKIES.rain.top} skyHorizon={SKIES.rain.horizon} fov={50} exposure={0.9}>
      <CameraRig position={[x + 4, 5, 15]} target={[x + 1, 4.5, 0]} fov={punchFov(frame, fps, 50)} />
      <BlockLights sun={[20, 50, 40]} target={[x, 0, 0]} area={30} sunIntensity={0.9} fill={1.3} sky="#9aa3c0" ground="#3a4a3a" fog={{ color: "#4a4c5c", near: 30, far: 120 }} />
      <Grass size={300} />
      <Road length={200} position={[0, 0, 8]} rotationY={Math.PI / 2} width={10} sidewalk={6} />
      {Array.from({ length: 8 }).map((_, i) => (
        <Townhouse key={i} position={[-40 + i * 11, 0, -6]} w={10} d={10} h={10 + (i % 3) * 4} wall={WALLS[i % WALLS.length]} />
      ))}
      <LampPost position={[-4, 0.3, 1.5]} />
      <StormClouds y={40} area={240} z={70} count={90} color="#2a2833" />
      <Rain t={t} center={[x, 0, 4]} />
      <BlockCharacter look={BOB} pose={pose} expression="sad" t={t} position={[x, 0.3, 2.5]} rotationY={Math.PI / 2} />
    </BlockCanvas>
  );
};

// ---------- 12: the notification ----------
export const S12Phone: React.FC = () => {
  const { frame, fps, t } = useT();
  const shocked = t > BEAT.dumbest;
  const pose = t > BEAT.phone ? holdUp(t, 6) : sad(t);
  return (
    <BlockCanvas skyTop={SKIES.rain.top} skyHorizon={SKIES.rain.horizon} fov={46} exposure={0.95}>
      <CameraRig position={[2, 5.6, 11]} target={[0, 4.6, 0]} fov={punchFov(frame, fps, 46) - (shocked ? 6 : 0)} />
      <BlockLights sun={[20, 50, 40]} target={[0, 0, 0]} area={25} sunIntensity={1} fill={1.4} sky="#9aa3c0" ground="#3a4a3a" fog={{ color: "#4a4c5c", near: 30, far: 120 }} />
      <Grass size={200} />
      <Townhouse position={[-6, 0, -10]} w={10} d={10} h={14} wall="#f6e3b0" />
      <Townhouse position={[6, 0, -10]} w={10} d={10} h={11} wall="#f2b5a7" />
      <StormClouds y={40} area={200} z={70} count={80} color="#2a2833" />
      <Rain t={t} center={[0, 0, 2]} area={30} />
      <BlockCharacter look={BOB} pose={pose} expression={shocked ? "shocked" : t > BEAT.phone ? "worried" : "sad"} t={t} position={[0, 0, 0]} />
    </BlockCanvas>
  );
};

// ---------- 13: a billion dollars ----------
export const S13Billion: React.FC = () => {
  const { frame, fps, t, p } = useT();
  return (
    <BlockCanvas skyTop={SKIES.gold.top} skyHorizon={SKIES.gold.horizon} fov={52}>
      <CameraRig position={[interpolate(p, [0, 1], [4, -4]), interpolate(p, [0, 1], [6, 10]), interpolate(p, [0, 1], [27, 36])]} target={[0, 7, 6]} fov={punchFov(frame, fps, 52)} />
      <BlockLights sun={[-30, 60, 40]} target={[0, 0, 5]} area={45} sunColor="#ffe7b0" />
      <Grass size={500} />
      <Mansion position={[0, 0, -14]} scale={1.15} gold />
      <Van position={[16, 0, 8]} color="#ffd23f" rotationY={-0.6} />
      <MoneyRain t={t} from={BEAT.billion - 0.3} center={[0, 0, 12]} area={30} count={140} height={26} />
      <BlockCharacter look={{ ...BOB, sunglasses: t > BEAT.billion + 0.6 }} pose={t > BEAT.billion ? cheer(t) : scared(t)} expression={t > BEAT.billion ? "grin" : "shocked"} t={t} position={[0, 0, 13]} />
    </BlockCanvas>
  );
};
