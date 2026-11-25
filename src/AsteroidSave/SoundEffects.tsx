import { Soundtrack, type Cue } from "../shared/Soundtrack";
import { VOICE_CLIPS } from "./captions";
import { AIR_ROLL, CATCH, FLICK, FPS, LIFTOFF, RESET, SCENE_STARTS } from "./constants";

// Score and SFX: `node scripts/generate-audio.mjs asteroid`; screams and
// cheers: the "crowd" section of scripts/narration/asteroid.json.
// Ominous and scary first (no whooshes), hype once Zen takes the car.

const s = (scene: number, seconds: number) => Math.round(SCENE_STARTS[scene] + seconds * FPS);
const A = (f: string) => `asteroid/${f}.mp3`;

const CUES: Cue[] = [
  { at: s(0, 0.8), src: A("rumble"), volume: 0.3 },
  // Panic
  { at: s(1, 0), src: A("siren"), volume: 0.28 },
  { at: s(1, 0), src: A("rumble"), volume: 0.5 },
  { at: s(1, 0.15), src: A("screams"), volume: 0.85 },
  { at: s(1, 2.6), src: A("screams"), volume: 0.55 },
  // The steal
  { at: s(2, LIFTOFF - 0.1), src: A("boost"), volume: 0.6 },
  // Whooshes only once the hype starts
  ...[3, 4, 5, 6].map((scene) => ({ at: SCENE_STARTS[scene] - 10, src: A("whoosh"), volume: 0.4 })),
  { at: s(3, AIR_ROLL - 0.1), src: A("whoosh"), volume: 0.55 },
  { at: s(3, CATCH), src: A("catch"), volume: 0.95 },
  { at: s(4, 0.05), src: A("whoosh"), volume: 0.35 },
  { at: s(4, RESET), src: A("ding"), volume: 0.6 },
  { at: s(4, FLICK - 0.3), src: A("whoosh"), volume: 0.5 },
  { at: s(4, FLICK), src: A("hit"), volume: 1 },
  { at: s(4, FLICK + 0.1), src: A("boom"), volume: 0.35 },
  // Saved
  { at: s(5, 0.1), src: A("cheer"), volume: 0.8 },
  { at: s(5, 0.2), src: A("applause"), volume: 0.55 },
  { at: s(5, 2.3), src: A("cheer"), volume: 0.5 },
];

export const SoundEffects: React.FC = () => (
  <Soundtrack music="asteroid/score.mp3" voice={VOICE_CLIPS} cues={CUES} musicVolume={0.5} duckedVolume={0.18} />
);
