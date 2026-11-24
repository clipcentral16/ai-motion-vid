import { geo, mat, shadowMat } from "./materials";

export const LEG_HEIGHT = 0.5;

export type CharacterProps = {
  position?: [number, number, number];
  rotationY?: number;
  color: string;
  skin: string;
  pants?: string;
  /** 1 = legs, 0 = no legs. */
  legs?: number;
  /** Walk cycle phase in radians. */
  walk?: number;
  /** Extra height of the upper body above where it should rest (bounce). */
  lift?: number;
  /** Vertical squash of the upper body, 1 = none. */
  squash?: number;
  expression?: "happy" | "shock";
  /** 0 = arms down, 1 = arms straight up ("wheee"). */
  armsUp?: number;
  /** Forward/back arm swing (radians), e.g. paddling along on a chair. */
  armSwing?: number;
  lean?: number;
  /** Side-to-side tilt of the upper body (radians). */
  roll?: number;
  scale?: number;
  shadow?: boolean;
};

// Simple capsule person with a round head. Origin is on the ground between
// the feet (or under the body when the legs are gone), facing +Z.
export const Character: React.FC<CharacterProps> = ({
  position = [0, 0, 0],
  rotationY = 0,
  color,
  skin,
  pants = "#34375a",
  legs = 1,
  walk = 0,
  lift = 0,
  squash = 1,
  expression = "happy",
  armsUp = 0,
  armSwing,
  lean = 0,
  roll = 0,
  scale = 1,
  shadow = true,
}) => {
  const base = LEG_HEIGHT * legs + lift;
  const legSwing = Math.sin(walk) * 0.55;
  const swing = armSwing ?? -Math.sin(walk) * 0.5 * legs;
  const sx = 1 / Math.sqrt(squash);
  const armOut = 0.15 + armsUp * 2.55;
  const body = mat(color);
  const skinM = mat(skin);
  const dark = mat("#1b1b2f");

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {shadow ? (
        <mesh geometry={geo.blob} material={shadowMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} />
      ) : null}

      {legs > 0.01 ? (
        <group position={[0, LEG_HEIGHT, 0]} scale={[1, legs, 1]}>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.15, 0, 0]} rotation={[side * legSwing, 0, 0]}>
              <mesh geometry={geo.leg} material={mat(pants)} position={[0, -0.25, 0]} />
            </group>
          ))}
        </group>
      ) : null}

      <group position={[0, base, 0]} scale={[sx * 1, squash, sx]} rotation={[lean, 0, roll]}>
        <mesh geometry={geo.body} material={body} position={[0, 0.565, 0]} />
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.38, 0.9, 0]} rotation={[armSwing === undefined ? swing * side : swing, 0, side * armOut]}>
            <mesh geometry={geo.limb} material={body} position={[0, -0.22, 0]} />
            <mesh geometry={geo.eye} material={skinM} position={[0, -0.42, 0]} scale={1.5} />
          </group>
        ))}
        <group position={[0, 1.42, 0]}>
          <mesh geometry={geo.head} material={skinM} />
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              geometry={geo.eye}
              material={dark}
              position={[side * 0.12, 0.06, 0.29]}
              scale={expression === "shock" ? [1.25, 1.6, 1] : [1, 1.2, 1]}
            />
          ))}
          {expression === "happy" ? (
            <mesh geometry={geo.smile} material={dark} position={[0, -0.06, 0.3]} rotation={[0, 0, Math.PI]} />
          ) : (
            <mesh geometry={geo.eye} material={dark} position={[0, -0.12, 0.3]} scale={[1.1, 1.5, 0.6]} />
          )}
          {[-1, 1].map((side) => (
            <mesh key={`c${side}`} geometry={geo.eye} material={mat("#ff8fa3")} position={[side * 0.2, -0.06, 0.25]} scale={[0.9, 0.6, 0.4]} />
          ))}
        </group>
      </group>
    </group>
  );
};
