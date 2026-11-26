import { AbsoluteFill, Sequence } from "remotion";
import { CaptionTrack } from "../shared/Captions";
import { Transitions } from "../shared/Transitions";
import { CAPTION_LINES, EMPHASIS_STARTS } from "./captions";
import { SCENE_FRAMES, SCENE_STARTS, TOTAL_FRAMES } from "./constants";
import { Overlays } from "./Overlays";
import * as S from "./scenes/Scenes";
import { SoundEffects } from "./SoundEffects";

const SCENES = [S.S0Wake, S.S1Commute, S.S2Billion, S.S3Jam, S.S4Lanes, S.S5Parachute, S.S6Birds, S.S7Parks, S.S8Move, S.S9Roof, S.S10Pizza, S.S11Outro];

// "What if everyone woke up with a flying car?" — vertical 9:16, blocky style, playful.
export const FlyingCars: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    {SCENES.map((Scene, i) => (
      <Sequence key={i} from={SCENE_STARTS[i]} durationInFrames={SCENE_FRAMES[i]} name={`Scene ${i}`}>
        <Scene />
      </Sequence>
    ))}
    <Transitions sceneStarts={SCENE_STARTS} mode="swipe" />
    <Overlays />
    <CaptionTrack lines={CAPTION_LINES} emphasis={EMPHASIS_STARTS} sceneStarts={SCENE_STARTS} totalFrames={TOTAL_FRAMES} variant="word" />
    <SoundEffects />
  </AbsoluteFill>
);
