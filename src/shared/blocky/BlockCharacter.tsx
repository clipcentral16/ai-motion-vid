import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Pose } from "./poses";
import { faceTexture, type Expression } from "./textures";

// Jointed block character (generic "brick avatar" style, not any brand's).
// Units are studs: ~5.3 tall, pelvis at y = 2, facing +Z.

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
/** Smooth, slightly glossy plastic. */
export const plastic = (color: string, roughness = 0.55) => {
  const k = `${color}|${roughness}`;
  let m = matCache.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
    matCache.set(k, m);
  }
  return m;
};

const faceGeo = new THREE.PlaneGeometry(1.08, 1.08);
const faceMats = new Map<string, THREE.MeshBasicMaterial>();
const faceMat = (expr: Expression, blink: boolean) => {
  const k = `${expr}|${blink}`;
  let m = faceMats.get(k);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ map: faceTexture(expr, blink), transparent: true, depthWrite: false });
    m.polygonOffset = true;
    m.polygonOffsetFactor = -2;
    faceMats.set(k, m);
  }
  return m;
};

export type HairStyle = "spiky" | "cap" | "ponytails" | "long" | "buzz" | "bald";

export type Look = {
  skin: string;
  shirt: string;
  pants: string;
  shoes: string;
  hair: HairStyle;
  hairColor: string;
  sleeves?: "long" | "short";
  /** Hoodie pocket + strings, or an open jacket over the shirt. */
  top?: "tee" | "hoodie" | "jacket";
  jacket?: string;
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

const S = (m: THREE.Material, g: THREE.BufferGeometry, pos: [number, number, number]) => (
  <mesh geometry={g} material={m} position={pos} castShadow receiveShadow />
);

const Hair: React.FC<{ style: HairStyle; color: string }> = ({ style, color }) => {
  const m = plastic(color, 0.7);
  switch (style) {
    case "spiky":
      return (
        <group>
          {S(m, rbox(1.32, 0.35, 1.22, 0.1), [0, 0.62, -0.02])}
          {[-0.4, 0, 0.4].map((x, i) => (
            <mesh key={i} geometry={rbox(0.42, 0.55, 0.5, 0.08)} material={m} position={[x, 0.85, 0.15 - i * 0.18]} rotation={[-0.4, 0, (i - 1) * -0.4]} castShadow />
          ))}
          {S(m, rbox(1.3, 0.3, 0.32, 0.08), [0, 0.45, 0.48])}
          {S(m, rbox(1.32, 0.9, 0.32, 0.08), [0, 0.2, -0.48])}
        </group>
      );
    case "cap":
      return (
        <group>
          {S(m, rbox(1.34, 0.4, 1.24, 0.12), [0, 0.6, 0])}
          {S(m, rbox(1.32, 0.95, 0.3, 0.08), [0, 0.18, -0.5])}
          {S(m, rbox(1.3, 0.22, 0.3, 0.06), [0, 0.42, 0.5])}
        </group>
      );
    case "ponytails":
      return (
        <group>
          {S(m, rbox(1.34, 0.36, 1.24, 0.12), [0, 0.6, 0])}
          {S(m, rbox(1.3, 0.22, 0.3, 0.06), [0, 0.42, 0.5])}
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={rbox(0.38, 0.85, 0.38, 0.14)} material={m} position={[s * 0.82, 0.05, -0.1]} rotation={[0, 0, s * 0.35]} castShadow />
          ))}
        </group>
      );
    case "long":
      return (
        <group>
          {S(m, rbox(1.36, 0.4, 1.26, 0.12), [0, 0.6, 0])}
          {S(m, rbox(1.36, 1.5, 0.35, 0.1), [0, -0.1, -0.5])}
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={rbox(0.22, 1.2, 0.9, 0.08)} material={m} position={[s * 0.66, 0.05, -0.12]} castShadow />
          ))}
        </group>
      );
    case "buzz":
      return S(m, rbox(1.3, 0.16, 1.2, 0.08), [0, 0.6, 0]);
    default:
      return null;
  }
};

