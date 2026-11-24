import * as THREE from "three";
import { useMemo } from "react";
import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { SHIRT_COLORS, SKIN_COLORS } from "../constants";
import { Character } from "../three/Character";
import { geo, mat } from "../three/materials";
import { BOARD_DECK_Y, Cloud, Skateboard, SoccerBall } from "../three/Props";
import { SceneCanvas } from "../three/SceneCanvas";
import { CameraRig, Lights, punchFov, type Vec3 } from "../three/World";
import { ollie } from "./walkers";

const FIELD_L = 40; // along X
const FIELD_W = 26; // along Z

// Faster, bouncier ball path.
const ballAt = (t: number): Vec3 => [11 * Math.sin(0.8 * t + 0.4), 0.35, 6.5 * Math.sin(1.25 * t + 1.1)];

const players = Array.from({ length: 12 }).map((_, i) => {
  const r = (k: string) => random(`s4-${k}-${i}`);
  return {
    team: i % 2,
    lag: 0.15 + r("lag") * 0.8,
    ox: (r("ox") - 0.5) * 3.5,
    oz: (r("oz") - 0.5) * 3.5,
    skin: SKIN_COLORS[Math.floor(r("k") * SKIN_COLORS.length)],
    phase: r("p") * 6.28,
  };
});

/** One stand of crowd: tiered seating with an instanced crowd of heads + bodies. */
const Stand: React.FC<{ position: Vec3; rotationY: number; length: number; seed: string; wave: number }> = ({
  position,
  rotationY,
  length,
  seed,
  wave,
}) => {
  const rows = 7;
  const crowd = useMemo(() => {
    const perRow = Math.floor(length / 0.9);
    const mesh = new THREE.InstancedMesh(geo.head, mat("#ffffff"), rows * perRow);
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    let k = 0;
    for (let row = 0; row < rows; row++) {
      for (let i = 0; i < perRow; i++) {
        m.makeTranslation(-length / 2 + 0.45 + i * 0.9 + (random(`${seed}x${row}${i}`) - 0.5) * 0.2, 0, 0);
        mesh.setMatrixAt(k, m);
        c.set(random(`${seed}t${row}${i}`) < 0.5 ? SHIRT_COLORS[0] : SHIRT_COLORS[7]);
        if (random(`${seed}o${row}${i}`) < 0.3) c.set(SHIRT_COLORS[Math.floor(random(`${seed}c${row}${i}`) * SHIRT_COLORS.length)]);
        mesh.setColorAt(k, c);
        k++;
      }
    }
    mesh.count = k;
    // One clone per row so the Mexican wave can lift rows independently.
    return Array.from({ length: rows }).map(() => mesh.clone());
  }, [length, seed]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {Array.from({ length: rows }).map((_, row) => (
        <group key={row}>
          <mesh geometry={geo.box} material={mat(row % 2 ? "#e9ecef" : "#adb5bd")} position={[0, row * 0.8 + 0.4, -row * 1.1]} scale={[length, 0.8, 1.1]} />
        </group>
      ))}
      {crowd.map((rowMesh, row) => {
        const lift = Math.max(0, Math.sin(wave - row * 0.6)) * 0.35;
        return <primitive key={`c${row}`} object={rowMesh} position={[0, row * 0.8 + 1.05 + lift, -row * 1.1]} scale={[1, 1.4, 1]} />;
      })}
      <mesh geometry={geo.box} material={mat("#ff6b6b")} position={[0, rows * 0.8 + 1.4, -rows * 1.1 + 0.5]} scale={[length, 0.5, 0.3]} />
    </group>
  );
};

