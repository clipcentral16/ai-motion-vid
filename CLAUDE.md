# CLAUDE.md

## Required stack for 3D animated videos

Whenever we create a 3D animation or video in this project, **always use this stack**. Don't swap in other renderers, animation libraries or video tools.

| Job | Tool |
| --- | --- |
| 3D scenes, models, lights, cameras | **Three.js** via **@react-three/fiber**, mounted with **`<ThreeCanvas>` from `@remotion/three`** |
| Timing, composition, 2D overlays | **Remotion** (`remotion`) |
| Captions / subtitles | **Remotion** + **`@remotion/captions`** (`Caption[]` data, `createTikTokStyleCaptions`) |
| Audio (music, voiceover, SFX) | **Remotion** `<Audio>` with files in `public/` loaded through `staticFile()` |
| Rendering the final video | **Remotion CLI** (`npx remotion render …`) to MP4 (H.264 + AAC) |

## Rules for 3D scenes

- Render 3D only inside `<ThreeCanvas>` from `@remotion/three`. Never use a plain `<Canvas>` from `@react-three/fiber`, because it won't sync with Remotion's frames.
- Drive **all** motion from `useCurrentFrame()` / `useVideoConfig()` (plus `interpolate` and `spring`). Do **not** use R3F's `useFrame`, `THREE.Clock`, `Date.now()`, `requestAnimationFrame` or `Math.random()` without a seed. Renders must be deterministic frame by frame.
- Pass `width` and `height` from `useVideoConfig()` to `<ThreeCanvas>`.
- Load async assets (GLTF, textures) with `delayRender`/`continueRender`, or with `useLoader` inside `<Suspense>` (which `@remotion/three` supports).
- Keep each composition in its own folder under `src/<Name>/`, with the 3D scene, captions and composition root in separate files, and register it in `src/Root.tsx`.
- Keep `remotion`, `@remotion/*` versions **exactly equal** (pinned, no `^`).
- Use `random(seed)` from `remotion` for any randomness (crowds, placement).
- Reuse the shared pieces in `src/shared/`: 3D in `shared/three/` (capsule `Character`, props, `Street`, `CameraRig`, `Puff`, `punchFov`, `SceneCanvas` with custom sky colours, `Lights` with a `mood`), plus `CaptionTrack`, `Transitions`, `Soundtrack` and `buildNarration`. Put video-specific props in `src/<Video>/three/`.
- Captions: build `createTikTokStyleCaptions` pages **per scene**, and give every word a leading space. Otherwise the first word of a line gets attached to the previous page.
- Narration: use Microsoft's free Edge neural voices via `edge-tts` (default `en-US-BrianMultilingualNeural`, +14% rate, clips loudness-normalised to about -13 LUFS). Captions must take their word timings from the TTS word boundaries in `narration.json`, so subtitles match the voice exactly. Duck the music under the voice. Each line can override `voice`/`rate`/`pitch`/`lufs` and add `fx` (`radio`, `alien`, `weak`), a `speaker` label and a caption `tone` (`radio`, `alien`, `hero`, `weak`, `narrator`), for dialogue-style videos. Never use downloaded TikTok/social audio; recreate it with TTS + effects. Crowd screams/cheers: the config's `crowd` section layers many TTS voices into one sound. Time big on-screen moments to the narrator's words (derive them from `narration.json`, as AsteroidSave/constants.ts does).
- Real people (e.g. streamers in a meme): cartoon character + name label only, a generic TTS voice (never a clone of their voice), and a positive or clearly comedic portrayal.
- Sensitive topics (war, disasters): keep it cartoon and non-graphic (no injuries or deaths on screen, blasts seen from a distance), no real people or national symbols, and phrase speculative consequences with "could".
- Mood: `Transitions mode` can be one value or one per cut (e.g. dips while it's scary, swipes once it turns hype). Playful videos use swipe transitions, whooshes and bouncy SFX; scary or serious ones use `Transitions mode="dip"` (dip to black), no whooshes or playful sounds, and a score that starts calm and builds.
- Keep scenes short (~4s each) with a camera punch-in (`punchFov`) at each scene start and constant character motion (bounces, squash and stretch, ollies, spins).
- New "blocky" look (preferred for new videos): `src/shared/blocky/` has `BlockCharacter` (jointed brick-avatar character: shoulders, elbows, hands, hips, knees, ankles, shoes; hairstyles; clothing; painted face decals with expressions + blinking), `poses.ts` (frame-driven walk/run, idle, wave, cheer, scared, sad, armsCrossed, handsOnHips, sit, push, holdUp, headInHands, lounge, balance, tuck, flail, splat, `blend`), and `Environment.tsx` (`BlockCanvas` with soft shadows + ACES tone mapping, `BlockLights`, textured `Grass`, `Road`, `House`, `BrickWing`, `Townhouse`, `Tower`, `Shop`, `Van`, `Tree`, `LampPost`, `StormClouds`), plus `TownProps.tsx` (`Sign`, `Classroom`, `ShopDoor`, `Mansion`, `Scanner`, `Rain`, `MoneyRain`). Units are studs (characters ~5.3 tall). Keep it an original generic style, not any brand's avatars or assets. `StyleTest` is the reference clip. Looks support `build: "kid"`, `top` (tee/hoodie/jacket), `jeans`, `sunglasses`, `crown`. For the "In this town" format use `CaptionTrack variant="word"` (one big lime-yellow word at a time, mid-screen) and `Transitions mode="dip"`.
- Fonts are bundled in `public/fonts/` and loaded with `@remotion/fonts`, so renders don't depend on network fonts.

## Layout

```
src/index.ts                 registerRoot
src/Root.tsx                 all <Composition>s
src/SpinningObject/          example: 3D scene + captions + audio
src/shared/                  shared by every video: three/ (characters, props,
                             city, camera, smoke), CaptionTrack, Transitions,
                             Soundtrack (music ducking + voice + SFX), narration
src/WhatIfNoLegs/            "What if everyone lost their legs?" (scenes/, captions, SFX)
src/WhatIfNuke/              "What if North Korea started nuking everyone?"
                             (scenes/, three/NukeProps: missile, mushroom cloud, globe...)
src/JupiterIncident/         "The 2011 Jupiter Incident" (dark found-footage style:
                             FoundFootage HUD/grain/SIGNAL LOST, HeroTitles, three/JupiterProps)
src/StyleTest/               test clip for the blocky look (skyline, street walk, family)
src/DumbTown/                "In this town, you get paid for being dumb" (blocky style, 14 scenes:
                             scenes/Scenes.tsx, shared/blocky/TownProps: classroom, doors, mansion, scanner,
                             rain, money rain; Overlays: test papers, phone notification)
src/ClumsyTown/              "In this town, the clumsiest person gets crowned king" (blocky style,
                             12 scenes; three/ClumsyProps: castle, throne, grand stairs, judges,
                             banana peel, coffee splash, confetti; Tumble helper for falls/flips)
src/AsteroidSave/            "What if an asteroid was about to hit Earth?" (Zen's Rocket League
                             save: mechanics.ts choreography, game-style callouts, boost meter)
public/                      static assets (audio, models, textures, fonts)
scripts/generate-audio.mjs   synthesises music + SFX (no arg: public/whatif/, `nuke`, `jupiter`, `asteroid`, `dumbtown`, `clumsytown`: public/<set>/)
scripts/generate-narration.py  narrator voice (Microsoft Edge TTS) + word timings,
                             one config per video in scripts/narration/*.json
remotion.config.ts           render config (ANGLE GL renderer for WebGL)
out/                         render output (git-ignored)
```

## Commands

- `npm run dev`: Remotion Studio preview
- `npm run render`: render `SpinningObject` to `out/spinning-object.mp4`
- `npx remotion render <CompositionId> out/<name>.mp4`: render any composition
- `npm run typecheck`: TypeScript check
- `npm run render:whatif` / `render:nuke` / `render:jupiter` / `render:asteroid` / `render:dumbtown` / `render:clumsytown`: render a video (1080×1920) to `out/`
- `npm run audio` / `audio:nuke` / `audio:jupiter` / `audio:asteroid` / `audio:dumbtown` / `audio:clumsytown`: regenerate the synthesised music and sound effects
- `npm run narration` / `narration:nuke` / `narration:jupiter` / `narration:asteroid` / `narration:dumbtown` / `narration:clumsytown`: regenerate the narrator voice-over from `scripts/narration/<video>.json` (needs `pip install edge-tts` and network access to `speech.platform.bing.com`)

Blocky-style videos render slowly in software WebGL (~30s of render per 1s of video); run long renders in the background.

In sandboxed or cloud environments where Remotion can't download its own headless Chrome (from `remotion.media`), add
`--browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`
(or any local Chrome Headless Shell) to the render command.

After rendering, check a few frames (e.g. `ffmpeg -i out/x.mp4 -vf "select=eq(n\,60)" -frames:v 1 frame.png`) to confirm the 3D layer isn't blank.
