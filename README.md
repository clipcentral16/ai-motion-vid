# ai-motion-vid

3D animated videos built with **Three.js** (through `@remotion/three`) and **Remotion** (captions, audio, rendering).

```bash
npm install
npm run dev      # preview in Remotion Studio
npm run render   # -> out/spinning-object.mp4
```

Videos:

- **What if everyone lost their legs?** (`WhatIfNoLegs`, 9:16, 25s, narrated): [`examples/what-if-no-legs.mp4`](examples/what-if-no-legs.mp4). Render with `npm run render:whatif`.
- **What if North Korea started nuking everyone?** (`WhatIfNuke`, 9:16, 25s, narrated): [`examples/what-if-nuke.mp4`](examples/what-if-nuke.mp4). Render with `npm run render:nuke`.
- **The 2011 Jupiter Incident** (`JupiterIncident`, 9:16, 32s, radio/alien voices, dark found-footage look): [`examples/jupiter-incident.mp4`](examples/jupiter-incident.mp4). Render with `npm run render:jupiter`.
- **What if an asteroid was about to hit Earth?** (`AsteroidSave`, 9:16, 32s: Zen's air roll, catch, flip reset and musty flick): [`examples/asteroid-save.mp4`](examples/asteroid-save.mp4). Render with `npm run render:asteroid`.
- **In this town, you get paid for being dumb** (`DumbTown`, 9:16, 54s, new blocky style): [`examples/dumb-town.mp4`](examples/dumb-town.mp4). Render with `npm run render:dumbtown`.
- **In this town, the clumsiest person gets crowned king** (`ClumsyTown`, 9:16, 50s, blocky style): [`examples/clumsy-town.mp4`](examples/clumsy-town.mp4). Render with `npm run render:clumsytown`.

A sample render of the starter scene is in [`examples/spinning-object.mp4`](examples/spinning-object.mp4). See [CLAUDE.md](CLAUDE.md) for the stack conventions.
