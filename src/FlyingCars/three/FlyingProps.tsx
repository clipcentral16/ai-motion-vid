import { random } from "remotion";
import { BlockCharacter, plastic, rbox, type Look } from "../../shared/blocky/BlockCharacter";
import type { Pose } from "../../shared/blocky/poses";
import { textTexture } from "../../shared/blocky/TownProps";
import type { Expression } from "../../shared/blocky/textures";

type V3 = [number, number, number];

const glowMat = (color: string, k: number) => <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4 + 2.2 * k} roughness={0.3} />;

/**
 * Open-top (convertible) hover car, nose along +Z, ~4.4 × 8.6 studs.
 * `glow` 0..1 lights the four hover pods and their thrust cones; `pitch`/`roll`
 * tilt it in flight. A driver can sit in the front seat.
 */
export const FlyingCar: React.FC<{
  position: V3;
  rotationY?: number;
  pitch?: number;
  roll?: number;
  color?: string;
  glow?: number;
  driver?: Look;
  pose?: Pose;
  expression?: Expression;
  t?: number;
  seed?: number;
  scale?: number;
  sign?: string;
  shadows?: boolean;
}> = ({ position, rotationY = 0, pitch = 0, roll = 0, color = "#ff5a5f", glow = 1, driver, pose, expression = "happy", t = 0, seed = 0, scale = 1, sign, shadows = true }) => {
  const body = plastic(color, 0.3);
  const dark = plastic("#262a33", 0.5);
  const trim = plastic("#f2f2f2", 0.35);
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <group rotation={[pitch, 0, roll]}>
        {/* Lower body, side skirts, nose and tail */}
        <mesh geometry={rbox(4.4, 1.3, 8.6, 0.5)} material={body} position={[0, 1.15, 0]} castShadow={shadows} receiveShadow />
        <mesh geometry={rbox(4.0, 0.7, 2.6, 0.3)} material={body} position={[0, 1.95, 2.8]} castShadow={shadows} />
        <mesh geometry={rbox(4.0, 0.9, 2.2, 0.3)} material={body} position={[0, 2.0, -3.1]} castShadow={shadows} />
        {/* Cabin tub + seats */}
        <mesh geometry={rbox(3.6, 0.4, 4.2, 0.15)} material={dark} position={[0, 1.85, -0.3]} />
        <mesh geometry={rbox(1.5, 1.4, 0.5, 0.2)} material={dark} position={[-0.95, 2.4, -0.9]} />
        <mesh geometry={rbox(1.5, 1.4, 0.5, 0.2)} material={dark} position={[0.95, 2.4, -0.9]} />
        {/* Windshield */}
        <mesh position={[0, 2.75, 1.45]} rotation={[-0.45, 0, 0]}>
          <boxGeometry args={[3.8, 1.3, 0.12]} />
          <meshStandardMaterial color="#bfe9ff" transparent opacity={0.45} roughness={0.05} metalness={0.2} />
        </mesh>
        {/* Little wings with lights */}
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh geometry={rbox(1.6, 0.25, 2.4, 0.1)} material={body} position={[s * 2.8, 1.5, -1.6]} rotation={[0, 0, s * -0.15]} castShadow={shadows} />
            <mesh position={[s * 3.55, 1.4, -1.6]}>
              <boxGeometry args={[0.15, 0.2, 0.5]} />
              {glowMat(s < 0 ? "#ff3b3b" : "#39ff6a", glow)}
            </mesh>
          </group>
        ))}
        {/* Headlights + tail lights */}
        {[-1, 1].map((s) => (
          <group key={`l${s}`}>
            <mesh position={[s * 1.4, 1.35, 4.31]}>
              <boxGeometry args={[0.9, 0.35, 0.05]} />
              <meshStandardMaterial color="#fffbe0" emissive="#fff3b0" emissiveIntensity={1.4} />
            </mesh>
            <mesh position={[s * 1.4, 1.45, -4.31]}>
              <boxGeometry args={[0.9, 0.3, 0.05]} />
              <meshStandardMaterial color="#ff4040" emissive="#ff2020" emissiveIntensity={1.2} />
            </mesh>
          </group>
        ))}
        <mesh geometry={rbox(4.5, 0.25, 0.3, 0.1)} material={trim} position={[0, 0.75, 4.2]} />
        {/* Hover pods with thrust cones */}
        {[-1, 1].map((sx) =>
          [-2.9, 2.9].map((z) => (
            <group key={`${sx}${z}`} position={[sx * 2.2, 0.55, z]}>
              <mesh castShadow={shadows}>
                <cylinderGeometry args={[0.95, 1.05, 0.6, 20]} />
                <meshStandardMaterial color="#3a3f4b" roughness={0.4} metalness={0.4} />
              </mesh>
              <mesh position={[0, -0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.8, 20]} />
                {glowMat("#4fe3ff", glow)}
              </mesh>
              {glow > 0.05 ? (
                <mesh position={[0, -0.31 - 0.9 * glow, 0]}>
                  <coneGeometry args={[0.75, 1.8 * glow, 16, 1, true]} />
                  <meshBasicMaterial color="#8ff0ff" transparent opacity={0.35 * glow} depthWrite={false} side={2} />
                </mesh>
              ) : null}
            </group>
          )),
        )}
        {sign ? <RoofSign text={sign} /> : null}
        {driver && pose ? (
          <group position={[-0.95, 1.05, -0.45]} scale={0.6}>
            <BlockCharacter look={driver} pose={pose} expression={expression} t={t} seed={seed} />
          </group>
        ) : null}
      </group>
    </group>
  );
};

