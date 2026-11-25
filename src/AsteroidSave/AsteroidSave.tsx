import { AbsoluteFill, Sequence } from "remotion";
import { CaptionTrack } from "../shared/Captions";
import { Transitions } from "../shared/Transitions";
import { CAPTION_LINES, EMPHASIS_STARTS, PAGE_META } from "./captions";
import { CATCH, CUT_MODES, FLICK, FPS, SCENE_FRAMES, SCENE_STARTS, SWIPES, TOTAL_FRAMES } from "./constants";
import { Overlays } from "./Overlays";
import { Scene1Space } from "./scenes/Scene1Space";
import { Scene2Panic } from "./scenes/Scene2Panic";
import { Scene3Steal } from "./scenes/Scene3Steal";
import { Scene4Catch } from "./scenes/Scene4Catch";
import { Scene5Flick } from "./scenes/Scene5Flick";
import { Scene6Saved } from "./scenes/Scene6Saved";
import { Scene7World } from "./scenes/Scene7World";
import { SoundEffects } from "./SoundEffects";

const SCENES = [
  { name: "1 Space", Scene: Scene1Space },
  { name: "2 Panic", Scene: Scene2Panic },
  { name: "3 Steal", Scene: Scene3Steal },
  { name: "4 Catch", Scene: Scene4Catch },
  { name: "5 Flick", Scene: Scene5Flick },
  { name: "6 Saved", Scene: Scene6Saved },
  { name: "7 World", Scene: Scene7World },
];

const FLASHES = [
  { frame: Math.round(SCENE_STARTS[3] + CATCH * FPS), peak: 0.35, length: 8 },
  { frame: Math.round(SCENE_STARTS[4] + FLICK * FPS), peak: 0.55, length: 10 },
];

// "What if an asteroid was about to hit Earth?" — vertical 9:16.
export const AsteroidSave: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    {SCENES.map(({ name, Scene }, i) => (
      <Sequence key={name} from={SCENE_STARTS[i]} durationInFrames={SCENE_FRAMES[i]} name={name}>
        <Scene />
      </Sequence>
    ))}
    <Overlays />
    <CaptionTrack lines={CAPTION_LINES} emphasis={EMPHASIS_STARTS} sceneStarts={SCENE_STARTS} totalFrames={TOTAL_FRAMES} pageMeta={PAGE_META} />
    <Transitions sceneStarts={SCENE_STARTS} colors={SWIPES} mode={[...CUT_MODES]} flashes={FLASHES} />
    <SoundEffects />
  </AbsoluteFill>
);
