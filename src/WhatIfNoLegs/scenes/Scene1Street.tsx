import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Character } from "../three/Character";
import { SceneCanvas } from "../three/SceneCanvas";
import { CameraRig, Lights, Street } from "../three/World";
import { makeWalkers, wrap } from "./walkers";

const Z_MIN = -40;
const Z_MAX = 18;
const walkers = makeWalkers("s1", 46, Z_MIN, Z_MAX);

// 1. Busy street, everyone walking. Camera glides forward and rises.
export const Scene1Street: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.cubic) });

  const cam: [number, number, number] = [interpolate(p, [0, 1], [-1.2, 1.6]), interpolate(p, [0, 1], [2.2, 5.5]), interpolate(p, [0, 1], [14, 8])];
  const target: [number, number, number] = [0, interpolate(p, [0, 1], [2.2, 1.2]), -8];

  return (
    <SceneCanvas>
      <CameraRig position={cam} target={target} fov={64} />
      <Lights fogNear={35} fogFar={110} />
      <Street />
      {walkers.map((w, i) => {
        const dist = w.speed * t;
        const z = wrap(w.z0 + w.dir * dist, Z_MIN, Z_MAX);
        return (
          <Character
            key={i}
            position={[w.x, 0.12, z]}
            rotationY={w.dir === 1 ? 0 : Math.PI}
            color={w.color}
            skin={w.skin}
            pants={w.pants}
            walk={w.phase + dist * 4.2}
            lift={Math.abs(Math.sin(w.phase + dist * 4.2)) * 0.06}
          />
        );
      })}
    </SceneCanvas>
  );
};
