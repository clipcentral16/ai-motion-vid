import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

// All motion is derived from useCurrentFrame() — never use useFrame()/clocks,
// otherwise renders are not deterministic.
export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rotation = (frame / fps) * Math.PI; // half a turn per second
  const scale = spring({ frame, fps, config: { damping: 12 } });
  const hue = interpolate(frame, [0, 180], [200, 320]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      <pointLight position={[-4, -2, 3]} intensity={20} color="#ff66cc" />
      <mesh rotation={[rotation * 0.6, rotation, 0]} position={[0, 0.5, 0]} scale={scale * 1.25}>
        <torusKnotGeometry args={[1, 0.32, 200, 32]} />
        <meshStandardMaterial
          color={`hsl(${hue}, 80%, 55%)`}
          metalness={0.4}
          roughness={0.25}
        />
      </mesh>
    </>
  );
};
