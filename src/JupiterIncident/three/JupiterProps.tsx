import * as THREE from "three";
import { useMemo } from "react";
import { random } from "remotion";
import { Character, type CharacterProps } from "../../shared/three/Character";
import { geo, mat } from "../../shared/three/materials";
import type { Vec3 } from "../../shared/three/World";

// Props for "The 2011 Jupiter Incident" (a fictional internet story).

/** Banded gas giant with a procedurally painted, deterministic texture. */
export const Jupiter: React.FC<{ position: Vec3; radius: number; rotation: number; dim?: number }> = ({ position, radius, rotation, dim = 1 }) => {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    const bands = ["#6b4a33", "#a77b55", "#d9b48a", "#8f5f3c", "#c79b70", "#5e3f2b", "#b98b62", "#e0c39c", "#7a5236", "#a8805c"];
    for (let y = 0; y < 256; y++) {
      const v = y / 256;
      const idx = Math.floor((v * 14 + 0.6 * Math.sin(v * 31)) % bands.length);
      ctx.fillStyle = bands[(idx + bands.length) % bands.length];
      for (let x = 0; x < 512; x += 4) {
        const wave = Math.sin(x * 0.03 + y * 0.2) * 2 + Math.sin(x * 0.011 - y * 0.05) * 3;
        ctx.fillRect(x, y + wave * 0.3, 4, 1.4);
      }
    }
    // Swirls
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = `rgba(${random(`jr${i}`) < 0.5 ? "240,220,190" : "90,60,40"},${0.15 + random(`ja${i}`) * 0.2})`;
      ctx.beginPath();
      ctx.ellipse(random(`jx${i}`) * 512, random(`jy${i}`) * 256, 6 + random(`jw${i}`) * 24, 2 + random(`jh${i}`) * 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Great Red Spot
    ctx.fillStyle = "#a8452c";
    ctx.beginPath();
    ctx.ellipse(330, 165, 34, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c9603d";
    ctx.beginPath();
    ctx.ellipse(330, 165, 22, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
  return (
    <group position={position} rotation={[0.1, rotation, 0.05]}>
      <mesh scale={radius}>
        <sphereGeometry args={[1, 64, 40]} />
        <meshStandardMaterial map={texture} roughness={1} color={new THREE.Color(dim, dim, dim)} />
      </mesh>
      <mesh scale={radius * 1.03}>
        <sphereGeometry args={[1, 32, 20]} />
        <meshBasicMaterial color="#d9a066" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
    </group>
  );
};

/** Orbiting crew ship: hull, habitat ring, solar panels and an engine glow. */
export const Orbiter: React.FC<{ position: Vec3; rotation?: Vec3; blink: number }> = ({ position, rotation = [0, 0, 0], blink }) => {
  const hull = mat("#9aa0a8");
  const dark = mat("#3a3f47");
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geo.cylinder} material={hull} rotation={[Math.PI / 2, 0, 0]} scale={[0.8, 7, 0.8]} />
      <mesh geometry={geo.cylinder} material={dark} position={[0, 0, -1]} rotation={[Math.PI / 2, 0, 0]} scale={[1.6, 0.6, 1.6]} />
      <mesh position={[0, 0, 4]} material={hull} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.8, 1.4, 8]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={geo.box} material={mat("#1f3a66")} position={[s * 3.2, 0, 0.5]} scale={[4.2, 0.08, 1.6]} />
      ))}
      <mesh geometry={geo.cylinder} position={[0, 0, -3.7]} rotation={[Math.PI / 2, 0, 0]} scale={[0.55, 0.4, 0.55]}>
        <meshStandardMaterial color="#9fd3ff" emissive="#6fb8ff" emissiveIntensity={1.6} />
      </mesh>
      <mesh geometry={geo.eye} position={[0, 0.9, 2]} scale={2.5}>
        <meshStandardMaterial color="#ff3030" emissive="#ff0000" emissiveIntensity={blink > 0.5 ? 3 : 0.2} />
      </mesh>
    </group>
  );
};

/** Landing craft standing on four legs, with flickering window lights. */
export const Lander: React.FC<{ position: Vec3; flicker: number; rotationY?: number }> = ({ position, flicker, rotationY = 0 }) => {
  const hull = mat("#7d838c");
  const dark = mat("#2b2f36");
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={geo.cylinder} material={hull} position={[0, 2.6, 0]} scale={[2.2, 2.2, 2.2]} />
      <mesh position={[0, 4.2, 0]} material={hull}>
        <coneGeometry args={[2.2, 1.4, 8]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <mesh geometry={geo.cylinder} material={dark} position={[0, 0.9, 2.4]} rotation={[0.5, 0, 0]} scale={[0.1, 2.2, 0.1]} />
            <mesh geometry={geo.cylinder} material={dark} position={[0, 0.06, 2.9]} scale={[0.4, 0.1, 0.4]} />
          </group>
        );
      })}
      {[0, 1, 2].map((i) => (
        <mesh key={i} geometry={geo.box} position={[Math.sin(i * 2.1) * 2.21, 2.9, Math.cos(i * 2.1) * 2.21]} rotation={[0, i * 2.1, 0]} scale={[0.7, 0.4, 0.05]}>
          <meshStandardMaterial color="#ffe9a8" emissive="#ffcf66" emissiveIntensity={0.4 + 1.4 * flicker} />
        </mesh>
      ))}
      <pointLight position={[0, 2.6, 3]} color="#ffcf66" intensity={10 * flicker} distance={10} />
    </group>
  );
};

