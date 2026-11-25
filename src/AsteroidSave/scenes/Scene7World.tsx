import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Globe } from "../../shared/three/Globe";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { Stars } from "../../shared/three/Stars";
import { CameraRig, Puff, punchFov, type Vec3 } from "../../shared/three/World";
import { SKIES } from "../constants";
import { Asteroid, FlyingCar } from "../three/AsteroidProps";

// 7. Back in space: the asteroid sails off, Zen's car does a lap of honour by Earth.
export const Scene7World: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.sin) });

  const rock: Vec3 = [interpolate(p, [0, 1], [6, 40]), interpolate(p, [0, 1], [10, 30]), interpolate(p, [0, 1], [-10, -80])];
  const car: Vec3 = [interpolate(p, [0, 1], [2.2, 3.2]), interpolate(p, [0, 1], [2.4, 3.0]), 7];
  const cam: Vec3 = [interpolate(p, [0, 1], [-2, 2]), interpolate(p, [0, 1], [6, 8]), interpolate(p, [0, 1], [13, 19])];

  return (
    <SceneCanvas skyTop={SKIES.space.top} skyHorizon={SKIES.space.horizon} far={900} fov={55}>
      <CameraRig position={cam} target={[0, 2.5, 0]} fov={punchFov(frame, fps, 55)} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[12, 6, 10]} intensity={2.6} color="#fff6e8" />
      <Stars upperOnly={false} radius={500} count={900} />
      <Globe rotation={t * 0.12 + 0.6} smoke={0} />
      <Asteroid position={rock} radius={1.7} spin={t * 2} heat={0.6} />
      {Array.from({ length: 10 }).map((_, k) => (
        <Puff key={k} position={[rock[0] - (k + 1) * 1.2, rock[1] - (k + 1) * 0.7, rock[2] + (k + 1) * 2]} progress={0.3 + k * 0.06} seed={`w${k}`} size={1.2} color="#ffb347" glow={1.2} rise={0} />
      ))}
      <group position={car} rotation={[-0.2, Math.PI / 2, t * 2.4, "YXZ"]}>
        <FlyingCar boost={0.7} flicker={t} scale={0.75} />
      </group>
    </SceneCanvas>
  );
};
