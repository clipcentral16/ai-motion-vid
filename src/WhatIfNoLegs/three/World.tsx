import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { random } from "remotion";
import { SKY_HORIZON, BUILDING_COLORS } from "../constants";
import { geo, mat } from "./materials";
import { Building, Cloud, LampPost, Tree } from "./Props";

export type Vec3 = [number, number, number];

/** Positions the default camera every frame. All values come from the frame. */
export const CameraRig: React.FC<{ position: Vec3; target: Vec3; fov?: number }> = ({ position, target, fov }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  camera.position.set(...position);
  camera.lookAt(...target);
  if (fov !== undefined && camera.fov !== fov) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  return null;
};

export const Lights: React.FC<{ fogNear?: number; fogFar?: number }> = ({ fogNear = 30, fogFar = 90 }) => (
  <>
    <fog attach="fog" args={[SKY_HORIZON, fogNear, fogFar]} />
    <hemisphereLight args={["#e8f6ff", "#8fd16a", 1.4]} />
    <directionalLight position={[8, 14, 6]} intensity={2.2} color="#fff4e0" />
    <directionalLight position={[-6, 5, -4]} intensity={0.5} color="#b8d8ff" />
  </>
);

/** Cartoon smoke puff. `progress` runs 0 → 1 over its lifetime. */
export const Puff: React.FC<{ position: Vec3; progress: number; seed: string | number; size?: number }> = ({
  position,
  progress,
  seed,
  size = 1,
}) => {
  if (progress <= 0 || progress >= 1) return null;
  const grow = 1 - Math.pow(1 - Math.min(1, progress * 2.2), 3);
  const fade = 1 - Math.pow(progress, 2.2);
  return (
    <group position={position} scale={size}>
      {Array.from({ length: 7 }).map((_, i) => {
        const a = (i / 7) * Math.PI * 2 + random(`pa${seed}${i}`);
        const r = 0.35 + random(`pr${seed}${i}`) * 0.3;
        const s = (0.22 + random(`ps${seed}${i}`) * 0.2) * (0.4 + grow) * fade;
        return (
          <mesh
            key={i}
            geometry={geo.puff}
            position={[Math.cos(a) * r * grow, (random(`py${seed}${i}`) * 0.4 + progress * 0.5) * grow, Math.sin(a) * r * grow]}
            scale={Math.max(0.001, s)}
          >
            <meshStandardMaterial color="#ffffff" flatShading transparent opacity={fade} emissive="#ffffff" emissiveIntensity={0.3} />
          </mesh>
        );
      })}
    </group>
  );
};

/**
 * City street running along the Z axis: road (x −3..3), sidewalks (|x| 3..6),
 * buildings both sides, trees, lamps and clouds.
 */
export const Street: React.FC<{ zMin?: number; zMax?: number; seed?: string }> = ({ zMin = -70, zMax = 20, seed = "street" }) => {
  const len = zMax - zMin;
  const mid = (zMin + zMax) / 2;
  const buildings: { x: number; z: number; w: number; h: number; d: number; color: string }[] = [];
  for (const side of [-1, 1]) {
    let z = zMax;
    let i = 0;
    while (z > zMin) {
      const d = 4 + random(`${seed}d${side}${i}`) * 3;
      const w = 5 + random(`${seed}w${side}${i}`) * 3;
      const h = 6 + random(`${seed}h${side}${i}`) * 14;
      buildings.push({
        x: side * (6.6 + w / 2),
        z: z - d / 2,
        w,
        h,
        d: d - 0.3,
        color: BUILDING_COLORS[Math.floor(random(`${seed}c${side}${i}`) * BUILDING_COLORS.length)],
      });
      z -= d;
      i++;
    }
  }
  const dashes = Math.floor(len / 4);
  return (
    <group>
      <mesh geometry={geo.plane} material={mat("#7ccf5b")} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, mid]} scale={[200, 200, 1]} />
      <mesh geometry={geo.box} material={mat("#4a4e69")} position={[0, -0.05, mid]} scale={[6, 0.1, len]} />
      {Array.from({ length: dashes }).map((_, i) => (
        <mesh key={i} geometry={geo.box} material={mat("#ffffff")} position={[0, 0.01, zMax - i * 4 - 1]} scale={[0.18, 0.02, 1.8]} />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`x${i}`} geometry={geo.box} material={mat("#ffffff")} position={[-2.6 + i * 0.75, 0.01, -2]} scale={[0.45, 0.02, 2.2]} />
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh geometry={geo.box} material={mat("#d9d4cc")} position={[side * 4.5, 0.06, mid]} scale={[3, 0.12, len]} />
          <mesh geometry={geo.box} material={mat("#b8b2a7")} position={[side * 3.05, 0.08, mid]} scale={[0.15, 0.16, len]} />
        </group>
      ))}
      {buildings.map((b, i) => (
        <Building key={i} position={[b.x, 0, b.z]} size={[b.w, b.h, b.d]} color={b.color} />
      ))}
      {Array.from({ length: Math.floor(len / 9) }).map((_, i) => {
        const z = zMax - 4 - i * 9;
        return (
          <group key={`t${i}`}>
            <Tree position={[-5.6, 0.1, z]} size={0.9} color={i % 2 ? "#3ddc84" : "#2bb673"} />
            <Tree position={[5.6, 0.1, z - 4.5]} size={0.9} color={i % 2 ? "#2bb673" : "#3ddc84"} />
            <LampPost position={[3.4, 0.1, z - 2]} rotationY={Math.PI} />
          </group>
        );
      })}
      {Array.from({ length: 6 }).map((_, i) => (
        <Cloud key={`cl${i}`} seed={i} position={[-20 + i * 8, 24 + random(`cy${i}`) * 6, zMin + 10 + random(`cz${i}`) * 30]} size={2 + random(`cs${i}`) * 1.5} />
      ))}
    </group>
  );
};
