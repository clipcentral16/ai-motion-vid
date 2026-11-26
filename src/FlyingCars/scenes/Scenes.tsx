import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BlockCharacter, plastic, rbox, type Look } from "../../shared/blocky/BlockCharacter";
import { BlockCanvas, BlockLights, Grass, House, LampPost, Road, Tower, Townhouse, Tree } from "../../shared/blocky/Environment";
import { cheer, holdUp, idle, scared, sit, walk, wave, type Pose } from "../../shared/blocky/poses";
import { Palm } from "../../shared/blocky/TownProps";
import type { Expression } from "../../shared/blocky/textures";
import { CameraRig, punchFov, type Vec3 } from "../../shared/three/World";
import { BEAT, SKIES } from "../constants";
import { Bird, Clouds, Feather, FlyingCar, Island, LandingPad, Mountain, Ocean, Parachute, PizzaBox, SkyLane, carColor, rr } from "../three/FlyingProps";

// ---------- Cast ----------
const DAD: Look = { skin: "#e0ac69", shirt: "#3a86ff", pants: "#2b2f36", shoes: "#ffffff", hair: "spiky", hairColor: "#2a1d17", top: "jacket", jacket: "#33415c", sleeves: "long", jeans: true };
const KID: Look = { skin: "#f2c9a0", shirt: "#ff5a5f", pants: "#1e2a36", shoes: "#ffffff", hair: "spiky", hairColor: "#f2d36b", top: "hoodie", sleeves: "long", jeans: true, build: "kid" };
const DRIVERS: Look[] = [
  { skin: "#8d5524", shirt: "#3ddc84", pants: "#2f4b7c", shoes: "#2b2f36", hair: "curly", hairColor: "#1b1b1f", jeans: true },
  { skin: "#f2c9a0", shirt: "#ff8fc0", pants: "#b48ae0", shoes: "#ffffff", hair: "long", hairColor: "#c98a3a", sleeves: "short" },
  { skin: "#c68642", shirt: "#ffcc2e", pants: "#6b7a3a", shoes: "#d93636", hair: "buzz", hairColor: "#1b1b1f", top: "hoodie" },
  { skin: "#f2c9a0", shirt: "#7d8591", pants: "#3a3a3a", shoes: "#ffffff", hair: "cap", hairColor: "#6b3a1e" },
];
const KIDS: Look[] = [
  { skin: "#f2c9a0", shirt: "#ff8fc0", pants: "#b48ae0", shoes: "#ffffff", hair: "ponytails", hairColor: "#f5d36b", sleeves: "short", build: "kid", accent: "#ff4fa3" },
  { skin: "#8d5524", shirt: "#ffcc2e", pants: "#2f4b7c", shoes: "#d93636", hair: "curly", hairColor: "#1b1b1f", build: "kid", jeans: true },
  { skin: "#e0ac69", shirt: "#3ddc84", pants: "#6b7a3a", shoes: "#ffffff", hair: "cap", hairColor: "#2a1d17", build: "kid" },
];

const useT = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  return { frame, fps, t: frame / fps, p: interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.sin) }) };
};
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp3 = (k: number, a: Vec3, b: Vec3): Vec3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

/** Seated driver: legs from `sit`, arms from `arms` (or hands on the wheel). */
const seated = (t: number, arms?: Pose): Pose => {
  const p = sit(t);
  if (!arms) {
    p.shoulderL = { x: -1.05, z: 0.1 };
    p.shoulderR = { x: -1.05, z: 0.1 };
    p.elbowL = { x: -0.5, z: 0 };
    p.elbowR = { x: -0.5, z: 0 };
    return p;
  }
  return { ...p, shoulderL: arms.shoulderL, shoulderR: arms.shoulderR, elbowL: arms.elbowL, elbowR: arms.elbowR, head: arms.head };
};

/** Clusters of glass towers around the origin (a city seen from above or the side). */
const City: React.FC<{ seed: string; count?: number; area?: number; z?: number; hMin?: number; hMax?: number; clearX?: number }> = ({ seed, count = 26, area = 180, z = -40, hMin = 14, hMax = 44, clearX = 0 }) => (
  <group>
    {Array.from({ length: count }).map((_, i) => {
      const x = rr(`${seed}x${i}`, -area / 2, area / 2);
      if (Math.abs(x) < clearX) return null;
      const zz = z + rr(`${seed}z${i}`, -area / 3, area / 3);
      const w = rr(`${seed}w${i}`, 9, 15);
      return <Tower key={i} position={[x, 0, zz]} w={w} d={w} h={rr(`${seed}h${i}`, hMin, hMax)} hue={rr(`${seed}c${i}`, 180, 230)} setbacks={i % 3 === 0 ? 1 : 0} />;
    })}
  </group>
);

