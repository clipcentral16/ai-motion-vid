import * as THREE from "three";
import { useMemo } from "react";
import { random } from "remotion";
import { plastic, rbox } from "./BlockCharacter";
import { Tree } from "./Environment";

type V3 = [number, number, number];

// ---------- Text signs ----------
const texCache = new Map<string, THREE.Texture>();
/** Canvas text texture for signs, boards and screens. */
export const textTexture = (text: string, bg: string, fg: string, w = 512, h = 192, font = "bold 120px 'Lilita One', 'DejaVu Sans', sans-serif") => {
  const k = `${text}|${bg}|${fg}|${w}|${h}|${font}`;
  let t = texCache.get(k);
  if (!t) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fg;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lines = text.split("\n");
    lines.forEach((ln, i) => ctx.fillText(ln, w / 2, h / 2 + (i - (lines.length - 1) / 2) * (h / lines.length)));
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    texCache.set(k, t);
  }
  return t;
};

export const Sign: React.FC<{ text: string; position: V3; size: [number, number]; bg?: string; fg?: string; rotationY?: number; glow?: number; font?: string }> = ({
  text,
  position,
  size,
  bg = "#ffffff",
  fg = "#1b1b1f",
  rotationY = 0,
  glow = 0,
  font,
}) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <mesh geometry={rbox(size[0] + 0.3, size[1] + 0.3, 0.25, 0.08)} material={plastic("#2b2f36", 0.5)} castShadow />
    <mesh position={[0, 0, 0.14]}>
      <planeGeometry args={size} />
      <meshStandardMaterial
        map={textTexture(text, bg, fg, 512, Math.round((512 * size[1]) / size[0]), font)}
        emissive="#ffffff"
        emissiveMap={glow ? textTexture(text, bg, fg, 512, Math.round((512 * size[1]) / size[0]), font) : undefined}
        emissiveIntensity={glow}
        roughness={0.6}
      />
    </mesh>
  </group>
);

// ---------- Classroom ----------
const Desk: React.FC<{ position: V3 }> = ({ position }) => {
  const wood = plastic("#c99a62", 0.6);
  const metal = plastic("#5c6470", 0.4);
  return (
    <group position={position}>
      <mesh geometry={rbox(4.4, 0.3, 3, 0.08)} material={wood} position={[0, 3.1, 0]} castShadow receiveShadow />
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => <mesh key={`${sx}${sz}`} geometry={rbox(0.25, 3, 0.25, 0.05)} material={metal} position={[sx * 1.9, 1.5, sz * 1.2]} castShadow />),
      )}
      {/* Chair behind the desk (towards +Z, where the pupil sits facing -Z) */}
      <group position={[0, 0, 2.6]}>
        <mesh geometry={rbox(2.6, 0.25, 2.4, 0.08)} material={plastic("#3f7fd6", 0.5)} position={[0, 1.4, 0]} castShadow />
        <mesh geometry={rbox(2.6, 2.2, 0.25, 0.08)} material={plastic("#3f7fd6", 0.5)} position={[0, 2.6, 1.1]} castShadow />
        {[-1, 1].map((sx) =>
          [-1, 1].map((sz) => <mesh key={`c${sx}${sz}`} geometry={rbox(0.2, 1.4, 0.2, 0.05)} material={metal} position={[sx * 1.1, 0.7, sz * 1.0]} castShadow />),
        )}
      </group>
    </group>
  );
};

