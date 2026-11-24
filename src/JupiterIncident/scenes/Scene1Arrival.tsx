import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { Stars } from "../../shared/three/Stars";
import { CameraRig, punchFov, type Vec3 } from "../../shared/three/World";
import { SKIES } from "../constants";
import { Jupiter, Orbiter } from "../three/JupiterProps";

// 1. 2011: the crew ship glides past a looming, dark Jupiter.
export const Scene1Arrival: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.sin) });

  const cam: Vec3 = [interpolate(p, [0, 1], [-3, 2]), interpolate(p, [0, 1], [5, 3]), interpolate(p, [0, 1], [24, 15])];
  const ship: Vec3 = [interpolate(p, [0, 1], [10, -4]), 4.5, interpolate(p, [0, 1], [-4, -14])];

  return (
    <SceneCanvas skyTop={SKIES.space.top} skyHorizon={SKIES.space.horizon} far={900} fov={60}>
      <CameraRig position={cam} target={[ship[0] * 0.5, 0, -40]} fov={punchFov(frame, fps, 58, 0, 12)} />
      <ambientLight intensity={0.12} />
      <directionalLight position={[-30, 12, 20]} intensity={2.4} color="#ffe2c4" />
      <Stars upperOnly={false} radius={600} count={900} />
      <Jupiter position={[6, -38, -150]} radius={95} rotation={t * 0.03} dim={0.85} />
      <Orbiter position={ship} rotation={[0.1, -1.2 + p * 0.3, 0.15]} blink={(t * 1.2) % 1} />
    </SceneCanvas>
  );
};
