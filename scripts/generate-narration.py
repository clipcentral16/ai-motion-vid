"""Generate a video's narrator voice-over with Microsoft's free Edge neural
voices (via the `edge-tts` package), plus per-word timings so the subtitles
pop in exactly when each word is spoken.

    pip install edge-tts
    python3 scripts/generate-narration.py scripts/narration/no-legs.json

The config file (one per video, in scripts/narration/) sets the voice, rate,
loudness, scene lengths, output paths and one line per scene:
  caption  exactly what is shown on screen; a word starting with * is highlighted
  extra    words shown after the spoken ones (e.g. an emoji)
  start    seconds into the scene when the clip begins (~0.1s lead-in)

Writes public/<audio_dir>/line<N>.mp3 and <json_out> (clip offsets + word
timings). Needs network access to speech.platform.bing.com. List voices with:
edge-tts --list-voices
"""

import asyncio
import json
import os
import subprocess
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent

if len(sys.argv) != 2:
    sys.exit("usage: python3 scripts/generate-narration.py scripts/narration/<video>.json")
CONFIG = json.loads(Path(sys.argv[1]).read_text())
VOICE = CONFIG["voice"]
RATE = CONFIG.get("rate", "+0%")
PITCH = CONFIG.get("pitch", "+0Hz")
TARGET_LUFS = CONFIG.get("target_lufs", -13)
SCENE_SECONDS = CONFIG["scene_seconds"]
LINES = CONFIG["lines"]
OUT_DIR = ROOT / "public" / CONFIG["audio_dir"]
JSON_OUT = ROOT / CONFIG["json_out"]


def duration_of(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def loudness_process(path: Path):
    """Compress + normalise a clip in place so the narrator sits on top of the mix."""
    tmp = path.with_suffix(".tmp.mp3")
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(path), "-af",
         f"acompressor=threshold=-22dB:ratio=3.5:attack=4:release=80:makeup=2,loudnorm=I={TARGET_LUFS}:TP=-1.2:LRA=6",
         "-ar", "44100", "-b:a", "192k", str(tmp)],
        check=True,
    )
    tmp.replace(path)


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
        shown = line["caption"].split()
        emphasis = [w.startswith("*") for w in shown]
        shown = [w.lstrip("*") for w in shown]
        words = await synth(" ".join(shown), path)
        loudness_process(path)
        if len(words) != len(shown):
            sys.exit(f"Line {i}: {len(shown)} caption words but {len(words)} spoken words: {[w['spoken'] for w in words]}")
        for w, text, emph in zip(words, shown, emphasis):
            w["text"] = text  # keep the caption's punctuation
            w["emphasis"] = emph
        dur = duration_of(path)
        if line["start"] + dur > SCENE_SECONDS[line["scene"]] - 0.2:
            sys.exit(f"Line {i} ({dur:.2f}s) doesn't fit in scene {line['scene']}")
        result.append({
            "scene": line["scene"],
            "file": f"{CONFIG['audio_dir']}/line{i}.mp3",
            "start": line["start"],
            "duration": round(dur, 3),
            "words": words,
            "extra": line.get("extra", []),
        })
        print(f"line{i}: {dur:.2f}s  {' | '.join(w['text'] + '@' + str(w['start']) for w in words)}")
    JSON_OUT.write_text(json.dumps({"voice": VOICE, "rate": RATE, "lines": result}, ensure_ascii=False, indent=2) + "\n")
    print(f"wrote {JSON_OUT.relative_to(ROOT)}")


asyncio.run(main())
