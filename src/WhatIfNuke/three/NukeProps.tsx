import * as THREE from "three";
import { useMemo } from "react";
import { random } from "remotion";
import { geo, mat, shadowMat } from "../../shared/three/materials";
import type { Vec3 } from "../../shared/three/World";

// Low-poly props for "What if North Korea started nuking everyone?".
// Deliberately generic: no flags, insignia or real people.

/** Missile standing on its base (origin at the bottom of the body). */
export const Missile: React.FC<{ position: Vec3; flame?: number; flicker?: number; scale?: number; rotation?: Vec3 }> = ({
  position,
  flame = 0,
  flicker = 0,
  scale = 1,
  rotation = [0, 0, 0],
}) => {
  const body = mat("#e9ecef");
  const dark = mat("#495057");
  const flameLen = flame * (2.6 + 0.6 * Math.sin(flicker * 37) + 0.3 * Math.sin(flicker * 91));
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geo.cylinder} material={body} position={[0, 3, 0]} scale={[0.45, 6, 0.45]} />
      <mesh geometry={geo.box} material={dark} position={[0, 4.6, 0]} scale={[0.92, 0.35, 0.92]} />
      <mesh geometry={geo.box} material={dark} position={[0, 1.6, 0]} scale={[0.92, 0.25, 0.92]} />
      <mesh position={[0, 6.8, 0]} material={dark}>
        <coneGeometry args={[0.45, 1.6, 8]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} geometry={geo.box} material={dark} rotation={[0, (i * Math.PI) / 2, 0]} position={[Math.sin((i * Math.PI) / 2) * 0.55, 0.5, Math.cos((i * Math.PI) / 2) * 0.55]} scale={[0.08, 1, 0.6]} />
      ))}
      {flame > 0 ? (
        <group position={[0, -flameLen / 2, 0]}>
          <mesh rotation={[Math.PI, 0, 0]} scale={[1, flameLen / 2, 1]}>
            <coneGeometry args={[0.5, 2, 8]} />
            <meshStandardMaterial color="#ffb703" emissive="#ff7b00" emissiveIntensity={2.2} flatShading />
          </mesh>
          <mesh rotation={[Math.PI, 0, 0]} scale={[0.55, flameLen / 2.6, 0.55]} position={[0, 0.25, 0]}>
            <coneGeometry args={[0.5, 2, 8]} />
            <meshStandardMaterial color="#fff3b0" emissive="#fff3b0" emissiveIntensity={2.5} flatShading />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};

export const LaunchPad: React.FC<{ position?: Vec3 }> = ({ position = [0, 0, 0] }) => {
  const concrete = mat("#adb5bd");
  const steel = mat("#c1121f");
  return (
    <group position={position}>
      <mesh geometry={geo.box} material={concrete} position={[0, 0.2, 0]} scale={[9, 0.4, 9]} />
      <mesh geometry={geo.box} material={mat("#343a40")} position={[0, 0.25, 0]} scale={[2.2, 0.42, 2.2]} />
      {/* Service tower: a simple lattice of beams */}
      <group position={[2.6, 0.4, 0]}>
        {[-0.6, 0.6].map((x) =>
          [-0.6, 0.6].map((z) => (
            <mesh key={`${x}${z}`} geometry={geo.box} material={steel} position={[x, 4.5, z]} scale={[0.15, 9, 0.15]} />
          )),
        )}
        {Array.from({ length: 9 }).map((_, i) => (
          <group key={i} position={[0, 0.5 + i, 0]}>
            <mesh geometry={geo.box} material={steel} scale={[1.35, 0.1, 0.1]} position={[0, 0, 0.6]} />
            <mesh geometry={geo.box} material={steel} scale={[1.35, 0.1, 0.1]} position={[0, 0, -0.6]} />
            <mesh geometry={geo.box} material={steel} scale={[0.1, 0.1, 1.35]} position={[-0.6, 0, 0]} />
            {i % 3 === 1 ? <mesh geometry={geo.box} material={steel} scale={[1.2, 0.1, 0.1]} position={[-1.0, 0, 0]} /> : null}
          </group>
        ))}
      </group>
    </group>
  );
};

/** Rolling low-poly hills ringing the scene. */
export const Hills: React.FC<{ color?: string; radius?: number; seed?: string; count?: number }> = ({
  color = "#6a994e",
  radius = 70,
  seed = "hills",
  count = 14,
}) => (
  <group>
    {Array.from({ length: count }).map((_, i) => {
      const a = (i / count) * Math.PI * 2 + random(`${seed}a${i}`) * 0.3;
      const r = radius + random(`${seed}r${i}`) * 25;
      const s = 14 + random(`${seed}s${i}`) * 16;
      return (
        <mesh
          key={i}
          geometry={geo.canopy}
          material={mat(color)}
          position={[Math.cos(a) * r, -s * 0.35, Math.sin(a) * r]}
          scale={[s * 1.4, s * 0.8, s]}
        />
      );
    })}
  </group>
);

/** Mushroom cloud growing over `t` seconds since detonation. */
export const MushroomCloud: React.FC<{ position: Vec3; t: number; size?: number }> = ({ position, t, size = 1 }) => {
  if (t <= 0) return null;
  const rise = Math.min(1, t / 3);
  const easeRise = 1 - Math.pow(1 - rise, 2.2);
  const capY = 2 + easeRise * 14;
  const capR = 2 + Math.min(1, t / 3.5) * 5;
  const fireball = Math.max(0, 1 - t / 1.6);
  const glow = Math.max(0.15, 1.6 * Math.exp(-t * 1.1));
  const stemCount = 9;
  return (
    <group position={position} scale={size}>
      {/* Fireball, fading into the cap */}
      <mesh geometry={geo.ball} position={[0, 1 + easeRise * 6, 0]} scale={Math.min(1, t * 3) * 3.2 * (0.4 + fireball)}>
        <meshStandardMaterial color="#ffd166" emissive="#ff6d00" emissiveIntensity={2.5 * fireball + 0.2} transparent opacity={0.35 + 0.65 * fireball} flatShading />
      </mesh>
      {/* Stem */}
      {Array.from({ length: stemCount }).map((_, i) => {
        const y = (capY * i) / stemCount;
        const r = 1.1 + (i / stemCount) * 0.4 + random(`stem${i}`) * 0.3;
        return (
          <mesh key={`s${i}`} geometry={geo.puff} position={[Math.sin(t * 2 + i) * 0.2, y, Math.cos(t * 2 + i) * 0.2]} scale={r * Math.min(1, t * 1.5)}>
            <meshStandardMaterial color="#d8c3a5" emissive="#ff8c42" emissiveIntensity={glow * (1 - i / stemCount) * 0.6} flatShading />
          </mesh>
        );
      })}
      {/* Cap: a ring of billowing puffs rolling outward */}
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 14) * Math.PI * 2 + t * 0.25;
        const r = capR * (0.85 + random(`capr${i}`) * 0.2);
        return (
          <mesh
            key={`c${i}`}
            geometry={geo.puff}
            position={[Math.cos(a) * r * 0.7, capY + Math.sin(a * 3 + t) * 0.4, Math.sin(a) * r * 0.7]}
            scale={capR * (0.42 + random(`caps${i}`) * 0.15)}
          >
            <meshStandardMaterial color="#e9d8c4" emissive="#ff7b39" emissiveIntensity={glow} flatShading />
          </mesh>
        );
      })}
      <mesh geometry={geo.puff} position={[0, capY + capR * 0.35, 0]} scale={capR * 0.75}>
        <meshStandardMaterial color="#efe2d1" emissive="#ff9e5e" emissiveIntensity={glow * 0.7} flatShading />
      </mesh>
      {/* Ground surge */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r = 2 + Math.min(1, t / 2.5) * 9;
        return (
          <mesh key={`g${i}`} geometry={geo.puff} position={[Math.cos(a) * r, 0.6, Math.sin(a) * r]} scale={1.2 + Math.min(1, t) * 1.2}>
            <meshStandardMaterial color="#cbb79c" flatShading transparent opacity={Math.max(0, 1 - t / 4)} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Expanding ring of dust racing across the ground. */
export const Shockwave: React.FC<{ center: Vec3; radius: number; opacity: number }> = ({ center, radius, opacity }) => {
  if (radius <= 0 || opacity <= 0) return null;
  return (
    <group position={center}>
      <mesh geometry={geo.ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, 0]} scale={radius}>
        <meshBasicMaterial color="#fff1d6" transparent opacity={opacity * 0.8} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: 36 }).map((_, i) => {
        const a = (i / 36) * Math.PI * 2;
        return (
          <mesh key={i} geometry={geo.puff} position={[Math.cos(a) * radius, 0.8, Math.sin(a) * radius]} scale={1.6 + random(`sw${i}`) * 1.2}>
            <meshStandardMaterial color="#d8c3a5" flatShading transparent opacity={opacity} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Bright starburst for an interception in the sky. */
export const Burst: React.FC<{ position: Vec3; t: number }> = ({ position, t }) => {
  if (t <= 0 || t > 1.2) return null;
  const s = Math.min(1, t * 6);
  const fade = Math.max(0, 1 - t / 1.2);
  return (
    <group position={position}>
      <mesh geometry={geo.ball} scale={4 * s * (0.6 + fade * 0.6)}>
        <meshStandardMaterial color="#fff7d6" emissive="#ffb703" emissiveIntensity={3 * fade} transparent opacity={fade} flatShading />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} geometry={geo.box} rotation={[0, 0, (i / 8) * Math.PI]} scale={[0.35, 12 * s * fade, 0.35]}>
          <meshStandardMaterial color="#ffffff" emissive="#ffe8a3" emissiveIntensity={3 * fade} transparent opacity={fade} />
        </mesh>
      ))}
    </group>
  );
};

