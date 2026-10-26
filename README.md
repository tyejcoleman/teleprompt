# Voice Follow Teleprompter

An open-source teleprompter that follows your voice while you **record separately** in QuickTime, OBS, or another app on the same Mac.

Paste a script, start listening, and speak naturally. Your current word is highlighted, completed words dim, speaker cues stand out, and the next lines remain visible. Focus view removes distractions. Desktop Chrome's floating reader stays above other apps where Document Picture-in-Picture is supported.

No account, hosted service, ElevenLabs key, or LLM key is required by this app. Browser speech recognition may use an online browser-provider service and send microphone audio to it. This is not an offline transcription promise.

## Start on a Mac

Requirements: **Google Chrome** and **Node.js 22.12 or newer**. Node 22 LTS is a suitable choice.

```bash
git clone https://github.com/tyejcoleman/voice-follow-teleprompter.git
cd voice-follow-teleprompter
npm ci
npm run dev
```

Open **http://localhost:5173** in Chrome. Keep the terminal and the original browser tab open. `localhost` is an allowed secure context for microphone access.

Alternatively, after downloading or cloning the project, run:

```bash
bash "Start Teleprompter.command"
```

The launcher installs locked dependencies when needed, starts the local app, and opens Chrome on macOS. It checks the Node version first. On a fresh Mac, install Node and Chrome before using the launcher. A downloaded `.command` file may need permission to execute; invoking it with `bash` avoids that executable-bit issue.

1. Choose **Edit script**, paste the script, then **Save script**, or choose **Import .txt**.
2. Put unspoken instructions in brackets, for example `[Pause. Next: explain the price.]`.
3. Choose the language you will speak.
4. Click **Start listening** and allow the microphone in Chrome. Check macOS **System Settings → Privacy & Security → Microphone** if access is blocked.
5. Read a short paragraph. The first-word highlight and **Following your voice** state confirm transcript matching.
6. Choose **Float reader ↗**, position the window near the camera, then use your separate recording app. Keep the main tab open. If floating view is unavailable, use **Focus view** or a second display.
7. Record a short test in the recording app and verify its microphone input and audio. Using the microphone in Chrome does not record your video or select the recorder's audio source.

**Capture behavior:** a full-desktop recording can include the prompter. Use your recorder's camera, application, or window capture settings as appropriate. The app does not hide itself from recordings.

Scripts persist in the same browser's local storage. Export a `.txt` backup for another device, browser, agent, or checkout URL. Nothing in local storage is committed to GitHub.

## Give this project to another agent

Start with [AGENTS.md](AGENTS.md) and [the handoff](docs/AGENT_HANDOFF.md). The user supplies the final script; the agent installs the project, imports the script, and helps the user run the Mac acceptance check. No deployment is necessary.

The working checkout is the product. Run `npm run dev` while tuning it: code changes reload in the same tab, and visual CSS changes also sync into an open floating reader. Do not create another app or hosted site for each round of feedback.

## Tune it in place

| Feedback | First file to change |
| --- | --- |
| Text too small, margins too wide, floating window size | [`src/config.ts`](src/config.ts) → `reading` defaults, or the in-app Reading settings |
| Colors, contrast, line spacing, typography | [`src/theme.css`](src/theme.css) |
| Header, cue, progress, focus-view layout | [`src/index.css`](src/index.css) |
| Tracking is too eager, too conservative, or skips too far | [`src/config.ts`](src/config.ts) → `tracking` |
| A particular phrase tracks incorrectly | [`src/lib/speech-matcher.ts`](src/lib/speech-matcher.ts), with a fixture in [`checks/fixtures/tracking.json`](checks/fixtures/tracking.json) |
| Recognition starts/stops incorrectly | [`src/lib/speech-recognizer.ts`](src/lib/speech-recognizer.ts) |

See [the tuning guide](docs/TUNING.md) for the feedback loop and configuration tradeoffs.

## How tracking works

The microphone feeds the browser Web Speech API with **interim results enabled**. Those provisional words go straight to a local script matcher; the UI does not wait for a completed sentence or an LLM request. The matcher normalizes words, searches a bounded nearby region, tolerates small transcription errors, and holds the screen when confidence is low. A single common word cannot jump to a distant section.

Partial results can change. A committed transcript establishes the anchor for the next segment. Long improvisations, extensive paraphrasing, accents, repeated passages, or recognition errors may require clicking the intended next word. This is script alignment; it does not generate new speaking advice or understand arbitrary paraphrases semantically. Prepared bracketed cues provide guidance instantly.

Audio latency depends on Chrome's recognition service, the network, the microphone, and the device. There is **no guaranteed end-to-end latency threshold**. The microbenchmark in the tests measures only local alignment work.

## Controls

- **Space:** start/pause listening when a text field or native control is not active.
- **F:** focus view. **Escape:** stop listening.
- **Left / right:** move five text elements. **Up / down:** move fifteen.
- **Click any word:** choose where to resume.
- **Restart:** return to the beginning while paused.
- **Export script:** download a transferable backup.

## Validation

```bash
npm test
npm run build
```

Tests exercise script alignment fixtures, interim/final transcript sequencing, off-script holds, microphone permission errors, import and persistence, focus controls, and a simulated floating-window portal with live style updates. The build type-checks the application and produces static assets in `dist/`.

See [the initial verification record](docs/VERIFICATION.md) for evidence and remaining device checks.

**Verification limits:** simulated DOM tests do not verify real Chrome speech recognition, actual Picture-in-Picture behavior, macOS permissions, layout rendering, or concurrent use with QuickTime/OBS. Run [the Mac acceptance checklist](docs/MAC_ACCEPTANCE.md) on the user's machine before relying on it for a recording.

## Credits and license

MIT licensed. Adapted from [Julien Lecomte's Voice-Activated Teleprompter](https://github.com/jlecomte/voice-activated-teleprompter), source commit `cd222c8225b9ac34ab4ecd0b14864de623e66dac`. Original license notices remain in [LICENSE](LICENSE). See [UPSTREAM.txt](UPSTREAM.txt) for provenance.
