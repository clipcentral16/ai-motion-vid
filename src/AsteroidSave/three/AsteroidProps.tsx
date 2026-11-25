import * as THREE from "three";
import { useMemo } from "react";
import { random } from "remotion";
import { Character, type CharacterProps } from "../../shared/three/Character";
import { geo, mat } from "../../shared/three/materials";
import type { Vec3 } from "../../shared/three/World";

// Props for "What if an asteroid was about to hit Earth?".

/** Lumpy rock with craters; `heat` (0..1) adds a glowing molten shell. */
export const Asteroid: React.FC<{ position: Vec3; radius: number; spin: number; heat?: number; squash?: number }> = ({
  position,
  radius,
  spin,
  heat = 0,
  squash = 1,
}) => {
  const geometry = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 3);
    const p = g.getAttribute("position") as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n =
        0.18 * Math.sin(v.x * 3.1 + 1.3) * Math.cos(v.y * 2.7) +
        0.1 * Math.sin(v.z * 5.3 + v.x * 2.1) +
        0.06 * Math.sin(v.y * 9.1 + v.z * 3.7);
      v.multiplyScalar(1 + n);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const craters = useMemo(
    () =>
      Array.from({ length: 9 }).map((_, i) => {
        const u = random(`cu${i}`) * 2 - 1;
        const th = random(`ct${i}`) * Math.PI * 2;
        const r = Math.sqrt(1 - u * u);
        const dir = new THREE.Vector3(Math.cos(th) * r, u, Math.sin(th) * r);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
        return { pos: dir.multiplyScalar(1.02).toArray() as Vec3, q, s: 0.12 + random(`cs${i}`) * 0.18 };
      }),
    [],
  );
  return (
    <group position={position} scale={[radius / Math.sqrt(squash), radius * squash, radius / Math.sqrt(squash)]}>
      <group rotation={[spin * 0.7, spin, spin * 0.3]}>
        <mesh geometry={geometry}>
          <meshStandardMaterial color="#5b4a3f" flatShading roughness={1} emissive="#ff5a1f" emissiveIntensity={heat * 0.35} />
        </mesh>
        {craters.map((c, i) => (
          <mesh key={i} geometry={geo.disc} position={c.pos} quaternion={c.q} scale={c.s}>
            <meshStandardMaterial color="#3a2e27" />
          </mesh>
        ))}
      </group>
      {heat > 0 ? (
        <mesh geometry={geo.ball} scale={1.18}>
          <meshBasicMaterial color="#ff7a2a" transparent opacity={0.28 * heat} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
};

/**
 * Sporty "flying car" (generic, no brand) with 4 wheels, a glass canopy with
 * the driver's head, and a rear boost nozzle. Origin at the car's centre;
 * faces +Z with the roof up.
 */
export const FlyingCar: React.FC<{
  boost?: number;
  flicker?: number;
  wheelGlow?: number;
  driverSkin?: string;
  showDriver?: boolean;
  scale?: number;
}> = ({ boost = 0, flicker = 0, wheelGlow = 0, driverSkin = "#f1c27d", showDriver = true, scale = 1 }) => {
  const body = mat("#c9ced6");
  const trim = mat("#1e2126");
  const accent = mat("#ffd166");
  const flameLen = boost * (1.6 + 0.3 * Math.sin(flicker * 41) + 0.2 * Math.sin(flicker * 73));
  return (
    <group scale={scale}>
      {/* Body: low wedge */}
      <mesh geometry={geo.box} material={body} position={[0, 0.05, 0]} scale={[1.3, 0.38, 2.4]} />
      <mesh geometry={geo.box} material={body} position={[0, 0.05, 1.25]} rotation={[0.35, 0, 0]} scale={[1.25, 0.22, 0.5]} />
      <mesh geometry={geo.box} material={accent} position={[0, 0.25, 0]} scale={[0.12, 0.02, 2.2]} />
      <mesh geometry={geo.box} material={trim} position={[0, 0.3, -1.15]} scale={[1.4, 0.08, 0.3]} />
      {[-1, 1].map((s) => (
        <mesh key={`fin${s}`} geometry={geo.box} material={trim} position={[s * 0.6, 0.45, -1.15]} scale={[0.06, 0.3, 0.3]} />
      ))}
      {/* Canopy with driver */}
      <mesh geometry={geo.head} position={[0, 0.35, -0.1]} scale={[0.62, 0.45, 1.0]}>
        <meshStandardMaterial color="#1b2a3a" transparent opacity={0.55} roughness={0.1} />
      </mesh>
      {showDriver ? (
        <group position={[0, 0.48, -0.15]} scale={0.55}>
          <mesh geometry={geo.head} material={mat(driverSkin)} />
          <mesh geometry={geo.box} material={mat("#111111")} position={[0, 0.25, 0]} scale={[0.75, 0.08, 0.2]} />
        </group>
      ) : null}
      {/* Wheels (glow during a flip reset) */}
      {[-1, 1].map((sx) =>
        [-0.8, 0.85].map((z) => (
          <group key={`${sx}${z}`} position={[sx * 0.7, -0.15, z]}>
            <mesh geometry={geo.wheel} material={mat("#111111")} rotation={[0, 0, Math.PI / 2]} scale={[0.34, 0.25, 0.34]} />
            <mesh geometry={geo.wheel} rotation={[0, 0, Math.PI / 2]} scale={[0.2, 0.27, 0.2]}>
              <meshStandardMaterial color="#8d99ae" emissive="#66e0ff" emissiveIntensity={wheelGlow * 4} />
            </mesh>
          </group>
        )),
      )}
      {/* Hover pods */}
      {[-1, 1].map((s) => (
        <mesh key={`pod${s}`} geometry={geo.cylinder} position={[s * 0.75, -0.05, 0.05]} scale={[0.12, 0.6, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#9fd3ff" emissive="#4cc9f0" emissiveIntensity={1.2} />
        </mesh>
      ))}
      {/* Boost nozzle + flame */}
      <mesh geometry={geo.cylinder} material={trim} position={[0, 0.05, -1.25]} rotation={[Math.PI / 2, 0, 0]} scale={[0.2, 0.2, 0.2]} />
      {boost > 0 ? (
        <group position={[0, 0.05, -1.35 - flameLen / 2]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1, flameLen / 2, 1]}>
            <coneGeometry args={[0.24, 2, 8]} />
            <meshStandardMaterial color="#ffb703" emissive="#ff6d00" emissiveIntensity={2.5} transparent opacity={0.9} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[0.5, flameLen / 3, 0.5]}>
            <coneGeometry args={[0.24, 2, 8]} />
            <meshStandardMaterial color="#fff3b0" emissive="#fff3b0" emissiveIntensity={3} />
          </mesh>
          <pointLight color="#ffb347" intensity={25 * boost} distance={8} />
        </group>
      ) : null}
    </group>
  );
};

/** Zen as a cartoon capsule character: black-and-yellow hoodie and a headset. */
export const ZenCharacter: React.FC<Omit<CharacterProps, "color"> & { color?: string }> = (props) => {
  const legs = props.legs ?? 1;
  const headY = 0.5 * legs + (props.lift ?? 0) + 1.42 * (props.squash ?? 1);
  return (
    <group position={props.position} rotation={[0, props.rotationY ?? 0, 0]} scale={props.scale ?? 1}>
      <Character {...props} position={[0, 0, 0]} rotationY={0} scale={1} color="#ffd60a" pants="#111111" />
      <mesh geometry={geo.box} material={mat("#111111")} position={[0, 0.5 * legs + 0.75 + (props.lift ?? 0), 0.34]} scale={[0.5, 0.18, 0.05]} />
      <group position={[0, headY, 0]}>
        <mesh scale={0.36} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[1, 0.12, 6, 16, Math.PI]} />
          <meshStandardMaterial color="#111111" flatShading />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={geo.cylinder} material={mat("#ffd60a")} position={[s * 0.34, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.13, 0.1, 0.13]} />
        ))}
      </group>
    </group>
  );
};

export const Helipad: React.FC<{ position: Vec3 }> = ({ position }) => (
  <group position={position}>
    <mesh geometry={geo.cylinder} material={mat("#3d4048")} position={[0, 0.1, 0]} scale={[5, 0.2, 5]} />
    <mesh geometry={geo.ring} material={mat("#ffd166")} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.21, 0]} scale={4} />
    {[-1, 1].map((s) => (
      <mesh key={s} geometry={geo.box} material={mat("#ffffff")} position={[s * 0.9, 0.22, 0]} scale={[0.35, 0.02, 2.6]} />
    ))}
    <mesh geometry={geo.box} material={mat("#ffffff")} position={[0, 0.22, 0]} scale={[1.5, 0.02, 0.35]} />
    {Array.from({ length: 10 }).map((_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return (
        <mesh key={`l${i}`} geometry={geo.eye} position={[Math.cos(a) * 4.8, 0.3, Math.sin(a) * 4.8]} scale={2}>
          <meshStandardMaterial color="#ff4d4d" emissive="#ff0000" emissiveIntensity={2} />
        </mesh>
      );
    })}
  </group>
);
