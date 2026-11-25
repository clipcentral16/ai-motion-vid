import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { geo } from "../../shared/three/materials";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { CameraRig, Puff, punchFov, type Vec3 } from "../../shared/three/World";
import { CATCH, SKIES } from "../constants";
import { ROCK_R, catchCar, catchRock } from "../mechanics";
import { Asteroid, FlyingCar } from "../three/AsteroidProps";
import { SkyArena } from "./SkyArena";

// 4. Zen air rolls up to meet the asteroid and catches it dead on the roof.
export const Scene4Catch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const car = catchCar(t);
  const rock = catchRock(t);

  const hit = t - CATCH;
  const shake = hit > 0 ? Math.exp(-hit * 5) * 0.35 : 0;
  // Wide side view while they converge, then a slow orbit around the balanced rock.
  const orbit = hit > 0 ? hit * 0.35 : 0;
  const dist = interpolate(t, [0, CATCH, 5], [17, 12, 10], { extrapolateRight: "clamp" });
  const focus: Vec3 = [(car.pos[0] + rock.pos[0]) / 2, (car.pos[1] + rock.pos[1]) / 2, 0];
  const cam: Vec3 = [focus[0] + Math.sin(orbit) * dist + Math.sin(t * 50) * shake, focus[1] + 1.5 + Math.cos(t * 43) * shake, Math.cos(orbit) * dist];

  return (
    <SceneCanvas skyTop={SKIES.high.top} skyHorizon={SKIES.high.horizon} far={600}>
      <CameraRig position={cam} target={focus} fov={punchFov(frame, fps, 60) - (hit > 0 ? 8 * Math.exp(-hit * 4) : 0)} />
      <SkyArena t={t} />
      <group position={car.pos} rotation={car.rot}>
        <FlyingCar boost={hit < 0 ? 1 : 0.35} flicker={t} />
      </group>
      <Asteroid position={rock.pos} radius={ROCK_R} spin={rock.spin} heat={rock.heat} squash={rock.squash} />
      {/* Fire trail while it falls */}
      {hit < 0
        ? Array.from({ length: 10 }).map((_, k) => {
            const back = catchRock(t - (k + 1) * 0.06);
            return <Puff key={k} position={back.pos} progress={0.3 + k * 0.06} seed={`ft${k}`} size={2.4 - k * 0.15} color="#ff9a3c" glow={1.4} rise={0} />;
          })
        : null}
      {/* Boost trail behind the car */}
      {hit < 0
        ? Array.from({ length: 10 }).map((_, k) => {
            const back = catchCar(t - (k + 1) * 0.05);
            return <Puff key={`c${k}`} position={back.pos} progress={0.3 + k * 0.07} seed={`ct${k}`} size={0.8} color="#cfe8ff" glow={0.6} rise={0} />;
          })
        : null}
      {/* Impact ring when it stops */}
      {hit > 0 && hit < 0.7 ? (
        <mesh geometry={geo.ring} position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={1 + hit * 12}>
          <meshBasicMaterial color="#ffffff" transparent opacity={1 - hit / 0.7} depthWrite={false} />
        </mesh>
      ) : null}
    </SceneCanvas>
  );
};
