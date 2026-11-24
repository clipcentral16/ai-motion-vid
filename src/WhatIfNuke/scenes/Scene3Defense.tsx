import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { geo, mat } from "../../shared/three/materials";
import { Building } from "../../shared/three/Props";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { CameraRig, Lights, Puff, punchFov, type Vec3 } from "../../shared/three/World";
import { HITS, SKIES } from "../constants";
import { Burst, Hills, LauncherTruck, Stars, Streak } from "../three/NukeProps";

const lerp = (a: Vec3, b: Vec3, u: number): Vec3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];

// Incoming warheads streak down from the upper right. The third gets through.
const WARHEADS = [
  { from: [70, 95, -120] as Vec3, to: [-30, 0, -70] as Vec3, t0: 0, dur: 3.2 },
  { from: [90, 100, -100] as Vec3, to: [-20, 0, -60] as Vec3, t0: 0.4, dur: 3.2 },
  { from: [80, 110, -90] as Vec3, to: [-25, 0, -55] as Vec3, t0: 1.0, dur: 3.0 },
];
const warheadAt = (i: number, t: number) => {
  const w = WARHEADS[i];
  return lerp(w.from, w.to, Math.max(0, (t - w.t0) / w.dur));
};

const LAUNCHERS: Vec3[] = [
  [-6, 0, -4],
  [5, 0, -8],
];
// Interceptor i leaves launcher i and meets warhead i at HITS[i].
const FLIGHT = 0.9;

// 3. Missile defense at night: interceptors knock two warheads out of the sky.
export const Scene3Defense: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.sin) });

  const cam: Vec3 = [interpolate(p, [0, 1], [-2, 4]), interpolate(p, [0, 1], [2, 3.5]), interpolate(p, [0, 1], [14, 16])];
  const target: Vec3 = [interpolate(p, [0, 1], [8, 0]), interpolate(p, [0, 1], [30, 22]), -60];

  return (
    <SceneCanvas skyTop={SKIES.night.top} skyHorizon={SKIES.night.horizon} far={600} fov={70}>
      <CameraRig position={cam} target={target} fov={punchFov(frame, fps, 70)} />
      <Lights fogNear={80} fogFar={260} mood={{ fog: "#1c2d58", sky: "#7f93cc", ground: "#2a3a24", hemi: 1.4, sun: "#b4c4ff", sunIntensity: 1.4 }} />
      <Stars />
      <mesh geometry={geo.plane} material={mat("#34502c")} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -60]} scale={[500, 500, 1]} />
      <Hills color="#2a3d25" radius={90} seed="night" />
      {/* Distant city with lit windows */}
      {Array.from({ length: 12 }).map((_, i) => (
        <Building key={i} position={[-45 + i * 8, 0, -110 - (i % 3) * 6]} size={[6, 10 + ((i * 7) % 5) * 5, 6]} color="#2b2f45" floorHeight={2} />
      ))}
      {LAUNCHERS.map((l, i) => (
        <LauncherTruck key={i} position={l} rotationY={-0.4 + i * 0.5} />
      ))}

      {WARHEADS.map((w, i) => {
        const hit = HITS[i];
        if (t < w.t0) return null;
        if (hit !== undefined && t >= hit) return null;
        const pos = warheadAt(i, t);
        if (pos[1] <= 0.5) return null;
        return (
          <group key={`w${i}`}>
            <Streak position={pos} color="#ff4d3d" size={2.6} />
            {Array.from({ length: 10 }).map((_, k) => {
              const back = warheadAt(i, t - (k + 1) * 0.06);
              return <Streak key={k} position={back} color="#ff8a5c" size={2.2 - k * 0.19} />;
            })}
          </group>
        );
      })}

      {HITS.map((hit, i) => {
        const start = hit - FLIGHT;
        if (t < start) return null;
        const meet = warheadAt(i, hit);
        const from: Vec3 = [LAUNCHERS[i][0], 2.5, LAUNCHERS[i][2]];
        const u = Math.min(1, (t - start) / FLIGHT);
        const ease = u * u;
        const pos = lerp(from, meet, ease);
        return (
          <group key={`i${i}`}>
            {u < 1 ? <Streak position={pos} color="#8ad8ff" size={2} /> : null}
            {/* Exhaust trail */}
            {Array.from({ length: 14 }).map((_, k) => {
              const su = Math.max(0, (k / 14) * Math.min(1, u));
              const spawnT = start + su * FLIGHT;
              return (
                <Puff
                  key={k}
                  position={lerp(from, meet, su * su)}
                  progress={(t - spawnT) / 2.2}
                  seed={`ix${i}${k}`}
                  size={1.4}
                  color="#c9d6ea"
                  glow={0.35}
                  rise={0.2}
                />
              );
            })}
            <Burst position={meet} t={t - hit} />
            <Puff position={meet} progress={(t - hit - 0.2) / 2} seed={`b${i}`} size={5} color="#8c8c96" glow={0.2} />
          </group>
        );
      })}
    </SceneCanvas>
  );
};