const RoofSign: React.FC<{ text: string }> = ({ text }) => {
  const tex = textTexture(text, "#ffd23f", "#c0262d", 512, 160, "bold 110px 'Lilita One', sans-serif");
  return (
    <group position={[0, 2.9, -3.1]}>
      <mesh geometry={rbox(3.2, 1.1, 0.5, 0.12)} material={plastic("#ffd23f", 0.4)} castShadow />
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, 0, s * 0.26]} rotation={[0, s > 0 ? 0 : Math.PI, 0]}>
          <planeGeometry args={[3.0, 0.94]} />
          <meshStandardMaterial map={tex} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
};

const CAR_COLORS = ["#ff5a5f", "#3a86ff", "#ffbe0b", "#8338ec", "#06d6a0", "#fb5607", "#f2f2f2", "#2b2f36", "#ff8fc0", "#4cc9f0"];
export const carColor = (i: number) => CAR_COLORS[i % CAR_COLORS.length];

/** Deterministic random helper: value in [a, b). */
export const rr = (seed: string, a: number, b: number) => a + random(seed) * (b - a);

/** Striped parachute canopy with lines down to `position` (attachment point). `open` 0..1. */
export const Parachute: React.FC<{ position: V3; open: number; sway?: number }> = ({ position, open, sway = 0 }) => {
  if (open <= 0) return null;
  const R = 7 * open;
  const H = 9 * Math.min(1, open * 1.4);
  const colors = ["#ff4d4d", "#ffffff"];
  return (
    <group position={position} rotation={[0, 0, sway]}>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[0, H, 0]} rotation={[0, (i / 8) * Math.PI * 2, 0]} castShadow>
          <sphereGeometry args={[R, 6, 8, 0, Math.PI / 4, 0, Math.PI / 2.4]} />
          <meshStandardMaterial color={colors[i % 2]} roughness={0.7} side={2} />
        </mesh>
      ))}
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        const ex = Math.cos(a) * R * 0.8, ez = Math.sin(a) * R * 0.8, ey = H + R * 0.3;
        const len = Math.hypot(ex, ey, ez);
        return (
          <group key={`c${i}`} position={[ex / 2, ey / 2, ez / 2]}>
            <Line from={[0, 0, 0]} to={[ex, ey, ez]} len={len} />
          </group>
        );
      })}
    </group>
  );
};

/** Thin cylinder between two points (relative to a parent centred on their midpoint). */
const Line: React.FC<{ from: V3; to: V3; len: number }> = ({ from, to, len }) => {
  const d: V3 = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  const yaw = Math.atan2(d[0], d[2]);
  const tilt = Math.acos(d[1] / len);
  return (
    <group rotation={[0, yaw, 0]}>
      <group rotation={[tilt, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, len, 4]} />
          <meshStandardMaterial color="#e8e8e8" />
        </mesh>
      </group>
    </group>
  );
};

