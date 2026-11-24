import * as THREE from "three";
import { useMemo } from "react";
import { random } from "remotion";
import { geo, mat, shadowMat } from "./materials";

type P = { position?: [number, number, number]; rotationY?: number; color?: string };

/** Top of the seat, where a legless character sits. */
export const CHAIR_SEAT_Y = 0.62;
/** Top of the deck, where a legless character sits. */
export const BOARD_DECK_Y = 0.2;

export const OfficeChair: React.FC<P & { wheelSpin?: number }> = ({
  position = [0, 0, 0],
  rotationY = 0,
  color = "#2d3142",
}) => {
  const metal = mat("#9aa0a6");
  const black = mat("#222222");
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={geo.blob} material={shadowMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} scale={1.3} />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <mesh geometry={geo.box} material={metal} position={[0, 0.12, 0.25]} scale={[0.08, 0.06, 0.5]} />
            <mesh geometry={geo.wheel} material={black} position={[0, 0.06, 0.48]} rotation={[0, 0, Math.PI / 2]} scale={[0.06, 0.06, 0.06]} />
          </group>
        );
      })}
      <mesh geometry={geo.cylinder} material={metal} position={[0, 0.33, 0]} scale={[0.05, 0.4, 0.05]} />
      <mesh geometry={geo.cylinder} material={mat(color)} position={[0, CHAIR_SEAT_Y - 0.06, 0]} scale={[0.5, 0.12, 0.5]} />
      <mesh geometry={geo.box} material={mat(color)} position={[0, CHAIR_SEAT_Y + 0.5, -0.45]} scale={[0.8, 0.85, 0.12]} rotation={[-0.12, 0, 0]} />
      <mesh geometry={geo.box} material={metal} position={[0, CHAIR_SEAT_Y + 0.1, -0.42]} scale={[0.06, 0.3, 0.06]} />
    </group>
  );
};

