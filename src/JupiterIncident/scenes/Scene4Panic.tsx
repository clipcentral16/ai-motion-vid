import { useCurrentFrame, useVideoConfig } from "remotion";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { CameraRig, punchFov, type Vec3 } from "../../shared/three/World";
import { SKIES } from "../constants";
import { Alien, Astronaut, Corridor } from "../three/JupiterProps";

// 4. Red alarm: the engineer runs, shapes close in behind. Then the radio cuts out.
export const Scene4Panic: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const runZ = -9 + t * 2.6;
  const stride = t * 13;
  const shake = 0.09;
  const cam: Vec3 = [0.4 + Math.sin(t * 29) * shake, 2 + Math.cos(t * 23) * shake, runZ + 5.5 + t * 0.4];

  return (
    <SceneCanvas skyTop={SKIES.ship.top} skyHorizon={SKIES.ship.horizon} fov={62}>
      <CameraRig position={cam} target={[0, 1.6, runZ - 6]} fov={punchFov(frame, fps, 62)} />
      <fog attach="fog" args={["#0a0204", 5, 30]} />
      <ambientLight intensity={0.06} />
      <Corridor lights={0.12} red={0.6 + 0.4 * Math.sin(t * 9)} />
      <Astronaut
        position={[0.2, 0, runZ]}
        color="#e9ecef"
        skin="#f1c27d"
        pants="#c9ccd1"
        walk={stride}
        lift={Math.abs(Math.sin(stride)) * 0.2}
        lean={0.25}
        roll={Math.sin(stride) * 0.12}
        armsUp={0.6 + 0.3 * Math.sin(t * 16)}
        expression="shock"
      />
      {[0, 1, 2].map((i) => (
        <Alien key={i} position={[(i - 1) * 1.3, 0, runZ - 6 - i * 2.5 + Math.min(1.5, t * 0.5)]} t={t * 1.5} seed={i + 5} scale={1.1} />
      ))}
    </SceneCanvas>
  );
};
