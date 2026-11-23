import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { POOF_SECONDS } from "../constants";
import { Character, LEG_HEIGHT } from "../three/Character";
import { SceneCanvas } from "../three/SceneCanvas";
import { CameraRig, Lights, Puff, Street } from "../three/World";
import { makeWalkers } from "./walkers";

const Z_MIN = -26;
const Z_MAX = 7;
const walkers = makeWalkers("s2", 34, Z_MIN, Z_MAX);

/** Height above the ground after the legs vanish: falls, then bounces. */
const bounce = (s: number) => (s <= 0 ? LEG_HEIGHT : LEG_HEIGHT * 1.2 * Math.exp(-2.4 * s) * Math.abs(Math.cos(7.2 * s + 0.58)));

// 2. POOF! Legs vanish, everyone drops and bounces. Camera pushes in, shakes.
export const Scene2Poof: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const since = t - POOF_SECONDS;
  const walkT = Math.min(t, POOF_SECONDS);

  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.quad) });
  const shake = since > 0 ? Math.exp(-since * 4) * 0.25 : 0;
  const cam: [number, number, number] = [
    interpolate(p, [0, 1], [1.5, -0.8]) + Math.sin(t * 61) * shake,
    interpolate(p, [0, 1], [3.6, 2.4]) + Math.cos(t * 47) * shake,
    interpolate(p, [0, 1], [11, 6.5]),
  ];
  const target: [number, number, number] = [0, 0.8, -4];

  return (
    <SceneCanvas>
      <CameraRig position={cam} target={target} fov={64} />
      <Lights fogNear={30} fogFar={100} />
      <Street />
      {walkers.map((w, i) => {
        const dist = w.speed * walkT;
        const z = w.z0 + w.dir * dist;
        const gone = since >= 0;
        // Upper body rests at y=0 once the legs are gone; `lift` is the bounce.
        const lift = gone ? bounce(since) : Math.abs(Math.sin(w.phase + dist * 4.2)) * 0.06;
        const landed = gone ? Math.exp(-since * 5) * Math.max(0, 1 - bounce(since) / LEG_HEIGHT) : 0;
        return (
          <group key={i}>
            <Character
              position={[w.x, 0.12, z]}
              rotationY={w.dir === 1 ? 0 : Math.PI}
              color={w.color}
              skin={w.skin}
              pants={w.pants}
              legs={gone ? 0 : 1}
              walk={gone ? 0 : w.phase + dist * 4.2}
              lift={lift}
              squash={1 - landed * 0.35}
              expression={since > 0.1 ? "shock" : "happy"}
              armsUp={gone ? Math.min(1, since * 3) * 0.55 : 0}
            />
            <Puff position={[w.x, 0.35, z]} progress={since / 0.9} seed={i} size={1.1} />
          </group>
        );
      })}
    </SceneCanvas>
  );
};
