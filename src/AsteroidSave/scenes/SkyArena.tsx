import { random } from "remotion";
import { geo } from "../../shared/three/materials";
import { Stars } from "../../shared/three/Stars";

/** High-altitude backdrop for the save: dark sky, a cloud sea far below. */
export const SkyArena: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.45} />
    <directionalLight position={[10, 8, 12]} intensity={2.4} color="#fff2dc" />
    <directionalLight position={[-8, -6, -4]} intensity={0.6} color="#7fb0ff" />
    <Stars upperOnly radius={500} count={500} />
    {Array.from({ length: 40 }).map((_, i) => (
      <mesh
        key={i}
        geometry={geo.puff}
        position={[(random(`sx${i}`) - 0.5) * 160 + t * 0.6, -32 - random(`sy${i}`) * 6, -random(`sz${i}`) * 140 + 20]}
        scale={[10 + random(`ss${i}`) * 8, 3, 8 + random(`st${i}`) * 6]}
      >
        <meshStandardMaterial color="#e8eef8" flatShading emissive="#9fb8e8" emissiveIntensity={0.25} />
      </mesh>
    ))}
  </>
);