/** Classroom facing -Z: whiteboard on the front wall, rows of desks with chairs. */
export const Classroom: React.FC<{ board?: string; desks?: V3[] }> = ({ board = "TEST TODAY!", desks }) => {
  const wall = plastic("#f4efe4", 0.9);
  const rows: V3[] = desks ?? [-7, 0, 7].flatMap((x) => [-4, 4, 12].map((z) => [x, 0, z] as V3));
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 4]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#d8b98a" roughness={0.75} />
      </mesh>
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} position={[-18 + i * 4, 0.01, 4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 40]} />
          <meshBasicMaterial color="#b89565" />
        </mesh>
      ))}
      <mesh position={[0, 8, -12]} receiveShadow>
        <boxGeometry args={[40, 16, 0.5]} />
        <primitive object={wall} attach="material" />
      </mesh>
      <mesh position={[0, 8, 20]} receiveShadow>
        <boxGeometry args={[40, 16, 0.5]} />
        <primitive object={wall} attach="material" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 20, 8, 4]} receiveShadow>
          <boxGeometry args={[0.5, 16, 40]} />
          <primitive object={wall} attach="material" />
        </mesh>
      ))}
      {/* Whiteboard */}
      <mesh geometry={rbox(16.5, 7.5, 0.3, 0.1)} material={plastic("#9aa3ad", 0.4)} position={[0, 8.2, -11.7]} castShadow />
      <mesh position={[0, 8.2, -11.5]}>
        <planeGeometry args={[16, 7]} />
        <meshStandardMaterial map={textTexture(board, "#fbfbf8", "#2a5bd7", 1024, 448, "bold 150px 'Lilita One', 'DejaVu Sans', sans-serif")} roughness={0.3} />
      </mesh>
      {/* Windows on the side wall */}
      {[-6, 4, 14].map((z) => (
        <group key={z} position={[19.7, 8.5, z]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh geometry={rbox(6, 5, 0.3, 0.08)} material={plastic("#ffffff", 0.5)} />
          <mesh position={[0, 0, 0.17]}>
            <planeGeometry args={[5.2, 4.2]} />
            <meshStandardMaterial color="#9fdcff" emissive="#9fdcff" emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}
      {/* Clock */}
      <group position={[12, 12.5, -11.6]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 0.2, 24]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.35, 0.12]}>
          <boxGeometry args={[0.12, 0.8, 0.05]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0.25, 0, 0.12]} rotation={[0, 0, -1.2]}>
          <boxGeometry args={[0.1, 0.6, 0.05]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </group>
      {rows.map((p, i) => (
        <Desk key={i} position={p} />
      ))}
    </group>
  );
};

// ---------- Doors ----------
/** Shop front with a glass door on a hinge (`open` radians) and a sign above it. */
export const ShopDoor: React.FC<{ position: V3; sign: string; open?: number; wall?: string; noHandle?: boolean; doorSign?: string }> = ({
  position,
  sign,
  open = 0,
  wall = "#f6e3b0",
  noHandle = false,
  doorSign,
}) => (
  <group position={position}>
    <mesh geometry={rbox(26, 16, 1, 0.1)} material={plastic(wall, 0.85)} position={[0, 8, -0.5]} receiveShadow castShadow />
    <mesh geometry={rbox(6.4, 9.4, 1.2, 0.1)} material={plastic("#2b2f36", 0.4)} position={[0, 4.7, -0.4]} />
    <mesh position={[0, 4.6, -0.2]}>
      <planeGeometry args={[5.6, 9]} />
      <meshStandardMaterial color="#101318" />
    </mesh>
    {/* Door leaf hinged on its left edge */}
    <group position={[-2.75, 0.1, 0]} rotation={[0, -open, 0]}>
      <mesh geometry={rbox(5.5, 9, 0.3, 0.06)} material={plastic("#3a3f48", 0.35)} position={[2.75, 4.5, 0]} castShadow />
      <mesh position={[2.75, 4.7, 0.16]}>
        <planeGeometry args={[4.5, 7.8]} />
        <meshStandardMaterial color="#8fd4ff" roughness={0.1} metalness={0.2} emissive="#8fd4ff" emissiveIntensity={0.25} />
      </mesh>
      {!noHandle ? <mesh geometry={rbox(0.25, 2.4, 0.5, 0.1)} material={plastic("#c9ced6", 0.2)} position={[4.8, 4.4, 0.35]} castShadow /> : null}
      {doorSign ? (
        <mesh position={[2.75, 6.6, 0.18]}>
          <planeGeometry args={[3.2, 1.4]} />
          <meshStandardMaterial map={textTexture(doorSign, "#ffffff", "#d62828", 512, 224)} />
        </mesh>
      ) : null}
    </group>
    <Sign text={sign} position={[0, 12.2, 0.2]} size={[16, 3.6]} bg="#ffd23f" fg="#1b1b1f" />
  </group>
);

