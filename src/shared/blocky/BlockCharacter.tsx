import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Pose } from "./poses";
import { beltTexture, faceTexture, legFrontTexture, torsoBackTexture, torsoFrontTexture, type Expression, type Top } from "./textures";

// Jointed block character (generic "brick avatar" style, not any brand's).
// Units are studs: an adult is ~5.3 tall with the pelvis at y = 2, facing +Z.
// Kids have shorter legs, torso and arms but the same head, so they read as
// younger without being a shrunk adult.

const geoCache = new Map<string, THREE.BufferGeometry>();
export const rbox = (w: number, h: number, d: number, r = 0.12) => {
  const k = `${w}|${h}|${d}|${r}`;
  let g = geoCache.get(k);
  if (!g) {
    g = new RoundedBoxGeometry(w, h, d, 3, r);
    geoCache.set(k, g);
  }
  return g;
};

const matCache = new Map<string, THREE.MeshStandardMaterial>();
/** Smooth, matte-ish plastic. */
export const plastic = (color: string, roughness = 0.62) => {
  const k = `${color}|${roughness}`;
  let m = matCache.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
    matCache.set(k, m);
  }
  return m;
};

const planeCache = new Map<string, THREE.PlaneGeometry>();
const plane = (w: number, h: number) => {
  const k = `${w}|${h}`;
  let g = planeCache.get(k);
  if (!g) {
    g = new THREE.PlaneGeometry(w, h);
    planeCache.set(k, g);
  }
  return g;
};

const decalCache = new Map<string, THREE.MeshStandardMaterial>();
/** Lit, transparent decal material that sits just on top of a surface. */
const decal = (key: string, map: THREE.Texture) => {
  let m = decalCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ map, transparent: true, depthWrite: false, roughness: 0.65, polygonOffset: true, polygonOffsetFactor: -2 });
    decalCache.set(key, m);
  }
  return m;
};

const faceMats = new Map<string, THREE.MeshBasicMaterial>();
const faceMat = (expr: Expression, blink: boolean) => {
  const k = `${expr}|${blink}`;
  let m = faceMats.get(k);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ map: faceTexture(expr, blink), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    faceMats.set(k, m);
  }
  return m;
};

export type HairStyle = "spiky" | "cap" | "ponytails" | "long" | "buzz" | "bald" | "curly";

export type Look = {
  skin: string;
  shirt: string;
  pants: string;
  shoes: string;
  hair: HairStyle;
  hairColor: string;
  sleeves?: "long" | "short";
  /** Tee, hoodie (pocket + strings + hood), or an open jacket over `shirt`. */
  top?: Top;
  jacket?: string;
  jeans?: boolean;
  build?: "adult" | "kid";
  /** Hair tie colour for ponytails. */
  accent?: string;
  sunglasses?: boolean;
};

type Props = {
  look: Look;
  pose: Pose;
  expression?: Expression;
  /** Time in seconds, for blinking. */
  t: number;
  seed?: number;
  position?: [number, number, number];
  rotationY?: number;
  scale?: number;
};

const M = (m: THREE.Material, g: THREE.BufferGeometry, pos: [number, number, number], rot?: [number, number, number]) => (
  <mesh geometry={g} material={m} position={pos} rotation={rot} castShadow receiveShadow />
);

