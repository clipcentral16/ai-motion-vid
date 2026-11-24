import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { CameraRig, Puff, punchFov, type Vec3 } from "../../shared/three/World";
import { SHOTS, SKIES } from "../constants";
import { Alien, Blaster, CaseOhCharacter, Corridor, Tracer } from "../three/JupiterProps";

const ALIENS = SHOTS.map((_, i) => ({
  x: (i % 3 - 1) * 1.4 + (random(`ax${i}`) - 0.5) * 0.4,
  z: -7 - i * 1.8,
}));
const MUZZLE: Vec3 = [-0.19, 1.66, -2.1];
const SCALE = 1.25;

// 5. "I have a gun." CaseOh holds the corridor and blasts every alien.
export const Scene5Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const since = SHOTS.map((s) => t - s);
  const flash = Math.max(0, ...since.map((d) => (d >= 0 && d < 0.12 ? 1 - d / 0.12 : 0)));
  const kick = Math.max(0, ...since.map((d) => (d >= 0 ? Math.exp(-d * 18) : 0)));

  // Close-up on his face for the line, then whip behind his shoulder for the fight.
  const swing = interpolate(t, [1.0, 1.3], [0, 1], { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const front: Vec3 = [0.6, 2.3, -3.6];
  const behind: Vec3 = [1.25, 3.1, 4.8 - Math.max(0, t - 1.3) * 0.4];
  const shake = kick * 0.12;
  const cam: Vec3 = [
    front[0] + (behind[0] - front[0]) * swing + Math.sin(t * 50) * shake,
    front[1] + (behind[1] - front[1]) * swing + Math.cos(t * 43) * shake,
    front[2] + (behind[2] - front[2]) * swing,
  ];
  const target: Vec3 = [-0.4 * swing, 2 - swing * 0.2, -12 * swing + 0.2 * (1 - swing)];

  return (
    <SceneCanvas skyTop={SKIES.ship.top} skyHorizon={SKIES.ship.horizon} fov={60}>
      <CameraRig position={cam} target={target} fov={punchFov(frame, fps, 58) - kick * 3} />
      <fog attach="fog" args={["#06050a", 8, 36]} />
      <ambientLight intensity={0.12} />
      <Corridor lights={0.5} red={0.3 + 0.2 * Math.sin(t * 5)} />
      <CaseOhCharacter
        position={[0, 0, 0]}
        rotationY={Math.PI}
        scale={SCALE}
        color="#2f3640"
        skin="#e0ac69"
        pants="#1e2a36"
        armSwing={-1.35 - kick * 0.25}
        armsUp={0.08}
        expression="happy"
        lift={kick * 0.04}
      />
      <group position={[0, 0, 0]} rotation={[-kick * 0.15, Math.PI, 0]} scale={SCALE}>
        <group position={[0.15, 1.33, 0.45]}>
          <Blaster flash={flash} />
        </group>
      </group>
      {ALIENS.map((a, i) => {
        const d = since[i];
        const alive = d < 0;
        const approach = Math.min(2.2, t * 0.6);
        const pos: Vec3 = [a.x, 0, a.z + approach];
        return (
          <group key={i}>
            {alive ? <Alien position={pos} t={t * 1.3} seed={i + 10} scale={1.1} eye={i % 2 ? "#ff2a2a" : "#7dff6a"} /> : null}
            <Tracer from={MUZZLE} to={[pos[0], 2.2, pos[2]]} fade={d >= 0 && d < 0.1 ? 1 - d / 0.1 : 0} />
            <Puff position={[pos[0], 1.6, pos[2]]} progress={d / 1.1} seed={`v${i}`} size={1.3} color="#9b4dff" glow={1.2} rise={0.8} />
          </group>
        );
      })}
    </SceneCanvas>
  );
};