/** Capsule astronaut: a Character in a white suit with a glass helmet. */
export const Astronaut: React.FC<CharacterProps & { visor?: string }> = ({ visor = "#9fd3ff", ...props }) => {
  const legs = props.legs ?? 1;
  const headY = 0.5 * legs + (props.lift ?? 0) + 1.42 * (props.squash ?? 1);
  return (
    <group position={props.position} rotation={[0, props.rotationY ?? 0, 0]} scale={props.scale ?? 1}>
      <Character {...props} position={[0, 0, 0]} rotationY={0} scale={1} />
      <mesh geometry={geo.head} position={[0, headY, 0]} scale={1.28}>
        <meshStandardMaterial color={visor} transparent opacity={0.28} roughness={0.1} />
      </mesh>
      <mesh geometry={geo.box} material={mat("#c9ccd1")} position={[0, 0.5 * legs + 0.75, -0.42]} scale={[0.55, 0.65, 0.25]} />
    </group>
  );
};

/** Tall thin alien silhouette with glowing eyes. */
export const Alien: React.FC<{ position: Vec3; t: number; seed: number; rotationY?: number; scale?: number; eye?: string; opacity?: number }> = ({
  position,
  t,
  seed,
  rotationY = 0,
  scale = 1,
  eye = "#ff2a2a",
  opacity = 1,
}) => {
  if (opacity <= 0) return null;
  const skin = mat("#160f1f");
  const sway = Math.sin(t * 2 + seed) * 0.08;
  const reach = 0.4 + Math.sin(t * 3 + seed) * 0.25;
  return (
    <group position={position} rotation={[0, rotationY, sway]} scale={scale}>
      <mesh geometry={geo.body} material={skin} position={[0, 1.5, 0]} scale={[0.75, 1.7, 0.7]} />
      <mesh geometry={geo.head} material={skin} position={[0, 3.05, 0.05]} scale={[1.05, 1.45, 1.0]} />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={geo.eye} position={[s * 0.16, 3.1, 0.3]} rotation={[0, 0, s * 0.4]} scale={[2.2, 1.1, 0.8]}>
          <meshStandardMaterial color={eye} emissive={eye} emissiveIntensity={3} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <group key={`a${s}`} position={[s * 0.42, 2.3, 0]} rotation={[-reach, 0, s * 0.25]}>
          <mesh geometry={geo.limb} material={skin} position={[0, -0.6, 0]} scale={[0.8, 2.6, 0.8]} />
        </group>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`l${s}`} geometry={geo.limb} material={skin} position={[s * 0.2, 0.45, 0]} scale={[0.9, 2.2, 0.9]} />
      ))}
    </group>
  );
};

/** Long spaceship corridor running along -Z from z=6, with ribbed walls. */
export const Corridor: React.FC<{ lights: number; red: number; length?: number }> = ({ lights, red, length = 46 }) => {
  const wall = mat("#30343b");
  const rib = mat("#1c1f24");
  const floor = mat("#24272c");
  const n = Math.floor(length / 3);
  return (
    <group>
      <mesh geometry={geo.box} material={floor} position={[0, -0.1, 6 - length / 2]} scale={[5, 0.2, length]} />
      <mesh geometry={geo.box} material={wall} position={[0, 4.6, 6 - length / 2]} scale={[5, 0.2, length]} />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={geo.box} material={wall} position={[s * 2.6, 2.3, 6 - length / 2]} scale={[0.2, 4.8, length]} />
      ))}
      {Array.from({ length: n }).map((_, i) => {
        const z = 6 - i * 3;
        const flick = random(`fl${i}-${Math.floor(lights * 100)}`) < 0.15 ? 0.1 : 1;
        return (
          <group key={i} position={[0, 0, z]}>
            {[-1, 1].map((s) => (
              <mesh key={s} geometry={geo.box} material={rib} position={[s * 2.35, 2.3, 0]} scale={[0.4, 4.6, 0.35]} />
            ))}
            <mesh geometry={geo.box} material={rib} position={[0, 4.35, 0]} scale={[5, 0.4, 0.35]} />
            <mesh geometry={geo.box} position={[0, 4.45, -1.5]} scale={[1.4, 0.06, 0.6]}>
              <meshStandardMaterial color="#cfe6ff" emissive="#a8d0ff" emissiveIntensity={lights * flick * 1.4} />
            </mesh>
            <mesh geometry={geo.box} position={[2.45, 3.6, -1.5]} scale={[0.08, 0.3, 0.3]}>
              <meshStandardMaterial color="#ff2020" emissive="#ff0000" emissiveIntensity={red * 2.5} />
            </mesh>
            {/* Floor grating stripes */}
            <mesh geometry={geo.box} material={mat("#3a3e45")} position={[0, 0.01, -1.5]} scale={[3.6, 0.02, 0.15]} />
          </group>
        );
      })}
      <pointLight position={[0, 3.8, 2]} color="#a8d0ff" intensity={18 * lights} distance={14} />
      <pointLight position={[0, 3.8, -10]} color="#a8d0ff" intensity={14 * lights} distance={14} />
      <pointLight position={[1.5, 3, -4]} color="#ff1a1a" intensity={40 * red} distance={18} />
    </group>
  );
};

