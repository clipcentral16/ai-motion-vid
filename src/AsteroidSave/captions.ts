import { buildNarration, type Narration } from "../shared/narration";
import { FPS, SCENE_STARTS } from "./constants";
import narration from "./narration.json";

// From scripts/narration/asteroid.json via scripts/generate-narration.py.
export const {
  captionLines: CAPTION_LINES,
  emphasis: EMPHASIS_STARTS,
  voiceClips: VOICE_CLIPS,
  pageMeta: PAGE_META,
} = buildNarration(narration as Narration, SCENE_STARTS, FPS);
