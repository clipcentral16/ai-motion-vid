import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { geo } from "../../shared/three/materials";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { CameraRig, Puff, punchFov, type Vec3 } from "../../shared/three/World";
import { FLICK, RESET, SKIES } from "../constants";
import { ROCK_R, flickCar, flickRock, resetGlow } from "../mechanics";
import { Asteroid, FlyingCar } from "../three/AsteroidProps";
import { SkyArena } from "./SkyArena";

// 5. Flip reset (all four wheels touch the rock), then a musty flick that
//    launches it straight up out of the sky.
export const Scene5Flick: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const car = flickCar(t);
  const rock = flickRock(t);
  const glow = resetGlow(t);

  const hit = t - FLICK;
  const shake = hit > 0 ? Math.exp(-hit * 4) * 0.5 : t > RESET && t < RESET + 0.3 ? 0.06 : 0;
  // Side view, then tilt up to watch the rock leave.
  const up = interpolate(t, [FLICK, FLICK + 1.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cam: Vec3 = [1.5 + Math.sin(t * 50) * shake, interpolate(up, [0, 1], [1.4, -1.5]) + Math.cos(t * 41) * shake, interpolate(up, [0, 1], [10, 13])];
  const target: Vec3 = [0, interpolate(up, [0, 1], [1.2, 22]), 0];

  return (
    <SceneCanvas skyTop={SKIES.high.top} skyHorizon={SKIES.high.horizon} far={800}>
      <CameraRig position={cam} target={target} fov={punchFov(frame, fps, 60) + (hit > 0 ? 10 * Math.exp(-hit * 3) : 0)} />
      <SkyArena t={t + 5} />
      <group position={car.pos} rotation={car.rot}>
        <FlyingCar boost={hit > 0 && hit < 1.5 ? 0.8 : 0.35} flicker={t} wheelGlow={glow} />
      </group>
      <Asteroid position={rock.pos} radius={ROCK_R} spin={rock.spin} heat={rock.heat} squash={rock.squash} />
      {/* Flip reset sparkle ring at the contact point */}
      {glow > 0 ? (
        <mesh geometry={geo.ring} position={[car.pos[0], car.pos[1] + 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.8 + (1 - glow) * 3}>
          <meshBasicMaterial color="#66e0ff" transparent opacity={glow} depthWrite={false} />
        </mesh>
      ) : null}
      {/* Flick impact: flash and shock ring */}
      {hit > 0 && hit < 0.6 ? (
        <>
          <mesh geometry={geo.ball} position={[car.pos[0] + 0.4, 1.4, 0]} scale={1 + hit * 10}>
            <meshBasicMaterial color="#fff3b0" transparent opacity={(1 - hit / 0.6) * 0.8} depthWrite={false} />
          </mesh>
          <mesh geometry={geo.ring} position={[car.pos[0] + 0.4, 1.4, 0]} scale={1 + hit * 20}>
            <meshBasicMaterial color="#ffffff" transparent opacity={1 - hit / 0.6} depthWrite={false} />
          </mesh>
        </>
      ) : null}
      {/* Fire trail as it rockets away */}
      {hit > 0
        ? Array.from({ length: 14 }).map((_, k) => {
            const back = flickRock(t - (k + 1) * 0.04);
            return <Puff key={k} position={back.pos} progress={0.25 + k * 0.045} seed={`fl${k}`} size={2.6 - k * 0.12} color="#ffb347" glow={1.4} rise={0} />;
          })
        : null}
    </SceneCanvas>
  );
};
