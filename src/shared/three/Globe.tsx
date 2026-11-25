import * as THREE from "three";
import { useMemo } from "react";
import { random } from "remotion";
import { geo, mat } from "./materials";
import type { Vec3 } from "./World";

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
