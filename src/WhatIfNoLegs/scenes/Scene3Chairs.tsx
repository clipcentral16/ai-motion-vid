import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { SHIRT_COLORS, SKIN_COLORS } from "../constants";
import { Character } from "../../shared/three/Character";
import { BOARD_DECK_Y, CHAIR_SEAT_Y, OfficeChair, Skateboard, TrafficLight } from "../../shared/three/Props";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { CameraRig, Lights, Street, punchFov } from "../../shared/three/World";
import { ollie, wrap } from "../../shared/three/motion";

const CHAIR_COLORS = ["#2d3142", "#ef476f", "#118ab2", "#06d6a0", "#ffd166", "#8338ec"];

// Two lanes of office chairs, nose to tail, all heading toward the camera (+Z).
const chairs = Array.from({ length: 30 }).map((_, i) => {
  const lane = i % 2;
  const row = Math.floor(i / 2);
  const r = (k: string) => random(`s3-${k}-${i}`);
  return {
    x: lane ? 1.5 : -1.5,
    z0: 4 - row * 1.75 + (r("z") - 0.5) * 0.3,
    phase: r("p") * Math.PI * 2,
    chair: CHAIR_COLORS[Math.floor(r("c") * CHAIR_COLORS.length)],
    color: SHIRT_COLORS[Math.floor(r("s") * SHIRT_COLORS.length)],
    skin: SKIN_COLORS[Math.floor(r("k") * SKIN_COLORS.length)],
    grumpy: r("g") < 0.45,
    // Some chairs do a full 360 spin at a random moment.
    spinAt: r("sp") < 0.55 ? 0.3 + r("st") * 3 : -1,
  };
});

// Board riders zipping past the jam on the sidewalks.
const riders = Array.from({ length: 10 }).map((_, i) => {
  const r = (k: string) => random(`s3r-${k}-${i}`);
  return {
    x: (i % 2 ? 1 : -1) * (3.9 + r("x") * 1.2),
    z0: -30 + r("z") * 44,
    dir: r("d") < 0.5 ? 1 : -1,
    speed: 4 + r("v") * 3,
    color: SHIRT_COLORS[Math.floor(r("s") * SHIRT_COLORS.length)],
    skin: SKIN_COLORS[Math.floor(r("k") * SKIN_COLORS.length)],
    board: CHAIR_COLORS[Math.floor(r("b") * CHAIR_COLORS.length)],
    ollie: r("o") * 2,
  };
});

// 3. Office chairs become the #1 car: a traffic jam of chairs. Camera cranes up.
export const Scene3Chairs: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.cubic) });

  const cam: [number, number, number] = [interpolate(p, [0, 1], [3.6, -2.5]), interpolate(p, [0, 1], [1.3, 9.5]), interpolate(p, [0, 1], [9, 14])];
  const target: [number, number, number] = [0, interpolate(p, [0, 1], [1.2, 0]), interpolate(p, [0, 1], [2, -8])];

  return (
    <SceneCanvas>
      <CameraRig position={cam} target={target} fov={punchFov(frame, fps, 64)} />
      <Lights fogNear={35} fogFar={110} />
      <Street />
      <TrafficLight position={[3.4, 0.1, 6.5]} rotationY={Math.PI * 0.85} />
      {chairs.map((c, i) => {
        // Stop-and-go creep forward
        const creep = 0.35 * t + 0.18 * Math.sin(t * 2.4 + c.phase);
        const z = c.z0 + creep;
        const spinU = c.spinAt < 0 ? 0 : Math.min(1, Math.max(0, (t - c.spinAt) / 0.7));
        const spin = Math.PI * 2 * (spinU < 0.5 ? 2 * spinU * spinU : 1 - Math.pow(-2 * spinU + 2, 2) / 2);
        const yaw = 0.3 * Math.sin(t * 2.2 + c.phase) + spin;
        // Little hop each time the jam lurches forward.
        const hop = Math.max(0, Math.sin(t * 4.8 + c.phase)) * 0.12;
        return (
          <group key={i} position={[c.x, hop, z]} rotation={[0, yaw, 0]}>
            <OfficeChair color={c.chair} />
            <Character
              position={[0, CHAIR_SEAT_Y, 0.05]}
              color={c.color}
              skin={c.skin}
              legs={0}
              shadow={false}
              expression={c.grumpy ? "shock" : "happy"}
              armSwing={Math.sin(t * 9 + c.phase) * 0.9}
              armsUp={spinU > 0 && spinU < 1 ? 0.95 : c.grumpy ? 0.25 + 0.25 * Math.sin(t * 11 + c.phase) : 0}
              lift={Math.abs(Math.sin(t * 6 + c.phase)) * 0.08}
              roll={Math.sin(t * 5 + c.phase) * 0.12}
            />
          </group>
        );
      })}
      {riders.map((r, i) => {
        const z = wrap(r.z0 + r.dir * r.speed * t, -34, 18);
        const rot = r.dir === 1 ? 0 : Math.PI;
        const o = ollie(t, r.ollie);
        return (
          <group key={`r${i}`} position={[r.x, 0.12 + o.h, z]} rotation={[o.pitch, rot, 0]}>
            <Skateboard color={r.board} />
            <Character
              position={[0, BOARD_DECK_Y, 0]}
              color={r.color}
              skin={r.skin}
              legs={0}
              shadow={false}
              armsUp={0.4}
              lean={0.15}
            />
          </group>
        );
      })}
    </SceneCanvas>
  );
};
