import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { SKY_HORIZON, SKY_TOP } from "../constants";

/** Sky gradient behind a transparent ThreeCanvas sized to the video. */
export const SceneCanvas: React.FC<{ children: React.ReactNode; fov?: number; far?: number }> = ({
  children,
  fov = 62,
  far = 400,
}) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${SKY_TOP} 0%, ${SKY_HORIZON} 62%)` }}>
      <ThreeCanvas width={width} height={height} camera={{ fov, near: 0.1, far, position: [0, 5, 10] }} gl={{ alpha: true, antialias: true }}>
        {children}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
