import { Composition } from "remotion";
import { SpinningObject } from "./SpinningObject/SpinningObject";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SpinningObject"
        component={SpinningObject}
        durationInFrames={180}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
