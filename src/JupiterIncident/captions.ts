import { buildNarration, type Narration } from "../shared/narration";
import { FPS, SCENE_STARTS } from "./constants";
import narration from "./narration.json";

// Every line (narrator, radio, alien, CaseOh) comes from
// scripts/narration/jupiter.json via scripts/generate-narration.py.
export const {
  captionLines: CAPTION_LINES,
  emphasis: EMPHASIS_STARTS,
  voiceClips: VOICE_CLIPS,
  pageMeta: PAGE_META,
} = buildNarration(narration as Narration, SCENE_STARTS, FPS);
