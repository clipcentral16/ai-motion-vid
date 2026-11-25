import { Soundtrack, type Cue } from "../shared/Soundtrack";
import { VOICE_CLIPS } from "./captions";
import { BEAT, FPS, SCENE_STARTS } from "./constants";

// Music + SFX: `node scripts/generate-audio.mjs dumbtown`; cheer: crowd section
// of scripts/narration/dumbtown.json.
const s = (scene: number, sec: number) => Math.round(SCENE_STARTS[scene] + sec * FPS);
const D = (f: string) => `dumbtown/${f}.mp3`;

const CUES: Cue[] = [
  ...SCENE_STARTS.slice(1).map((st) => ({ at: st - 6, src: D("whoosh"), volume: 0.25 })),
  { at: s(1, BEAT.zeroPaper), src: D("pop"), volume: 0.6 },
  { at: s(1, BEAT.bonusCash), src: D("kaching"), volume: 0.8 },
  { at: s(2, BEAT.doorBonk), src: D("bonk"), volume: 0.9 },
  { at: s(2, BEAT.kaching), src: D("kaching"), volume: 0.85 },
  { at: s(3, BEAT.classmateZero), src: D("pop"), volume: 0.5 },
  { at: s(3, BEAT.mansion), src: D("kaching"), volume: 0.5 },
  { at: s(5, BEAT.aPlus), src: D("ding"), volume: 0.6 },
  { at: s(6, BEAT.forgot), src: D("gasp"), volume: 0.7 },
  { at: s(7, BEAT.hundred), src: D("ding"), volume: 0.5 },
  { at: s(7, BEAT.hundred + 0.5), src: D("trombone"), volume: 0.6 },
  { at: s(9, 0.4), src: D("scan"), volume: 0.5 },
  { at: s(9, BEAT.zeroDumb), src: D("buzzer"), volume: 0.6 },
  { at: s(10, BEAT.pushDoor + 0.1), src: D("creak"), volume: 0.6 },
  { at: s(10, BEAT.pushReveal), src: D("ding"), volume: 0.8 },
  { at: s(11, 0), src: D("rain"), volume: 0.45 },
  { at: s(12, 0), src: D("rain"), volume: 0.35 },
  { at: s(12, BEAT.phone - 0.1), src: D("buzz"), volume: 0.7 },
  { at: s(12, BEAT.dumbest), src: D("ding"), volume: 0.6 },
  { at: s(13, BEAT.billion), src: D("kaching"), volume: 0.9 },
  { at: s(13, BEAT.billion + 0.1), src: D("cheer"), volume: 0.8 },
];

export const SoundEffects: React.FC = () => <Soundtrack music="dumbtown/score.mp3" voice={VOICE_CLIPS} cues={CUES} musicVolume={0.42} duckedVolume={0.14} />;
