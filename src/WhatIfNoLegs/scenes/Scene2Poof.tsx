import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { POOF_SECONDS } from "../constants";
import { Character, LEG_HEIGHT } from "../three/Character";
import { SceneCanvas } from "../three/SceneCanvas";
import { CameraRig, Lights, Puff, Street, punchFov } from "../three/World";
import { makeWalkers } from "./walkers";

const Z_MIN = -26;
const Z_MAX = 7;
const walkers = makeWalkers("s2", 34, Z_MIN, Z_MAX);

const HOP = 0.15; // surprised hop before the fall (s)
const HOP_HEIGHT = 0.55;

/** Height above the ground after the legs vanish: a startled hop, then falls and bounces. */
const bounce = (s: number) => {
  if (s <= 0) return LEG_HEIGHT;
  if (s < HOP) return LEG_HEIGHT + HOP_HEIGHT * Math.sin((Math.PI / 2) * (s / HOP));
  const u = s - HOP;
  return (LEG_HEIGHT + HOP_HEIGHT) * Math.exp(-2.2 * u) * Math.abs(Math.cos(7 * u));
};

// 2. POOF! Legs vanish, everyone drops and bounces. Camera pushes in, shakes.
export const Scene2Poof: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const since = t - POOF_SECONDS;
  const walkT = Math.min(t, POOF_SECONDS);

  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.quad) });
  const shake = since > 0 ? Math.exp(-since * 3.5) * 0.4 : 0;
  // Snap-zoom on the poof, easing back out.
  const poofZoom = since > 0 ? 16 * Math.exp(-since * 2.5) * Math.min(1, since * 12) : 0;
  const cam: [number, number, number] = [
    interpolate(p, [0, 1], [1.5, -0.8]) + Math.sin(t * 61) * shake,
    interpolate(p, [0, 1], [3.6, 2.4]) + Math.cos(t * 47) * shake,
    interpolate(p, [0, 1], [11, 6.5]),
  ];
  const target: [number, number, number] = [0, 0.8, -4];

  return (
    <SceneCanvas>
      <CameraRig position={cam} target={target} fov={punchFov(frame, fps, 64) - poofZoom} />
      <Lights fogNear={30} fogFar={100} />
      <Street />
      {walkers.map((w, i) => {
        const dist = w.speed * walkT;
        const z = w.z0 + w.dir * dist;
        const gone = since >= 0;
        // Upper body rests at y=0 once the legs are gone; `lift` is the bounce.
        const lift = gone ? bounce(since) : Math.abs(Math.sin(w.phase + dist * 4.2)) * 0.12;
        // Squash on each landing, stretch while flying up.
        const h = bounce(since);
        const landed = gone && since > HOP ? Math.exp(-since * 1.6) * Math.max(0, 1 - h / 0.35) : 0;
        const stretch = gone && since < HOP + 0.1 ? 0.18 : 0;
        // After landing, look around in shock.
        const look = gone ? 0.8 * Math.sin((since - 0.5) * 5 + w.phase) * Math.min(1, Math.max(0, since - 0.5) * 3) : 0;
        return (
          <group key={i}>
            <Character
              position={[w.x, 0.12, z]}
              rotationY={(w.dir === 1 ? 0 : Math.PI) + look}
              color={w.color}
              skin={w.skin}
              pants={w.pants}
              legs={gone ? 0 : 1}
              walk={gone ? 0 : w.phase + dist * 4.2}
              lift={lift}
              squash={1 - landed * 0.45 + stretch}
              expression={since > 0.05 ? "shock" : "happy"}
              armsUp={gone ? Math.min(1, since * 4) * (0.55 + 0.35 * Math.sin(since * 16 + w.phase)) : 0}
              roll={gone ? 0.15 * Math.sin(since * 9 + w.phase) * Math.exp(-since) : 0}
            />
            <Puff position={[w.x, 0.35, z]} progress={since / 0.9} seed={i} size={1.2} />
          </group>
        );
      })}
    </SceneCanvas>
  );
};
