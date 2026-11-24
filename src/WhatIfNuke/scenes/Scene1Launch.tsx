import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { geo, mat } from "../../shared/three/materials";
import { Cloud } from "../../shared/three/Props";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { CameraRig, Lights, Puff, punchFov, type Vec3 } from "../../shared/three/World";
import { IGNITION, LIFTOFF, SKIES } from "../constants";
import { Hills, LaunchPad, Missile } from "../three/NukeProps";

const PAD_TOP = 0.4;

/** Missile base height over time: sits on the pad, then accelerates upward. */
const missileY = (t: number) => (t < LIFTOFF ? PAD_TOP : PAD_TOP + 2.2 * Math.pow(t - LIFTOFF, 2.2));

// 1. Launch at sunset. Smoke billows, the missile lifts off, the camera follows it up.
export const Scene1Launch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.cubic) });

  const y = missileY(t);
  const shake = t > IGNITION ? Math.min(1, (t - IGNITION) * 2) * 0.12 * Math.max(0, 1 - (t - 2.5) / 1.5) : 0;
  const cam: Vec3 = [
    interpolate(p, [0, 1], [9, 13]) + Math.sin(t * 53) * shake,
    interpolate(p, [0, 1], [2.2, 6]) + Math.cos(t * 41) * shake,
    interpolate(p, [0, 1], [13, 20]),
  ];
  const target: Vec3 = [0, Math.max(4.5, y + 5), 0];

  // Ground smoke billowing out from the flame trench.
  const groundSmoke = Array.from({ length: 26 }).map((_, k) => {
    const spawn = IGNITION + k * 0.1;
    const a = random(`gsa${k}`) * Math.PI * 2;
    const d = 1.5 + random(`gsd${k}`) * 2;
    const life = (t - spawn) / 2.4;
    return { pos: [Math.cos(a) * d * (1 + life * 2), 0.8, Math.sin(a) * d * (1 + life * 2)] as Vec3, life, k };
  });
  // Trail left behind as the missile climbs.
  const trail = Array.from({ length: 34 }).map((_, k) => {
    const spawn = LIFTOFF + k * 0.08;
    return { pos: [0, missileY(spawn) - 1.2, 0] as Vec3, life: (t - spawn) / 2.2, k };
  });

  return (
    <SceneCanvas skyTop={SKIES.sunset.top} skyHorizon={SKIES.sunset.horizon} far={500}>
      <CameraRig position={cam} target={target} fov={punchFov(frame, fps, 62)} />
      <Lights fogNear={60} fogFar={180} mood={{ fog: "#f0a37c", sky: "#ffd6b8", ground: "#6b5d4a", hemi: 1.2, sun: "#ffb27a", sunIntensity: 2.4 }} />
      <mesh geometry={geo.plane} material={mat("#7a9a4e")} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} scale={[400, 400, 1]} />
      <Hills color="#5d7f3e" radius={70} />
      <Hills color="#4b6a33" radius={120} seed="far" count={18} />
      <LaunchPad />
      <Missile position={[0, y, 0]} flame={t > IGNITION ? Math.min(1, (t - IGNITION) * 3) : 0} flicker={t} />
      {groundSmoke.map((s) => (
        <Puff key={`g${s.k}`} position={s.pos} progress={s.life} seed={`g${s.k}`} size={2.6 + s.life * 2} color="#d6d0c8" glow={0.15} rise={1.2} />
      ))}
      {trail.map((s) => (
        <Puff key={`t${s.k}`} position={s.pos} progress={s.life} seed={`t${s.k}`} size={1.4 + s.life * 1.5} color="#e8e2da" glow={0.2} rise={0.3} />
      ))}
      {t > IGNITION ? <pointLight position={[0, y - 1, 2]} color="#ff9a3c" intensity={60} distance={30} /> : null}
      {Array.from({ length: 4 }).map((_, i) => (
        <Cloud key={i} seed={i + 60} position={[-30 + i * 20, 38 + random(`n1c${i}`) * 10, -60]} size={4} />
      ))}
    </SceneCanvas>
  );
};
