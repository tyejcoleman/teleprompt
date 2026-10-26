# Working on Voice Follow Teleprompter

This repository is the user's local Mac teleprompter. She records separately in QuickTime, OBS, or another application. Keep the app easy to run, easy to tune, and free of required API keys.

## Setup

- Use Node >=22.12, `npm ci`, then `npm run dev`.
- Default local URL: http://localhost:5173, in desktop Google Chrome.
- Keep the original tab open when using Float reader.
- Read docs/AGENT_HANDOFF.md, docs/TUNING.md, and docs/MAC_ACCEPTANCE.md.
- Do not create a hosted site or introduce an ElevenLabs/LLM dependency unless the user asks.

## User feedback: fix the same app

1. Keep using the same checkout and development server. Ask only for feedback details that cannot be observed or inferred.
2. Preserve the approved script and local browser data. Do not replace it with a demo or clear local storage. Export a backup before changing script storage.
3. Find the smallest change using src/config.ts for defaults/tracking, src/theme.css for visual tokens, and src/index.css for layout. In-app controls are appropriate for one-session reading adjustments.
4. Apply the fix directly. Vite reloads the running tab; CSS changes also sync to the floating window. Confirm state after changes that remount components; restart listening if needed.
5. For a tracking bug, add the real recognized phrase plus a short script excerpt to checks/fixtures/tracking.json only if the user authorizes storing that content. Otherwise use a representative synthetic phrase. Add a reproducer before changing the matcher.
6. Run npm test and npm run build for code/tracking changes. For simple CSS changes, check the affected view and run the build. Avoid testing unrelated flows repeatedly.
7. Recheck the specific feedback on her Mac, with her browser and microphone when possible. Distinguish simulated checks from real device tests. Do not claim a latency number from the local matcher is microphone-to-screen latency.
8. Describe what changed and any remaining verification limit. Commit or publish repository changes only within the user's authorized scope.

## Architecture

- src/lib/speech-recognizer.ts: Web Speech API adapter; interim results and permission/network errors.
- src/lib/speech-matcher.ts: bounded fuzzy word alignment, cached script words, confidence gating.
- src/app/thunks.ts: confirmed and interim transcript anchors; no cloud LLM in the hot path.
- src/features/content/Content.tsx: current-word highlight, cue rendering, scrolling and click-to-resume.
- src/hooks/useFloatingWindow.ts: Document Picture-in-Picture, shared React state, style sync.
- src/hooks/useReaderKeys.ts: shortcuts in the main and floating windows.
- src/config.ts and src/theme.css: primary tuning surfaces.

Use safe React text rendering, accessible control labels, and reduced-motion support. Keep the original MIT notices. Never commit the user's scripts, audio, recordings, credentials, node_modules, or dist output by default.
