import { useCurrentFrame, useVideoConfig } from "remotion";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { CameraRig, punchFov, type Vec3 } from "../../shared/three/World";
import { SKIES } from "../constants";
import { Alien, Astronaut, Corridor } from "../three/JupiterProps";

const RUNNERS = [
  // Speed out in front in his red suit, then two more crew.
  { x: 0.2, dz: 0, suit: "#e63946", skin: "#8d5524", phase: 0 },
  { x: -1.1, dz: -2.2, suit: "#e9ecef", skin: "#ffd7b5", phase: 1.3 },
  { x: 1.2, dz: -3.4, suit: "#e9ecef", skin: "#c68642", phase: 2.1 },
];

// 4. Red alarm: Speed and the crew run, shapes close in behind. Then the radio cuts out.
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
      {RUNNERS.map((r, i) => (
        <Astronaut
          key={i}
          position={[r.x, 0, runZ + r.dz]}
          color={r.suit}
          skin={r.skin}
          pants="#c9ccd1"
          walk={stride + r.phase}
          lift={Math.abs(Math.sin(stride + r.phase)) * 0.2}
          lean={0.25}
          roll={Math.sin(stride + r.phase) * 0.12}
          armsUp={0.6 + 0.3 * Math.sin(t * 16 + r.phase)}
          expression="shock"
        />
      ))}
      {[0, 1, 2].map((i) => (
        <Alien key={i} position={[(i - 1) * 1.3, 0, runZ - 7.5 - i * 2.5 + Math.min(1.5, t * 0.5)]} t={t * 1.5} seed={i + 5} scale={1.1} />
      ))}
    </SceneCanvas>
  );
};
