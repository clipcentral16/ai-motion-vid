import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { CameraRig, punchFov, type Vec3 } from "../../shared/three/World";
import { SKIES } from "../constants";
import { Globe } from "../../shared/three/Globe";
import { Stars } from "../../shared/three/Stars";

// 6. Pull back from Earth as smoke spreads around the planet.
export const Scene6Globe: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0, 3.2 * fps], [0, 1], { easing: Easing.inOut(Easing.cubic), extrapolateRight: "clamp" });

  const cam: Vec3 = [interpolate(p, [0, 1], [3, 5]), interpolate(p, [0, 1], [4, 7]), interpolate(p, [0, 1], [13, 24])];
  // Keep the globe in the upper part of the frame, clear of the captions.
  const target: Vec3 = [0, interpolate(p, [0, 1], [1.5, -3.5]), 0];

  return (
    <SceneCanvas skyTop={SKIES.space.top} skyHorizon={SKIES.space.horizon} far={800}>
      <CameraRig position={cam} target={target} fov={punchFov(frame, fps, 50)} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[10, 6, 8]} intensity={2.6} color="#fff6e8" />
      <Stars upperOnly={false} radius={400} count={800} />
      <Globe rotation={t * 0.35 - 1.2} smoke={interpolate(t, [0, 3.5], [0.05, 1], { extrapolateRight: "clamp" })} />
    </SceneCanvas>
  );
};
