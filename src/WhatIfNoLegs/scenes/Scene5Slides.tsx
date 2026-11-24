import * as THREE from "three";
import { useMemo } from "react";
import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { SHIRT_COLORS, SKIN_COLORS } from "../constants";
import { Character } from "../../shared/three/Character";
import { geo, mat } from "../../shared/three/materials";
import { Building, Cloud, Tree, slideRiderTransform, useHalfPipe } from "../../shared/three/Props";
import { SceneCanvas } from "../../shared/three/SceneCanvas";
import { CameraRig, Lights, punchFov, type Vec3 } from "../../shared/three/World";

const SLIDE_R = 0.85;
const TOWER_H = 16;

/** Spiral slide wrapped around the tower, then a straight run-out. */
const makeSpiral = () => {
  const pts: THREE.Vector3[] = [];
  const turns = 2.25;
  const n = 60;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = u * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * 4.4, TOWER_H - 0.5 - u * (TOWER_H - 1.6), Math.sin(a) * 4.4));
  }
  const last = pts[pts.length - 1];
  const endA = turns * Math.PI * 2;
  const tangent = new THREE.Vector3(-Math.sin(endA), 0, Math.cos(endA));
  pts.push(last.clone().addScaledVector(tangent, 3).setY(1.1));
  pts.push(last.clone().addScaledVector(tangent, 8).setY(1.0));
  return new THREE.CatmullRomCurve3(pts);
};

/** Straight-ish ramp from a rooftop down to the street. */
const makeRamp = (from: Vec3, to: Vec3) =>
  new THREE.CatmullRomCurve3([
    new THREE.Vector3(...from),
    new THREE.Vector3(from[0] + (to[0] - from[0]) * 0.5, from[1] * 0.45, from[2] + (to[2] - from[2]) * 0.5),
    new THREE.Vector3(to[0] - (to[0] - from[0]) * 0.1, to[1] + 0.1, to[2] - (to[2] - from[2]) * 0.1),
    new THREE.Vector3(...to),
  ]);

const SLIDE_COLORS = ["#ffd166", "#ef476f", "#06d6a0"];

const riders = Array.from({ length: 12 }).map((_, i) => {
  const r = (k: string) => random(`s5-${k}-${i}`);
  return {
    slide: i % 3,
    start: Math.floor(i / 3) * 0.85 + r("s") * 0.25 - 0.9,
    dur: 2.3 + r("d") * 0.4,
    color: SHIRT_COLORS[Math.floor(r("c") * SHIRT_COLORS.length)],
    skin: SKIN_COLORS[Math.floor(r("k") * SKIN_COLORS.length)],
  };
});

/** Round "no stairs" sign: red ring + slash over a stair icon. */
const NoStairsSign: React.FC<{ position: Vec3; rotationY: number }> = ({ position, rotationY }) => {
  const red = mat("#e63946");
  const black = mat("#1b1b2f");
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={geo.cylinder} material={mat("#6c757d")} position={[0, 1.4, 0]} scale={[0.08, 2.8, 0.08]} />
      <group position={[0, 3.6, 0.1]} scale={1.1}>
        <mesh geometry={geo.disc} material={mat("#ffffff", { emissive: 0.2 })} />
        <mesh geometry={geo.ring} material={red} position={[0, 0, 0.02]} scale={[1, 1, 1]} />
        <mesh geometry={geo.disc} position={[0, 0, 0.01]} scale={0.86}>
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh geometry={geo.ring} material={red} position={[0, 0, 0.02]} scale={0.86} />
        {[0, 1, 2].map((s) => (
          <mesh key={s} geometry={geo.box} material={black} position={[-0.35 + s * 0.3, -0.35 + s * 0.15 + 0.075 * s, 0.03]} scale={[0.3, 0.3 + s * 0.3, 0.02]} />
        ))}
        <mesh geometry={geo.box} material={red} position={[0, 0, 0.05]} rotation={[0, 0, Math.PI / 4]} scale={[0.16, 1.85, 0.03]} />
      </group>
    </group>
  );
};

