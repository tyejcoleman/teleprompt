# Copy this prompt into your Mac coding agent

Use the following prompt with an agent that can access your Mac's terminal and project files. If browser control is available, it can also help with the UI. You will still need to grant microphone access and speak for the real-device test.

```text
Set up and tune this open-source teleprompter on my Mac:
https://github.com/tyejcoleman/voice-follow-teleprompter

I will tune it on my Mac first, then share the tuned project with another person and their agent. The presenter records separately in QuickTime, OBS, or another app on the same Mac. Do not add a recorder, hosted deployment, ElevenLabs, or another paid API dependency.

Clone it once into a stable local folder, or reuse my existing checkout. Read AGENTS.md, README.md, docs/TUNING.md, and docs/MAC_ACCEPTANCE.md. Check Google Chrome and Node.js >=22.12. Run npm ci, npm test, and npm run build. Start the local app with npm run dev and open http://localhost:5173 in desktop Chrome. Keep the terminal and main tab open. The Mac launcher is Start Teleprompter.command.

Help me load my script without rewriting it, set the speech language, and test the microphone. Make the reader comfortable for my screen/camera position, using Focus view or Float reader. I will grant microphone permission and speak for the test.

When I give feedback, fix this same running checkout in place. Preserve my script and browser data. Tune src/config.ts for reading/tracking defaults, src/theme.css for colors/typography, and src/index.css for layout. Use in-app settings for session-only adjustments. Do not make a new app or deploy another copy.

For tracking bugs, compare the actual recognized text with the intended script position, add an authorized or synthetic regression fixture, then fix and test it. Run relevant checks after changes. Walk me through the Mac acceptance checklist, including a short recording in my separate recorder. Be explicit about what is simulated versus tested on my real Mac; do not call the matcher benchmark end-to-end latency.

When I am happy, give me the local folder, launcher, changed settings, and a short handoff for the next person's agent. Keep scripts and recordings out of GitHub unless I explicitly authorize sharing them. Leave repository pushes or a release for when I ask.
```