export const Skateboard: React.FC<P> = ({ position = [0, 0, 0], rotationY = 0, color = "#ff4d6d" }) => {
  const black = mat("#222222");
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={geo.blob} material={shadowMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} scale={[1.1, 1.6, 1]} />
      <mesh geometry={geo.box} material={mat(color)} position={[0, BOARD_DECK_Y - 0.03, 0]} scale={[0.75, 0.06, 1.25]} />
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx}${sz}`}
            geometry={geo.wheel}
            material={mat("#ffe66d")}
            position={[sx * 0.3, 0.08, sz * 0.42]}
            rotation={[0, 0, Math.PI / 2]}
            scale={[0.08, 0.08, 0.08]}
          />
        )),
      )}
      <mesh geometry={geo.box} material={black} position={[0, BOARD_DECK_Y - 0.065, 0]} scale={[0.5, 0.02, 1.1]} />
    </group>
  );
};

export const Tree: React.FC<P & { size?: number }> = ({ position = [0, 0, 0], size = 1, color = "#3ddc84" }) => (
  <group position={position} scale={size}>
    <mesh geometry={geo.blob} material={shadowMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} scale={2} />
    <mesh geometry={geo.cylinder} material={mat("#8d5a3b")} position={[0, 0.7, 0]} scale={[0.15, 1.4, 0.15]} />
    <mesh geometry={geo.canopy} material={mat(color)} position={[0, 1.9, 0]} scale={0.9} />
    <mesh geometry={geo.canopy} material={mat(color)} position={[0.35, 1.5, 0.2]} scale={0.6} />
  </group>
);

export const LampPost: React.FC<P> = ({ position = [0, 0, 0], rotationY = 0 }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <mesh geometry={geo.cylinder} material={mat("#2d3142")} position={[0, 1.6, 0]} scale={[0.06, 3.2, 0.06]} />
    <mesh geometry={geo.box} material={mat("#2d3142")} position={[0.3, 3.15, 0]} scale={[0.7, 0.08, 0.1]} />
    <mesh geometry={geo.box} material={mat("#fff3b0", { emissive: 0.6 })} position={[0.55, 3.05, 0]} scale={[0.3, 0.12, 0.2]} />
  </group>
);

export const TrafficLight: React.FC<P> = ({ position = [0, 0, 0], rotationY = 0 }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <mesh geometry={geo.cylinder} material={mat("#2d3142")} position={[0, 1.5, 0]} scale={[0.07, 3, 0.07]} />
    <mesh geometry={geo.box} material={mat("#2d3142")} position={[0, 3.3, 0]} scale={[0.4, 1.1, 0.35]} />
    <mesh geometry={geo.eye} material={mat("#ff3b30", { emissive: 1 })} position={[0, 3.62, 0.18]} scale={2.2} />
    <mesh geometry={geo.eye} material={mat("#5a4a00")} position={[0, 3.3, 0.18]} scale={2.2} />
    <mesh geometry={geo.eye} material={mat("#0a3d1a")} position={[0, 2.98, 0.18]} scale={2.2} />
  </group>
);

export const Cloud: React.FC<P & { size?: number; seed?: number }> = ({ position = [0, 0, 0], size = 1, seed = 0 }) => {
  const white = mat("#ffffff", { emissive: 0.35 });
  return (
    <group position={position} scale={size}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          geometry={geo.puff}
          material={white}
          position={[(i - 2) * 0.9, random(`c${seed}${i}`) * 0.4, random(`d${seed}${i}`) * 0.4]}
          scale={0.7 + random(`s${seed}${i}`) * 0.6}
        />
      ))}
    </group>
  );
};

/** Building with horizontal window bands and a roof cap. */
export const Building: React.FC<{
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  floorHeight?: number;
  windows?: boolean;
}> = ({ position, size, color, floorHeight = 1.4, windows = true }) => {
  const [w, h, d] = size;
  const floors = Math.max(1, Math.floor((h - 0.8) / floorHeight));
  const glass = mat("#d6f3ff", { emissive: 0.15 });
  return (
    <group position={position}>
      <mesh geometry={geo.box} material={mat(color)} position={[0, h / 2, 0]} scale={[w, h, d]} />
      <mesh geometry={geo.box} material={mat("#ffffff")} position={[0, h + 0.1, 0]} scale={[w + 0.2, 0.2, d + 0.2]} />
      {windows
        ? Array.from({ length: floors }).map((_, i) => (
            <mesh
              key={i}
              geometry={geo.box}
              material={glass}
              position={[0, 1.0 + i * floorHeight + floorHeight / 2 - 0.3, 0]}
              scale={[w + 0.04, floorHeight * 0.4, d + 0.04]}
            />
          ))
        : null}
    </group>
  );
};

export const SoccerBall: React.FC<{ position: [number, number, number]; roll: number }> = ({ position, roll }) => (
  <group position={position} rotation={[roll, roll * 0.3, 0]}>
    <mesh geometry={geo.ball} material={mat("#ffffff")} scale={0.35} />
    <mesh geometry={geo.puff} material={mat("#222222")} scale={0.2} position={[0, 0, 0.18]} />
    <mesh geometry={geo.puff} material={mat("#222222")} scale={0.2} position={[0, 0, -0.18]} />
  </group>
);

/**
 * U-shaped half-pipe slide that follows a curve. Riders sit at
 * `slideRiderTransform` positions along it.
 */
export const useHalfPipe = (curve: THREE.Curve<THREE.Vector3>, radius = 0.9, segments = 160) =>
  useMemo(() => {
    const radial = 8;
    const positions: number[] = [];
    const index: number[] = [];
    const worldUp = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const p = curve.getPointAt(u);
      const t = curve.getTangentAt(u);
      const side = new THREE.Vector3().crossVectors(t, worldUp).normalize();
      const up = new THREE.Vector3().crossVectors(side, t).normalize();
      for (let j = 0; j <= radial; j++) {
        const a = Math.PI + (Math.PI * j) / radial;
        const v = p
          .clone()
          .addScaledVector(side, Math.cos(a) * radius)
          .addScaledVector(up, Math.sin(a) * radius);
        positions.push(v.x, v.y, v.z);
      }
    }
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < radial; j++) {
        const a = i * (radial + 1) + j;
        const b = a + radial + 1;
        index.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(index);
    g.computeVertexNormals();
    return g;
  }, [curve, radius, segments]);

/**
 * Where a rider sits on a half-pipe slide at progress `u` (0..1). `swing`
 * (radians) rides them up the side walls, like a real slide.
 */
export const slideRiderTransform = (curve: THREE.Curve<THREE.Vector3>, u: number, radius: number, swing = 0) => {
  const uu = Math.min(1, Math.max(0, u));
  const p = curve.getPointAt(uu);
  const t = curve.getTangentAt(uu);
  const side = new THREE.Vector3().crossVectors(t, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(side, t).normalize();
  const pos = p.addScaledVector(up, -Math.cos(swing) * radius * 0.92).addScaledVector(side, Math.sin(swing) * radius * 0.92);
  return {
    position: [pos.x, pos.y, pos.z] as [number, number, number],
    rotationY: Math.atan2(t.x, t.z),
    pitch: -Math.asin(Math.max(-1, Math.min(1, t.y))),
    roll: -swing,
  };
};