// 5. Stairs replaced by giant slides. Camera spirals down with the riders.
export const Scene5Slides: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.cubic) });

  const curves = useMemo(() => [makeSpiral(), makeRamp([-9, 10.4, -7], [-1.5, 0.95, 6]), makeRamp([10, 8.4, -5], [3, 0.95, 7.5])], []);
  const g0 = useHalfPipe(curves[0], SLIDE_R, 240);
  const g1 = useHalfPipe(curves[1], SLIDE_R, 80);
  const g2 = useHalfPipe(curves[2], SLIDE_R, 80);
  const geos = [g0, g1, g2];

  const angle = interpolate(p, [0, 1], [0.6, 2.45]);
  const radius = interpolate(p, [0, 1], [17, 15]);
  const cam: Vec3 = [Math.cos(angle) * radius, interpolate(p, [0, 1], [17, 4]), Math.sin(angle) * radius + 4];
  const target: Vec3 = [0, interpolate(p, [0, 1], [11, 2.5]), 1];

  return (
    <SceneCanvas>
      <CameraRig position={cam} target={target} fov={punchFov(frame, fps, 66)} />
      <Lights fogNear={40} fogFar={130} />
      <mesh geometry={geo.plane} material={mat("#7ccf5b")} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} scale={[200, 200, 1]} />
      <mesh geometry={geo.box} material={mat("#d9d4cc")} position={[0, 0.02, 3]} scale={[40, 0.06, 14]} />
      <Building position={[0, 0, 0]} size={[5.2, TOWER_H, 5.2]} color="#4d96ff" />
      <Building position={[-10.5, 0, -9]} size={[6, 10, 6]} color="#ff6b6b" />
      <Building position={[11.5, 0, -7]} size={[6, 8, 6]} color="#c77dff" />
      <Building position={[-4, 0, -16]} size={[6, 13, 5]} color="#ffd93d" />
      <Building position={[6, 0, -17]} size={[5, 18, 5]} color="#5ee7df" />
      {curves.map((_, i) => (
        <mesh key={i} geometry={geos[i]} material={mat(SLIDE_COLORS[i], { side: THREE.DoubleSide })} />
      ))}
      {/* Support pole under the spiral run-out */}
      {[0.86, 0.94].map((u) => {
        const pt = curves[0].getPointAt(u);
        return <mesh key={u} geometry={geo.cylinder} material={mat("#adb5bd")} position={[pt.x, (pt.y - SLIDE_R) / 2, pt.z]} scale={[0.15, pt.y - SLIDE_R, 0.15]} />;
      })}
      <NoStairsSign position={[5.5, 0, 6.5]} rotationY={-0.5} />
      <Tree position={[-7, 0, 6]} />
      <Tree position={[9, 0, 3]} size={1.2} />
      <Tree position={[-14, 0, 2]} size={1.1} />
      {Array.from({ length: 5 }).map((_, i) => (
        <Cloud key={`cl${i}`} seed={i + 20} position={[-30 + i * 15, 28 + random(`s5cy${i}`) * 6, -40]} size={2.5} />
      ))}
      {riders.map((r, i) => {
        const s = (t - r.start) / r.dur;
        if (s < 0 || s > 1.15) return null;
        const u = Math.min(1, Math.pow(Math.min(1, s), 1.35));
        // Swing up the walls as they speed up.
        const swing = Math.sin(t * 5 + i * 1.7) * 0.75 * Math.min(1, u * 2);
        const tr = slideRiderTransform(curves[r.slide], u, SLIDE_R, swing);
        return (
          <group key={i} position={tr.position} rotation={[0, tr.rotationY, 0]}>
            <Character
              color={r.color}
              skin={r.skin}
              legs={0}
              shadow={false}
              lean={tr.pitch}
              roll={tr.roll}
              armsUp={0.75 + 0.25 * Math.sin(t * 14 + i)}
              expression={i % 2 ? "shock" : "happy"}
            />
          </group>
        );
      })}
    </SceneCanvas>
  );
};
