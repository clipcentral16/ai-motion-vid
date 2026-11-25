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
Optional per line: voice / rate / pitch / lufs (override the defaults),
  fx       "radio" (crackly walkie-talkie), "alien" (pitched-down, warbling,
           distorted) or "weak" (quiet, shaky); effects keep the timing, so
           captions still match the words
  speaker  label shown above the caption (e.g. "CAPTAIN", "???")
  tone     caption style: "radio", "alien", "hero", "weak", "panic" or "narrator"
Optional "crowd": [{ "name", "texts": [...], "voices": [...], "pitch_spread", "rate",
  "reverb" }] builds one layered crowd sound per entry (screams, cheers) from
  many TTS voices, written to public/<audio_dir>/<name>.mp3.

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


# Voice effects. Each keeps the clip's timing (pitch shifts are paired with
# an inverse tempo change) so the TTS word boundaries stay valid.
FX = {
    None: "",
    "radio": "highpass=f=380,lowpass=f=2700,acompressor=threshold=-30dB:ratio=8:attack=1:release=40:makeup=4,"
             "acrusher=bits=9:mix=0.35:mode=log,aphaser=type=t:speed=0.6:decay=0.3,",
    "alien": "asetrate=44100*0.7,aresample=44100,atempo=1.428571,vibrato=f=7:d=0.35,"
             "tremolo=f=38:d=0.55,aecho=0.8:0.6:35|70:0.45|0.3,acrusher=bits=7:mix=0.35:mode=log,"
             "acompressor=threshold=-36dB:ratio=12:attack=1:release=60:makeup=10,alimiter=limit=0.7,",
    "weak": "lowpass=f=3200,tremolo=f=5.5:d=0.3,vibrato=f=4:d=0.08,",
}


def loudness_process(path: Path, fx=None, lufs=None):
    """Apply the line's voice effect, then compress + normalise in place."""
    tmp = path.with_suffix(".tmp.mp3")
    chain = "aresample=44100," + FX[fx] + (
        f"acompressor=threshold=-22dB:ratio=3.5:attack=4:release=80:makeup=2,"
        f"loudnorm=I={lufs if lufs is not None else TARGET_LUFS}:TP=-1.2:LRA=6"
    )
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(path), "-af", chain, "-ar", "44100", "-b:a", "192k", str(tmp)],
        check=True,
    )
    tmp.replace(path)


async def synth(text: str, path: Path, voice: str, rate: str, pitch: str):
    kwargs = {}
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    if proxy:
        kwargs["proxy"] = proxy
    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary", **kwargs)
    words = []
    with open(path, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / 1e7
                words.append({"spoken": chunk["text"], "start": round(start, 3), "end": round(start + chunk["duration"] / 1e7, 3)})
    return words


async def build_crowd(item):
    """Layer many short TTS shouts (different voices/pitches, staggered) into one crowd sound."""
    import random as _r
    rng = _r.Random(item["name"])
    tmp_files = []
    for k in range(item.get("layers", 12)):
        text = item["texts"][k % len(item["texts"])]
        voice = item["voices"][k % len(item["voices"])]
        pitch = f"{rng.randint(-item.get('pitch_spread', 20), item.get('pitch_spread', 20)) + item.get('pitch', 0):+d}Hz"
        path = OUT_DIR / f"_crowd{k}.mp3"
        await synth(text, path, voice, item.get("rate", "+10%"), pitch)
        tmp_files.append((path, rng.uniform(0, item.get("spread", 0.8))))
    inputs = []
    filters = []
    for i, (path, delay) in enumerate(tmp_files):
        inputs += ["-i", str(path)]
        pan = rng.uniform(-0.8, 0.8)
        filters.append(
            f"[{i}]aresample=44100,adelay={int(delay * 1000)}|{int(delay * 1000)},"
            f"pan=stereo|c0={0.5 - pan / 2:.2f}*c0|c1={0.5 + pan / 2:.2f}*c0,volume={rng.uniform(0.5, 1):.2f}[a{i}]"
        )
    mix = "".join(f"[a{i}]" for i in range(len(tmp_files)))
    reverb = ",aecho=0.8:0.7:60|120:0.35|0.25" if item.get("reverb", True) else ""
    filters.append(f"{mix}amix=inputs={len(tmp_files)}:normalize=0{reverb},loudnorm=I={item.get('lufs', -16)}:TP=-1.5[out]")
    out = OUT_DIR.parent / f"{item['name']}.mp3"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(filters), "-map", "[out]", "-ar", "44100", "-b:a", "192k", str(out)],
        check=True,
    )
    for path, _ in tmp_files:
        path.unlink()
    print(f"crowd {item['name']}: {duration_of(out):.2f}s -> {out.relative_to(ROOT)}")


async def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    result = []
    for i, line in enumerate(LINES):
        path = OUT_DIR / f"line{i}.mp3"
        shown = line["caption"].split()
        emphasis = [w.startswith("*") for w in shown]
        shown = [w.lstrip("*") for w in shown]
        words = await synth(
            " ".join(shown), path, line.get("voice", VOICE), line.get("rate", RATE), line.get("pitch", PITCH)
        )
        loudness_process(path, line.get("fx"), line.get("lufs"))
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
            **({"speaker": line["speaker"]} if "speaker" in line else {}),
            **({"tone": line["tone"]} if "tone" in line else {}),
        })
        print(f"line{i}: {dur:.2f}s  {' | '.join(w['text'] + '@' + str(w['start']) for w in words)}")
    JSON_OUT.write_text(json.dumps({"voice": VOICE, "rate": RATE, "lines": result}, ensure_ascii=False, indent=2) + "\n")
    for item in CONFIG.get("crowd", []):
        await build_crowd(item)
    print(f"wrote {JSON_OUT.relative_to(ROOT)}")


asyncio.run(main())