/** Truck with a tilted rack of interceptor tubes. */
export const LauncherTruck: React.FC<{ position: Vec3; rotationY?: number }> = ({ position, rotationY = 0 }) => {
  const green = mat("#4a5d3a");
  const dark = mat("#22281c");
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={geo.blob} material={shadowMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} scale={[3, 4.5, 1]} />
      <mesh geometry={geo.box} material={green} position={[0, 0.9, 1.6]} scale={[1.8, 1.2, 1.2]} />
      <mesh geometry={geo.box} material={green} position={[0, 0.7, -0.6]} scale={[1.9, 0.6, 3.4]} />
      <group position={[0, 1.2, -0.8]} rotation={[0.75, 0, 0]}>
        <mesh geometry={geo.box} material={green} position={[0, 0.9, 0]} scale={[1.6, 1.4, 2.6]} />
        {[-0.45, 0.45].map((x) =>
          [0.5, 1.3].map((y) => (
            <mesh key={`${x}${y}`} geometry={geo.cylinder} material={dark} position={[x, y, 1.31]} rotation={[Math.PI / 2, 0, 0]} scale={[0.25, 0.05, 0.25]} />
          )),
        )}
      </group>
      {[-1, 1].map((sx) =>
        [-1.6, 0, 1.6].map((z) => (
          <mesh key={`${sx}${z}`} geometry={geo.wheel} material={mat("#1b1b1b")} position={[sx * 0.95, 0.35, z]} rotation={[0, 0, Math.PI / 2]} scale={[0.35, 0.25, 0.35]} />
        )),
      )}
    </group>
  );
};

