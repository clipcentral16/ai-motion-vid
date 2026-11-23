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

## Layout

```
src/index.ts                 registerRoot
src/Root.tsx                 all <Composition>s
src/SpinningObject/          example: 3D scene + captions + audio
public/                      static assets (audio, models, textures)
remotion.config.ts           render config (ANGLE GL renderer for WebGL)
out/                         render output (git-ignored)
```

## Commands

- `npm run dev`: Remotion Studio preview
- `npm run render`: render `SpinningObject` to `out/spinning-object.mp4`
- `npx remotion render <CompositionId> out/<name>.mp4`: render any composition
- `npm run typecheck`: TypeScript check

In sandboxed or cloud environments where Remotion can't download its own headless Chrome (from `remotion.media`), add
`--browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`
(or any local Chrome Headless Shell) to the render command.

After rendering, check a few frames (e.g. `ffmpeg -i out/x.mp4 -vf "select=eq(n\,60)" -frames:v 1 frame.png`) to confirm the 3D layer isn't blank.
