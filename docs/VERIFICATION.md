# Verification at initial handoff

Story: import a script, receive interim speech results, align them locally, and update the reader while the user records separately on a Mac.

## Confirmed in the development environment

- `npm test` passes 12 tracking fixtures: first-word updates, punctuation/case, ignored cues, recognition typo, spoken filler, off-script holds, bounded single-word jumps, sentence skipping, committed continuation, nearest repeated phrase, and empty audio.
- Simulated speech events pass interim/final sequencing, position holding, microphone-denied handling, and unsupported-browser fallback.
- Simulated DOM flows pass editing, .txt import, local persistence, current-word highlighting, focus mode, floating-reader portal transfer, style copying/live synchronization, keyboard navigation, and return to the main reader.
- A local matcher microbenchmark averaged under 1 ms per alignment in this environment with a 10,000-word script. This is not microphone-to-screen latency, and the regression timing bound is deliberately loose to allow slower CI machines.
- `npm run build` type-checks and produces production static assets successfully.
- The Mac launcher's shell syntax passes, and its shared local-server path runs on Linux: Vite reports ready, and HTTP requests return 200 for the app, agent handoff, sample script, config module, and stylesheet. Starting a second launcher correctly refuses an occupied port.

## Not established here

- Actual rendering/layout in desktop Chrome on the user's screen.
- Real Web Speech API transcripts, startup delay, response latency, and accuracy from the user's microphone.
- Real macOS permissions or Chrome Document Picture-in-Picture behavior.
- The macOS-specific `open -a 'Google Chrome'` launcher step.
- Simultaneous use of the chosen microphone by Chrome and QuickTime/OBS.
- Whether the chosen recording capture excludes the prompter.

Run [MAC_ACCEPTANCE.md](MAC_ACCEPTANCE.md) on the user's Mac. These limits are explicit in the setup prompt and agent handoff.
