import { AbsoluteFill, Sequence } from "remotion";
import { CaptionTrack } from "../shared/Captions";
import { Transitions } from "../shared/Transitions";
import { CAPTION_LINES, EMPHASIS_STARTS } from "./captions";
import { SCENE_FRAMES, SCENE_STARTS, TOTAL_FRAMES } from "./constants";
import { Overlays } from "./Overlays";
import * as S from "./scenes/Scenes";
import { SoundEffects } from "./SoundEffects";

const SCENES = [
  S.S0Skyline, S.S1Bonus, S.S2Door, S.S3Mansion, S.S4Bob, S.S5Smart, S.S6Forgot,
  S.S7Highest, S.S8Centre, S.S9Scan, S.S10Impossible, S.S11Home, S.S12Phone, S.S13Billion,
];

// "In this town, you get paid for being dumb" — vertical 9:16, blocky style.
export const DumbTown: React.FC = () => (
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
