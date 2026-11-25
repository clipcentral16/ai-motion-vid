import * as THREE from "three";
import { random } from "remotion";
import { plastic, rbox } from "../../shared/blocky/BlockCharacter";
import { Sign, textTexture } from "../../shared/blocky/TownProps";

type V3 = [number, number, number];

/** Castle: curtain wall with crenellations, four round towers with cone roofs, flags, a gate. */
export const Castle: React.FC<{ position?: V3; scale?: number; t?: number }> = ({ position = [0, 0, 0], scale = 1, t = 0 }) => {
  const stone = plastic("#cfc7b8", 0.85);
  const dark = plastic("#a89f90", 0.85);
  const roof = plastic("#3f5fd6", 0.55);
  return (
    <group position={position} scale={scale}>
      <mesh geometry={rbox(40, 14, 4, 0.1)} material={stone} position={[0, 7, 0]} castShadow receiveShadow />
      {Array.from({ length: 13 }).map((_, i) => (
        <mesh key={i} geometry={rbox(1.8, 2, 4.2, 0.08)} material={stone} position={[-18 + i * 3, 15, 0]} castShadow />
      ))}
      {/* Keep behind */}
      <mesh geometry={rbox(18, 24, 12, 0.1)} material={dark} position={[0, 12, -9]} castShadow receiveShadow />
      {[-20, 20].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 11, 0]} castShadow receiveShadow material={stone}>
            <cylinderGeometry args={[4, 4.3, 22, 18]} />
          </mesh>
          <mesh position={[0, 26, 0]} castShadow material={roof}>
            <coneGeometry args={[5, 8, 18]} />
          </mesh>
          <mesh position={[0, 32, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 4, 6]} />
            <meshStandardMaterial color="#555" />
          </mesh>
          <mesh position={[1.1, 33, 0]} rotation={[0, Math.sin(t * 3 + x) * 0.25, 0]}>
            <planeGeometry args={[2.2, 1.3]} />
            <meshStandardMaterial color="#ffcc33" side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      {[-6, 6].map((x) => (
        <group key={`k${x}`} position={[x, 0, -9]}>
          <mesh position={[0, 16, 0]} castShadow material={stone}>
            <cylinderGeometry args={[3, 3, 32, 16]} />
          </mesh>
          <mesh position={[0, 36, 0]} castShadow material={roof}>
            <coneGeometry args={[3.8, 7, 16]} />
          </mesh>
        </group>
      ))}
      {/* Gate */}
      <mesh geometry={rbox(8, 10, 0.6, 0.1)} material={plastic("#6b4a2b", 0.8)} position={[0, 5, 2.1]} />
      <mesh geometry={rbox(9, 0.8, 0.8, 0.1)} material={plastic("#ffcc33", 0.4)} position={[0, 10.3, 2.2]} />
      {/* Red carpet */}
      <mesh position={[0, 0.05, 14]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 24]} />
        <meshStandardMaterial color="#c1121f" roughness={0.9} />
      </mesh>
    </group>
  );
};

/** Golden throne facing +Z. Seat top ~2.0 high. */
export const Throne: React.FC<{ position: V3 }> = ({ position }) => {
  const gold = plastic("#ffcc33", 0.35);
  const red = plastic("#c1121f", 0.8);
  return (
    <group position={position}>
      <mesh geometry={rbox(4.4, 1.6, 3.6, 0.15)} material={gold} position={[0, 0.8, 0]} castShadow />
      <mesh geometry={rbox(3.6, 0.4, 3, 0.15)} material={red} position={[0, 1.8, 0.1]} castShadow />
      <mesh geometry={rbox(4.4, 7, 0.8, 0.2)} material={gold} position={[0, 4, -1.6]} castShadow />
      <mesh geometry={rbox(3.2, 5, 0.3, 0.15)} material={red} position={[0, 4.4, -1.1]} />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={rbox(0.6, 1.6, 3.2, 0.15)} material={gold} position={[s * 2.1, 2.6, 0]} castShadow />
      ))}
      <mesh position={[0, 8, -1.6]}>
        <sphereGeometry args={[0.6, 12, 10]} />
        <meshStandardMaterial color="#e63946" roughness={0.2} />
      </mesh>
    </group>
  );
};

