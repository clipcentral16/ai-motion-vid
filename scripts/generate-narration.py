"""Generate the narrator voice-over for the "What if" video with Microsoft's
free Edge neural voices (via the `edge-tts` package), plus per-word timings
so the subtitles pop in exactly when each word is spoken.

    pip install edge-tts
    python3 scripts/generate-narration.py

Writes:
  public/whatif/voice/line<N>.mp3     one clip per scene
  src/WhatIfNoLegs/narration.json     clip start offsets + word timings

Needs network access to speech.platform.bing.com. Change VOICE / RATE below
and re-run to try another voice (list them with: edge-tts --list-voices).
"""

import asyncio
import json
import os
import subprocess
import sys
from pathlib import Path

import edge_tts

VOICE = "en-US-AndrewNeural"
RATE = "+6%"
PITCH = "+0Hz"

POOF_SECONDS = 1.5  # keep in sync with src/WhatIfNoLegs/constants.ts
SCENE_SECONDS = [6, 6, 6, 6, 6, 7]

# One line per scene. `caption` is exactly what is shown on screen (word by
# word); `extra` are words shown after the spoken ones (e.g. an emoji).
# `start` is seconds into the scene when the voice begins.
LINES = [
    {"scene": 0, "caption": "What if everyone lost their legs?", "start": 0.35},
    {"scene": 1, "caption": "Overnight… gone.", "start": POOF_SECONDS + 0.4},
    {"scene": 2, "caption": "Office chairs become the #1 car", "start": 0.35},
    {"scene": 3, "caption": "Sports would never be the same", "start": 0.35},
    {"scene": 4, "caption": "Stairs? Banned.", "start": 0.4},
    {"scene": 5, "caption": "Would you survive? Comment below", "extra": ["👇"], "start": 1.2},
]

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "whatif" / "voice"
JSON_OUT = ROOT / "src" / "WhatIfNoLegs" / "narration.json"


def duration_of(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


async def synth(text: str, path: Path):
    kwargs = {}
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    if proxy:
        kwargs["proxy"] = proxy
    comm = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH, boundary="WordBoundary", **kwargs)
    words = []
    with open(path, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / 1e7
                words.append({"spoken": chunk["text"], "start": round(start, 3), "end": round(start + chunk["duration"] / 1e7, 3)})
    return words


async def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    result = []
    for i, line in enumerate(LINES):
        path = OUT_DIR / f"line{i}.mp3"
        words = await synth(line["caption"], path)
        shown = line["caption"].split()
        if len(words) != len(shown):
            sys.exit(f"Line {i}: {len(shown)} caption words but {len(words)} spoken words: {[w['spoken'] for w in words]}")
        for w, text in zip(words, shown):
            w["text"] = text  # keep the caption's punctuation
        dur = duration_of(path)
        if line["start"] + dur > SCENE_SECONDS[line["scene"]] - 0.2:
            sys.exit(f"Line {i} ({dur:.2f}s) doesn't fit in scene {line['scene']}")
        result.append({
            "scene": line["scene"],
            "file": f"whatif/voice/line{i}.mp3",
            "start": line["start"],
            "duration": round(dur, 3),
            "words": words,
            "extra": line.get("extra", []),
        })
        print(f"line{i}: {dur:.2f}s  {' | '.join(w['text'] + '@' + str(w['start']) for w in words)}")
    JSON_OUT.write_text(json.dumps({"voice": VOICE, "rate": RATE, "lines": result}, ensure_ascii=False, indent=2) + "\n")
    print(f"wrote {JSON_OUT.relative_to(ROOT)}")


asyncio.run(main())
