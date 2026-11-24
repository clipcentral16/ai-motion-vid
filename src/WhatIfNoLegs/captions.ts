import { buildNarration, type Narration } from "../shared/narration";
import { FPS, SCENE_STARTS } from "./constants";
import narration from "./narration.json";

// Captions follow the narrator word for word (timings from
// scripts/generate-narration.py, config scripts/narration/no-legs.json).
export const { captionLines: CAPTION_LINES, emphasis: EMPHASIS_STARTS, voiceClips: VOICE_CLIPS } = buildNarration(
  narration as Narration,
  SCENE_STARTS,
  FPS,
);
