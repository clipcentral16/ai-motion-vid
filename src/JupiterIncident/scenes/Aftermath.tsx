import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { CameraRig, punchFov, type Vec3 } from "../../shared/three/World";
import { geo } from "../../shared/three/materials";
import { SKIES } from "../constants";
import { Blaster, CaseOhCharacter, Corridor } from "../three/JupiterProps";

/** Quiet corridor after the fight: CaseOh lying on his back, gun at his side. */
const AftermathSet: React.FC<{ cam: Vec3; target: Vec3; fov: number; t: number; spotlight: number }> = ({ cam, target, fov, t, spotlight }) => (
  <SceneCanvas skyTop={SKIES.ship.top} skyHorizon={SKIES.ship.horizon} fov={fov}>
    <CameraRig position={cam} target={target} fov={fov} />
    <fog attach="fog" args={["#06050a", 6, 30]} />
    <ambientLight intensity={0.1} />
    <Corridor lights={0.18 + (random(`af${Math.floor(t * 8)}`) < 0.2 ? 0 : 0.12)} red={0.03 + 0.02 * Math.sin(t * 2)} />
    <CaseOhCharacter
      position={[0, 0.42, -0.6]}
      lean={-Math.PI / 2}
      scale={1.25}
      color="#2f3640"
      skin="#e0ac69"
      pants="#1e2a36"
      armsUp={0.1 + 0.06 * Math.sin(t * 1.5)}
      roll={0}
      expression="happy"
    />
    <group position={[1.05, 0.15, -1.1]} rotation={[Math.PI / 2, 0, 0.6]} scale={1.2}>
      <Blaster flash={0} />
    </group>
    {/* Lingering purple haze where the aliens vanished */}
    {Array.from({ length: 10 }).map((_, i) => (
      <mesh key={i} geometry={geo.puff} position={[(random(`hx${i}`) - 0.5) * 4, 0.5 + random(`hy${i}`) * 0.8, 3 + random(`hz${i}`) * 4]} scale={0.8 + random(`hs${i}`) * 0.8}>
        <meshStandardMaterial color="#5a2a8a" emissive="#5a2a8a" emissiveIntensity={0.5} flatShading transparent opacity={0.22} />
      </mesh>
    ))}
    <spotLight position={[0, 4.3, -2]} angle={0.5} penumbra={0.6} intensity={120 * spotlight} color="#fff1c9" distance={12} />
  </SceneCanvas>
);

// 6. "They're... all... gone." Top-down, slowly closing in.
export const Scene6Fallen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.sin) });
  // From above his head, looking down along his body.
  // Stay under the corridor ceiling (y = 4.6).
  const cam: Vec3 = [interpolate(p, [0, 1], [0.6, 0.3]), interpolate(p, [0, 1], [4.25, 3.4]), interpolate(p, [0, 1], [-4.2, -3.7])];
  return <AftermathSet cam={cam} target={[0, 0.4, -2.3]} fov={punchFov(frame, fps, 56, 0, 8)} t={t} spotlight={0.4 + p * 0.6} />;
};

// 7. End card: rise up over the true hero in a spotlight.
export const Scene7Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.cubic) });
  const cam: Vec3 = [interpolate(p, [0, 1], [0.3, 0.1]), interpolate(p, [0, 1], [3.5, 4.3]), interpolate(p, [0, 1], [-3.8, -6.5])];
  return <AftermathSet cam={cam} target={[0, 0.3, -1.6]} fov={56} t={t + 4.5} spotlight={1} />;
};
