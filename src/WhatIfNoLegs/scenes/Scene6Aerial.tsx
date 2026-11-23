import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { BUILDING_COLORS, SHIRT_COLORS, SKIN_COLORS } from "../constants";
import { Character } from "../three/Character";
import { geo, mat } from "../three/materials";
import { BOARD_DECK_Y, Building, CHAIR_SEAT_Y, Cloud, OfficeChair, Skateboard, Tree } from "../three/Props";
import { SceneCanvas } from "../three/SceneCanvas";
import { CameraRig, Lights, type Vec3 } from "../three/World";
import { wrap } from "./walkers";

const BLOCK = 12; // block size
const ROAD = 6; // road width
const PITCH = BLOCK + ROAD;
const N = 3; // blocks from centre each way → 7×7 grid
const EXTENT = (N + 0.5) * PITCH;

type Lot = { x: number; z: number; w: number; d: number; h: number; color: string; park: boolean };

const lots: Lot[] = [];
for (let bx = -N; bx <= N; bx++) {
  for (let bz = -N; bz <= N; bz++) {
    const cx = bx * PITCH + PITCH / 2;
    const cz = bz * PITCH + PITCH / 2;
    const park = random(`park${bx}${bz}`) < 0.15;
    for (let i = 0; i < 4; i++) {
      const ox = (i % 2 ? 1 : -1) * BLOCK / 4;
      const oz = (i < 2 ? 1 : -1) * BLOCK / 4;
      const r = (k: string) => random(`lot${k}${bx}${bz}${i}`);
      lots.push({
        x: cx + ox,
        z: cz + oz,
        w: BLOCK / 2 - 1 - r("w") * 0.8,
        d: BLOCK / 2 - 1 - r("d") * 0.8,
        h: 4 + Math.pow(r("h"), 2) * 26,
        color: BUILDING_COLORS[Math.floor(r("c") * BUILDING_COLORS.length)],
        park,
      });
    }
  }
}

// Riders roll along the roads (x = const or z = const lines at multiples of PITCH).
const riders = Array.from({ length: 140 }).map((_, i) => {
  const r = (k: string) => random(`s6-${k}-${i}`);
  const alongX = r("a") < 0.5;
  const line = (Math.floor(r("l") * (2 * N + 2)) - N) * PITCH;
  const dir = r("dir") < 0.5 ? 1 : -1;
  return {
    alongX,
    lane: line + dir * (1 + r("lane") * 1.3),
    s0: -EXTENT + r("s") * 2 * EXTENT,
    dir,
    speed: 2.5 + r("v") * 3,
    chair: r("chair") < 0.35,
    color: SHIRT_COLORS[Math.floor(r("c") * SHIRT_COLORS.length)],
    skin: SKIN_COLORS[Math.floor(r("k") * SKIN_COLORS.length)],
    board: SHIRT_COLORS[Math.floor(r("b") * SHIRT_COLORS.length)],
  };
});

// 6. Pull way out over the whole city full of rolling characters.
export const Scene6Aerial: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0, 5.2 * fps], [0, 1], { easing: Easing.inOut(Easing.cubic), extrapolateRight: "clamp" });
  const drift = t * 0.04;

  const cam: Vec3 = [
    // Stay over the x=0 road while low, only swing sideways once above the roofs.
    interpolate(p, [0, 0.45, 1], [2, 2.5, 26]) + Math.sin(drift) * 4,
    interpolate(p, [0, 0.45, 1], [2.4, 34, 70]),
    interpolate(p, [0, 0.45, 1], [9, 26, 56]),
  ];
  const target: Vec3 = [interpolate(p, [0, 1], [0, -2]), interpolate(p, [0, 1], [1.4, 0]), interpolate(p, [0, 1], [-2, -10])];

  return (
    <SceneCanvas far={600}>
      <CameraRig position={cam} target={target} fov={64} />
      <Lights fogNear={90} fogFar={260} />
      <mesh geometry={geo.plane} material={mat("#7ccf5b")} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} scale={[600, 600, 1]} />
      <mesh geometry={geo.box} material={mat("#4a4e69")} position={[0, -0.03, 0]} scale={[EXTENT * 2 + ROAD, 0.04, EXTENT * 2 + ROAD]} />
      {Array.from({ length: (2 * N + 1) ** 2 }).map((_, i) => {
        const bx = (i % (2 * N + 1)) - N;
        const bz = Math.floor(i / (2 * N + 1)) - N;
        const park = random(`park${bx}${bz}`) < 0.15;
        return (
          <mesh
            key={`b${i}`}
            geometry={geo.box}
            material={mat(park ? "#5cb85c" : "#d9d4cc")}
            position={[bx * PITCH + PITCH / 2, 0.08, bz * PITCH + PITCH / 2]}
            scale={[BLOCK, 0.16, BLOCK]}
          />
        );
      })}
      {lots.map((l, i) =>
        l.park ? (
          <Tree key={i} position={[l.x, 0.16, l.z]} size={1.6} color={i % 2 ? "#2bb673" : "#3ddc84"} />
        ) : (
          <Building key={i} position={[l.x, 0.16, l.z]} size={[l.w, l.h, l.d]} color={l.color} floorHeight={2} />
        ),
      )}
      {Array.from({ length: 8 }).map((_, i) => (
        <Cloud key={`cl${i}`} seed={i + 40} position={[-80 + i * 25, 55 + random(`s6cy${i}`) * 15, -90 + random(`s6cz${i}`) * 60]} size={5} />
      ))}
      {riders.map((r, i) => {
        const s = wrap(r.s0 + r.dir * r.speed * t, -EXTENT, EXTENT);
        const pos: Vec3 = r.alongX ? [s, 0, r.lane] : [r.lane, 0, s];
        const yaw = r.alongX ? (r.dir === 1 ? Math.PI / 2 : -Math.PI / 2) : r.dir === 1 ? 0 : Math.PI;
        return (
          <group key={i} position={pos} rotation={[0, yaw, 0]} scale={1.25}>
            {r.chair ? <OfficeChair color={r.board} /> : <Skateboard color={r.board} />}
            <Character
              position={[0, r.chair ? CHAIR_SEAT_Y : BOARD_DECK_Y, 0]}
              color={r.color}
              skin={r.skin}
              legs={0}
              shadow={false}
              armSwing={Math.sin(t * 7 + i) * 0.6}
              armsUp={i % 4 === 0 ? 0.9 : 0}
            />
          </group>
        );
      })}
    </SceneCanvas>
  );
};
