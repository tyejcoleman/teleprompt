# Agent handoff

The owner will tune this app on their own Mac first, then share the repository and the tuned setup with another user and their agent. The presenter records separately; do not add a recorder or a hosted deployment.

## First Mac setup

1. Read `AGENTS.md`, `README.md`, and `docs/TUNING.md`.
2. Check Node (>=22.12), npm, and Google Chrome. Install missing software using the user's normal approved process.
3. Clone this repository into a stable directory. Reuse the existing checkout on later visits.
4. Run `npm ci`, `npm test`, and `npm run build`.
5. Start `npm run dev` and open http://localhost:5173 in desktop Chrome. Or use `bash "Start Teleprompter.command"`.
6. Load the user's approved script. Do not invent or rewrite it without being asked. Paste through Edit script/Save script or use a UTF-8 `.txt` file.
7. Set the speech language; adjust reading size and margins.
8. The user grants Chrome microphone access and reads the sample aloud. Only the user's real microphone can establish tracking quality and response time.
9. Run `docs/MAC_ACCEPTANCE.md`, including a short test in the separate recording app.
10. Leave the working checkout, app URL, and launcher location with the user.

## Feedback on the same Mac

Keep the development server running and edit the same project. Use `src/config.ts` for default sizes, window dimensions, and tracking thresholds; `src/theme.css` for visual tokens; `src/index.css` for layout. Changes reload in place. Floating-reader styles sync from the main tab. Changes that remount the app may require restarting listening; check that it is still active.

Preserve the browser profile, localhost origin/port, and script. Export a backup before storage changes or transferring to a new Mac. Do not clear local storage or replace the user's draft with demo text.

For each tracking bug, get a short script excerpt, the actual **Microphone** text returned by recognition, and the desired position. Add an authorized or synthetic fixture to `checks/fixtures/tracking.json`. Test the fix before changing unrelated settings.

After tuning, provide a concise list of changed settings and the commit/branch if requested. When sharing with the next person, send the repository, this handoff, and a separately authorized script file. The other person's microphone and recording setup require their own device check.

## Scope and limitations

No required API keys, authentication, cloud LLM, database, or hosted application. Browser recognition can depend on its online service. Arbitrary semantic paraphrasing is outside the local matcher. Extensive improvisation may need click-to-resume.

Automated tests simulate speech and browser DOM. They do not verify live Mac speech latency, actual Chrome Picture-in-Picture rendering, or QuickTime/OBS audio capture. Never present those as completed unless you perform them on the device.
