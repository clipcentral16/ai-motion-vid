import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { BUILDING_COLORS, SKIN_COLORS } from "../../shared/palette";
import { Character } from "../../shared/three/Character";
import { geo, mat } from "../../shared/three/materials";
import { Building, Tree } from "../../shared/three/Props";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { CameraRig, Lights, Puff, punchFov, type Vec3 } from "../../shared/three/World";
import { BLAST, SHOCK_ARRIVES, SKIES } from "../constants";
import { Hills, MushroomCloud, Shockwave } from "../three/NukeProps";

const GROUND_ZERO: Vec3 = [6, 0, -95];
const WATCHERS = [
  { x: -1.6, z: 1.2, color: "#4d96ff" },
  { x: -0.4, z: 0.6, color: "#ff6b6b" },
  { x: 0.9, z: 1.0, color: "#ffd93d" },
  { x: 2.0, z: 1.6, color: "#6bcb77" },
];
const DIST = Math.hypot(GROUND_ZERO[0], GROUND_ZERO[2]);
const SHOCK_SPEED = DIST / (SHOCK_ARRIVES - BLAST);

// 4. From a hilltop shelter, people watch a far-off flash and mushroom cloud;
//    the shockwave races across the land and hits seconds later.
export const Scene4Blast: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const since = t - BLAST;
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.quad) });

  const hit = t - SHOCK_ARRIVES;
  const shake = hit > 0 ? Math.exp(-hit * 2.5) * 0.45 : since > 0 ? 0.04 : 0;
  const cam: Vec3 = [
    interpolate(p, [0, 1], [-4, -2.5]) + Math.sin(t * 57) * shake,
    interpolate(p, [0, 1], [3, 3.6]) + Math.cos(t * 43) * shake,
    interpolate(p, [0, 1], [9, 7]),
  ];
  const target: Vec3 = [3, interpolate(p, [0, 1], [3, 9]), -60];
  // The sky glows orange after the flash.
  const glow = since > 0 ? Math.exp(-since * 0.8) : 0;
  const wind = hit > 0 ? Math.exp(-hit * 1.5) * Math.sin(hit * 9) : 0;

  return (
    <SceneCanvas skyTop={SKIES.dusk.top} skyHorizon={SKIES.dusk.horizon} far={600}>
      <CameraRig position={cam} target={target} fov={punchFov(frame, fps, 60)} />
      <Lights fogNear={60} fogFar={240} mood={{ fog: "#e9a67e", sky: "#ffd1b3", ground: "#5c5a3e", hemi: 1.1 + glow, sun: "#ffb27a", sunIntensity: 1.8 }} />
      {since > 0 ? <pointLight position={[GROUND_ZERO[0], 20, GROUND_ZERO[2] + 20]} color="#ffb36b" intensity={4000 * glow} distance={260} decay={1.5} /> : null}

      {/* Hilltop we stand on, and the valley below */}
      <mesh geometry={geo.plane} material={mat("#6f8f45")} rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, -100]} scale={[600, 600, 1]} />
      <mesh geometry={geo.canopy} material={mat("#7ea150")} position={[0, -6.5, 2]} scale={[16, 7, 12]} />
      <Hills color="#5a7b3a" radius={140} seed="blast" count={16} />
      {/* Shelter door in the hill */}
      <group position={[-5.5, 0, -1]} rotation={[0, 0.5, 0]}>
        <mesh geometry={geo.box} material={mat("#a7a9ac")} position={[0, 1.3, 0]} scale={[3, 2.6, 2]} />
        <mesh geometry={geo.box} material={mat("#1b1b1f")} position={[0, 1.1, 1.01]} scale={[1.4, 2, 0.05]} />
      </group>
      <Tree position={[3.5, 0, -2]} size={1.1} />
      <group position={[-3, 0, -3]} rotation={[wind * 0.25, 0, wind * 0.2]}>
        <Tree size={1.3} color="#2bb673" />
      </group>

      {/* Distant city */}
      {Array.from({ length: 16 }).map((_, i) => (
        <Building
          key={i}
          position={[-40 + i * 6.5, -6, -100 - (i % 4) * 5]}
          size={[5, 8 + random(`bh${i}`) * 18, 5]}
          color={BUILDING_COLORS[i % BUILDING_COLORS.length]}
          floorHeight={2.2}
        />
      ))}

      {since > 0 ? <MushroomCloud position={[GROUND_ZERO[0], -6, GROUND_ZERO[2]]} t={since} size={2.2} /> : null}
      {since > 0 ? (
        <mesh geometry={geo.ball} position={[GROUND_ZERO[0], 0, GROUND_ZERO[2]]} scale={20 * Math.min(1, since * 8) * Math.max(0, 1 - since * 2.5)}>
          <meshBasicMaterial color="#ffffff" transparent opacity={Math.max(0, 1 - since * 2.5)} />
        </mesh>
      ) : null}
      <Shockwave center={[GROUND_ZERO[0], -5.8, GROUND_ZERO[2]]} radius={since > 0 ? since * SHOCK_SPEED : 0} opacity={since > 0 ? Math.max(0, 1 - hit / 1.2) : 0} />

      {/* Dust blowing past once the shockwave arrives */}
      {Array.from({ length: 10 }).map((_, k) => (
        <Puff key={k} position={[-6 + k * 1.4, 0.6 + random(`dy${k}`), -2 - random(`dz${k}`) * 3]} progress={(hit - k * 0.05) / 1.4} seed={`d${k}`} size={1.6} color="#d8c3a5" glow={0.1} rise={0.6} />
      ))}

      {WATCHERS.map((w, i) => {
        const startled = hit > 0 ? Math.min(1, hit * 4) : 0;
        return (
          <Character
            key={i}
            position={[w.x, 0.3, w.z]}
            rotationY={Math.PI + 0.1 * (i - 1.5)}
            color={w.color}
            skin={SKIN_COLORS[(i * 2) % SKIN_COLORS.length]}
            expression={since > 0.15 ? "shock" : "happy"}
            armsUp={since > 0.15 ? 0.45 + 0.45 * startled : 0}
            lean={-0.25 * startled}
            lift={startled * Math.abs(Math.sin(hit * 12)) * 0.15 * Math.exp(-Math.max(0, hit) * 2)}
            roll={wind * 0.15}
          />
        );
      })}
    </SceneCanvas>
  );
};