// ---------- Mansion ----------
export const Palm: React.FC<{ position: V3; size?: number }> = ({ position, size = 1 }) => (
  <group position={position} scale={size}>
    {Array.from({ length: 7 }).map((_, i) => (
      <mesh key={i} geometry={rbox(0.7, 1.4, 0.7, 0.2)} material={plastic(i % 2 ? "#9b7650" : "#8a6744", 0.9)} position={[Math.sin(i * 0.4) * 0.25 * i * 0.3, 0.7 + i * 1.3, 0]} castShadow />
    ))}
    {Array.from({ length: 7 }).map((_, i) => {
      const a = (i / 7) * Math.PI * 2;
      return (
        <mesh key={`l${i}`} geometry={rbox(0.5, 0.2, 4.2, 0.1)} material={plastic("#3fae3a", 0.8)} position={[Math.cos(a) * 1.6, 9.3, Math.sin(a) * 1.6]} rotation={[0.45, -a + Math.PI / 2, 0]} castShadow />
      );
    })}
  </group>
);

/** Modern white mansion with glass walls, a pool, palms and a lounger. `scale` makes it bigger. */
export const Mansion: React.FC<{ position?: V3; scale?: number; gold?: boolean }> = ({ position = [0, 0, 0], scale = 1, gold = false }) => {
  const white = plastic(gold ? "#ffe08a" : "#f7f7f4", 0.5);
  const glass = plastic("#66c6ff", 0.1);
  const dark = plastic("#2b2f36", 0.5);
  return (
    <group position={position} scale={scale}>
      <mesh geometry={rbox(34, 10, 18, 0.2)} material={white} position={[0, 5, -6]} castShadow receiveShadow />
      <mesh geometry={rbox(22, 8, 14, 0.2)} material={white} position={[-5, 14, -8]} castShadow receiveShadow />
      <mesh geometry={rbox(36, 0.8, 20, 0.1)} material={dark} position={[0, 10.2, -6]} castShadow />
      <mesh geometry={rbox(24, 0.8, 16, 0.1)} material={dark} position={[-5, 18.2, -8]} castShadow />
      {[-12, -4, 4, 12].map((x) => (
        <mesh key={x} geometry={rbox(6.5, 7, 0.2, 0.05)} material={glass} position={[x, 4.6, 3.05]} />
      ))}
      {[-12, -4, 4].map((x) => (
        <mesh key={`u${x}`} geometry={rbox(6.5, 5.5, 0.2, 0.05)} material={glass} position={[x + 2, 14, -0.95]} />
      ))}
      {gold ? <Sign text="$$$" position={[10, 15, -1]} size={[8, 3]} bg="#1b1b1f" fg="#ffd23f" glow={0.8} /> : null}
      {/* Pool deck and pool */}
      <mesh geometry={rbox(40, 0.4, 16, 0.1)} material={plastic("#e9e2d6", 0.8)} position={[0, 0.2, 12]} receiveShadow />
      <mesh position={[3, 0.42, 12]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 9]} />
        <meshStandardMaterial color="#29b6f6" roughness={0.05} metalness={0.1} emissive="#1e88e5" emissiveIntensity={0.25} />
      </mesh>
      <Palm position={[-16, 0, 10]} size={1.2} />
      <Palm position={[17, 0, 8]} />
      <Palm position={[18, 0, 16]} size={0.8} />
      {/* Lounger */}
      <group position={[-9, 0.4, 13]}>
        <mesh geometry={rbox(3, 0.4, 6.5, 0.1)} material={plastic("#ffffff", 0.6)} position={[0, 1.2, 0]} castShadow />
        <mesh geometry={rbox(3, 0.4, 3, 0.1)} material={plastic("#ffffff", 0.6)} position={[0, 2.2, -3.3]} rotation={[-0.7, 0, 0]} castShadow />
      </group>
      <Tree position={[22, 0, -4]} size={1.4} />
    </group>
  );
};

