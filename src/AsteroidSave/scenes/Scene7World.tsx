import * as THREE from "three";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Globe } from "../../shared/three/Globe";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { Stars } from "../../shared/three/Stars";
import { CameraRig, Puff, punchFov, type Vec3 } from "../../shared/three/World";
import { SKIES } from "../constants";
import narration from "../narration.json";
import { Asteroid, FlyingCar } from "../three/AsteroidProps";

// The orbit starts on the narrator's "saved".
const line = narration.lines.find((l) => l.scene === 6)!;
const ORBIT_START = line.start + line.words.find((w) => w.text.toLowerCase().startsWith("saved"))!.start;

const ORBIT_R = 6.4;
const TILT = new THREE.Euler(0.45, 0, 0.2);
const ORBIT_SPEED = 2.6; // rad/s once up to speed
const ROLL_SPEED = 9; // air roll, rad/s

/** Angle around Earth: still before "saved", then eases up to full speed. */
const orbitAngle = (t: number) => {
  const s = Math.max(0, t - ORBIT_START);
  const ramp = 0.5;
  return -0.4 + (s < ramp ? (ORBIT_SPEED * s * s) / (2 * ramp) : ORBIT_SPEED * (s - ramp / 2));
};

/** Car transform on the tilted orbit: nose along the orbit, roof away from Earth, plus the air roll. */
const orbitTransform = (t: number) => {
  const a = orbitAngle(t);
  const pos = new THREE.Vector3(Math.cos(a) * ORBIT_R, 0, Math.sin(a) * ORBIT_R).applyEuler(TILT);
  const forward = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).applyEuler(TILT).normalize();
  const up = pos.clone().normalize();
  const right = new THREE.Vector3().crossVectors(up, forward).normalize();
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, forward));
  const rollAngle = Math.max(0, t - ORBIT_START) * ROLL_SPEED;
  q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rollAngle));
  return { pos: pos.toArray() as Vec3, q };
};

// 7. Back in space: the asteroid sails off; on "saved", Zen air rolls in an orbit around Earth.
export const Scene7World: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.sin) });

  const rock: Vec3 = [interpolate(p, [0, 1], [6, 40]), interpolate(p, [0, 1], [10, 30]), interpolate(p, [0, 1], [-10, -80])];
  // Pulled back far enough to see the whole orbit in a vertical frame.
  const cam: Vec3 = [interpolate(p, [0, 1], [-2, 2]), interpolate(p, [0, 1], [5, 7]), interpolate(p, [0, 1], [24, 27])];
  const car = orbitTransform(t);

  return (
    <SceneCanvas skyTop={SKIES.space.top} skyHorizon={SKIES.space.horizon} far={900} fov={55}>
      <CameraRig position={cam} target={[0, -0.5, 0]} fov={punchFov(frame, fps, 55)} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[12, 6, 10]} intensity={2.6} color="#fff6e8" />
      <Stars upperOnly={false} radius={500} count={900} />
      <Globe rotation={t * 0.12 + 0.6} smoke={0} />
      <Asteroid position={rock} radius={1.7} spin={t * 2} heat={0.6} />
      {Array.from({ length: 10 }).map((_, k) => (
        <Puff key={k} position={[rock[0] - (k + 1) * 1.2, rock[1] - (k + 1) * 0.7, rock[2] + (k + 1) * 2]} progress={0.3 + k * 0.06} seed={`w${k}`} size={1.2} color="#ffb347" glow={1.2} rise={0} />
      ))}
      {/* Boost trail following the orbit */}
      {t > ORBIT_START
        ? Array.from({ length: 14 }).map((_, k) => {
            const back = orbitTransform(Math.max(ORBIT_START, t - (k + 1) * 0.045));
            return <Puff key={`o${k}`} position={back.pos} progress={0.3 + k * 0.045} seed={`o${k}`} size={0.75} color="#ffd166" glow={1.2} rise={0} />;
          })
        : null}
      <group position={car.pos} quaternion={car.q}>
        <FlyingCar boost={t > ORBIT_START ? 1 : 0.5} flicker={t} scale={1.15} />
      </group>
    </SceneCanvas>
  );
};