/** A small streak with a glowing head (warhead or interceptor). */
export const Streak: React.FC<{ position: Vec3; color: string; size?: number }> = ({ position, color, size = 1 }) => (
  <mesh geometry={geo.ball} position={position} scale={0.5 * size}>
    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} flatShading />
  </mesh>
);

/** Siren on a pole with a rotating red beacon. */
export const SirenPole: React.FC<{ position: Vec3; t: number }> = ({ position, t }) => {
  const pulse = 0.5 + 0.5 * Math.sin(t * 12);
  return (
    <group position={position}>
      <mesh geometry={geo.cylinder} material={mat("#2d3142")} position={[0, 2.5, 0]} scale={[0.1, 5, 0.1]} />
      <mesh geometry={geo.box} material={mat("#adb5bd")} position={[0, 4.6, 0.25]} scale={[0.8, 0.6, 0.5]} />
      <group position={[0, 5.3, 0]} rotation={[0, t * 9, 0]}>
        <mesh geometry={geo.ball} scale={0.35}>
          <meshStandardMaterial color="#ff2d2d" emissive="#ff0000" emissiveIntensity={1 + 2 * pulse} flatShading />
        </mesh>
        <mesh geometry={geo.box} position={[0, 0, 1.4]} scale={[0.5, 0.5, 2.6]}>
          <meshBasicMaterial color="#ff3b3b" transparent opacity={0.25 * pulse} depthWrite={false} />
        </mesh>
      </group>
      <pointLight position={[0, 5.3, 0.5]} color="#ff2020" intensity={30 * pulse} distance={25} />
    </group>
  );
};

/** Bare winter tree. */
export const DeadTree: React.FC<{ position: Vec3; size?: number; seed?: number }> = ({ position, size = 1, seed = 0 }) => {
  const bark = mat("#5b5048");
  return (
    <group position={position} scale={size} rotation={[0, seed, 0]}>
      <mesh geometry={geo.cylinder} material={bark} position={[0, 1.2, 0]} scale={[0.12, 2.4, 0.12]} />
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} geometry={geo.cylinder} material={bark} position={[0, 1.4 + i * 0.35, 0]} rotation={[0.9 * (i % 2 ? 1 : -1), i * 1.7, 0.6]} scale={[0.05, 1.1 - i * 0.15, 0.05]} />
      ))}
    </group>
  );
};

