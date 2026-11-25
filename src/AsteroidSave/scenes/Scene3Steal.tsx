import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { BUILDING_COLORS } from "../../shared/palette";
import { geo, mat } from "../../shared/three/materials";
import { Building } from "../../shared/three/Props";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { CameraRig, Lights, Puff, punchFov, type Vec3 } from "../../shared/three/World";
import { JUMP_IN, LIFTOFF, SKIES } from "../constants";
import { Asteroid, FlyingCar, Helipad, ZenCharacter } from "../three/AsteroidProps";

const ROOF = 0;

/** Car height above the pad: parked, a hop at lift-off, then rockets upward. */
export const carRise = (t: number) => (t < LIFTOFF ? 0.75 : 0.75 + 4 * Math.pow(t - LIFTOFF, 2) + (t - LIFTOFF) * 2);

// 3. On a rooftop helipad Zen sprints up, jumps into Elon's flying car and boosts away.
export const Scene3Steal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const zenX = interpolate(t, [0, JUMP_IN - 0.2], [-7, -1.2], { extrapolateRight: "clamp" });
  const jump = interpolate(t, [JUMP_IN - 0.2, JUMP_IN + 0.15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const inCar = t > JUMP_IN + 0.15;
  const stride = t * 14;
  const carY = carRise(t);
  const nose = interpolate(t, [LIFTOFF, LIFTOFF + 0.6], [0, -0.9], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });

  const follow = interpolate(t, [LIFTOFF, 4.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
  const cam: Vec3 = [1.5, 3.2 + follow * 6, 10 + follow * 2];
  const target: Vec3 = [0, 1.2 + Math.max(0, carY - 1.5) * 0.85, 0];

  return (
    <SceneCanvas skyTop={SKIES.dusk.top} skyHorizon={SKIES.dusk.horizon} far={600}>
      <CameraRig position={cam} target={target} fov={punchFov(frame, fps, 62)} />
      <Lights fogNear={40} fogFar={200} mood={{ fog: "#c9573a", sky: "#ffb38a", ground: "#3a2a2a", hemi: 1.1, sun: "#ff9a6a", sunIntensity: 1.8 }} />
      <Asteroid position={[-18, 60, -150]} radius={22} spin={t * 0.3} heat={1} />
      {/* Rooftop and the city below */}
      <mesh geometry={geo.box} material={mat("#4a4e58")} position={[0, ROOF - 0.5, 0]} scale={[16, 1, 16]} />
      <Helipad position={[0, ROOF, 0]} />
      {Array.from({ length: 22 }).map((_, i) => {
        const a = (i / 22) * Math.PI * 2;
        const r = 22 + random(`rb${i}`) * 25;
        return (
          <Building
            key={i}
            position={[Math.cos(a) * r, -40, Math.sin(a) * r - 10]}
            size={[7, 30 + random(`rh${i}`) * 25, 7]}
            color={BUILDING_COLORS[i % BUILDING_COLORS.length]}
            floorHeight={3}
          />
        );
      })}

      <group position={[0, carY, 0]} rotation={[nose, Math.PI / 2, 0, "YXZ"]}>
        <FlyingCar boost={t > LIFTOFF - 0.1 ? 1 : 0} flicker={t} showDriver={inCar} />
      </group>
      {/* Boost smoke on take-off */}
      {Array.from({ length: 12 }).map((_, k) => {
        const spawn = LIFTOFF + k * 0.08;
        return <Puff key={k} position={[-1.4, carRise(spawn) - 0.6, 0]} progress={(t - spawn) / 1.4} seed={`b${k}`} size={1.4} color="#d6d0c8" glow={0.3} rise={0.4} />;
      })}

      {!inCar ? (
        <ZenCharacter
          position={[zenX + jump * 1.2, ROOF + 0.2 + Math.sin(jump * Math.PI) * 1.6 + jump * 0.6, jump * 0.2]}
          rotationY={Math.PI / 2}
          scale={1 - jump * 0.5}
          skin="#f1c27d"
          walk={jump > 0 ? 0 : stride}
          lift={jump > 0 ? 0 : Math.abs(Math.sin(stride)) * 0.18}
          lean={0.2}
          armsUp={jump > 0 ? 0.9 : 0}
          expression="happy"
        />
      ) : null}
    </SceneCanvas>
  );
};