/** Chunky cartoon blaster held in front of the chest. */
export const Blaster: React.FC<{ flash: number }> = ({ flash }) => (
  <group>
    <mesh geometry={geo.box} material={mat("#2b2d42")} position={[0, 0, 0.35]} scale={[0.22, 0.26, 0.85]} />
    <mesh geometry={geo.cylinder} material={mat("#8d99ae")} position={[0, 0.03, 0.9]} rotation={[Math.PI / 2, 0, 0]} scale={[0.07, 0.4, 0.07]} />
    <mesh geometry={geo.box} material={mat("#ef233c")} position={[0, 0.16, 0.25]} scale={[0.12, 0.06, 0.4]} />
    <mesh geometry={geo.box} material={mat("#2b2d42")} position={[0, -0.22, 0.12]} rotation={[0.3, 0, 0]} scale={[0.16, 0.36, 0.16]} />
    {flash > 0 ? (
      <group position={[0, 0.03, 1.2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, flash, 1]}>
          <coneGeometry args={[0.3, 0.9, 7]} />
          <meshStandardMaterial color="#fff3b0" emissive="#ffb703" emissiveIntensity={3} transparent opacity={flash} />
        </mesh>
        <pointLight color="#ffcf66" intensity={60 * flash} distance={14} />
      </group>
    ) : null}
  </group>
);

/** Bright tracer streak from `from` to `to` (fades with `fade`). */
export const Tracer: React.FC<{ from: Vec3; to: Vec3; fade: number }> = ({ from, to, fade }) => {
  if (fade <= 0) return null;
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const len = a.distanceTo(b);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), b.clone().sub(a).normalize());
  return (
    <mesh geometry={geo.box} position={mid.toArray() as Vec3} quaternion={q} scale={[0.06, 0.06, len]}>
      <meshStandardMaterial color="#fff3b0" emissive="#ffd166" emissiveIntensity={3} transparent opacity={fade} />
    </mesh>
  );
};

/** CaseOh as a cartoon capsule character: dark hoodie and a gaming headset. */
export const CaseOhCharacter: React.FC<CharacterProps> = (props) => {
  const legs = props.legs ?? 1;
  const headY = 0.5 * legs + (props.lift ?? 0) + 1.42 * (props.squash ?? 1);
  return (
    <group position={props.position} rotation={[props.lean ?? 0, props.rotationY ?? 0, 0]} scale={props.scale ?? 1.25}>
      <Character {...props} position={[0, 0, 0]} rotationY={0} lean={0} scale={1} />
      <group position={[0, headY, 0]}>
        <mesh scale={0.36} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[1, 0.12, 6, 16, Math.PI]} />
          <meshStandardMaterial color="#111111" flatShading />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={geo.cylinder} material={mat("#111111")} position={[s * 0.34, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.13, 0.1, 0.13]} />
        ))}
        <mesh geometry={geo.cylinder} material={mat("#ef233c")} position={[0.34, -0.12, 0.14]} rotation={[0.9, 0, 0]} scale={[0.02, 0.32, 0.02]} />
      </group>
    </group>
  );
};

/** Jagged dark rocks scattered over a moon surface. */
export const Rocks: React.FC<{ count?: number; area?: number; seed?: string; color?: string }> = ({ count = 30, area = 60, seed = "rock", color = "#2c3440" }) => (
  <group>
    {Array.from({ length: count }).map((_, i) => {
      const s = 0.5 + random(`${seed}s${i}`) * 2.2;
      return (
        <mesh
          key={i}
          geometry={geo.puff}
          material={mat(color)}
          position={[(random(`${seed}x${i}`) - 0.5) * area, s * 0.3, -random(`${seed}z${i}`) * area]}
          rotation={[random(`${seed}a${i}`) * 3, random(`${seed}b${i}`) * 3, 0]}
          scale={[s, s * 0.7, s * 1.1]}
        />
      );
    })}
  </group>
);
