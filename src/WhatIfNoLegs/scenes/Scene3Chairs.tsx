import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { SHIRT_COLORS, SKIN_COLORS } from "../constants";
import { Character } from "../three/Character";
import { BOARD_DECK_Y, CHAIR_SEAT_Y, OfficeChair, Skateboard, TrafficLight } from "../three/Props";
import { SceneCanvas } from "../three/SceneCanvas";
import { CameraRig, Lights, Street } from "../three/World";
import { wrap } from "./walkers";

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
  };
});

// 3. Office chairs become the #1 car: a traffic jam of chairs. Camera cranes up.
export const Scene3Chairs: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.cubic) });

  const cam: [number, number, number] = [interpolate(p, [0, 1], [3.2, -2]), interpolate(p, [0, 1], [1.6, 9]), interpolate(p, [0, 1], [10, 14])];
  const target: [number, number, number] = [0, interpolate(p, [0, 1], [1.2, 0]), interpolate(p, [0, 1], [2, -8])];

  return (
    <SceneCanvas>
      <CameraRig position={cam} target={target} fov={64} />
      <Lights fogNear={35} fogFar={110} />
      <Street />
      <TrafficLight position={[3.4, 0.1, 6.5]} rotationY={Math.PI * 0.85} />
      {chairs.map((c, i) => {
        // Stop-and-go creep forward
        const creep = 0.35 * t + 0.18 * Math.sin(t * 2.4 + c.phase);
        const z = c.z0 + creep;
        const yaw = 0.25 * Math.sin(t * 1.7 + c.phase);
        return (
          <group key={i} position={[c.x, 0, z]} rotation={[0, yaw, 0]}>
            <OfficeChair color={c.chair} />
            <Character
              position={[0, CHAIR_SEAT_Y, 0.05]}
              color={c.color}
              skin={c.skin}
              legs={0}
              shadow={false}
              expression={c.grumpy ? "shock" : "happy"}
              armSwing={Math.sin(t * 7 + c.phase) * 0.7}
              armsUp={c.grumpy ? 0.15 + 0.15 * Math.sin(t * 9 + c.phase) : 0}
              lift={Math.abs(Math.sin(t * 3 + c.phase)) * 0.04}
            />
          </group>
        );
      })}
      {riders.map((r, i) => {
        const z = wrap(r.z0 + r.dir * r.speed * t, -34, 18);
        const rot = r.dir === 1 ? 0 : Math.PI;
        return (
          <group key={`r${i}`} position={[r.x, 0.12, z]} rotation={[0, rot, 0]}>
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
