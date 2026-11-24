import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { geo, mat } from "../../shared/three/materials";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { Stars } from "../../shared/three/Stars";
import { CameraRig, Lights, punchFov, type Vec3 } from "../../shared/three/World";
import { SKIES } from "../constants";
import { Alien, Astronaut, Jupiter, Lander, Rocks } from "../three/JupiterProps";

// 2. On an icy moon, the captain radios Houston while something moves in the dark.
export const Scene2Moon: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.cubic) });

  const cam: Vec3 = [interpolate(p, [0, 1], [3.5, 1.4]), interpolate(p, [0, 1], [2.4, 1.9]), interpolate(p, [0, 1], [9, 4.6])];
  const flicker = random(`lf${Math.floor(frame / 3)}`) < 0.25 ? 0.2 : 1;
  // The captain glances over his shoulder toward the movement.
  const look = interpolate(t, [1.6, 2.2, 3.6, 4.2], [0, -1.1, -1.1, -0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Silhouettes dart between the rocks in the distance.
  const dart = (offset: number) => interpolate(t, [1.5 + offset, 2.6 + offset], [-26, 18], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <SceneCanvas skyTop={SKIES.moon.top} skyHorizon={SKIES.moon.horizon} far={700}>
      <CameraRig position={cam} target={[0, 1.7, -2]} fov={punchFov(frame, fps, 58)} />
      <Lights fogNear={18} fogFar={110} mood={{ fog: "#0d0c14", sky: "#5a4a40", ground: "#101318", hemi: 0.55, sun: "#ffc79a", sunIntensity: 1.1 }} />
      <Stars upperOnly radius={500} count={500} />
      <Jupiter position={[-30, 30, -260]} radius={90} rotation={0.6 + t * 0.02} dim={0.55} />
      <mesh geometry={geo.plane} material={mat("#1d2430")} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -60]} scale={[400, 400, 1]} />
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} geometry={geo.ring} material={mat("#141a23")} rotation={[-Math.PI / 2, 0, 0]} position={[(random(`cx${i}`) - 0.5) * 50, 0.02, -8 - random(`cz${i}`) * 50]} scale={2 + random(`cs${i}`) * 5} />
      ))}
      <Rocks count={40} area={80} seed="moonrock" />
      <Lander position={[5, 0, -7]} flicker={flicker} rotationY={0.4} />
      <Astronaut position={[0, 0, 0]} rotationY={0.35 + look} color="#e9ecef" skin="#ffd7b5" pants="#c9ccd1" armsUp={0.32} expression={t > 2.3 ? "shock" : "happy"} />
      <Alien position={[dart(0), 0, -34]} t={t} seed={1} rotationY={Math.PI / 2} scale={1.3} />
      <Alien position={[dart(0.35), 0, -42]} t={t} seed={2} rotationY={Math.PI / 2} scale={1.3} />
    </SceneCanvas>
  );
};
