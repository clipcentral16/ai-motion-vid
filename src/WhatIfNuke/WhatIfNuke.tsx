import { AbsoluteFill, Sequence } from "remotion";
import { CaptionTrack } from "../shared/Captions";
import { Transitions } from "../shared/Transitions";
import { CAPTION_LINES, EMPHASIS_STARTS } from "./captions";
import { BLAST, FPS, HITS, SCENE_FRAMES, SCENE_STARTS, SWIPES, TOTAL_FRAMES } from "./constants";
import { Scene1Launch } from "./scenes/Scene1Launch";
import { Scene2Sirens } from "./scenes/Scene2Sirens";
import { Scene3Defense } from "./scenes/Scene3Defense";
import { Scene4Blast } from "./scenes/Scene4Blast";
import { Scene5Winter } from "./scenes/Scene5Winter";
import { Scene6Globe } from "./scenes/Scene6Globe";
import { SoundEffects } from "./SoundEffects";

const SCENES = [
  { name: "1 Launch", Scene: Scene1Launch },
  { name: "2 Sirens", Scene: Scene2Sirens },
  { name: "3 Defense", Scene: Scene3Defense },
  { name: "4 Blast", Scene: Scene4Blast },
  { name: "5 Winter", Scene: Scene5Winter },
  { name: "6 Globe", Scene: Scene6Globe },
];

const FLASHES = [
  ...HITS.map((hit) => ({ frame: Math.round(SCENE_STARTS[2] + hit * FPS), peak: 0.3, length: 8 })),
  { frame: Math.round(SCENE_STARTS[3] + BLAST * FPS), peak: 0.95, length: 16 },
];

// "What if North Korea started nuking everyone?" — vertical 9:16 short.
export const WhatIfNuke: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#0b1236" }}>
    {SCENES.map(({ name, Scene }, i) => (
      <Sequence key={name} from={SCENE_STARTS[i]} durationInFrames={SCENE_FRAMES[i]} name={name}>
        <Scene />
      </Sequence>
    ))}
    <CaptionTrack lines={CAPTION_LINES} emphasis={EMPHASIS_STARTS} sceneStarts={SCENE_STARTS} totalFrames={TOTAL_FRAMES} />
    <Transitions sceneStarts={SCENE_STARTS} colors={SWIPES} flashes={FLASHES} />
    <SoundEffects />
  </AbsoluteFill>
);