/** Chunky cartoon bird, beak along +Z, flapping. `panic` widens the eyes. */
export const Bird: React.FC<{ position: V3; t: number; rotationY?: number; scale?: number; color?: string; panic?: boolean; seed?: number }> = ({
  position,
  t,
  rotationY = 0,
  scale = 1,
  color = "#f2f2f2",
  panic = false,
  seed = 0,
}) => {
  const flap = Math.sin(t * (panic ? 34 : 16) + seed * 2.1) * 0.9;
  const eye = panic ? 0.26 : 0.16;
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh geometry={rbox(1.2, 1.1, 1.9, 0.45)} material={plastic(color, 0.6)} castShadow />
      <mesh geometry={rbox(1.0, 1.0, 1.0, 0.4)} material={plastic(color, 0.6)} position={[0, 0.55, 1.0]} castShadow />
      <mesh position={[0, 0.45, 1.65]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.22, 0.6, 4]} />
        <meshStandardMaterial color="#ffb703" roughness={0.5} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.38, 0.72, 1.48]}>
            <sphereGeometry args={[eye, 10, 10]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          <mesh position={[s * 0.38, 0.72, 1.48 + eye * 0.8]}>
            <sphereGeometry args={[eye * 0.45, 8, 8]} />
            <meshStandardMaterial color="#111111" />
          </mesh>
          <group position={[s * 0.55, 0.25, 0.1]} rotation={[0, 0, s * flap]}>
            <mesh geometry={rbox(1.8, 0.18, 1.1, 0.08)} material={plastic(color === "#f2f2f2" ? "#cfd6dd" : color, 0.6)} position={[s * 0.9, 0, 0]} castShadow />
          </group>
        </group>
      ))}
      <mesh geometry={rbox(0.8, 0.15, 0.9, 0.06)} material={plastic("#cfd6dd", 0.6)} position={[0, 0.2, -1.2]} rotation={[0.3, 0, 0]} />
    </group>
  );
};

/** A loose feather drifting down (for the bird gag). */
export const Feather: React.FC<{ position: V3; t: number; seed: number }> = ({ position, t, seed }) => (
  <mesh position={[position[0] + Math.sin(t * 3 + seed) * 0.8, position[1] - t * 2.2, position[2]]} rotation={[0.3, t * 2 + seed, Math.sin(t * 4 + seed) * 0.6]}>
    <boxGeometry args={[0.18, 0.04, 0.8]} />
    <meshStandardMaterial color="#ffffff" roughness={0.8} />
  </mesh>
);

/**
 * A glowing sky lane: a translucent ribbon along X at height `y`, with
 * chevrons pointing in `dir` and hoop gates. Label sign at one end.
 */
