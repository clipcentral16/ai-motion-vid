import { Easing, interpolate } from "remotion";
import { AIR_ROLL, CATCH, FLICK, RESET } from "./constants";

// The save, as pure functions of scene-local time (seconds).
// Side-on arena: the car faces +X (yaw π/2), X is "forward", Y is up.
// Car pose: position + Euler [pitch, yaw, roll] in "YXZ" order.
// pitch < 0 = nose up; roll = barrel roll around the car's forward axis.

export const ROCK_R = 2.2;
/** Asteroid centre when it sits on the car's roof (car centre at the origin). */
export const CATCH_POS: [number, number, number] = [0, 2.55, 0];
const YAW = Math.PI / 2;

type Pose = { pos: [number, number, number]; rot: [number, number, number, "YXZ"] };
type Rock = { pos: [number, number, number]; squash: number; heat: number; spin: number };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);

// ---------- Scene 4: air roll + catch ----------

export const catchCar = (t: number): Pose => {
  // Fly up from below-left, ease into the catch point.
  const u = interpolate(t, [0, CATCH], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const pos: [number, number, number] = [-7 * (1 - u), -9 * (1 - u) + Math.sin(t * 2) * 0.05 * u, 0];
  // Nose points along the climb, levelling out right at the catch.
  const pitch = interpolate(t, [0, CATCH - 0.35, CATCH], [-0.95, -0.7, 0], clamp);
  // Two full air rolls while "air rolled" is spoken.
  const roll = interpolate(t, [AIR_ROLL - 0.15, CATCH - 0.2], [0, Math.PI * 4], { ...clamp, easing: ease });
  const bob = t > CATCH ? Math.sin((t - CATCH) * 3) * 0.06 : 0;
  return { pos: [pos[0], pos[1] + bob, pos[2]], rot: [pitch, YAW, roll, "YXZ"] };
};

export const catchRock = (t: number): Rock => {
  if (t < CATCH) {
    // Falling in from the upper right, hot from the atmosphere.
    const d = CATCH - t;
    return { pos: [CATCH_POS[0] + d * 5.5, CATCH_POS[1] + d * 8, CATCH_POS[2]], squash: 1, heat: 1, spin: t * 1.5 };
  }
  // Dead stop on the roof: one squash, then it just sits there.
  const s = t - CATCH;
  const bob = Math.sin(s * 3) * 0.06;
  return {
    pos: [CATCH_POS[0], CATCH_POS[1] + bob, CATCH_POS[2]],
    squash: 1 - 0.18 * Math.exp(-s * 7) * Math.cos(s * 18),
    heat: Math.max(0, 1 - s * 0.6),
    spin: CATCH * 1.5,
  };
};

// ---------- Scene 5: flip reset + musty flick ----------

export const flickCar = (t: number): Pose => {
  const RISE_END = RESET;
  const back = RESET + 0.45;
  const setup = FLICK - 0.35;
  // Height: drop, rise to touch with the wheels (inverted), drop, rise under the rock.
  const y = interpolate(t, [0, 0.35, RISE_END, back, setup, FLICK, FLICK + 1.2], [0, -1.6, 0.18, -1.5, 0.15, 0.3, 1.4], { ...clamp, easing: ease });
  const x = interpolate(t, [0, RESET, back, setup, FLICK + 1.2], [0, 0, -1.2, -1.0, 0.4], { ...clamp, easing: ease });
  // Roll: upside down for the reset, back upright after.
  const roll = interpolate(t, [0, 0.35, RESET + 0.05, back], [0, Math.PI, Math.PI, Math.PI * 2], { ...clamp, easing: ease });
  // Pitch: nose dips for the musty set-up, then a full backflip through the rock.
  // At FLICK the nose points straight up into the rock (pitch -π/2), then the flip completes.
  const pitch = interpolate(t, [back, setup, FLICK, FLICK + 0.45, FLICK + 1.5], [0, 0.45, -Math.PI / 2, -Math.PI * 2, -Math.PI * 2], { ...clamp, easing: ease });
  return { pos: [x, y, 0], rot: [pitch, YAW, roll, "YXZ"] };
};

/** Wheel glow for the flip reset. */
export const resetGlow = (t: number) => interpolate(t, [RESET - 0.05, RESET, RESET + 0.6], [0, 1, 0], clamp);

export const flickRock = (t: number): Rock => {
  const nudge = interpolate(t, [RESET, RESET + 0.4], [0, 0.35], { ...clamp, easing: Easing.out(Easing.quad) });
  const drift = interpolate(t, [RESET + 0.4, FLICK], [0, -0.5], clamp);
  const base: [number, number, number] = [CATCH_POS[0] + drift, CATCH_POS[1] + nudge, CATCH_POS[2]];
  if (t < FLICK) return { pos: base, squash: 1 - 0.12 * Math.exp(-Math.max(0, t - RESET) * 8) * (t > RESET ? 1 : 0), heat: 0, spin: 3 + t * 0.3 };
  // Launched: fast and accelerating, straight up and slightly forward.
  const s = t - FLICK;
  return {
    pos: [base[0] + s * 3, base[1] + s * 26 + s * s * 22, base[2] - s * 2],
    squash: 1 + 0.3 * Math.exp(-s * 6),
    heat: Math.min(1, s * 1.5),
    spin: 3 + FLICK * 0.3 + s * 6,
  };
};
