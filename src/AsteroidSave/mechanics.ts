import { Easing, interpolate } from "remotion";
import { AIR_ROLL, CATCH, FLICK, RESET, SCENE_SECONDS } from "./constants";

// The save as one continuous move, as pure functions of "save time" T:
// T = scene-4 local time, and T = SCENE4_LEN + local time in scene 5.
//
//   zen touch  -> he air rolls in and the touch pauses all momentum: car and
//                 rock hang together, frozen, for the rest of scene 4
//   flip reset -> from the pause he rolls (accelerating) into a half-roll so
//                 he's upside down with all 4 wheels on the rock
//   musty      -> roll out upright, drop back nose-down, backflip; the nose
//                 meets the rock's surface aimed through its centre and the
//                 flip follows through to a full rotation
//
// Side-on arena: the car faces +X (yaw π/2), Y is up. Car pose is an Euler
// [pitch, yaw, roll] in "YXZ" order; pitch < 0 = nose up.

export const ROCK_R = 2.2;
const YAW = Math.PI / 2;
const NOSE = 1.35; // centre-to-nose length
export const SCENE4_LEN = SCENE_SECONDS[3];

const T_CATCH = CATCH;
const T_RESET = SCENE4_LEN + RESET;
const T_FLICK = SCENE4_LEN + FLICK;

/** Where the car is at the zen touch (the origin of the arena). */
const C: [number, number] = [0, 0];
/** Slow drift once things start moving again after the pause. */
const V: [number, number] = [0.45, 0.35];
/** The pause ends when scene 5 starts. */
const T_GO = SCENE4_LEN;

// Air roll: two spins before the touch (ends upright), frozen during the
// pause, then an accelerating half-roll so he's upside down at the reset,
// then rolls out upright.
const ROLL_AT_CATCH = Math.PI * 4;
const ROLL_AT_RESET = ROLL_AT_CATCH + Math.PI;
const OMEGA = (2 * (ROLL_AT_RESET - ROLL_AT_CATCH)) / (T_RESET - T_GO); // spin rate reached at the reset
// Last half-turn eases out (sine) starting at the same spin rate.
const ROLL_OUT = (Math.PI * Math.PI) / (2 * OMEGA);
const T_UPRIGHT = T_RESET + ROLL_OUT;
// The musty set-up (drop back, nose dip) starts while it's still rolling out.
const T_SET = T_RESET + 0.2;

// Musty: nose-up angle φ (= -pitch) through the flip.
const PHI_SETUP = -0.45; // nose dipped
const PHI_CONTACT = 1.15; // nose up-and-forward at contact
const FLIP_SPEED = 7; // rad/s, same before and after contact (follow-through)
const T_FLIP_START = T_FLICK - (PHI_CONTACT - PHI_SETUP) / FLIP_SPEED;
const T_FLIP_END = T_FLICK + (Math.PI * 2 - PHI_CONTACT) / FLIP_SPEED;
const SHOT: [number, number] = [Math.cos(PHI_CONTACT), Math.sin(PHI_CONTACT)];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Pose = { pos: [number, number, number]; rot: [number, number, number, "YXZ"]; noseUp: number };
type Rock = { pos: [number, number, number]; squash: number; heat: number; spin: number };

const roll = (T: number) => {
  if (T < T_CATCH) return interpolate(T, [AIR_ROLL - 0.15, T_CATCH], [0, ROLL_AT_CATCH], { ...clamp, easing: Easing.inOut(Easing.sin) });
  if (T < T_GO) return ROLL_AT_CATCH;
  if (T < T_RESET) {
    const u = (T - T_GO) / (T_RESET - T_GO);
    return ROLL_AT_CATCH + (ROLL_AT_RESET - ROLL_AT_CATCH) * u * u;
  }
  if (T < T_UPRIGHT) return ROLL_AT_RESET + Math.PI * Math.sin(((T - T_RESET) / ROLL_OUT) * (Math.PI / 2));
  return ROLL_AT_RESET + Math.PI;
};

/** Rock height above the car centre while dribbling: pushed up when the car is side-on. */
const rideHeight = (r: number) => 0.5 + ROCK_R * 0.95 + 0.55 * Math.abs(Math.sin(r));

/** Car path before the musty set-up begins. */
const flyPos = (T: number): [number, number] => {
  if (T < T_CATCH) {
    // Climb in from below-left, decelerating to a stop at the touch.
    const k = (T_CATCH - T) / T_CATCH;
    return [C[0] - 7 * k * k, C[1] - 9 * k * k];
  }
  // Paused (a tiny hover), then a slow drift once he goes again.
  const hover = Math.sin((T - T_CATCH) * 2.2) * 0.05;
  const go = Math.max(0, T - T_GO);
  return [C[0] + V[0] * go, C[1] + V[1] * go + hover];
};