export const BlockCharacter: React.FC<Props> = ({ look, pose, expression = "happy", t, seed = 0, position = [0, 0, 0], rotationY = 0, scale = 1 }) => {
  const skin = plastic(look.skin, 0.5);
  const shirt = plastic(look.shirt);
  const pants = plastic(look.pants, 0.65);
  const shoes = plastic(look.shoes, 0.5);
  const forearm = look.sleeves === "short" ? skin : shirt;
  const blink = (t + seed * 1.37) % 3.4 < 0.12;
  const breathe = 1 + pose.breathe * 0.015;

  const arm = (side: 1 | -1) => {
    const sh = side === 1 ? pose.shoulderR : pose.shoulderL;
    const el = side === 1 ? pose.elbowR : pose.elbowL;
    // Mirror sideways rotations so positive z always lifts the arm outward.
    return (
      <group position={[side * 1.5, 1.75, 0]} rotation={[sh.x, (sh.y ?? 0) * side, sh.z * side]}>
        {S(shirt, rbox(0.95, 1.1, 0.95), [0, -0.3, 0])}
        <group position={[0, -0.85, 0]} rotation={[el.x, (el.y ?? 0) * side, el.z * side]}>
          {S(forearm, rbox(0.9, 0.8, 0.9), [0, -0.35, 0])}
          {S(skin, rbox(0.88, 0.42, 0.88, 0.16), [0, -0.92, 0])}
        </group>
      </group>
    );
  };

  const leg = (side: 1 | -1) => {
    const hip = side === 1 ? pose.hipR : pose.hipL;
    const knee = side === 1 ? pose.kneeR : pose.kneeL;
    const ankle = side === 1 ? pose.ankleR : pose.ankleL;
    return (
      <group position={[side * 0.5, 0, 0]} rotation={[hip.x, (hip.y ?? 0) * side, hip.z * side]}>
        {S(pants, rbox(0.96, 1.08, 0.96), [0, -0.5, 0])}
        <group position={[0, -1.0, 0]} rotation={[knee, 0, 0]}>
          {S(pants, rbox(0.92, 0.82, 0.92), [0, -0.36, 0])}
          <group position={[0, -0.78, 0]} rotation={[ankle, 0, 0]}>
            {S(shoes, rbox(0.98, 0.26, 1.28, 0.1), [0, -0.09, 0.14])}
            {S(plastic("#f2f2f2", 0.6), rbox(1.0, 0.07, 1.3, 0.03), [0, -0.2, 0.14])}
          </group>
        </group>
      </group>
    );
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {/* Pelvis */}
      <group position={[0, 2 + pose.bob, 0]} rotation={[0, pose.pelvisYaw, pose.pelvisRoll]}>
        {leg(-1)}
        {leg(1)}
        {/* Torso */}
        <group rotation={[pose.lean, pose.torsoYaw, pose.torsoRoll]} scale={[1, breathe, 1 + (breathe - 1) * 2]}>
          {S(pants, rbox(2, 0.4, 1, 0.1), [0, 0.2, 0])}
          {S(shirt, rbox(2, 1.7, 1, 0.14), [0, 1.15, 0])}
          {look.top === "hoodie" ? (
            <>
              {S(plastic(look.shirt, 0.8), rbox(1.1, 0.45, 0.12, 0.06), [0, 0.65, 0.5])}
              {[-0.2, 0.2].map((x) => (
                <mesh key={x} geometry={rbox(0.07, 0.5, 0.07, 0.02)} material={plastic("#f5f5f5")} position={[x, 1.55, 0.53]} />
              ))}
            </>
          ) : null}
          {look.top === "jacket" && look.jacket ? (
            <>
              {[-1, 1].map((s) => (
                <mesh key={s} geometry={rbox(0.62, 1.72, 1.06, 0.12)} material={plastic(look.jacket!)} position={[s * 0.7, 1.15, 0]} castShadow />
              ))}
            </>
          ) : null}
          {arm(-1)}
          {arm(1)}
          {/* Head */}
          <group position={[0, 2.0, 0]} rotation={[pose.head.x, pose.head.y, pose.head.z]}>
            {S(skin, rbox(0.55, 0.3, 0.55, 0.1), [0, 0.1, 0])}
            {S(skin, rbox(1.25, 1.2, 1.15, 0.22), [0, 0.68, 0])}
            <mesh geometry={faceGeo} material={faceMat(expression, blink)} position={[0, 0.66, 0.581]} />
            {/* Hair pieces are modelled around the head's centre */}
            <group position={[0, 0.68, 0]}>
              <Hair style={look.hair} color={look.hairColor} />
            </group>
          </group>
        </group>
      </group>
      {/* Soft contact shadow under the feet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[1.6, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  );
};