/** Hair, modelled around the head's centre (head is 1.25 x 1.2 x 1.15). */
const Hair: React.FC<{ style: HairStyle; color: string; accent?: string }> = ({ style, color, accent = "#ff4fa3" }) => {
  const m = plastic(color, 0.72);
  const cap = M(m, rbox(1.36, 0.38, 1.26, 0.14), [0, 0.6, -0.02]);
  const back = M(m, rbox(1.34, 0.9, 0.3, 0.1), [0, 0.2, -0.5]);
  switch (style) {
    case "spiky": {
      // A crown of chunky tufts swept up and back, plus a fringe.
      const tufts: [number, number, number, number, number][] = [
        [-0.45, 0.85, 0.32, -0.5, 0.4],
        [0.0, 0.92, 0.36, -0.6, 0],
        [0.45, 0.85, 0.32, -0.5, -0.4],
        [-0.5, 0.88, -0.1, 0.1, 0.5],
        [0.05, 0.98, -0.05, 0, 0.1],
        [0.5, 0.88, -0.1, 0.1, -0.5],
        [-0.3, 0.8, -0.45, 0.5, 0.3],
        [0.3, 0.8, -0.45, 0.5, -0.3],
      ];
      return (
        <group>
          {cap}
          {back}
          {tufts.map(([x, y, z, rx, rz], i) => (
            <mesh key={i} geometry={rbox(0.46, 0.62, 0.46, 0.12)} material={m} position={[x, y, z]} rotation={[rx, 0, rz]} castShadow />
          ))}
          {M(m, rbox(1.3, 0.26, 0.34, 0.1), [0, 0.46, 0.5], [0.35, 0, 0])}
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={rbox(0.2, 0.55, 0.7, 0.08)} material={m} position={[s * 0.66, 0.3, 0.1]} castShadow />
          ))}
        </group>
      );
    }
    case "curly":
      return (
        <group>
          {back}
          {Array.from({ length: 11 }).map((_, i) => {
            const a = (i / 11) * Math.PI * 2;
            return <mesh key={i} geometry={rbox(0.5, 0.45, 0.5, 0.2)} material={m} position={[Math.cos(a) * 0.48, 0.72, Math.sin(a) * 0.45 - 0.05]} castShadow />;
          })}
          {M(m, rbox(0.8, 0.4, 0.8, 0.2), [0, 0.85, -0.05])}
        </group>
      );
    case "cap":
      return (
        <group>
          {cap}
          {back}
          {M(m, rbox(1.32, 0.24, 0.32, 0.08), [0, 0.44, 0.5])}
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={rbox(0.18, 0.5, 0.6, 0.06)} material={m} position={[s * 0.66, 0.32, 0.05]} castShadow />
          ))}
        </group>
      );
    case "ponytails":
      return (
        <group>
          {cap}
          {M(m, rbox(1.32, 0.24, 0.32, 0.08), [0, 0.44, 0.5])}
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.8, 0.35, -0.1]} rotation={[0, 0, s * 0.45]}>
              <mesh geometry={rbox(0.2, 0.2, 0.3, 0.06)} material={plastic(accent, 0.5)} castShadow />
              <mesh geometry={rbox(0.36, 0.75, 0.36, 0.16)} material={m} position={[s * 0.05, -0.42, 0]} castShadow />
            </group>
          ))}
        </group>
      );
    case "long":
      return (
        <group>
          {cap}
          {M(m, rbox(1.38, 1.55, 0.36, 0.12), [0, -0.1, -0.5])}
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={rbox(0.24, 1.25, 0.95, 0.1)} material={m} position={[s * 0.67, 0.05, -0.1]} castShadow />
          ))}
          {M(m, rbox(0.75, 0.3, 0.3, 0.1), [-0.25, 0.46, 0.5], [0.3, 0, 0.25])}
        </group>
      );
    case "buzz":
      return M(m, rbox(1.3, 0.18, 1.2, 0.08), [0, 0.6, 0]);
    default:
      return null;
  }
};

