import { interpolate, interpolateColors, random, useCurrentFrame, useVideoConfig } from "remotion";
import { Character } from "../../shared/three/Character";
import { geo, mat } from "../../shared/three/materials";
import { makeWalkers } from "../../shared/three/motion";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { CameraRig, Lights, Street, punchFov, type Vec3 } from "../../shared/three/World";
import { SKIES } from "../constants";

const crowd = makeWalkers("asteroid-cheer", 44, -26, 8);
const CONFETTI = ["#ffd166", "#ef476f", "#06d6a0", "#118ab2", "#ffffff", "#c77dff"];

// 6. Back on the street: the asteroid streaks away, the sky clears, everyone cheers.
export const Scene6Saved: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const clear = interpolate(t, [0.2, 2.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const top = interpolateColors(clear, [0, 1], [SKIES.doom.top, SKIES.saved.top]);
  const horizon = interpolateColors(clear, [0, 1], [SKIES.doom.horizon, SKIES.saved.horizon]);
  const fog = interpolateColors(clear, [0, 1], ["#ff6a2a", "#bfe8ff"]);
  // The rock shrinks to a dot as it leaves the sky.
  const away = interpolate(t, [0, 2.2], [0, 1], { extrapolateRight: "clamp" });
  const cam: Vec3 = [Math.sin(t * 0.5) * 1.5, 2.2, 11];

  return (
    <SceneCanvas skyTop={top} skyHorizon={horizon} far={600}>
      <CameraRig position={cam} target={[0, 5 + (1 - away) * 6, -20]} fov={punchFov(frame, fps, 64)} />
      <Lights fogNear={40} fogFar={150} mood={{ fog, sun: "#fff4e0", sunIntensity: 1.6 + clear }} />
      <Street seed="asteroid-street" />
      {away < 1 ? (
        <group position={[4, 30 + away * 110, -120 - away * 80]} scale={Math.max(0.05, 6 * (1 - away))}>
          <mesh geometry={geo.ball}>
            <meshStandardMaterial color="#5b4a3f" emissive="#ff7a2a" emissiveIntensity={1.2} flatShading />
          </mesh>
        </group>
      ) : null}
      {crowd.map((w, i) => {
        const hop = Math.abs(Math.sin(t * 7 + w.phase));
        return (
          <Character
            key={i}
            position={[w.x, 0.12 + hop * 0.6, w.z0]}
            rotationY={Math.sin(t * 2 + w.phase) * 0.6}
            color={w.color}
            skin={w.skin}
            pants={w.pants}
            armsUp={0.85 + 0.15 * Math.sin(t * 12 + w.phase)}
            squash={1 + (hop < 0.2 ? -0.15 : 0.08)}
            expression="happy"
          />
        );
      })}
      {/* Confetti */}
      {Array.from({ length: 90 }).map((_, i) => {
        const fall = (random(`cy${i}`) * 14 - t * (2 + random(`cv${i}`) * 2) + 140) % 14;
        return (
          <mesh
            key={`c${i}`}
            geometry={geo.box}
            material={mat(CONFETTI[i % CONFETTI.length])}
            position={[(random(`cx${i}`) - 0.5) * 14, fall, -random(`cz${i}`) * 18 + 4]}
            rotation={[t * 5 + i, t * 3 + i, 0]}
            scale={[0.15, 0.25, 0.02]}
          />
        );
      })}
    </SceneCanvas>
  );
};
