import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { Character } from "../../shared/three/Character";
import { geo, mat } from "../../shared/three/materials";
import { Building } from "../../shared/three/Props";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { CameraRig, Lights, punchFov, type Vec3 } from "../../shared/three/World";
import { SKIES } from "../constants";
import { AshFall, Campfire, DeadTree } from "../three/NukeProps";

const HUDDLE = Array.from({ length: 6 }).map((_, i) => {
  const a = (i / 6) * Math.PI * 2 + 0.3;
  return { a, color: ["#7d8597", "#9a8c98", "#8d99ae", "#a5a58d", "#6c757d", "#b5838d"][i], skin: ["#e0c2a8", "#c9a88c", "#a9876d", "#e8d0bd", "#8d6e5a", "#d4b89d"][i] };
});

// 5. Nuclear winter: grey sky, a dim sun, ash falling, people huddled by a fire.
export const Scene5Winter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.cubic) });

  const angle = interpolate(p, [0, 1], [0.2, 0.9]);
  const radius = interpolate(p, [0, 1], [11, 6.5]);
  const cam: Vec3 = [Math.sin(angle) * radius, interpolate(p, [0, 1], [5.5, 2.4]), Math.cos(angle) * radius];
  const target: Vec3 = [0, interpolate(p, [0, 1], [3, 1.2]), 0];

  return (
    <SceneCanvas skyTop={SKIES.ash.top} skyHorizon={SKIES.ash.horizon} far={300}>
      <CameraRig position={cam} target={target} fov={punchFov(frame, fps, 62)} />
      <Lights fogNear={12} fogFar={70} mood={{ fog: "#8f8a83", sky: "#b9b6b0", ground: "#5f5c58", hemi: 1.0, sun: "#d9d4cc", sunIntensity: 0.8 }} />
      <mesh geometry={geo.plane} material={mat("#cfccc6")} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} scale={[300, 300, 1]} />
      {/* Ash drifts on the ground */}
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh key={i} geometry={geo.canopy} material={mat("#bdb9b2")} position={[(random(`dx${i}`) - 0.5) * 40, -0.4, (random(`dz${i}`) - 0.5) * 40]} scale={[2 + random(`ds${i}`) * 3, 0.6, 2 + random(`dt${i}`) * 3]} />
      ))}
      {/* Pale sun behind drifting smoke */}
      <mesh geometry={geo.disc} position={[-20, 40, -80]} scale={5}>
        <meshBasicMaterial color="#e8e3d6" transparent opacity={0.35} fog={false} />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={`sm${i}`} geometry={geo.puff} position={[-60 + i * 11 + t * 2.5, 34 + random(`smy${i}`) * 10, -75 + random(`smz${i}`) * 10]} scale={[9, 4, 6]}>
          <meshStandardMaterial color="#5b5a5e" flatShading transparent opacity={0.85} fog={false} />
        </mesh>
      ))}
      {/* Abandoned grey houses and bare trees */}
      {[
        [-14, -18],
        [-6, -22],
        [5, -20],
        [14, -16],
      ].map(([x, z], i) => (
        <Building key={i} position={[x, 0, z]} size={[5, 4 + (i % 2) * 2, 5]} color="#8e8b86" windows={false} />
      ))}
      {Array.from({ length: 9 }).map((_, i) => (
        <DeadTree key={i} position={[(random(`tx${i}`) - 0.5) * 34, 0, -6 - random(`tz${i}`) * 14]} size={1.2 + random(`ts${i}`)} seed={i} />
      ))}
      <Campfire position={[0, 0, 0]} t={t} />
      {HUDDLE.map((h, i) => {
        const r = 1.6;
        return (
          <Character
            key={i}
            position={[Math.cos(h.a) * r, 0, Math.sin(h.a) * r]}
            rotationY={Math.atan2(-Math.cos(h.a), -Math.sin(h.a))}
            color={h.color}
            skin={h.skin}
            pants="#4a4e69"
            expression={i % 2 ? "shock" : "happy"}
            armSwing={-0.9}
            roll={Math.sin(t * 38 + i * 2) * 0.05}
            lift={Math.abs(Math.sin(t * 20 + i)) * 0.03}
            squash={0.94}
          />
        );
      })}
      <AshFall t={t} center={[0, 0, -2]} />
    </SceneCanvas>
  );
};
