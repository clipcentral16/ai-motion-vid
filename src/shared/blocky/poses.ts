// Procedural animation for BlockCharacter, as pure functions of time.
// Angles are radians. Conventions (character faces +Z):
//   shoulder/hip X  : negative swings the limb forward
//   shoulder Z      : positive lifts the arm out to the side (mirrored per side)
//   elbow X         : negative bends the forearm forward/up
//   knee X          : positive bends the shin backward
//   ankle X         : keeps the foot flat / rolls it

export type Limb = { x: number; y?: number; z: number };
export type Pose = {
  /** Pelvis height offset (studs) and rotation. */
  bob: number;
  pelvisYaw: number;
  pelvisRoll: number;
  /** Torso lean (forward +) and twist. */
  lean: number;
  torsoYaw: number;
  torsoRoll: number;
  breathe: number;
  head: { x: number; y: number; z: number };
  shoulderL: Limb;
  shoulderR: Limb;
  elbowL: Limb;
  elbowR: Limb;
  hipL: Limb;
  hipR: Limb;
  kneeL: number;
  kneeR: number;
  ankleL: number;
  ankleR: number;
};

const neutral = (): Pose => ({
  bob: 0,
  pelvisYaw: 0,
  pelvisRoll: 0,
  lean: 0,
  torsoYaw: 0,
  torsoRoll: 0,
  breathe: 0,
  head: { x: 0, y: 0, z: 0 },
  shoulderL: { x: 0, z: 0.06 },
  shoulderR: { x: 0, z: 0.06 },
  elbowL: { x: -0.15, z: 0 },
  elbowR: { x: -0.15, z: 0 },
  hipL: { x: 0, z: 0.02 },
  hipR: { x: 0, z: 0.02 },
  kneeL: 0.02,
  kneeR: 0.02,
  ankleL: 0,
  ankleR: 0,
});

/**
 * Walk / run cycle. `phase` advances with distance travelled (radians);
 * `speed` 0..1 blends from a relaxed walk to a full run.
 */
export const walk = (phase: number, speed = 0): Pose => {
  const p = neutral();
  const s = speed;
  const stride = 0.5 + 0.35 * s;
  const sinP = Math.sin(phase);
  const legL = sinP;
  const legR = -sinP;

  // Hips swing the legs; knees bend mostly during the swing (when the leg
  // is travelling forward), ankles keep the feet roughly flat.
  const swing = (leg: number, ph: number) => {
    const forward = Math.cos(ph); // > 0 while the leg swings forward
    const hip = -leg * stride;
    const knee = 0.08 + (0.85 + 0.6 * s) * Math.pow(Math.max(0, forward), 1.6) + 0.12 * Math.max(0, -leg);
    const ankle = -hip * 0.55 - knee * 0.45 + (leg < -0.6 ? 0.25 * (-leg - 0.6) : 0); // toe-off
    return { hip, knee, ankle };
  };
  const L = swing(legL, phase);
  const R = swing(legR, phase + Math.PI);
  p.hipL = { x: L.hip, z: 0.03 };
  p.hipR = { x: R.hip, z: 0.03 };
  p.kneeL = L.knee;
  p.kneeR = R.knee;
  p.ankleL = L.ankle;
  p.ankleR = R.ankle;

  // Body: two bobs per cycle (lowest at foot contact), side sway, counter-twist.
  p.bob = -0.08 - 0.12 * s + (0.09 + 0.1 * s) * Math.abs(Math.sin(phase));
  p.pelvisRoll = 0.045 * sinP;
  p.pelvisYaw = 0.12 * sinP;
  p.torsoYaw = -0.2 * sinP;
  p.torsoRoll = -0.03 * sinP;
  p.lean = 0.05 + 0.22 * s;
  p.head = { x: -0.04 - 0.1 * s + 0.03 * Math.cos(phase * 2), y: 0.1 * sinP, z: 0 };

  // Arms counter-swing with a little lag; elbows bend more as they come forward.
  const lag = phase - 0.25;
  const armL = -Math.sin(lag); // forward when the right leg is forward
  const armR = Math.sin(lag);
  const armAmp = 0.45 + 0.5 * s;
  p.shoulderL = { x: -armL * armAmp, z: 0.08 };
  p.shoulderR = { x: -armR * armAmp, z: 0.08 };
  p.elbowL = { x: -(0.25 + 0.55 * s) - 0.35 * Math.max(0, armL), z: 0 };
  p.elbowR = { x: -(0.25 + 0.55 * s) - 0.35 * Math.max(0, armR), z: 0 };
  return p;
};

/** Standing idle: breathing, a slow weight shift, small head movements. */
export const idle = (t: number, seed = 0): Pose => {
  const p = neutral();
  const w = Math.sin(t * 0.9 + seed);
  p.breathe = Math.sin(t * 2.2 + seed) * 0.5 + 0.5;
  p.pelvisRoll = 0.03 * w;
  p.bob = -0.02 * Math.abs(w);
  p.torsoRoll = -0.02 * w;
  p.hipL = { x: 0, z: 0.04 + 0.02 * w };
  p.hipR = { x: 0, z: 0.04 - 0.02 * w };
  p.kneeL = 0.04 + 0.05 * Math.max(0, w);
  p.kneeR = 0.04 + 0.05 * Math.max(0, -w);
  p.head = { x: 0.03 * Math.sin(t * 0.7 + seed), y: 0.15 * Math.sin(t * 0.45 + seed * 2), z: 0.03 * w };
  p.shoulderL = { x: 0.04 * Math.sin(t * 2.2 + seed), z: 0.08 };
  p.shoulderR = { x: 0.04 * Math.sin(t * 2.2 + seed + 1), z: 0.08 };
  p.elbowL = { x: -0.2, z: 0 };
  p.elbowR = { x: -0.2, z: 0 };
  return p;
};

