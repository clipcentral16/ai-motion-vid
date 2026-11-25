import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { Character } from "../../shared/three/Character";
import { makeWalkers, wrap } from "../../shared/three/motion";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { CameraRig, Lights, Puff, Street, punchFov, type Vec3 } from "../../shared/three/World";
import { SKIES } from "../constants";
import { Asteroid } from "../three/AsteroidProps";

const runners = makeWalkers("asteroid-run", 48, -40, 22);

// 2. The asteroid fills a burning sky; everyone screams and runs.
export const Scene2Panic: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.quad) });
  const shake = 0.06 + p * 0.1;
  const cam: Vec3 = [Math.sin(t * 31) * shake, interpolate(p, [0, 1], [1.8, 2.6]) + Math.cos(t * 27) * shake, interpolate(p, [0, 1], [10, 13])];
  const rock: Vec3 = [interpolate(p, [0, 1], [14, 8]), interpolate(p, [0, 1], [52, 40]), -110];
  const pulse = 0.5 + 0.5 * Math.sin(t * 10);

  return (
    <AbsoluteFill>
      <SceneCanvas skyTop={SKIES.doom.top} skyHorizon={SKIES.doom.horizon} far={500}>
        <CameraRig position={cam} target={[0, interpolate(p, [0, 1], [6, 9]), -30]} fov={punchFov(frame, fps, 66)} />
        <Lights fogNear={35} fogFar={160} mood={{ fog: "#ff6a2a", sky: "#ffb38a", ground: "#5a2a1a", hemi: 1.1, sun: "#ff8a4c", sunIntensity: 2 }} />
        <Street seed="asteroid-street" />
        <Asteroid position={rock} radius={interpolate(p, [0, 1], [14, 20])} spin={t * 0.3} heat={1} />
        {/* Fiery trail behind it */}
        {Array.from({ length: 10 }).map((_, k) => (
          <Puff
            key={k}
            position={[rock[0] + 8 + k * 4, rock[1] + 6 + k * 3, rock[2] - k * 2]}
            progress={0.2 + (((t * 0.6 + k * 0.1) % 1) * 0.6)}
            seed={`tr${k}`}
            size={9 - k * 0.5}
            color={k < 4 ? "#ffb347" : "#7a5a4a"}
            glow={k < 4 ? 1.2 : 0.2}
            rise={0.2}
          />
        ))}
        {runners.map((w, i) => {
          const dist = (3.2 + w.speed) * t;
          const z = wrap(w.z0 + dist, -40, 22);
          const stride = w.phase + dist * 3.2;
          return (
            <Character
              key={i}
              position={[w.x, 0.12, z]}
              rotationY={Math.sin(t * 3 + w.phase) * 0.25}
              color={w.color}
              skin={w.skin}
              pants={w.pants}
              walk={stride}
              lift={Math.abs(Math.sin(stride)) * 0.22}
              squash={1 + Math.cos(stride * 2) * 0.07}
              lean={0.2}
              roll={Math.sin(stride) * 0.14}
              expression="shock"
              armsUp={random(`up${i}`) < 0.6 ? 0.8 + 0.2 * Math.sin(t * 15 + w.phase) : 0}
            />
          );
        })}
      </SceneCanvas>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, rgba(255,60,0,0) 45%, rgba(200,0,0,0.5) 100%)",
          opacity: 0.5 + 0.5 * pulse,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
