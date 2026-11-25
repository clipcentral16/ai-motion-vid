import { AbsoluteFill, Sequence } from "remotion";
import { CaptionTrack } from "../shared/Captions";
import { Transitions } from "../shared/Transitions";
import { CAPTION_LINES, EMPHASIS_STARTS } from "./captions";
import { SCENE_FRAMES, SCENE_STARTS, TOTAL_FRAMES } from "./constants";
import { Overlays } from "./Overlays";
import * as S from "./scenes/Scenes";
import { SoundEffects } from "./SoundEffects";

const SCENES = [S.S0Skyline, S.S1Trip, S.S2Coffee, S.S3King, S.S4Max, S.S5Balance, S.S6Banana, S.S7Champ, S.S8Stairs, S.S9Home, S.S10Phone, S.S11Crowned];

// "In this town, the clumsiest person gets crowned king" — vertical 9:16, blocky style.
export const ClumsyTown: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    {SCENES.map((Scene, i) => (
      <Sequence key={i} from={SCENE_STARTS[i]} durationInFrames={SCENE_FRAMES[i]} name={`Scene ${i}`}>
        <Scene />
      </Sequence>
    ))}
    <Transitions sceneStarts={SCENE_STARTS} mode="dip" />
    <Overlays />
    <CaptionTrack lines={CAPTION_LINES} emphasis={EMPHASIS_STARTS} sceneStarts={SCENE_STARTS} totalFrames={TOTAL_FRAMES} variant="word" />
    <SoundEffects />
  </AbsoluteFill>
);