/** A long straight staircase going down toward +Z. Returns step geometry helpers. */
export const STAIRS = { steps: 26, rise: 0.9, run: 1.6, width: 14 };
export const stairTopY = STAIRS.steps * STAIRS.rise;
/** Height of the stair surface at distance z from the top (z grows toward the bottom). */
export const stairY = (z: number) => Math.max(0, stairTopY - Math.floor(Math.max(0, z) / STAIRS.run + 1) * STAIRS.rise);

export const GrandStairs: React.FC<{ position?: V3 }> = ({ position = [0, 0, 0] }) => {
  const stone = plastic("#e7e1d5", 0.7);
  const carpet = plastic("#c1121f", 0.85);
  return (
    <group position={position}>
      {/* top platform */}
      <mesh geometry={rbox(STAIRS.width + 4, stairTopY, 8, 0.1)} material={stone} position={[0, stairTopY / 2, -4]} castShadow receiveShadow />
      {Array.from({ length: STAIRS.steps }).map((_, i) => {
        const h = stairTopY - (i + 1) * STAIRS.rise;
        if (h <= 0) return null;
        return (
          <group key={i}>
            <mesh geometry={rbox(STAIRS.width, h, STAIRS.run, 0.04)} material={stone} position={[0, h / 2, i * STAIRS.run + STAIRS.run / 2]} castShadow receiveShadow />
            <mesh geometry={rbox(4, 0.06, STAIRS.run, 0.02)} material={carpet} position={[0, h + 0.03, i * STAIRS.run + STAIRS.run / 2]} receiveShadow />
          </group>
        );
      })}
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={rbox(0.6, 2, STAIRS.steps * STAIRS.run, 0.1)} material={plastic("#ffcc33", 0.4)} position={[s * (STAIRS.width / 2 + 0.3), stairTopY / 2 + 1, (STAIRS.steps * STAIRS.run) / 2]} rotation={[Math.atan2(stairTopY, STAIRS.steps * STAIRS.run), 0, 0]} castShadow />
      ))}
    </group>
  );
};

/** Judges' table with score cards (shown when `scores` is true). Faces -Z (towards the stairs). */
export const JudgesTable: React.FC<{ position: V3; scores: boolean; rotationY?: number }> = ({ position, scores, rotationY = 0 }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <mesh geometry={rbox(14, 3.2, 2.4, 0.1)} material={plastic("#2b2d42", 0.6)} position={[0, 1.6, 0]} castShadow />
    <mesh position={[0, 1.8, 1.22]}>
      <planeGeometry args={[12, 1.6]} />
      <meshStandardMaterial map={textTexture("JUDGES", "#2b2d42", "#ffcc33", 768, 205)} />
    </mesh>
    {scores
      ? [-4.5, 0, 4.5].map((x) => <Sign key={x} text="10" position={[x, 6.5, 0.4]} size={[2.6, 2.2]} bg="#ffffff" fg="#d62828" />)
      : null}
  </group>
);

export const BananaPeel: React.FC<{ position: V3; rotationY?: number }> = ({ position, rotationY = 0 }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    {[0, 1, 2, 3].map((i) => {
      const a = (i / 4) * Math.PI * 2;
      return <mesh key={i} geometry={rbox(0.35, 0.12, 1.2, 0.06)} material={plastic("#ffd23f", 0.5)} position={[Math.sin(a) * 0.45, 0.08, Math.cos(a) * 0.45]} rotation={[0, a, 0]} castShadow />;
    })}
    <mesh geometry={rbox(0.5, 0.4, 0.5, 0.15)} material={plastic("#e8c22e", 0.5)} position={[0, 0.25, 0]} castShadow />
    <mesh geometry={rbox(0.12, 0.3, 0.12, 0.04)} material={plastic("#5b4630", 0.6)} position={[0, 0.55, 0]} />
  </group>
);

