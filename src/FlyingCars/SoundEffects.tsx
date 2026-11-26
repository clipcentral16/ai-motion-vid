import { Soundtrack, type Cue } from "../shared/Soundtrack";
import { VOICE_CLIPS } from "./captions";
import { BEAT, FPS, SCENE_STARTS } from "./constants";

// Music + SFX: `node scripts/generate-audio.mjs flyingcars`; cheer/honk crowds:
// crowd section of scripts/narration/flyingcars.json.
const s = (scene: number, sec: number) => Math.round(SCENE_STARTS[scene] + sec * FPS);
const F = (f: string) => `flyingcars/${f}.mp3`;

const CUES: Cue[] = [
  ...SCENE_STARTS.slice(1).map((st) => ({ at: st - 6, src: F("whoosh"), volume: 0.3 })),
  { at: s(0, BEAT.flying - 0.3), src: F("liftoff"), volume: 0.8 },
  { at: s(0, BEAT.flying + 0.3), src: F("pop"), volume: 0.5 },
  { at: s(1, BEAT.amazing), src: F("cheer"), volume: 0.35 },
  { at: s(1, BEAT.four), src: F("ding"), volume: 0.7 },
  { at: s(2, 0.3), src: F("liftoff"), volume: 0.45 },
  { at: s(2, 1.2), src: F("liftoff"), volume: 0.4 },
  { at: s(2, BEAT.billion), src: F("pop"), volume: 0.5 },
  { at: s(3, 0.1), src: F("jam"), volume: 0.6 },
  { at: s(3, 1.4), src: F("honk"), volume: 0.6 },
  { at: s(3, BEAT.three), src: F("honk"), volume: 0.35 },
  { at: s(4, BEAT.lanes - 0.2), src: F("ding"), volume: 0.5 },
  { at: s(4, BEAT.heights - 0.4), src: F("pop"), volume: 0.45 },
  { at: s(5, BEAT.dead), src: F("sputter"), volume: 0.8 },
  { at: s(5, BEAT.brick), src: F("whoosh"), volume: 0.6 },
  { at: s(5, BEAT.parachute - 0.55), src: F("chute"), volume: 0.9 },
  { at: s(6, 0.5), src: F("whoosh"), volume: 0.6 },
  { at: s(6, 0.7), src: F("chirp"), volume: 0.75 },
  { at: s(7, BEAT.parks - 0.15), src: F("boing"), volume: 0.5 },
  { at: s(7, BEAT.parks + 0.2), src: F("cheer"), volume: 0.4 },
  { at: s(8, BEAT.mountains), src: F("pop"), volume: 0.45 },
  { at: s(8, BEAT.islands), src: F("pop"), volume: 0.45 },
  { at: s(9, BEAT.driveway), src: F("boing"), volume: 0.45 },
  { at: s(10, 0.05), src: F("whoosh"), volume: 0.6 },
  { at: s(10, 1.35), src: F("pop"), volume: 0.5 },
  { at: s(10, BEAT.ninety), src: F("ding"), volume: 0.7 },
  { at: s(10, 2.5), src: F("liftoff"), volume: 0.5 },
  { at: s(11, BEAT.car + 0.25), src: F("liftoff"), volume: 0.8 },
];

export const SoundEffects: React.FC = () => <Soundtrack music="flyingcars/score.mp3" voice={VOICE_CLIPS} cues={CUES} musicVolume={0.42} duckedVolume={0.14} />;
