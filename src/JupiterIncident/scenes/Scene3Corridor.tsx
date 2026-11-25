import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { CameraRig, punchFov, type Vec3 } from "../../shared/three/World";
import { SKIES } from "../constants";
import { Alien, Astronaut, Corridor } from "../three/JupiterProps";

// 3. The lights fail in the ship's corridor and something walks out of the dark.
export const Scene3Corridor: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.quad) });

  const lights = random(`cf${Math.floor(frame / 2)}`) < 0.35 ? 0.08 : 0.55;
  const alienZ = interpolate(t, [0.3, 4.5], [-24, -9], { extrapolateLeft: "clamp" });
  const cam: Vec3 = [0.6 + Math.sin(t * 1.3) * 0.08, 1.9 + Math.sin(t * 2.1) * 0.05, interpolate(p, [0, 1], [5, 2])];

  return (
    <SceneCanvas skyTop={SKIES.ship.top} skyHorizon={SKIES.ship.horizon} fov={60}>
      <CameraRig position={cam} target={[0, 2.1, -16]} fov={punchFov(frame, fps, 56)} />
      <fog attach="fog" args={["#050407", 6, 34]} />
      <ambientLight intensity={0.08} />
      <Corridor lights={lights} red={0.35 + 0.35 * Math.sin(t * 4)} />
      <Alien position={[0, 0, alienZ]} t={t} seed={3} scale={1.15} opacity={t > 0.3 ? 1 : 0} />
      {/* Two crew members frozen in the corridor, backing away */}
      <Astronaut position={[-1.2, 0, -2 + Math.min(1.2, t * 0.35)]} rotationY={Math.PI - 0.2} color="#e9ecef" skin="#f1c27d" pants="#c9ccd1" armsUp={0.5 + 0.15 * Math.sin(t * 6)} expression="shock" lean={-0.15} />
      <Astronaut position={[1.3, 0, -3.5 + Math.min(1.2, t * 0.4)]} rotationY={Math.PI + 0.3} color="#e9ecef" skin="#c68642" pants="#c9ccd1" armsUp={0.25} expression="shock" lean={-0.1} />
    </SceneCanvas>
  );
};