export const CoffeeCup: React.FC<{ position: V3; tilt?: number }> = ({ position, tilt = 0 }) => (
  <group position={position} rotation={[tilt, 0, 0]}>
    <mesh castShadow>
      <cylinderGeometry args={[0.38, 0.3, 0.9, 14]} />
      <meshStandardMaterial color="#ffffff" roughness={0.6} />
    </mesh>
    <mesh position={[0, 0.48, 0]}>
      <cylinderGeometry args={[0.4, 0.4, 0.12, 14]} />
      <meshStandardMaterial color="#6b4a2b" roughness={0.6} />
    </mesh>
    <mesh position={[0, 0, 0]}>
      <cylinderGeometry args={[0.39, 0.33, 0.35, 14]} />
      <meshStandardMaterial color="#c1121f" roughness={0.7} />
    </mesh>
  </group>
);

/** Coffee splash: brown blobs flying out from `origin`, `s` seconds after the spill. */
export const Splash: React.FC<{ origin: V3; s: number }> = ({ origin, s }) => {
  if (s <= 0 || s > 1.4) return null;
  return (
    <group position={origin}>
      {Array.from({ length: 14 }).map((_, i) => {
        const vx = (random(`sx${i}`) - 0.5) * 3;
        const vz = 1.5 + random(`sz${i}`) * 2.5;
        const vy = 1 + random(`sy${i}`) * 3;
        const y = vy * s - 6 * s * s;
        return (
          <mesh key={i} position={[vx * s, Math.max(-origin[1] + 0.05, y), vz * s]} scale={0.18 + random(`ss${i}`) * 0.2}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color="#6b4a2b" roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Stack of plates balanced on a head (place at head-top height). */
export const PlateStack: React.FC<{ position: V3; wobble: number }> = ({ position, wobble }) => (
  <group position={position}>
    {Array.from({ length: 6 }).map((_, i) => (
      <mesh key={i} position={[Math.sin(wobble + i * 0.6) * 0.08 * i, i * 0.22, 0]} rotation={[0, 0, Math.sin(wobble) * 0.04 * i]} castShadow>
        <cylinderGeometry args={[0.9, 0.7, 0.14, 18]} />
        <meshStandardMaterial color={i % 2 ? "#ffffff" : "#dfe8f0"} roughness={0.3} />
      </mesh>
    ))}
  </group>
);

const CONFETTI = ["#ffd166", "#ef476f", "#06d6a0", "#118ab2", "#ffffff", "#c77dff"];
/** Confetti and streamers falling from `from` seconds. */
export const Confetti: React.FC<{ t: number; from: number; center: V3; area?: number; count?: number; height?: number }> = ({ t, from, center, area = 24, count = 160, height = 20 }) => {
  if (t < from) return null;
  const s = t - from;
  return (
    <group position={center}>
      {Array.from({ length: count }).map((_, i) => {
        const delay = random(`cd${i}`) * 0.8;
        if (s < delay) return null;
        const y = height - (s - delay) * (4 + random(`cv${i}`) * 3);
        if (y < 0.05) return null;
        return (
          <mesh
            key={i}
            position={[(random(`cx${i}`) - 0.5) * area + Math.sin(s * 3 + i) * 0.8, y, (random(`cz${i}`) - 0.5) * area * 0.6]}
            rotation={[s * 6 + i, s * 4 + i, s * 5]}
          >
            <planeGeometry args={[0.35, 0.6]} />
            <meshStandardMaterial color={CONFETTI[i % CONFETTI.length]} side={THREE.DoubleSide} emissive={CONFETTI[i % CONFETTI.length]} emissiveIntensity={0.25} />
          </mesh>
        );
      })}
    </group>
  );
};