// ---------- Dumb Centre ----------
/** Scanner arch with a big screen above it showing `screen`. */
export const Scanner: React.FC<{ position: V3; screen: string; lit?: number }> = ({ position, screen, lit = 0 }) => (
  <group position={position}>
    {[-1, 1].map((s) => (
      <mesh key={s} geometry={rbox(1.2, 9, 1.6, 0.2)} material={plastic("#d9dde3", 0.4)} position={[s * 4, 4.5, 0]} castShadow />
    ))}
    <mesh geometry={rbox(9.2, 1.2, 1.6, 0.2)} material={plastic("#d9dde3", 0.4)} position={[0, 9.4, 0]} castShadow />
    {[-1, 1].map((s) => (
      <mesh key={`b${s}`} position={[s * 3.35, 4.5, 0]}>
        <boxGeometry args={[0.12, 8, 1.2]} />
        <meshStandardMaterial color="#39ff88" emissive="#39ff88" emissiveIntensity={0.5 + lit * 2} />
      </mesh>
    ))}
    <group position={[0, 13.2, -0.5]}>
      <mesh geometry={rbox(12, 5, 0.6, 0.15)} material={plastic("#1b1d24", 0.4)} castShadow />
      <mesh position={[0, 0, 0.32]}>
        <planeGeometry args={[11, 4.2]} />
        <meshStandardMaterial
          map={textTexture(screen, "#06240f", "#39ff88", 640, 244)}
          emissive="#ffffff"
          emissiveMap={textTexture(screen, "#06240f", "#39ff88", 640, 244)}
          emissiveIntensity={0.9}
        />
      </mesh>
    </group>
  </group>
);

// ---------- Weather and money ----------
/** Rain streaks falling around `center`. */
export const Rain: React.FC<{ t: number; center: V3; area?: number; height?: number; count?: number }> = ({ t, center, area = 50, height = 30, count = 260 }) => {
  const drops = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        x: (random(`rx${i}`) - 0.5) * area,
        z: (random(`rz${i}`) - 0.5) * area,
        y: random(`ry${i}`) * height,
        v: 28 + random(`rv${i}`) * 10,
      })),
    [area, count, height],
  );
  return (
    <group position={center}>
      {drops.map((d, i) => (
        <mesh key={i} position={[d.x, (((d.y - d.v * t) % height) + height) % height, d.z]}>
          <boxGeometry args={[0.06, 1.4, 0.06]} />
          <meshBasicMaterial color="#c9d6ff" transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  );
};

/** Green banknotes fluttering down from `from` seconds. */
export const MoneyRain: React.FC<{ t: number; from: number; center: V3; area?: number; count?: number; height?: number }> = ({ t, from, center, area = 24, count = 90, height = 22 }) => {
  if (t < from) return null;
  const s = t - from;
  return (
    <group position={center}>
      {Array.from({ length: count }).map((_, i) => {
        const delay = random(`md${i}`) * 1.2;
        if (s < delay) return null;
        const fall = (s - delay) * (5 + random(`mv${i}`) * 3);
        const y = height - fall;
        if (y < 0.1) return null;
        return (
          <mesh
            key={i}
            position={[(random(`mx${i}`) - 0.5) * area + Math.sin(s * 2 + i) * 1.2, y, (random(`mz${i}`) - 0.5) * area * 0.6]}
            rotation={[s * 3 + i, s * 2 + i * 0.5, Math.sin(s * 4 + i) * 0.6]}
          >
            <planeGeometry args={[1.6, 0.75]} />
            <meshStandardMaterial color="#4caf50" emissive="#2e7d32" emissiveIntensity={0.3} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
};
