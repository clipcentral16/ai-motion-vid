import { AbsoluteFill, Sequence } from "remotion";
import { CaptionTrack } from "../shared/Captions";
import { Transitions } from "../shared/Transitions";
import { CAPTION_LINES, EMPHASIS_STARTS } from "./captions";
import { FPS, POOF_SECONDS, SCENE_FRAMES, SCENE_STARTS, TOTAL_FRAMES } from "./constants";
import { Scene1Street } from "./scenes/Scene1Street";
import { Scene2Poof } from "./scenes/Scene2Poof";
import { Scene3Chairs } from "./scenes/Scene3Chairs";
import { Scene4Stadium } from "./scenes/Scene4Stadium";
import { Scene5Slides } from "./scenes/Scene5Slides";
import { Scene6Aerial } from "./scenes/Scene6Aerial";
import { SoundEffects } from "./SoundEffects";

const SCENES = [
  { name: "1 Street", Scene: Scene1Street },
  { name: "2 Poof", Scene: Scene2Poof },
  { name: "3 Chairs", Scene: Scene3Chairs },
  { name: "4 Stadium", Scene: Scene4Stadium },
  { name: "5 Slides", Scene: Scene5Slides },
  { name: "6 Aerial", Scene: Scene6Aerial },
];

// "What if everyone lost their legs?" — vertical 9:16 short.
export const WhatIfNoLegs: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#bfe8ff" }}>
    {SCENES.map(({ name, Scene }, i) => (
      <Sequence key={name} from={SCENE_STARTS[i]} durationInFrames={SCENE_FRAMES[i]} name={name}>
        <Scene />
      </Sequence>
    ))}
    <CaptionTrack lines={CAPTION_LINES} emphasis={EMPHASIS_STARTS} sceneStarts={SCENE_STARTS} totalFrames={TOTAL_FRAMES} />
    <Transitions sceneStarts={SCENE_STARTS} flashes={[{ frame: SCENE_STARTS[1] + POOF_SECONDS * FPS }]} />
    <SoundEffects />
  </AbsoluteFill>
);