// 4. Stadium: legless players chase the ball on skateboards. Camera orbits.
export const Scene4Stadium: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.sin) });

  const ballFlat = ballAt(t + 2);
  const ball: Vec3 = [ballFlat[0], 0.35 + Math.abs(Math.sin(t * 4.5)) * 1.6, ballFlat[2]];
  // Frame the middle of the pack (ball + chasing players).
  const pack = ballAt(t + 2 - 0.45);
  const focus: Vec3 = [(ballFlat[0] + pack[0]) / 2, 0.6, (ballFlat[2] + pack[2]) / 2];
  const angle = interpolate(p, [0, 1], [0.2, 1.9]);
  const radius = interpolate(p, [0, 1], [13, 8.5]);
  const cam: Vec3 = [focus[0] + Math.sin(angle) * radius, interpolate(p, [0, 1], [8, 4]), focus[2] + Math.cos(angle) * radius];
  const target: Vec3 = focus;
  const roll = t * 9;

  return (
    <SceneCanvas>
      <CameraRig position={cam} target={target} fov={punchFov(frame, fps, 66)} />
      <Lights fogNear={40} fogFar={140} />
      {/* Grass with mowing stripes */}
      <mesh geometry={geo.plane} material={mat("#5cb85c")} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} scale={[120, 120, 1]} />
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} geometry={geo.box} material={mat(i % 2 ? "#4caf50" : "#66c466")} position={[-FIELD_L / 2 + 2 + i * 4, 0, 0]} scale={[4, 0.02, FIELD_W + 4]} />
      ))}
      {/* Lines */}
      {[
        [0, 0, 0.15, FIELD_W],
        [0, -FIELD_W / 2, FIELD_L, 0.15],
        [0, FIELD_W / 2, FIELD_L, 0.15],
        [-FIELD_L / 2, 0, 0.15, FIELD_W],
        [FIELD_L / 2, 0, 0.15, FIELD_W],
        [-FIELD_L / 2 + 5, 0, 0.15, 12],
        [FIELD_L / 2 - 5, 0, 0.15, 12],
        [-FIELD_L / 2 + 2.5, -6, 5, 0.15],
        [-FIELD_L / 2 + 2.5, 6, 5, 0.15],
        [FIELD_L / 2 - 2.5, -6, 5, 0.15],
        [FIELD_L / 2 - 2.5, 6, 5, 0.15],
      ].map(([x, z, w, d], i) => (
        <mesh key={`l${i}`} geometry={geo.box} material={mat("#ffffff")} position={[x, 0.02, z]} scale={[w, 0.02, d]} />
      ))}
      <mesh geometry={geo.ring} material={mat("#ffffff")} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]} scale={4} />
      {/* Goals */}
      {[-1, 1].map((s) => (
        <group key={`g${s}`} position={[s * FIELD_L / 2, 0, 0]}>
          {[-1, 1].map((z) => (
            <mesh key={z} geometry={geo.cylinder} material={mat("#ffffff")} position={[0, 1.2, z * 3]} scale={[0.1, 2.4, 0.1]} />
          ))}
          <mesh geometry={geo.cylinder} material={mat("#ffffff")} position={[0, 2.4, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.1, 6.2, 0.1]} />
          <mesh geometry={geo.box} position={[s * 0.9, 1.2, 0]} scale={[1.8, 2.4, 6]}>
            <meshStandardMaterial color="#ffffff" transparent opacity={0.25} />
          </mesh>
        </group>
      ))}
      {/* Stands */}
      <Stand position={[0, 0, -FIELD_W / 2 - 3]} rotationY={0} length={FIELD_L + 6} seed="n" wave={t * 5} />
      <Stand position={[0, 0, FIELD_W / 2 + 3]} rotationY={Math.PI} length={FIELD_L + 6} seed="s" wave={t * 5 + 2} />
      <Stand position={[FIELD_L / 2 + 4, 0, 0]} rotationY={-Math.PI / 2} length={FIELD_W + 4} seed="e" wave={t * 5 + 1} />
      <Stand position={[-FIELD_L / 2 - 4, 0, 0]} rotationY={Math.PI / 2} length={FIELD_W + 4} seed="w" wave={t * 5 + 3} />
      {Array.from({ length: 5 }).map((_, i) => (
        <Cloud key={`cl${i}`} seed={i + 10} position={[-40 + i * 20, 28 + random(`s4cy${i}`) * 8, -50 + random(`s4cz${i}`) * 30]} size={3} />
      ))}

      <SoccerBall position={ball} roll={roll} />
      <mesh geometry={geo.blob} rotation={[-Math.PI / 2, 0, 0]} position={[ballFlat[0], 0.03, ballFlat[2]]} scale={0.8 - (ball[1] - 0.35) * 0.25}>
        <meshBasicMaterial color="#000000" transparent opacity={0.25} depthWrite={false} />
      </mesh>
      {players.map((pl, i) => {
        const pos = ballAt(t + 2 - pl.lag);
        const prev = ballAt(t + 2 - pl.lag - 0.1);
        const x = pos[0] + pl.ox * Math.min(1, pl.lag);
        const z = pos[2] + pl.oz * Math.min(1, pl.lag);
        const heading = Math.atan2(pos[0] - prev[0], pos[2] - prev[2]);
        const o = ollie(t, pl.phase, 1.3, 0.42, 0.8);
        return (
          <group key={i} position={[x, o.h, z]} rotation={[o.pitch, heading, 0]}>
            <Skateboard color={pl.team ? "#1d3557" : "#e63946"} />
            <Character
              position={[0, BOARD_DECK_Y, 0]}
              color={pl.team ? SHIRT_COLORS[7] : SHIRT_COLORS[0]}
              skin={pl.skin}
              legs={0}
              shadow={false}
              armSwing={o.h > 0 ? 0 : Math.sin(t * 10 + pl.phase) * 1.1}
              armsUp={o.h > 0 ? 0.85 : 0}
              lean={0.3}
              roll={Math.sin(t * 6 + pl.phase) * 0.12}
              expression={i % 3 === 0 ? "shock" : "happy"}
            />
          </group>
        );
      })}
    </SceneCanvas>
  );
};
