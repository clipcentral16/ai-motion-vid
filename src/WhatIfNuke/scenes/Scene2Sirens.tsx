import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Character } from "../../shared/three/Character";
import { makeWalkers, wrap } from "../../shared/three/motion";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { CameraRig, Lights, Street, punchFov, type Vec3 } from "../../shared/three/World";
import { SKIES } from "../constants";
import { SirenPole } from "../three/NukeProps";

const Z_MIN = -40;
const Z_MAX = 22;
const runners = makeWalkers("nuke-run", 42, Z_MIN, Z_MAX);

// 2. Sirens: everyone runs for cover down a red-lit street. Camera backs away ahead of them.
export const Scene2Sirens: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.quad) });
  const pulse = 0.5 + 0.5 * Math.sin(t * 12);

  const shake = 0.05;
  const cam: Vec3 = [
    interpolate(p, [0, 1], [-1.5, 1.5]) + Math.sin(t * 31) * shake,
    interpolate(p, [0, 1], [2.4, 3.6]) + Math.cos(t * 27) * shake,
    interpolate(p, [0, 1], [10, 15]),
  ];
  const target: Vec3 = [0, 1.4, -6];

  return (
    <AbsoluteFill>
      <SceneCanvas skyTop={SKIES.alarm.top} skyHorizon={SKIES.alarm.horizon}>
        <CameraRig position={cam} target={target} fov={punchFov(frame, fps, 64)} />
        <Lights fogNear={30} fogFar={100} mood={{ fog: "#d9675a", sky: "#ffb3a7", ground: "#5a3a3a", hemi: 1.1, sun: "#ff9b85", sunIntensity: 1.8 }} />
        <Street seed="nuke-street" />
        <SirenPole position={[3.6, 0.1, 4]} t={t} />
        <SirenPole position={[-3.6, 0.1, -14]} t={t + 0.7} />
        {runners.map((w, i) => {
          // Everyone runs toward the camera (and the shelter behind it).
          const speed = 3.2 + w.speed;
          const dist = speed * t;
          const z = wrap(w.z0 + dist, Z_MIN, Z_MAX);
          const stride = w.phase + dist * 3.2;
          return (
            <Character
              key={i}
              position={[w.x, 0.12, z]}
              rotationY={Math.sin(t * 3 + w.phase) * 0.15}
              color={w.color}
              skin={w.skin}
              pants={w.pants}
              walk={stride}
              lift={Math.abs(Math.sin(stride)) * 0.2}
              squash={1 + Math.cos(stride * 2) * 0.06}
              lean={0.22}
              roll={Math.sin(stride) * 0.12}
              expression="shock"
              armsUp={i % 3 === 0 ? 0.75 + 0.2 * Math.sin(t * 15 + w.phase) : 0}
            />
          );
        })}
      </SceneCanvas>
      {/* Pulsing red alarm vignette */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, rgba(255,0,0,0) 45%, rgba(220,0,20,0.55) 100%)",
          opacity: 0.4 + 0.6 * pulse,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