export const SkyLane: React.FC<{ y: number; z: number; length?: number; color: string; dir: 1 | -1; t: number; label?: string; labelX?: number; on?: number }> = ({
  y,
  z,
  length = 160,
  color,
  dir,
  t,
  label,
  labelX = 0,
  on = 1,
}) => {
  if (on <= 0) return null;
  const tex = label ? textTexture(label, color, "#13140e", 512, 192) : null;
  return (
    <group position={[0, y, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[on, 1, 1]}>
        <planeGeometry args={[length, 7]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} side={2} />
      </mesh>
      {[-3.5, 3.5].map((e) => (
        <mesh key={e} position={[0, 0, e]} scale={[on, 1, 1]}>
          <boxGeometry args={[length, 0.18, 0.18]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} />
        </mesh>
      ))}
      {on >= 1
        ? Array.from({ length: 14 }).map((_, i) => {
            const x = ((((i * 12 + dir * t * 10) % 168) + 168) % 168) - 84;
            return (
              <mesh key={i} position={[x, 0.05, 0]} rotation={[-Math.PI / 2, 0, dir > 0 ? -Math.PI / 2 : Math.PI / 2]}>
                <circleGeometry args={[1.4, 3]} />
                <meshBasicMaterial color={color} transparent opacity={0.65} depthWrite={false} />
              </mesh>
            );
          })
        : null}
      {tex ? (
        <group position={[labelX, 4.5, -4]}>
          <mesh position={[0, -2.5, 0]}>
            <boxGeometry args={[0.3, 5, 0.3]} />
            <meshStandardMaterial color="#d9dde3" />
          </mesh>
          <mesh>
            <planeGeometry args={[7, 2.6]} />
            <meshStandardMaterial map={tex} emissive={color} emissiveIntensity={0.25} side={2} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};

/** Rooftop landing pad: yellow ring with a big "P". */
export const LandingPad: React.FC<{ position: V3; r?: number; lit?: number }> = ({ position, r = 6, lit = 0 }) => {
  const tex = textTexture("P", "#2b2f36", "#ffd23f", 256, 256, "bold 200px 'Lilita One', sans-serif");
  return (
    <group position={position}>
      <mesh receiveShadow>
        <cylinderGeometry args={[r, r, 0.4, 32]} />
        <meshStandardMaterial color="#2b2f36" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[r * 0.78, r * 0.9, 40]} />
        <meshStandardMaterial color="#ffd23f" emissive="#ffd23f" emissiveIntensity={0.2 + lit} />
      </mesh>
      <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[r * 1.1, r * 1.1]} />
        <meshStandardMaterial map={tex} transparent roughness={0.8} />
      </mesh>
    </group>
  );
};

/** Stepped blocky mountain with a snow cap. */
export const Mountain: React.FC<{ position: V3; h?: number; r?: number; color?: string }> = ({ position, h = 40, r = 30, color = "#6f8f5a" }) => {
  const steps = 7;
  return (
    <group position={position}>
      {Array.from({ length: steps }).map((_, i) => {
        const k = 1 - i / steps;
        const snow = i >= steps - 2;
        return (
          <mesh key={i} position={[0, (i + 0.5) * (h / steps), 0]} rotation={[0, i * 0.35, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[r * (k - 1 / steps) + 2, r * k + 2, h / steps, 7]} />
            <meshStandardMaterial color={snow ? "#f4f7fb" : i > 3 ? "#8a8f98" : color} roughness={0.9} flatShading />
          </mesh>
        );
      })}
    </group>
  );
};

/** Ocean plane + small sandy island. */
export const Ocean: React.FC<{ y?: number }> = ({ y = 0 }) => (
  <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <planeGeometry args={[800, 800]} />
    <meshStandardMaterial color="#2a9df4" roughness={0.25} metalness={0.1} />
  </mesh>
);
export const Island: React.FC<{ position: V3; r?: number }> = ({ position, r = 9 }) => (
  <group position={position}>
    <mesh position={[0, 0.4, 0]} receiveShadow castShadow>
      <cylinderGeometry args={[r, r + 2, 1.4, 24]} />
      <meshStandardMaterial color="#f2d79b" roughness={0.9} />
    </mesh>
    <mesh position={[0, 0.2, 0]}>
      <cylinderGeometry args={[r + 3.5, r + 3.5, 0.2, 24]} />
      <meshStandardMaterial color="#7fd8f5" transparent opacity={0.6} />
    </mesh>
  </group>
);

/** Pizza box with a label. */
export const PizzaBox: React.FC<{ position: V3; rotationY?: number; scale?: number }> = ({ position, rotationY = 0, scale = 1 }) => {
  const tex = textTexture("PIZZA", "#f7f1e3", "#c0262d", 256, 256, "bold 80px 'Lilita One', sans-serif");
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh geometry={rbox(2.2, 0.4, 2.2, 0.05)} material={plastic("#f7f1e3", 0.8)} castShadow />
      <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.1, 2.1]} />
        <meshStandardMaterial map={tex} roughness={0.8} />
      </mesh>
    </group>
  );
};

/** Soft round cloud puffs for sky scenes. */
export const Clouds: React.FC<{ count?: number; area?: number; y?: number; seed?: string; z?: number }> = ({ count = 14, area = 260, y = 70, seed = "cl", z = -60 }) => (
  <group>
    {Array.from({ length: count }).map((_, i) => {
      const x = rr(`${seed}x${i}`, -area / 2, area / 2);
      const zz = z + rr(`${seed}z${i}`, -40, 40);
      const yy = y + rr(`${seed}y${i}`, -12, 12);
      const s = rr(`${seed}s${i}`, 4, 9);
      return (
        <group key={i} position={[x, yy, zz]}>
          {[0, 1, 2].map((k) => (
            <mesh key={k} position={[(k - 1) * s * 1.1, k === 1 ? s * 0.4 : 0, 0]}>
              <sphereGeometry args={[s * (k === 1 ? 1.2 : 0.9), 12, 10]} />
              <meshStandardMaterial color="#ffffff" roughness={1} />
            </mesh>
          ))}
        </group>
      );
    })}
  </group>
);
