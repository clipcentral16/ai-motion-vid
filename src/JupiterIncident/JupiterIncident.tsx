import { AbsoluteFill, Sequence } from "remotion";
import { CaptionTrack } from "../shared/Captions";
import { Transitions } from "../shared/Transitions";
import { CAPTION_LINES, EMPHASIS_STARTS, PAGE_META } from "./captions";
import { FPS, SCENE_FRAMES, SCENE_STARTS, SHOTS, TOTAL_FRAMES } from "./constants";
import { FoundFootage } from "./FoundFootage";
import { HeroTitles } from "./HeroTitles";
import { Scene6Fallen, Scene7Hero } from "./scenes/Aftermath";
import { Scene1Arrival } from "./scenes/Scene1Arrival";
import { Scene2Moon } from "./scenes/Scene2Moon";
import { Scene3Corridor } from "./scenes/Scene3Corridor";
import { Scene4Panic } from "./scenes/Scene4Panic";
import { Scene5Hero } from "./scenes/Scene5Hero";
import { SoundEffects } from "./SoundEffects";

const SCENES = [
  { name: "1 Arrival", Scene: Scene1Arrival },
  { name: "2 Moon", Scene: Scene2Moon },
  { name: "3 Corridor", Scene: Scene3Corridor },
  { name: "4 Panic", Scene: Scene4Panic },
  { name: "5 Hero", Scene: Scene5Hero },
  { name: "6 Fallen", Scene: Scene6Fallen },
  { name: "7 True hero", Scene: Scene7Hero },
];

const FLASHES = SHOTS.map((shot) => ({ frame: Math.round(SCENE_STARTS[4] + shot * FPS), peak: 0.18, length: 4 }));

// "The 2011 Jupiter Incident" (fictional internet story) — vertical 9:16, dark found-footage look.
export const JupiterIncident: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000000" }}>
    {SCENES.map(({ name, Scene }, i) => (
      <Sequence key={name} from={SCENE_STARTS[i]} durationInFrames={SCENE_FRAMES[i]} name={name}>
        <Scene />
      </Sequence>
    ))}
    <HeroTitles />
    <CaptionTrack lines={CAPTION_LINES} emphasis={EMPHASIS_STARTS} sceneStarts={SCENE_STARTS} totalFrames={TOTAL_FRAMES} pageMeta={PAGE_META} />
    <Transitions sceneStarts={SCENE_STARTS} mode="dip" flashes={FLASHES} />
    <FoundFootage />
    <SoundEffects />
  </AbsoluteFill>
);