/** Mix two poses (k = 0 → a, 1 → b). */
export const blend = (a: Pose, b: Pose, k: number): Pose => {
  const m = (x: number, y: number) => x + (y - x) * k;
  const limb = (x: Limb, y: Limb): Limb => ({ x: m(x.x, y.x), y: m(x.y ?? 0, y.y ?? 0), z: m(x.z, y.z) });
  return {
    bob: m(a.bob, b.bob),
    pelvisYaw: m(a.pelvisYaw, b.pelvisYaw),
    pelvisRoll: m(a.pelvisRoll, b.pelvisRoll),
    lean: m(a.lean, b.lean),
    torsoYaw: m(a.torsoYaw, b.torsoYaw),
    torsoRoll: m(a.torsoRoll, b.torsoRoll),
    breathe: m(a.breathe, b.breathe),
    head: { x: m(a.head.x, b.head.x), y: m(a.head.y, b.head.y), z: m(a.head.z, b.head.z) },
    shoulderL: limb(a.shoulderL, b.shoulderL),
    shoulderR: limb(a.shoulderR, b.shoulderR),
    elbowL: limb(a.elbowL, b.elbowL),
    elbowR: limb(a.elbowR, b.elbowR),
    hipL: limb(a.hipL, b.hipL),
    hipR: limb(a.hipR, b.hipR),
    kneeL: m(a.kneeL, b.kneeL),
    kneeR: m(a.kneeR, b.kneeR),
    ankleL: m(a.ankleL, b.ankleL),
    ankleR: m(a.ankleR, b.ankleR),
  };
};

/** Idle with the right arm waving overhead. */
export const wave = (t: number, seed = 0): Pose => {
  const p = idle(t, seed);
  p.shoulderR = { x: -0.15, z: 2.55 };
  p.elbowR = { x: 0, z: 0.35 + 0.45 * Math.sin(t * 9) };
  p.torsoRoll = -0.05;
  p.head = { ...p.head, z: 0.08 };
  return p;
};

/** Both arms up, bouncing. */
export const cheer = (t: number, seed = 0): Pose => {
  const p = idle(t, seed);
  const b = Math.abs(Math.sin(t * 6 + seed));
  p.bob = 0.35 * b;
  p.kneeL = p.kneeR = 0.35 * (1 - b);
  p.ankleL = p.ankleR = -0.2 * (1 - b);
  p.hipL = { x: -0.15 * (1 - b), z: 0.06 };
  p.hipR = { x: -0.15 * (1 - b), z: 0.06 };
  p.shoulderL = { x: -0.2, z: 2.6 + 0.2 * Math.sin(t * 12 + seed) };
  p.shoulderR = { x: -0.2, z: 2.6 + 0.2 * Math.sin(t * 12 + seed + 1) };
  p.elbowL = { x: 0, z: 0.3 };
  p.elbowR = { x: 0, z: 0.3 };
  p.head = { x: -0.15, y: 0, z: 0 };
  return p;
};

/** Hunched, knees bent, hands up by the face, trembling. */
export const scared = (t: number, seed = 0): Pose => {
  const p = neutral();
  const tr = Math.sin(t * 40 + seed) * 0.03;
  p.bob = -0.25;
  p.kneeL = p.kneeR = 0.5;
  p.hipL = { x: -0.3, z: 0.1 };
  p.hipR = { x: -0.3, z: 0.1 };
  p.ankleL = p.ankleR = -0.2;
  p.lean = 0.15;
  p.torsoRoll = tr;
  p.shoulderL = { x: -0.9 + tr, z: 0.5 };
  p.shoulderR = { x: -0.9 - tr, z: 0.5 };
  p.elbowL = { x: -1.6, z: 0 };
  p.elbowR = { x: -1.6, z: 0 };
  p.head = { x: 0.1, y: 0.25 * Math.sin(t * 2 + seed), z: tr };
  return p;
};

/** Slumped: head down, shoulders forward, arms hanging. */
export const sad = (t: number, seed = 0): Pose => {
  const p = idle(t * 0.6, seed);
  p.lean = 0.12;
  p.head = { x: 0.35, y: 0.05 * Math.sin(t * 0.5), z: 0 };
  p.shoulderL = { x: -0.1, z: 0.02 };
  p.shoulderR = { x: -0.1, z: 0.02 };
  p.elbowL = { x: -0.05, z: 0 };
  p.elbowR = { x: -0.05, z: 0 };
  return p;
};

/** Arms folded across the chest (grumpy). */
export const armsCrossed = (t: number, seed = 0): Pose => {
  const p = idle(t, seed);
  p.shoulderL = { x: -0.45, z: -0.12, y: 0.2 };
  p.shoulderR = { x: -0.45, z: -0.12, y: -0.2 };
  p.elbowL = { x: -1.7, z: 0, y: 0.9 };
  p.elbowR = { x: -1.7, z: 0, y: -0.9 };
  p.head = { ...p.head, z: 0.06 };
  return p;
};

/** Proud stance with fists on hips. */
export const handsOnHips = (t: number, seed = 0): Pose => {
  const p = idle(t, seed);
  p.shoulderL = { x: 0.15, z: 0.75 };
  p.shoulderR = { x: 0.15, z: 0.75 };
  p.elbowL = { x: -0.3, z: -1.55 };
  p.elbowR = { x: -0.3, z: -1.55 };
  p.head = { x: -0.08, y: p.head.y, z: 0 };
  p.lean = -0.04;
  return p;
};