export const BlockCharacter: React.FC<Props> = ({ look, pose, expression = "happy", t, seed = 0, position = [0, 0, 0], rotationY = 0, scale = 1 }) => {
  const kid = look.build === "kid";
  // Proportions: kids keep the head but shorten legs, torso and arms.
  const L = kid ? 0.72 : 1; // legs
  const T = kid ? 0.8 : 1; // torso height
  const W = kid ? 0.9 : 1; // body width
  const A = kid ? 0.8 : 1; // arm length

  const top: Top = look.top ?? "tee";
  const outer = top === "jacket" && look.jacket ? look.jacket : look.shirt;
  const skin = plastic(look.skin, 0.55);
  const torsoMat = plastic(outer);
  const pants = plastic(look.pants, 0.7);
  const shoes = plastic(look.shoes, 0.5);
  const sleeve = plastic(outer);
  const forearm = look.sleeves === "short" ? skin : sleeve;
  const blink = (t + seed * 1.37) % 3.4 < 0.12;
  const breathe = 1 + pose.breathe * 0.015;
  const torsoH = 1.7 * T;
  const neckY = 0.4 * T + torsoH;

  const arm = (side: 1 | -1) => {
    const sh = side === 1 ? pose.shoulderR : pose.shoulderL;
    const el = side === 1 ? pose.elbowR : pose.elbowL;
    // Mirror sideways rotations so positive z always lifts the arm outward.
    return (
      <group position={[side * 1.5 * W, neckY - 0.25, 0]} rotation={[sh.x, (sh.y ?? 0) * side, sh.z * side]}>
        <group scale={[W, A, W]}>
          {M(sleeve, rbox(0.95, 1.1, 0.95), [0, -0.3, 0])}
        </group>
        {/* YXZ: bend the forearm first, then turn it inward (for folded arms) */}
        <group position={[0, -0.85 * A, 0]} rotation={[el.x, (el.y ?? 0) * side, el.z * side, "YXZ"]}>
          <group scale={[W, A, W]}>
            {M(forearm, rbox(0.9, 0.8, 0.9), [0, -0.35, 0])}
          </group>
          {M(skin, rbox(0.84 * W, 0.42, 0.84 * W, 0.16), [0, -0.92 * A, 0])}
        </group>
      </group>
    );
  };

  const leg = (side: 1 | -1) => {
    const hip = side === 1 ? pose.hipR : pose.hipL;
    const knee = side === 1 ? pose.kneeR : pose.kneeL;
    const ankle = side === 1 ? pose.ankleR : pose.ankleL;
    return (
      <group position={[side * 0.5 * W, 0, 0]} rotation={[hip.x, (hip.y ?? 0) * side, hip.z * side]}>
        <group scale={[W, L, W]}>
          {M(pants, rbox(0.96, 1.08, 0.96), [0, -0.5, 0])}
          <mesh geometry={plane(0.9, 1.0)} material={decal(`leg-${look.pants}-${!!look.jeans}`, legFrontTexture(look.pants, !!look.jeans))} position={[0, -0.5, 0.485]} />
        </group>
        <group position={[0, -1.0 * L, 0]} rotation={[knee, 0, 0]}>
          <group scale={[W, L, W]}>
            {M(pants, rbox(0.92, 0.82, 0.92), [0, -0.36, 0])}
          </group>
          <group position={[0, -0.78 * L, 0]} rotation={[ankle, 0, 0]}>
            {M(shoes, rbox(0.98 * W, 0.26, 1.28 * W, 0.1), [0, -0.09, 0.14])}
            {M(plastic("#f2f2f2", 0.6), rbox(1.0 * W, 0.07, 1.3 * W, 0.03), [0, -0.2, 0.14])}
          </group>
        </group>
      </group>
    );
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {/* Pelvis */}
      <group position={[0, 2 * L + pose.bob * L, 0]} rotation={[0, pose.pelvisYaw, pose.pelvisRoll]}>
        {leg(-1)}
        {leg(1)}
        {/* Torso */}
        <group rotation={[pose.lean, pose.torsoYaw, pose.torsoRoll]}>
          <group scale={[1, breathe, 1 + (breathe - 1) * 2]}>
            {M(pants, rbox(2 * W, 0.4 * T, 1, 0.1), [0, 0.2 * T, 0])}
            <mesh geometry={plane(2 * W, 0.4 * T)} material={decal(`belt-${look.pants}`, beltTexture(look.pants))} position={[0, 0.22 * T, 0.505]} />
            {M(torsoMat, rbox(2 * W, torsoH, 1, 0.16), [0, 0.4 * T + torsoH / 2, 0])}
            <mesh geometry={plane(1.96 * W, torsoH)} material={decal(`tf-${top}-${outer}-${look.shirt}`, torsoFrontTexture(top, outer, look.shirt))} position={[0, 0.4 * T + torsoH / 2, 0.506]} />
            <mesh
              geometry={plane(1.96 * W, torsoH)}
              material={decal(`tb-${top}-${outer}`, torsoBackTexture(top, outer))}
              position={[0, 0.4 * T + torsoH / 2, -0.506]}
              rotation={[0, Math.PI, 0]}
            />
            {top === "hoodie" ? M(plastic(outer, 0.75), rbox(1.5 * W, 0.4, 0.55, 0.18), [0, neckY - 0.02, -0.32]) : null}
            {top === "jacket" ? M(plastic(outer, 0.62), rbox(1.3 * W, 0.28, 0.9, 0.1), [0, neckY - 0.05, 0]) : null}
          </group>
          {arm(-1)}
          {arm(1)}
          {/* Head */}
          <group position={[0, neckY, 0]} rotation={[pose.head.x, pose.head.y, pose.head.z]}>
            {M(skin, rbox(0.55, 0.3, 0.55, 0.1), [0, 0.1, 0])}
            {M(skin, rbox(1.25, 1.2, 1.15, 0.24), [0, 0.68, 0])}
            <mesh geometry={plane(1.08, 1.08)} material={faceMat(expression, blink)} position={[0, 0.66, 0.581]} />
            {look.sunglasses ? (
              <group position={[0, 0.8, 0.6]}>
                {[-1, 1].map((s) => (
                  <mesh key={s} geometry={rbox(0.44, 0.28, 0.08, 0.06)} material={plastic("#111216", 0.15)} position={[s * 0.27, 0, 0]} />
                ))}
                <mesh geometry={rbox(1.3, 0.08, 0.08, 0.03)} material={plastic("#111216", 0.2)} position={[0, 0.08, 0]} />
              </group>
            ) : null}
            <group position={[0, 0.68, 0]}>
              <Hair style={look.hair} color={look.hairColor} accent={look.accent} />
            </group>
          </group>
        </group>
      </group>
      {/* Soft contact shadow under the feet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[1.6 * W, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.2} depthWrite={false} />
      </mesh>
    </group>
  );
};
