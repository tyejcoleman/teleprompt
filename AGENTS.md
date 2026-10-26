# Working on Voice Follow Teleprompter

This repository is the user's local Mac teleprompter. They record separately in QuickTime, OBS, or another application. Keep the app easy to run, easy to tune, and free of required API keys.

## Set up for a new user (do this first)

The whole setup is one command. Requirements: macOS, Google Chrome, Node.js 22.12+. Nothing else: no accounts, API keys, or hosting.

1. **Ask the user two questions, in one message:**
   - "Where is your script? Give me the file path, or paste the text." (Pasted text: save it to a `.txt` file in their home folder, not inside this repo.)
   - "Do you want me to add delivery cues automatically — pauses, 'Next:' headings, slow-downs? I won't change any of your words."
2. **If they want cues:** read the script, write `<name>.cued.txt` next to the original following `docs/CUES.md` (insert `[cues]` only; never change a spoken word).
3. **Run setup** from this folder (it returns when the app is running; it does not block):
   ```bash
   node setup.mjs --script "<path to script>"
   node setup.mjs --script "<path to script>" --cued "<path to cued script>"   # with cues
   ```
   It checks Node and Chrome, installs dependencies, verifies cues, loads the script, starts the app in the background, and opens Chrome. Every line is `OK:`, `FAIL:` (fix it and rerun; the message says how), or `NEXT:`.
4. **If you added cues**, list them for the user as `cue → the words it sits before`, not the whole script. Apply any edits, then rerun step 3.
5. **Chrome opens by itself** on macOS with the script loaded. Tell the user the `NEXT:` lines: click Start listening, allow the microphone, press F for full screen. If you can drive the user's browser, you may open the URL and click \"Load it\" for them, but only the user grants the microphone and tests their voice.

Other commands: `node setup.mjs --check` (verify requirements, change nothing), `node setup.mjs --stop` (stop the app), `npm test`, `npm run build`, `npm run cues -- original.txt cued.txt`.

Notes:
- If node is missing, ask before installing it (`brew install node@22` or https://nodejs.org). The user installs Chrome.
- A `.docx`/`.pages` script: convert to text first (`textutil -convert txt <file>` on macOS) and confirm the text with the user.
- The script lands in `public/local/script.txt` (gitignored). The app loads it automatically; if the user already has a different script open, the app asks "Load it" first. It never overwrites their draft silently.
- App URL: http://127.0.0.1:5173 in desktop Chrome. Server log: `.local/server.log`.
- Read docs/AGENT_HANDOFF.md, docs/TUNING.md, and docs/MAC_ACCEPTANCE.md before tuning.
- Do not create a hosted site or introduce an ElevenLabs/LLM dependency unless the user asks.

## User feedback: fix the same app

1. Keep using the same checkout and development server. Ask only for feedback details that cannot be observed or inferred.
2. Preserve the approved script and local browser data. Do not replace it with a demo or clear local storage. Export a backup before changing script storage.
3. Find the smallest change using src/config.ts for defaults/tracking, src/theme.css for visual tokens, and src/index.css for layout. In-app controls are appropriate for one-session reading adjustments.
4. Apply the fix directly. Vite reloads the running tab; CSS changes also sync to the floating window. Confirm state after changes that remount components; restart listening if needed.
5. For a tracking bug, add the real recognized phrase plus a short script excerpt to checks/fixtures/tracking.json only if the user authorizes storing that content. Otherwise use a representative synthetic phrase. Add a reproducer before changing the matcher.
6. Run npm test and npm run build for code/tracking changes. For simple CSS changes, check the affected view and run the build. Avoid testing unrelated flows repeatedly.
7. Recheck the specific feedback on their Mac, with their browser and microphone when possible. Distinguish simulated checks from real device tests. Do not claim a latency number from the local matcher is microphone-to-screen latency.
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
