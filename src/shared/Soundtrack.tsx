import { Audio, Sequence, interpolate, staticFile } from "remotion";
import type { VoiceClip } from "./narration";

export type Cue = { at: number; src: string; volume: number };

/**
 * Background music that ducks under the narrator, the narrator clips, and
 * one-shot sound effects (`cues`, absolute frames, paths under public/).
 */
export const Soundtrack: React.FC<{
  music: string;
  voice: VoiceClip[];
  cues: Cue[];
  musicVolume?: number;
  duckedVolume?: number;
  voiceVolume?: number;
}> = ({ music, voice, cues, musicVolume = 0.5, duckedVolume = 0.13, voiceVolume = 1 }) => {
  const volume = (f: number) => {
    let duck = 0;
    for (const v of voice) {
      duck = Math.max(
        duck,
        interpolate(f, [v.from - 6, v.from, v.to, v.to + 10], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      );
    }
    return musicVolume + (duckedVolume - musicVolume) * duck;
  };

  return (
    <>
      <Audio src={staticFile(music)} volume={volume} />
      {voice.map((v) => (
        <Sequence key={v.src} from={v.from} layout="none" name={`Voice ${v.src}`}>
          <Audio src={staticFile(v.src)} volume={voiceVolume} />
        </Sequence>
      ))}
      {cues.map((cue, i) => (
        <Sequence key={i} from={Math.max(0, cue.at)} layout="none" name={cue.src}>
          <Audio src={staticFile(cue.src)} volume={cue.volume} />
        </Sequence>
      ))}
    </>
  );
};