const SkySet: React.FC<{ sky?: { top: string; horizon: string }; cam: Vec3; look: Vec3; target?: Vec3; area?: number; children: React.ReactNode; fov?: number }> = ({
  sky = SKIES.day,
  cam,
  look,
  target = [0, 0, 0],
  area = 80,
  fov = 50,
  children,
}) => {
  const { frame, fps } = useT();
  return (
    <BlockCanvas skyTop={sky.top} skyHorizon={sky.horizon} fov={fov} far={1600}>
      <CameraRig position={cam} target={look} fov={punchFov(frame, fps, fov)} />
      <BlockLights sun={[-40, 80, 50]} target={target} area={area} />
      {children}
    </BlockCanvas>
  );
};

// ---------- 0: everyone wakes up with a flying car ----------
export const S0Wake: React.FC = () => {
  const { t, p } = useT();
  const k = interpolate(t, [BEAT.flying - 0.3, BEAT.flying + 0.5], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const hover = k * 3 + (k > 0.9 ? Math.sin(t * 3) * 0.25 : 0);
  const walking = t < 1.6;
  const dx = interpolate(t, [0, 1.6], [-3, 1.5], clamp);
  const pose: Pose = walking ? walk(t * 7) : t < BEAT.flying ? idle(t) : t < BEAT.flying + 0.4 ? scared(t) : cheer(t);
  const face: Expression = t < BEAT.flying ? "neutral" : t < BEAT.flying + 0.4 ? "shocked" : "grin";
  return (
    <SkySet sky={SKIES.dawn} cam={lerp3(p, [16, 8, 32], [11, 6.5, 25])} look={[3, 3.5, -1]} target={[2, 0, -2]} area={45}>
      <Grass size={400} />
      <Road length={200} position={[0, 0, 12]} rotationY={Math.PI / 2} width={10} sidewalk={6} />
      <House position={[-6, 0, -12]} w={16} d={12} h={14} siding="#f6e3b0" roof="#5a3a2a" />
      <House position={[-36, 0, -12]} w={16} d={12} h={13} siding="#a9c8e8" />
      <House position={[26, 0, -14]} w={16} d={12} h={13} siding="#f2b5a7" roof="#3b4a5a" />
      <mesh position={[6, 0.03, -3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[7, 18]} />
        <meshStandardMaterial color="#b9b4aa" roughness={0.9} />
      </mesh>
      <Tree position={[-18, 0, -2]} size={1.2} />
      <FlyingCar position={[6, 0.3 + hover, -3]} rotationY={-0.6} glow={k} pitch={-0.05 * k} />
      {/* Neighbours' cars lifting too, further down the street */}
      <FlyingCar position={[-30, 0.3 + interpolate(t, [BEAT.flying, BEAT.flying + 0.8], [0, 7], clamp), -2]} rotationY={0.3} glow={t > BEAT.flying ? 1 : 0} color={carColor(1)} shadows={false} />
      <FlyingCar position={[34, 0.3 + interpolate(t, [BEAT.flying + 0.2, BEAT.flying + 1], [0, 9], clamp), -4]} rotationY={-0.2} glow={t > BEAT.flying + 0.2 ? 1 : 0} color={carColor(2)} shadows={false} />
      <BlockCharacter look={DAD} pose={pose} expression={face} t={t} position={[dx, 0, 2]} rotationY={walking ? Math.PI / 2 - 0.3 : 0.5} />
    </SkySet>
  );
};

// ---------- 1: 40-minute commute -> 4 minutes ----------
export const S1Commute: React.FC = () => {
  const { t } = useT();
  const x = -30 + t * 16;
  const y = 44 + Math.sin(t * 2) * 0.6;
  const arms = t > BEAT.amazing && t < BEAT.forty ? cheer(t) : t > BEAT.four ? cheer(t, 1) : undefined;
  return (
    <SkySet cam={[x + 9, y + 5, 15]} look={[x - 1, y + 1, 0]} target={[x, 0, -20]} area={140}>
      <Grass size={1200} />
      <City seed="commute" count={40} area={320} z={-40} hMin={12} hMax={36} />
      <Clouds seed="c1" y={75} z={-120} count={12} area={400} />
      <FlyingCar position={[x, y, 0]} rotationY={Math.PI / 2} roll={Math.sin(t * 2.4) * 0.08} driver={DAD} pose={seated(t, arms)} expression={arms ? "grin" : "happy"} t={t} />
    </SkySet>
  );
};

// ---------- 2: a billion cars all want the sky ----------
const RISERS = Array.from({ length: 34 }).map((_, i) => ({
  x: rr(`bx${i}`, -70, 70),
  z: rr(`bz${i}`, -50, 30),
  y: rr(`by${i}`, 14, 50),
  at: rr(`ba${i}`, 0.2, 3.0),
  rot: rr(`br${i}`, 0, Math.PI * 2),
}));
export const S2Billion: React.FC = () => {
  const { t } = useT();
  const up = interpolate(t, [BEAT.sky - 0.6, BEAT.sky + 0.6], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  return (
    <SkySet sky={SKIES.busy} cam={lerp3(up, [0, 16, 100], [0, 30, 95])} look={lerp3(up, [0, 12, 0], [0, 40, 0])} target={[0, 0, -10]} area={130}>
      <Grass size={1200} />
      <City seed="billion" count={22} area={220} z={-70} hMin={16} hMax={40} />
      {RISERS.map((r, i) => {
        const k = interpolate(t, [r.at, r.at + 1.2], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        return <FlyingCar key={i} position={[r.x + Math.sin(t + i) * 0.8 * k, 0.3 + k * r.y, r.z]} rotationY={r.rot + t * 0.2 * k} glow={t > r.at ? 1 : 0} color={carColor(i)} shadows={false} />;
      })}
    </SkySet>
  );
};

// ---------- 3: traffic jam in three dimensions ----------
const JAM = Array.from({ length: 30 }).map((_, i) => ({ layer: i % 3, lane: Math.floor(i / 3) % 2, slot: Math.floor(i / 6) }));
export const S3Jam: React.FC = () => {
  const { t } = useT();
  const rise = interpolate(t, [BEAT.three - 0.3, BEAT.three + 0.8], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  return (
    <SkySet sky={SKIES.busy} cam={lerp3(rise, [12, 25, 24], [22, 30, 44])} look={lerp3(rise, [0, 24, 0], [0, 27, -4])} target={[0, 20, -6]} area={60}>
      <Grass size={1200} />
      <City seed="jam" count={18} area={200} z={-60} hMin={20} hMax={50} clearX={0} />
      {JAM.map((c, i) => {
        const creep = Math.max(0, Math.sin(t * 1.3 + c.slot)) * 0.4;
        const pos: Vec3 = [-24 + c.slot * 10 + creep + c.layer * 3, 16 + c.layer * 8 + Math.sin(t * 2 + i) * 0.2, -c.lane * 7];
        const near = c.lane === 0 && c.slot >= 2 && c.slot <= 3;
        return (
          <FlyingCar
            key={i}
            position={pos}
            rotationY={Math.PI / 2}
            color={carColor(i + 3)}
            shadows={false}
            driver={near ? DRIVERS[i % DRIVERS.length] : undefined}
            pose={near ? seated(t, i % 2 ? scared(t, i) : undefined) : undefined}
            expression="angry"
            t={t}
            seed={i}
          />
        );
      })}
    </SkySet>
  );
};

// ---------- 4: sky lanes at different heights ----------
const LANES = [
  { y: 16, z: 0, color: "#4fe3ff", dir: 1 as const, label: "100 m" },
  { y: 28, z: -6, color: "#ff5ad1", dir: -1 as const, label: "200 m" },
  { y: 40, z: -12, color: "#ffd23f", dir: 1 as const, label: "300 m" },
];
export const S4Lanes: React.FC = () => {
  const { t, p } = useT();
  return (
    <SkySet cam={lerp3(p, [-6, 30, 62], [4, 32, 54])} look={[0, 27, -6]} target={[0, 20, -6]} area={90}>
      <Grass size={1200} />
      <City seed="lanes" count={20} area={220} z={-70} hMin={18} hMax={48} />
      {LANES.map((l, i) => {
        const on = interpolate(t, [BEAT.lanes - 0.4 + i * 0.25, BEAT.lanes + 0.2 + i * 0.25], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        const labelOn = t > BEAT.heights - 0.6 + i * 0.15;
        return (
          <group key={i}>
            <SkyLane y={l.y} z={l.z} color={l.color} dir={l.dir} t={t} on={on} label={labelOn ? l.label : undefined} labelX={-16 + i * 4} />
            {on >= 1
              ? [0, 1, 2, 3].map((k) => {
                  const x = ((((k * 28 + l.dir * (t - BEAT.lanes) * 26 + i * 9) % 112) + 112) % 112) - 56;
                  return <FlyingCar key={k} position={[x, l.y - 0.5, l.z]} rotationY={l.dir * (Math.PI / 2)} color={carColor(i * 4 + k)} shadows={false} />;
                })
              : null}
          </group>
        );
      })}
    </SkySet>
  );
};

// ---------- 5: dead battery -> parachute ----------
export const S5Parachute: React.FC = () => {
  const { t } = useT();
  const CHUTE = BEAT.parachute - 0.55;
  const x = -6 + Math.min(t, BEAT.brick) * 4;
  const dead = t > BEAT.dead;
  const glow = !dead ? 1 : t < BEAT.brick ? (Math.sin(t * 40) > 0 ? 0.6 : 0) * (1 - (t - BEAT.dead) / (BEAT.brick - BEAT.dead)) : 0;
  const fallT = Math.max(0, Math.min(t, CHUTE) - BEAT.brick);
  const yFall = 0.5 * 13 * fallT * fallT;
  const slowT = Math.max(0, t - CHUTE);
  const y = 40 - yFall - slowT * 2.2 + (dead && t < BEAT.brick ? -Math.sin((t - BEAT.dead) * 20) * 0.15 : 0);
  const open = interpolate(t, [CHUTE, CHUTE + 0.35], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const sway = open > 0 ? Math.sin(slowT * 3) * 0.12 * Math.exp(-slowT * 0.5) : 0;
  const pitch = t > BEAT.brick ? interpolate(t, [BEAT.brick, CHUTE, CHUTE + 0.6], [0, 0.35, 0], clamp) : 0;
  const face: Expression = !dead ? "happy" : t < CHUTE + 0.3 ? "shocked" : "grin";
  const arms = t > BEAT.brick && t < CHUTE + 0.3 ? scared(t) : t > CHUTE + 0.5 ? cheer(t) : undefined;
  return (
    <SkySet cam={[x + 4, y + 6, 24]} look={[x, y + 2.5, 0]} target={[x, 0, -20]} area={120}>
      <Grass size={1200} />
      <City seed="para" count={30} area={260} z={-50} hMin={16} hMax={42} />
      <Clouds seed="c5" y={60} z={-110} count={10} area={300} />
      <group position={[x, y, 0]} rotation={[0, 0, sway]}>
        <FlyingCar position={[0, 0, 0]} rotationY={Math.PI / 2} pitch={pitch} glow={glow} color="#06d6a0" driver={DAD} pose={seated(t, arms)} expression={face} t={t} />
        <Parachute position={[0, 2.6, 0]} open={open} />
      </group>
    </SkySet>
  );
};

// ---------- 6: birds' worst year ----------
const FLOCK = Array.from({ length: 9 }).map((_, i) => ({ x: rr(`fx${i}`, -14, 10), y: rr(`fy${i}`, -3, 4), z: rr(`fz${i}`, -6, 3), a: rr(`fa${i}`, 0, Math.PI * 2) }));
export const S6Birds: React.FC = () => {
  const { t } = useT();
  const HIT = 0.75;
  const carX = 18 - t * 18;
  const s = Math.max(0, t - HIT);
  return (
    <SkySet cam={[0, 32, 22]} look={[-1, 30, 0]} target={[0, 20, 0]} area={60}>
      <Grass size={1200} />
      <City seed="birds" count={16} area={200} z={-70} hMin={16} hMax={36} />
      <Clouds seed="c6" y={50} z={-90} count={10} area={260} />
      {FLOCK.map((b, i) => {
        const bx = b.x + t * 3 + Math.cos(b.a) * s * 12;
        const by = 30 + b.y + Math.sin(b.a) * s * 8 + (s > 0 ? Math.sin(s * 6 + i) * 0.4 : Math.sin(t * 3 + i) * 0.4);
        const bz = b.z + (s > 0 ? Math.sin(b.a * 3) * s * 6 : 0);
        return <Bird key={i} position={[bx, by, bz]} t={t} rotationY={Math.PI / 2 + (s > 0 ? b.a : 0)} panic={s > 0} seed={i} color={i % 3 === 0 ? "#9aa3ad" : "#f2f2f2"} />;
      })}
      {/* The unlucky one: spins in place right in front of the camera */}
      <Bird position={[1.5, 30 + (s > 0 ? -s * 0.5 : 0), 5]} t={t} rotationY={s > 0 ? Math.PI * 0.15 + s * 9 * Math.exp(-s * 2) : Math.PI / 2} panic={s > 0} scale={1.2} seed={7} />
      {s > 0 ? Array.from({ length: 7 }).map((_, i) => <Feather key={i} position={[1.5 + (i - 3) * 0.7, 31.5 + (i % 3) * 0.6, 5]} t={s} seed={i} />) : null}
      <FlyingCar position={[carX, 30.5, 2]} rotationY={-Math.PI / 2} color="#fb5607" driver={DRIVERS[2]} pose={seated(t)} expression="grin" t={t} shadows={false} />
    </SkySet>
  );
};

// ---------- 7: empty roads become parks ----------
export const S7Parks: React.FC = () => {
  const { frame, fps, t, p } = useT();
  const pf = Math.round(BEAT.parks * fps) - 6;
  const grow = spring({ frame: frame - pf, fps, config: { damping: 14, stiffness: 90 } });
  return (
    <SkySet cam={lerp3(p, [-4, 14, 40], [2, 12, 32])} look={[0, 4, 4]} target={[0, 0, 4]} area={50}>
      <Grass size={400} />
      <Road length={200} position={[0, 0, 8]} rotationY={Math.PI / 2} width={10} sidewalk={6} />
      {/* Park grass rolling out over the road */}
      {grow > 0.01 ? (
        <mesh position={[0, 0.36, 8]} rotation={[-Math.PI / 2, 0, 0]} scale={[grow, 1, 1]} receiveShadow>
          <planeGeometry args={[120, 10.5]} />
          <meshStandardMaterial color="#5fbf4a" roughness={0.9} />
        </mesh>
      ) : null}
      {Array.from({ length: 8 }).map((_, i) => (
        <Townhouse key={i} position={[-44 + i * 11, 0, -6]} w={10} d={10} h={10 + (i % 3) * 4} wall={["#f4c7a1", "#f6e3b0", "#dfe8f0", "#e9c3d6"][i % 4]} />
      ))}
      <LampPost position={[14, 0.3, 1.5]} />
      {[-16, -6, 6, 16].map((x, i) => {
        const g = spring({ frame: frame - pf - 4 - i * 3, fps, config: { damping: 9, stiffness: 140 } });
        return g > 0.01 ? (
          <group key={i} position={[x, 0.35, 8 + (i % 2 ? 2.5 : -2.5)]} scale={g}>
            <Tree position={[0, 0, 0]} size={0.8} />
          </group>
        ) : null;
      })}
      {grow > 0.3
        ? KIDS.map((k, i) => (
            <BlockCharacter key={i} look={k} pose={cheer(t, i)} expression="grin" t={t} seed={i} position={[-8 + i * 7, 0.35, 9 + (i % 2) * 1.5]} rotationY={0.2 * (1 - i)} />
          ))
        : null}
      {/* Traffic moved upstairs */}
      {[0, 1, 2].map((k) => (
        <FlyingCar key={k} position={[-40 + ((t * 20 + k * 30) % 90), 24, -14]} rotationY={Math.PI / 2} color={carColor(k + 5)} shadows={false} />
      ))}
    </SkySet>
  );
};

// ---------- 8: move to mountains and islands ----------
export const S8Move: React.FC = () => {
  const { t } = useT();
  const k = interpolate(t, [0.4, BEAT.islands + 0.6], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const carPos: Vec3 = [-22 + 42 * k, 40 + Math.sin(k * Math.PI) * 5 - 30 * k, -22 + 14 * k];
  const lookK = interpolate(t, [BEAT.mountains - 0.4, BEAT.islands], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  return (
    <SkySet sky={SKIES.ocean} cam={lerp3(lookK, [-8, 30, 34], [12, 16, 26])} look={lerp3(lookK, [-28, 28, -32], [22, 5, -10])} target={[0, 0, -20]} area={110}>
      <Ocean />
      <Clouds seed="c8" y={70} z={-160} count={10} area={360} />
      <Mountain position={[-30, 0, -32]} h={36} r={24} />
      <Mountain position={[-80, 0, -80]} h={50} r={34} />
      <mesh position={[-30, 36.5, -32]}>
        <cylinderGeometry args={[6.5, 6.5, 1, 7]} />
        <meshStandardMaterial color="#f4f7fb" roughness={0.9} flatShading />
      </mesh>
      <group position={[-30, 37, -32]} scale={0.38}>
        <House position={[0, 0, 0]} w={16} d={12} h={13} siding="#8a5a3a" roof="#3b2a22" />
      </group>
      <Island position={[22, 0, -10]} r={10} />
      <Palm position={[27, 1.1, -13]} size={0.8} />
      <group position={[18, 1.1, -11]} scale={0.4}>
        <House position={[0, 0, 0]} w={16} d={12} h={13} siding="#ffffff" roof="#2a9df4" />
      </group>
      <FlyingCar position={carPos} rotationY={Math.PI / 2 - 0.3} roll={-0.1} driver={DRIVERS[1]} pose={seated(t, t > BEAT.islands ? cheer(t) : undefined)} expression="grin" t={t} color="#ffbe0b" />
    </SkySet>
  );
};

// ---------- 9: your roof is your driveway ----------
export const S9Roof: React.FC = () => {
  const { t, p } = useT();
  const ROOF = 12;
  const k = interpolate(t, [0, BEAT.driveway + 0.1], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const car: Vec3 = [interpolate(k, [0, 1], [-26, 0]), interpolate(k, [0, 1], [30, ROOF + 0.4]), -6];
  const landed = k > 0.98;
  return (
    <SkySet cam={lerp3(p, [20, 24, 34], [15, 20, 28])} look={[0, 11, -6]} target={[0, 0, -6]} area={45}>
      <Grass size={400} />
      <Road length={200} position={[0, 0, 14]} rotationY={Math.PI / 2} width={10} sidewalk={6} />
      {/* Flat-roof modern house */}
      <mesh geometry={rbox(18, ROOF, 14, 0.3)} material={plastic("#f2efe8", 0.7)} position={[0, ROOF / 2, -6]} castShadow receiveShadow />
      <mesh geometry={rbox(19, 0.5, 15, 0.2)} material={plastic("#3b4a5a", 0.6)} position={[0, ROOF, -6]} castShadow />
      {[-5.5, 5.5].map((x) =>
        [3.5, 8.5].map((y) => (
          <mesh key={`${x}${y}`} geometry={rbox(4, 2.8, 0.3, 0.1)} material={plastic("#7cc6ff", 0.1)} position={[x, y, 1.05]} />
        )),
      )}
      <mesh geometry={rbox(3, 5, 0.3, 0.1)} material={plastic("#e07a3f", 0.5)} position={[0, 2.5, 1.05]} />
      <LandingPad position={[0, ROOF + 0.3, -6]} r={6} lit={landed ? 0.8 : 0.3} />
      <Tree position={[-15, 0, -2]} size={1.1} />
      <House position={[-36, 0, -10]} w={16} d={12} h={13} siding="#a9c8e8" />
      <FlyingCar position={car} rotationY={Math.PI / 2 - (1 - k) * 0.4} glow={landed ? interpolate(t, [BEAT.driveway + 0.1, BEAT.driveway + 0.6], [1, 0.2], clamp) : 1} driver={DAD} pose={seated(t, landed ? wave(t) : undefined)} expression="grin" t={t} color="#3a86ff" />
    </SkySet>
  );
};

// ---------- 10: pizza in ninety seconds ----------
export const S10Pizza: React.FC = () => {
  const { t, p } = useT();
  const ARRIVE = 1.0;
  const HAND = 1.35;
  const LEAVE = 2.5;
  const cx = t < ARRIVE ? interpolate(t, [0, ARRIVE], [44, 5], { easing: Easing.out(Easing.cubic) }) : t < LEAVE ? 5 : 5 + (t - LEAVE) ** 2 * 60;
  const cy = 3.2 + (t > LEAVE ? (t - LEAVE) ** 2 * 30 : Math.sin(t * 3) * 0.2);
  const fly = interpolate(t, [HAND - 0.25, HAND], [0, 1], clamp);
  const boxPos: Vec3 = t < HAND - 0.25 ? [cx - 1.5, cy + 2.6, 2] : t < HAND ? [interpolate(fly, [0, 1], [3.5, 0.5]), cy + 2.6 + Math.sin(fly * Math.PI) * 1.5 - fly * 1.2, 2.5] : [0.4, 3.85 + (t > BEAT.ninety ? Math.abs(Math.sin(t * 6)) * 0.3 : 0), 3.6];
  const has = t >= HAND;
  const pose: Pose = has ? holdUp(t) : t > 0.6 ? wave(t) : idle(t);
  return (
    <SkySet cam={lerp3(p, [6, 7.5, 30], [4, 7, 25])} look={[2, 4, 1]} target={[0, 0, 0]} area={40}>
      <Grass size={400} />
      <Road length={200} position={[0, 0, 12]} rotationY={Math.PI / 2} width={10} sidewalk={6} />
      <House position={[-2, 0, -12]} w={16} d={12} h={14} siding="#cfe3c3" roof="#7a2a2a" />
      <Tree position={[-14, 0, -2]} size={1.1} />
      <BlockCharacter look={KID} pose={pose} expression={has ? "grin" : "happy"} t={t} position={[-1.2, 0, 2.5]} rotationY={0.5} />
      <PizzaBox position={boxPos} scale={0.9} />
      <FlyingCar position={[cx, cy, 2]} rotationY={-Math.PI / 2} color="#c0262d" sign="PIZZA" driver={DRIVERS[3]} pose={seated(t, t > HAND - 0.4 && t < LEAVE ? wave(t) : undefined)} expression="grin" t={t} />
    </SkySet>
  );
};

// ---------- 11: would you take the flying car? ----------
export const S11Outro: React.FC = () => {
  const { t, p } = useT();
  const GO = BEAT.car + 0.25;
  const g = Math.max(0, t - GO);
  const pos: Vec3 = [0, 3 + Math.sin(t * 2.5) * 0.3 + g * g * 9, -g * g * 12];
  return (
    <SkySet sky={SKIES.sunset} cam={lerp3(p, [3, 7, 22], [2, 9, 20])} look={[0, 5 + Math.min(pos[1] - 3, 12), -4 + pos[2] * 0.5]} target={[0, 0, -4]} area={50}>
      <Grass size={600} />
      <Road length={200} position={[0, 0, 4]} rotationY={Math.PI / 2} width={10} sidewalk={6} />
      {Array.from({ length: 9 }).map((_, i) => (
        <Townhouse key={i} position={[-44 + i * 11, 0, -16]} w={10} d={10} h={10 + (i % 3) * 4} wall={["#f4c7a1", "#f6e3b0", "#f2b5a7", "#dfe8f0"][i % 4]} />
      ))}
      <SkyLane y={30} z={-26} color="#ffd23f" dir={1} t={t} />
      <SkyLane y={40} z={-34} color="#4fe3ff" dir={-1} t={t} />
      {[0, 1, 2, 3].map((k) => (
        <FlyingCar key={k} position={[-50 + ((t * 18 + k * 26) % 100), 29.5, -26]} rotationY={Math.PI / 2} color={carColor(k + 2)} shadows={false} />
      ))}
      {[0, 1, 2].map((k) => (
        <FlyingCar key={`b${k}`} position={[50 - ((t * 16 + k * 33) % 100), 39.5, -34]} rotationY={-Math.PI / 2} color={carColor(k + 6)} shadows={false} />
      ))}
      <FlyingCar position={pos} rotationY={-0.25} pitch={-Math.min(0.4, g * 0.6)} color="#3a86ff" driver={KID} pose={seated(t, t > BEAT.would - 0.2 ? wave(t) : undefined)} expression="grin" t={t} />
    </SkySet>
  );
};
