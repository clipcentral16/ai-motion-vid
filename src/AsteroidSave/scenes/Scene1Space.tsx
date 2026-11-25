import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Globe } from "../../shared/three/Globe";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { Stars } from "../../shared/three/Stars";
import { CameraRig, punchFov, type Vec3 } from "../../shared/three/World";
import { SKIES } from "../constants";
import { Asteroid } from "../three/AsteroidProps";

// 1. A giant asteroid drifts toward Earth. Slow, ominous.
export const Scene1Space: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.sin) });

  const rock: Vec3 = [interpolate(p, [0, 1], [-9, -4.5]), interpolate(p, [0, 1], [9, 5.8]), interpolate(p, [0, 1], [-4, 0])];
  const cam: Vec3 = [interpolate(p, [0, 1], [6, 3]), interpolate(p, [0, 1], [3, 4]), interpolate(p, [0, 1], [22, 16])];

  return (
    <SceneCanvas skyTop={SKIES.space.top} skyHorizon={SKIES.space.horizon} far={900} fov={55}>
      <CameraRig position={cam} target={[-1.5, 2.5, 0]} fov={punchFov(frame, fps, 55, 0, 10)} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[12, 6, 10]} intensity={2.6} color="#fff6e8" />
      <Stars upperOnly={false} radius={500} count={900} />
      <Globe rotation={t * 0.12} smoke={0} />
      <Asteroid position={rock} radius={1.7} spin={t * 0.4} />
    </SceneCanvas>
  );
};
