import { AbsoluteFill, Audio, staticFile, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Scene } from "./Scene";
import { Captions } from "./Captions";

export const SpinningObject: React.FC = () => {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle, #1d2440 0%, #05060c 100%)" }}>
      {/* 3D layer: Three.js via @remotion/three */}
      <ThreeCanvas width={width} height={height} camera={{ fov: 50, position: [0, 0, 7] }}>
        <Scene />
      </ThreeCanvas>

      {/* 2D layers: captions + audio handled by Remotion */}
      <Captions />
      <Audio src={staticFile("music.mp3")} />
    </AbsoluteFill>
  );
};
