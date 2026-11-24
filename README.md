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

A sample render of the starter scene is in [`examples/spinning-object.mp4`](examples/spinning-object.mp4). See [CLAUDE.md](CLAUDE.md) for the stack conventions.