export const Campfire: React.FC<{ position: Vec3; t: number }> = ({ position, t }) => {
  const f = 1 + 0.18 * Math.sin(t * 23) + 0.1 * Math.sin(t * 41);
  return (
    <group position={position}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} geometry={geo.cylinder} material={mat("#6b4f3a")} position={[0, 0.12, 0]} rotation={[0, (i * Math.PI) / 3, Math.PI / 2]} scale={[0.1, 1.2, 0.1]} />
      ))}
      <mesh position={[0, 0.55 * f, 0]} scale={[1, f, 1]}>
        <coneGeometry args={[0.35, 1, 7]} />
        <meshStandardMaterial color="#ffb703" emissive="#ff6d00" emissiveIntensity={2.2} flatShading />
      </mesh>
      <pointLight position={[0, 1, 0]} color="#ff9a3c" intensity={14 * f} distance={9} />
    </group>
  );
};

/** Ash drifting down: points falling through a box, wrapping at the bottom. */
export const AshFall: React.FC<{ t: number; count?: number; size?: number; area?: number; height?: number; center?: Vec3 }> = ({
  t,
  count = 700,
  size = 3,
  area = 30,
  height = 16,
  center = [0, 0, 0],
}) => {
  const { geometry, base } = useMemo(() => {
    const base = Array.from({ length: count }).map((_, i) => ({
      x: (random(`ax${i}`) - 0.5) * area,
      y: random(`ay${i}`) * height,
      z: (random(`az${i}`) - 0.5) * area,
      speed: 0.6 + random(`as${i}`) * 0.8,
      sway: random(`aw${i}`) * 6.28,
    }));
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
    return { geometry: g, base };
  }, [count, area, height]);
  const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
  base.forEach((b, i) => {
    const y = (((b.y - b.speed * t) % height) + height) % height;
    attr.setXYZ(i, center[0] + b.x + Math.sin(t * 1.3 + b.sway) * 0.4, center[1] + y, center[2] + b.z + Math.cos(t + b.sway) * 0.3);
  });
  attr.needsUpdate = true;
  return (
    <points geometry={geometry}>
      <pointsMaterial color="#e6e2dc" size={size} sizeAttenuation={false} />
    </points>
  );
};

/** Cartoon Earth with drifting smoke patches (`smoke` 0..1). */
export const Globe: React.FC<{ rotation: number; smoke: number }> = ({ rotation, smoke }) => {
  const patches = useMemo(
    () =>
      Array.from({ length: 26 }).map((_, i) => {
        const u = random(`gu${i}`) * 2 - 1;
        const th = random(`gt${i}`) * Math.PI * 2;
        const r = Math.sqrt(1 - u * u);
        return { dir: new THREE.Vector3(Math.cos(th) * r, u * 0.8, Math.sin(th) * r).normalize(), s: 0.8 + random(`gs${i}`) * 0.9 };
      }),
    [],
  );
  const smokePuffs = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => {
        const u = random(`su${i}`) * 1.4 - 0.2; // mostly northern hemisphere
        const th = random(`st${i}`) * Math.PI * 2;
        const r = Math.sqrt(Math.max(0, 1 - u * u));
        return { dir: new THREE.Vector3(Math.cos(th) * r, Math.min(0.95, u), Math.sin(th) * r).normalize(), delay: random(`sd${i}`) * 0.7, s: 0.55 + random(`ss${i}`) * 0.6 };
      }),
    [],
  );
  const R = 5;
  return (
    <group rotation={[0.35, rotation, 0.1]}>
      <mesh geometry={geo.ball} scale={R}>
        <meshStandardMaterial color="#2f7fd8" flatShading />
      </mesh>
      {patches.map((p, i) => (
        <mesh key={i} geometry={geo.puff} position={p.dir.clone().multiplyScalar(R * 0.88).toArray() as Vec3} scale={p.s} material={mat(i % 4 === 0 ? "#d9c58b" : "#4caf50")} />
      ))}
      {[1, -1].map((y) => (
        <mesh key={y} geometry={geo.puff} position={[0, y * R * 0.93, 0]} scale={[1.6, 0.6, 1.6]} material={mat("#f8f9fa")} />
      ))}
      {smokePuffs.map((p, i) => {
        const g = Math.max(0, Math.min(1, (smoke - p.delay) / 0.4));
        if (g <= 0) return null;
        return (
          <mesh key={`s${i}`} geometry={geo.puff} position={p.dir.clone().multiplyScalar(R * 0.97).toArray() as Vec3} scale={p.s * g}>
            <meshStandardMaterial color="#4a4646" flatShading transparent opacity={0.8} />
          </mesh>
        );
      })}
      <mesh geometry={geo.ball} scale={R * 1.08}>
        <meshBasicMaterial color="#8ecbff" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
    </group>
  );
};
