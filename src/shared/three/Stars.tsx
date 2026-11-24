import * as THREE from "three";
import { useMemo } from "react";
import { random } from "remotion";

/** Fixed starfield on a far sphere. */
export const Stars: React.FC<{ count?: number; radius?: number; seed?: string; upperOnly?: boolean }> = ({
  count = 500,
  radius = 300,
  seed = "stars",
  upperOnly = true,
}) => {
  const geometry = useMemo(() => {
    const p: number[] = [];
    for (let i = 0; i < count; i++) {
      const u = random(`${seed}u${i}`);
      const v = random(`${seed}v${i}`);
      const theta = u * Math.PI * 2;
      const y = upperOnly ? 0.05 + v * 0.95 : v * 2 - 1;
      const r = Math.sqrt(1 - y * y);
      p.push(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    return g;
  }, [count, radius, seed, upperOnly]);
  return (
    <points geometry={geometry}>
      <pointsMaterial color="#ffffff" size={2.5} sizeAttenuation={false} fog={false} />
    </points>
  );
};
