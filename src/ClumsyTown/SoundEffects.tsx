import { Soundtrack, type Cue } from "../shared/Soundtrack";
import { VOICE_CLIPS } from "./captions";
import { BEAT, FPS, SCENE_STARTS } from "./constants";

// Music + SFX: `node scripts/generate-audio.mjs clumsytown`; cheer/gasp: crowd
// section of scripts/narration/clumsytown.json.
const s = (scene: number, sec: number) => Math.round(SCENE_STARTS[scene] + sec * FPS);
const C = (f: string) => `clumsytown/${f}.mp3`;

const CUES: Cue[] = [
  ...SCENE_STARTS.slice(1).map((st) => ({ at: st - 6, src: C("whoosh"), volume: 0.22 })),
  { at: s(1, BEAT.trip + 0.35), src: C("thud"), volume: 0.9 },
  { at: s(1, BEAT.crown), src: C("ding"), volume: 0.7 },
  { at: s(2, BEAT.spill + 0.1), src: C("splash"), volume: 0.8 },
  { at: s(2, BEAT.parade), src: C("fanfare"), volume: 0.6 },
  { at: s(2, BEAT.parade), src: C("cheer"), volume: 0.6 },
  { at: s(6, BEAT.banana), src: C("slide"), volume: 0.7 },
  { at: s(6, BEAT.perfectPose + 0.35), src: C("ding"), volume: 0.6 },
  { at: s(8, BEAT.tripped), src: C("gasp"), volume: 0.9 },
  { at: s(8, BEAT.tripped + 0.4), src: C("whoosh"), volume: 0.6 },
  { at: s(8, BEAT.tripped + 1.0), src: C("whoosh"), volume: 0.5 },
  { at: s(8, BEAT.tripped + 1.75), src: C("thud"), volume: 0.6 },
  { at: s(8, BEAT.backflip + 0.3), src: C("trombone"), volume: 0.6 },
  { at: s(9, 0), src: C("rain"), volume: 0.45 },
  { at: s(10, 0), src: C("rain"), volume: 0.35 },
  { at: s(10, BEAT.judges - 0.1), src: C("buzz"), volume: 0.7 },
  { at: s(10, BEAT.clumsiest), src: C("ding"), volume: 0.6 },
  { at: s(11, BEAT.king), src: C("fanfare"), volume: 0.8 },
  { at: s(11, BEAT.king + 0.1), src: C("cheer"), volume: 0.8 },
];

export const SoundEffects: React.FC = () => <Soundtrack music="clumsytown/score.mp3" voice={VOICE_CLIPS} cues={CUES} musicVolume={0.4} duckedVolume={0.13} />;
