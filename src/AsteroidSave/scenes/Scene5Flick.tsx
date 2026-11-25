import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { geo } from "../../shared/three/materials";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { CameraRig, Puff, punchFov, type Vec3 } from "../../shared/three/World";
import { SKIES } from "../constants";
import { ROCK_R, SAVE, SCENE4_LEN, carPose, flickPoint, resetGlow, rockState } from "../mechanics";
import { Asteroid, FlyingCar } from "../three/AsteroidProps";
import { SkyArena } from "./SkyArena";

const IMPACT = flickPoint();

// 5. Still air rolling: the flip reset happens mid-roll (all four wheels on the
//    rock), then a musty flick with full nose contact and a follow-through.
export const Scene5Flick: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const T = SCENE4_LEN + t; // continuous with scene 4
  const car = carPose(T);
  const rock = rockState(T);
  const glow = resetGlow(T);

  const hit = T - SAVE.T_FLICK;
  const shake = hit > 0 ? Math.exp(-hit * 4) * 0.5 : glow > 0.5 ? 0.06 : 0;
  // Track the pair side-on, then tilt up to watch the rock leave.
  const pre = rockState(Math.min(T, SAVE.T_FLICK));
  const carNow = carPose(Math.min(T, SAVE.T_FLICK));
  const focus: Vec3 = [(pre.pos[0] + carNow.pos[0]) / 2, (pre.pos[1] + carNow.pos[1]) / 2, 0];
  const up = interpolate(hit, [0, 1.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cam: Vec3 = [focus[0] + 1.5 + Math.sin(t * 50) * shake, focus[1] + interpolate(up, [0, 1], [0.3, -3]) + Math.cos(t * 41) * shake, interpolate(up, [0, 1], [10.5, 13])];
  const target: Vec3 = [focus[0] + up * 6, focus[1] + up * 22, 0];

  return (
    <SceneCanvas skyTop={SKIES.high.top} skyHorizon={SKIES.high.horizon} far={800}>
      <CameraRig position={cam} target={target} fov={punchFov(frame, fps, 60) + (hit > 0 ? 10 * Math.exp(-hit * 3) : 0)} />
      <SkyArena t={t + 5} />
      <group position={car.pos} rotation={car.rot}>
        <FlyingCar boost={hit > 0 && hit < 1.5 ? 0.9 : 0.5} flicker={t} wheelGlow={glow} />
      </group>
      <Asteroid position={rock.pos} radius={ROCK_R} spin={rock.spin} heat={rock.heat} squash={rock.squash} />
      {/* Flip reset: sparkle ring where the wheels meet the rock */}
      {glow > 0 ? (
        <mesh geometry={geo.ring} position={[car.pos[0], car.pos[1] + 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.8 + (1 - glow) * 3}>
          <meshBasicMaterial color="#66e0ff" transparent opacity={glow} depthWrite={false} />
        </mesh>
      ) : null}
      {/* Musty contact: flash and shock ring at the nose */}
      {hit > 0 && hit < 0.6 ? (
        <>
          <mesh geometry={geo.ball} position={IMPACT} scale={0.4 + hit * 3}>
            <meshBasicMaterial color="#fff3b0" transparent opacity={(1 - hit / 0.6) * 0.6} depthWrite={false} />
          </mesh>
          <mesh geometry={geo.ring} position={IMPACT} scale={1 + hit * 18}>
            <meshBasicMaterial color="#ffffff" transparent opacity={1 - hit / 0.6} depthWrite={false} />
          </mesh>
        </>
      ) : null}
      {/* Fire trail as it rockets away */}
      {/* Held back a beat so the nose contact stays visible */}
      {hit > 0.12
        ? Array.from({ length: 14 }).map((_, k) => {
            const back = rockState(Math.max(SAVE.T_FLICK + 0.12, T - (k + 1) * 0.04));
            return <Puff key={k} position={back.pos} progress={0.25 + k * 0.045} seed={`fl${k}`} size={2.6 - k * 0.12} color="#ffb347" glow={1.4} rise={0} />;
          })
        : null}
    </SceneCanvas>
  );
};
