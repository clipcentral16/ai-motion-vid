import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Character } from "../three/Character";
import { SceneCanvas } from "../three/SceneCanvas";
import { CameraRig, Lights, Street, punchFov } from "../three/World";
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

  // Fast swoop: low and wide, rising over the crowd.
  const cam: [number, number, number] = [interpolate(p, [0, 1], [-2.2, 2.2]), interpolate(p, [0, 1], [1.4, 6]), interpolate(p, [0, 1], [15, 7])];
  const target: [number, number, number] = [0, interpolate(p, [0, 1], [2.4, 1]), -8];

  return (
    <SceneCanvas>
      <CameraRig position={cam} target={target} fov={punchFov(frame, fps, 64)} />
      <Lights fogNear={35} fogFar={110} />
      <Street />
      {walkers.map((w, i) => {
        const dist = w.speed * 1.35 * t;
        const stride = w.phase + dist * 4.2;
        const z = wrap(w.z0 + w.dir * dist, Z_MIN, Z_MAX);
        return (
          <Character
            key={i}
            position={[w.x, 0.12, z]}
            rotationY={w.dir === 1 ? 0 : Math.PI}
            color={w.color}
            skin={w.skin}
            pants={w.pants}
            walk={stride}
            lift={Math.abs(Math.sin(stride)) * 0.13}
            squash={1 + Math.cos(stride * 2) * 0.05}
            roll={Math.sin(stride) * 0.1}
          />
        );
      })}
    </SceneCanvas>
  );
};
