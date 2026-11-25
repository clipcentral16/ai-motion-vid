import * as THREE from "three";
import { useMemo } from "react";
import { AbsoluteFill, random, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { plastic, rbox } from "./BlockCharacter";
import { brickTexture, facadeTexture, glassTexture, grassTexture, pavingTexture, roadTexture, sidingTexture } from "./textures";

type V3 = [number, number, number];

// ---------- Canvas + lighting ----------

/** Shadow-casting canvas with filmic tone mapping over a CSS sky gradient. */
export const BlockCanvas: React.FC<{
  children: React.ReactNode;
  skyTop: string;
  skyHorizon: string;
  fov?: number;
  far?: number;
  exposure?: number;
}> = ({ children, skyTop, skyHorizon, fov = 50, far = 1200, exposure = 1.05 }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${skyTop} 0%, ${skyHorizon} 70%)` }}>
      <ThreeCanvas
        width={width}
        height={height}
        shadows="soft"
        camera={{ fov, near: 0.3, far, position: [0, 10, 30] }}
        gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: exposure }}
      >
        {children}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

/** Sky/ground fill plus a shadow-casting sun aimed at `target`, covering `area` studs. */
export const BlockLights: React.FC<{
  sun?: V3;
  target?: V3;
  area?: number;
  sunColor?: string;
  sunIntensity?: number;
  sky?: string;
  ground?: string;
  fill?: number;
  fog?: { color: string; near: number; far: number };
}> = ({ sun = [40, 60, 30], target = [0, 0, 0], area = 60, sunColor = "#fff4e2", sunIntensity = 2.6, sky = "#cfe8ff", ground = "#5b8f3c", fill = 1.3, fog }) => {
  const light = useMemo(() => new THREE.DirectionalLight(), []);
  light.position.set(target[0] + sun[0], target[1] + sun[1], target[2] + sun[2]);
  light.target.position.set(...target);
  light.target.updateMatrixWorld();
  light.color.set(sunColor);
  light.intensity = sunIntensity;
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  const cam = light.shadow.camera;
  cam.left = -area;
  cam.right = area;
  cam.top = area;
  cam.bottom = -area;
  cam.near = 1;
  cam.far = 400;
  cam.updateProjectionMatrix();
  light.shadow.bias = -0.0004;
  light.shadow.normalBias = 0.05;
  light.shadow.radius = 4;
  return (
    <>
      {fog ? <fog attach="fog" args={[fog.color, fog.near, fog.far]} /> : null}
      <hemisphereLight args={[sky, ground, fill]} />
      <primitive object={light} />
      <primitive object={light.target} />
    </>
  );
};

// ---------- Ground ----------

export const Grass: React.FC<{ size?: number; position?: V3 }> = ({ size = 600, position = [0, 0, 0] }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={position} receiveShadow>
    <planeGeometry args={[size, size]} />
    <meshStandardMaterial map={grassTexture([size / 12, size / 12])} roughness={0.95} />
  </mesh>
);

/** Road strip running along Z, with paving sidewalks on both sides. */
export const Road: React.FC<{ length: number; position?: V3; rotationY?: number; width?: number; sidewalk?: number }> = ({
  length,
  position = [0, 0, 0],
  rotationY = 0,
  width = 14,
  sidewalk = 6,
}) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
      <planeGeometry args={[width, length]} />
      <meshStandardMaterial map={roadTexture([1, length / width])} roughness={0.9} />
    </mesh>
    {[-1, 1].map((s) => (
      <group key={s}>
        <mesh position={[s * (width / 2 + sidewalk / 2), 0.15, 0]} receiveShadow castShadow>
          <boxGeometry args={[sidewalk, 0.3, length]} />
          <meshStandardMaterial map={pavingTexture([sidewalk / 4, length / 4])} roughness={0.9} />
        </mesh>
        <mesh position={[s * (width / 2 + 0.15), 0.17, 0]} receiveShadow>
          <boxGeometry args={[0.3, 0.34, length]} />
          <meshStandardMaterial color="#c9c4bd" roughness={0.9} />
        </mesh>
      </group>
    ))}
  </group>
);

// ---------- Buildings ----------

/** Triangular gable roof prism spanning `w` (X) by `d` (Z), height `h`. */
const gable = (w: number, h: number, d: number) => {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(w / 2, 0);
  shape.lineTo(0, h);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
  g.translate(0, 0, -d / 2);
  return g;
};

/** Detailed suburban house: siding, trim, gable roof, door with frame, shuttered windows. */
export const House: React.FC<{ position?: V3; rotationY?: number; siding?: string; roof?: string; door?: string; shutters?: string; w?: number; d?: number; h?: number }> = ({
  position = [0, 0, 0],
  rotationY = 0,
  siding = "#a9c8e8",
  roof = "#b4553b",
  door = "#f2d27a",
  shutters = "#2e6f9e",
  w = 16,
  d = 12,
  h = 14,
}) => {
  const roofGeo = useMemo(() => gable(w + 1.6, 5, d + 1.6), [w, d]);
  const trim = plastic("#f4f1ea", 0.6);
  const glass = plastic("#59b8f0", 0.2);
  const win = (x: number, y: number) => (
    <group position={[x, y, d / 2 + 0.05]}>
      <mesh geometry={rbox(3.2, 3.6, 0.3, 0.05)} material={trim} castShadow />
      <mesh geometry={rbox(2.6, 3.0, 0.32, 0.03)} material={glass} />
      <mesh geometry={rbox(0.18, 3.0, 0.36, 0.02)} material={trim} />
      <mesh geometry={rbox(2.6, 0.18, 0.36, 0.02)} material={trim} />
      <mesh geometry={rbox(3.6, 0.3, 0.6, 0.05)} material={trim} position={[0, -1.9, 0.15]} castShadow />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={rbox(1.1, 3.6, 0.2, 0.05)} material={plastic(shutters, 0.6)} position={[s * 2.25, 0, 0]} castShadow />
      ))}
    </group>
  );
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial map={sidingTexture(siding, [w / 6, h / 4])} roughness={0.8} />
      </mesh>
      {/* Corner and floor trim */}
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={rbox(0.6, h, 0.6, 0.05)} material={trim} position={[s * (w / 2), h / 2, d / 2]} castShadow />
      ))}
      <mesh geometry={rbox(w + 0.6, 0.5, 0.5, 0.05)} material={trim} position={[0, h * 0.52, d / 2 + 0.1]} castShadow />
      <mesh geometry={rbox(w + 0.8, 0.6, d + 0.8, 0.05)} material={plastic("#e9e5dc", 0.8)} position={[0, 0.3, 0]} receiveShadow />
      {/* Roof */}
      <mesh geometry={roofGeo} material={plastic(roof, 0.75)} position={[0, h, 0]} castShadow receiveShadow />
      <mesh geometry={rbox(w + 2, 0.4, d + 2, 0.05)} material={plastic(roof, 0.75)} position={[0, h, 0]} castShadow />
      {/* Door */}
      <group position={[0, 0, d / 2 + 0.05]}>
        <mesh geometry={rbox(4.0, 6.6, 0.35, 0.05)} material={trim} position={[0, 3.3, 0]} castShadow />
        <mesh geometry={rbox(3.0, 5.9, 0.4, 0.05)} material={plastic(door, 0.5)} position={[0, 3.05, 0]} />
        <mesh geometry={rbox(2.0, 1.8, 0.45, 0.05)} material={plastic(door, 0.65)} position={[0, 4.2, 0.02]} />
        <mesh geometry={rbox(0.3, 0.3, 0.6, 0.1)} material={plastic("#c9a227", 0.3)} position={[1.0, 3.0, 0.1]} />
        <mesh geometry={rbox(6, 0.5, 2.2, 0.05)} material={plastic("#d9d4cb", 0.85)} position={[0, 0.25, 1.1]} receiveShadow castShadow />
      </group>
      {win(-4.8, h * 0.76)}
      {win(4.8, h * 0.76)}
      {win(-4.8, h * 0.27)}
    </group>
  );
};

/** Brick neighbour wall section. */
export const BrickWing: React.FC<{ position?: V3; w?: number; h?: number; d?: number; roof?: string }> = ({ position = [0, 0, 0], w = 10, h = 11, d = 10, roof = "#8a3b2a" }) => {
  const roofGeo = useMemo(() => gable(w + 1, 3.5, d + 1), [w, d]);
  return (
    <group position={position}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial map={brickTexture([w / 4, h / 4])} roughness={0.9} />
      </mesh>
      <mesh geometry={roofGeo} material={plastic(roof, 0.75)} position={[0, h, 0]} castShadow />
    </group>
  );
};

/** Row townhouse with a facade texture and a pitched red roof. */
export const Townhouse: React.FC<{ position: V3; w: number; d: number; h: number; wall: string; roof?: string; rotationY?: number }> = ({
  position,
  w,
  d,
  h,
  wall,
  roof = "#b9553a",
  rotationY = 0,
}) => {
  const roofGeo = useMemo(() => gable(w + 0.6, Math.min(4, w * 0.4), d + 0.6), [w, d]);
  const floors = Math.max(1, Math.round(h / 4));
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial map={facadeTexture(wall, Math.max(1, Math.round(w / 4)), floors)} roughness={0.85} />
      </mesh>
      <mesh geometry={roofGeo} material={plastic(roof, 0.75)} position={[0, h, 0]} castShadow />
    </group>
  );
};

/** Glass skyscraper, optionally with setbacks and a crown. */
export const Tower: React.FC<{ position: V3; w: number; d: number; h: number; hue?: number; setbacks?: number; round?: boolean; crown?: string }> = ({
  position,
  w,
  d,
  h,
  hue = 205,
  setbacks = 0,
  round = false,
  crown,
}) => {
  const tiers = setbacks + 1;
  return (
    <group position={position}>
      {Array.from({ length: tiers }).map((_, i) => {
        const th = h / tiers;
        const s = 1 - i * 0.18;
        const mat = (
          <meshStandardMaterial map={glassTexture(hue, round ? 12 : Math.max(3, Math.round(w / 2.5)), Math.max(6, Math.round(th / 2)))} roughness={0.15} metalness={0.25} envMapIntensity={1} />
        );
        return round ? (
          <mesh key={i} position={[0, th * i + th / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[(w / 2) * s, (w / 2) * s, th, 24]} />
            {mat}
          </mesh>
        ) : (
          <mesh key={i} position={[0, th * i + th / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w * s, th, d * s]} />
            {mat}
          </mesh>
        );
      })}
      <mesh position={[0, h + 0.4, 0]} castShadow>
        <boxGeometry args={[w * (1 - setbacks * 0.18) + 0.4, 0.8, d * (1 - setbacks * 0.18) + 0.4]} />
        <meshStandardMaterial color="#e8edf2" roughness={0.6} />
      </mesh>
      {crown ? (
        <mesh position={[0, h + 2.5, 0]} castShadow>
          <cylinderGeometry args={[w * 0.12, w * 0.2, 4, 12]} />
          <meshStandardMaterial color={crown} roughness={0.3} metalness={0.6} />
        </mesh>
      ) : null}
      <mesh position={[0, h + 5, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 6, 6]} />
        <meshStandardMaterial color="#d9dde2" />
      </mesh>
    </group>
  );
};

/** Street-level shop with a striped awning and big windows. */
export const Shop: React.FC<{ position: V3; w: number; h: number; d?: number; wall: string; awning: string; rotationY?: number }> = ({ position, w, h, d = 10, wall, awning, rotationY = 0 }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial map={facadeTexture(wall, Math.max(2, Math.round(w / 4)), Math.max(2, Math.round(h / 4)))} roughness={0.85} />
    </mesh>
    <mesh position={[0, 2.4, d / 2 + 0.05]}>
      <boxGeometry args={[w * 0.8, 4, 0.2]} />
      <meshStandardMaterial color="#7fd0ff" roughness={0.15} metalness={0.2} />
    </mesh>
    {Array.from({ length: Math.round(w / 1.2) }).map((_, i, arr) => (
      <mesh key={i} position={[-w * 0.42 + (i * w * 0.84) / (arr.length - 1), 5.1, d / 2 + 1.1]} rotation={[0.45, 0, 0]} castShadow>
        <boxGeometry args={[(w * 0.84) / arr.length + 0.02, 0.12, 2.6]} />
        <meshStandardMaterial color={i % 2 ? "#ffffff" : awning} roughness={0.7} />
      </mesh>
    ))}
  </group>
);

// ---------- Props ----------

export const Tree: React.FC<{ position: V3; size?: number }> = ({ position, size = 1 }) => (
  <group position={position} scale={size}>
    <mesh position={[0, 1.6, 0]} castShadow>
      <cylinderGeometry args={[0.35, 0.45, 3.2, 10]} />
      <meshStandardMaterial color="#7a5232" roughness={0.9} />
    </mesh>
    {[
      [0, 4.4, 0, 2.2],
      [0.9, 3.8, 0.4, 1.5],
      [-0.9, 3.9, -0.3, 1.6],
    ].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]} castShadow>
        <sphereGeometry args={[r, 20, 16]} />
        <meshStandardMaterial color={i ? "#4cbf45" : "#3fae3a"} roughness={0.85} />
      </mesh>
    ))}
  </group>
);

export const LampPost: React.FC<{ position: V3; rotationY?: number }> = ({ position, rotationY = 0 }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <mesh position={[0, 4, 0]} castShadow>
      <cylinderGeometry args={[0.15, 0.22, 8, 10]} />
      <meshStandardMaterial color="#3b3f46" roughness={0.5} metalness={0.4} />
    </mesh>
    <mesh position={[0.9, 7.9, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.1, 0.1, 1.8, 8]} />
      <meshStandardMaterial color="#3b3f46" roughness={0.5} metalness={0.4} />
    </mesh>
    <mesh position={[1.7, 7.7, 0]} castShadow>
      <boxGeometry args={[0.9, 0.35, 0.6]} />
      <meshStandardMaterial color="#f7f3df" emissive="#fff3c4" emissiveIntensity={0.4} />
    </mesh>
  </group>
);

/** Boxy delivery van. Faces +Z. */
export const Van: React.FC<{ position: V3; rotationY?: number; color?: string }> = ({ position, rotationY = 0, color = "#ffd23f" }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <mesh geometry={rbox(4.6, 4.2, 9, 0.4)} material={plastic(color, 0.35)} position={[0, 2.9, 0]} castShadow receiveShadow />
    <mesh geometry={rbox(4.2, 1.6, 0.3, 0.1)} material={plastic("#29313d", 0.15)} position={[0, 3.8, 4.42]} />
    {[-1, 1].map((s) => (
      <mesh key={s} geometry={rbox(0.3, 1.5, 2.4, 0.1)} material={plastic("#29313d", 0.15)} position={[s * 2.31, 3.8, 3.0]} />
    ))}
    {[-1, 1].map((sx) =>
      [-2.9, 2.9].map((z) => (
        <group key={`${sx}${z}`} position={[sx * 2.1, 1.05, z]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[1.05, 1.05, 0.9, 20]} />
            <meshStandardMaterial color="#1d1f24" roughness={0.8} />
          </mesh>
          <mesh position={[0, sx * 0.46, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.02, 16]} />
            <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.5} />
          </mesh>
        </group>
      )),
    )}
  </group>
);

/** A dark, lumpy storm-cloud ceiling made of smooth puffs. */
export const StormClouds: React.FC<{ y: number; area: number; z?: number; seed?: string; count?: number; color?: string }> = ({
  y,
  area,
  z = 0,
  seed = "storm",
  count = 70,
  color = "#3a3742",
}) => {
  const puffs = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        x: (random(`${seed}x${i}`) - 0.5) * area,
        y: y + random(`${seed}y${i}`) * 8,
        z: z - random(`${seed}z${i}`) * area,
        r: 7 + random(`${seed}r${i}`) * 9,
        shade: random(`${seed}s${i}`),
      })),
    [area, count, seed, y, z],
  );
  return (
    <group>
      {puffs.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} scale={[p.r * 1.5, p.r * 0.7, p.r]}>
          <sphereGeometry args={[1, 18, 12]} />
          <meshStandardMaterial color={p.shade < 0.5 ? color : "#4a4654"} roughness={1} emissive="#1b1530" emissiveIntensity={0.25} />
        </mesh>
      ))}
    </group>
  );
};
