import { Composition } from "remotion";
import { SpinningObject } from "./SpinningObject/SpinningObject";
import { WhatIfNoLegs } from "./WhatIfNoLegs/WhatIfNoLegs";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./WhatIfNoLegs/constants";
import { WhatIfNuke } from "./WhatIfNuke/WhatIfNuke";
import * as Nuke from "./WhatIfNuke/constants";

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
      <Composition
        id="WhatIfNoLegs"
        component={WhatIfNoLegs}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="WhatIfNuke"
        component={WhatIfNuke}
        durationInFrames={Nuke.TOTAL_FRAMES}
        fps={Nuke.FPS}
        width={Nuke.WIDTH}
        height={Nuke.HEIGHT}
      />
    </>
  );
};