/** Rock centre when the set-up starts, and at the flick (it floats on with the car's velocity). */
const rockAtSet = (): [number, number] => {
  const p = flyPos(T_SET);
  return [p[0], p[1] + rideHeight(roll(T_SET))];
};
const rockAtFlick = (): [number, number] => {
  const a = rockAtSet();
  return [a[0] + V[0] * (T_FLICK - T_SET) * 0.6, a[1] + V[1] * (T_FLICK - T_SET) * 0.6];
};

/** Car position at the flick: nose tip on the rock's surface, aimed through its centre. */
const carAtFlick = (): [number, number] => {
  const r = rockAtFlick();
  const d = NOSE + ROCK_R * 0.9;
  return [r[0] - SHOT[0] * d, r[1] - SHOT[1] * d];
};

export const carPose = (T: number): Pose => {
  const rl = roll(T);
  let x: number, y: number, phi: number;
  if (T < T_SET) {
    [x, y] = flyPos(T);
    // Nose follows the climb, level from the touch onward.
    phi = interpolate(T, [0, T_CATCH - 0.35, T_CATCH], [0.95, 0.7, 0], clamp);
  } else {
    // Drop back into the musty set-up, flip through the rock, follow through.
    const from = flyPos(T_SET);
    const at = carAtFlick();
    const after: [number, number] = [at[0] + 0.6, at[1] + 1.4];
    x = interpolate(T, [T_SET, T_FLIP_START, T_FLICK, T_FLIP_END + 0.6], [from[0], at[0] - 0.3, at[0], after[0]], {
      ...clamp,
      easing: Easing.inOut(Easing.sin),
    });
    y = interpolate(T, [T_SET, T_FLIP_START, T_FLICK, T_FLIP_END + 0.6], [from[1], at[1] - 0.25, at[1], after[1]], {
      ...clamp,
      easing: Easing.inOut(Easing.sin),
    });
    if (T < T_FLIP_START) {
      phi = interpolate(T, [T_SET + 0.1, T_FLIP_START], [0, PHI_SETUP], { ...clamp, easing: Easing.inOut(Easing.quad) });
    } else if (T < T_FLIP_END) {
      // Constant spin rate straight through contact = proper follow-through.
      phi = PHI_SETUP + FLIP_SPEED * (T - T_FLIP_START);
    } else {
      phi = Math.PI * 2;
    }
  }
  const bob = 0;
  return { pos: [x, y + bob, 0], rot: [-phi, YAW, rl, "YXZ"], noseUp: phi };
};

export const rockState = (T: number): Rock => {
  if (T < T_CATCH) {
    // Falling in fast from the upper right, hot from the atmosphere.
    const d = T_CATCH - T;
    const p = flyPos(T_CATCH);
    return { pos: [p[0] + d * 5.5, p[1] + rideHeight(ROLL_AT_CATCH) + d * 8, 0], squash: 1, heat: 1, spin: T * 1.5 };
  }
  if (T < T_FLICK) {
    // Zen touch: momentum gone, it rides on the rolling car.
    const s = T - T_CATCH;
    const touch = 1 - 0.18 * Math.exp(-s * 7) * Math.cos(s * 18);
    let pos: [number, number];
    if (T < T_SET) {
      const p = flyPos(T);
      pos = [p[0], p[1] + rideHeight(roll(T))];
    } else {
      const a = rockAtSet();
      const b = rockAtFlick();
      const u = (T - T_SET) / (T_FLICK - T_SET);
      pos = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    }
    const reset = Math.exp(-Math.max(0, T - T_RESET) * 8) * (T > T_RESET ? 1 : 0);
    return { pos: [pos[0], pos[1], 0], squash: touch - reset * 0.1, heat: Math.max(0, 1 - s * 0.6), spin: T_CATCH * 1.5 + s * 0.4 };
  }
  // Flicked: launched along the nose direction, accelerating away.
  const s = T - T_FLICK;
  const r = rockAtFlick();
  const dist = s * 24 + s * s * 20;
  return {
    pos: [r[0] + SHOT[0] * dist, r[1] + SHOT[1] * dist, -s * 2],
    squash: 1 + 0.3 * Math.exp(-s * 6),
    heat: Math.min(1, s * 1.5),
    spin: T_CATCH * 1.5 + 2 + s * 6,
  };
};

/** Wheel glow for the flip reset. */
export const resetGlow = (T: number) => interpolate(T, [T_RESET - 0.05, T_RESET, T_RESET + 0.6], [0, 1, 0], clamp);

/** Where the flick's impact effects go: the nose tip at contact. */
export const flickPoint = (): [number, number, number] => {
  const r = rockAtFlick();
  return [r[0] - SHOT[0] * ROCK_R * 0.9, r[1] - SHOT[1] * ROCK_R * 0.9, 0];
};

export const SAVE = { T_CATCH, T_RESET, T_FLICK, T_UPRIGHT, T_SET, T_FLIP_START, T_FLIP_END };
