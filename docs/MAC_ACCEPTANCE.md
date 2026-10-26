# Mac acceptance checklist

This checklist is intentionally separate from automated tests. The repository's tests do not establish that these device checks passed.

## Setup and appearance

- [ ] Node >=22.12, `npm ci`, `npm test`, and `npm run build` succeed.
- [ ] `npm run dev` opens the app at http://localhost:5173 in desktop Chrome.
- [ ] Import `public/sample-script.txt`; edit, save, export, and refresh. The script survives refresh.
- [ ] Main, focus, and floating views are readable at the actual screen size and camera distance.
- [ ] Text size/margins work; progress and cue cards do not obscure upcoming words.
- [ ] Focus shortcut and return controls work. Closing the floating window restores the main reader.
- [ ] Change a CSS token while the dev server runs; the main and floating reader reflect the change.

## Real microphone and tracking

- [ ] Allow Chrome microphone access and the required macOS microphone permission.
- [ ] Use the intended microphone and correct speech language. Verify returned text in the Microphone line.
- [ ] Read 30–60 seconds at the user's natural pace. Check first-word response and ongoing cursor lag.
- [ ] Pause for five seconds: the cursor holds. Continue: tracking resumes.
- [ ] Reread a short phrase, skip a nearby sentence, and speak one unrelated sentence. Check recovery/hold behavior.
- [ ] Click the desired next word after a large jump and continue.
- [ ] Deny microphone access once: the app shows a useful message without repeated prompts. Restore access.
- [ ] Keep the main tab open, switch to the recorder, and verify tracking continues in the floating view.

## Separate recorder

- [ ] Select and test the recorder's own camera/microphone inputs independently of Chrome.
- [ ] Record a 30-second test using the actual QuickTime/OBS setup and play it back.
- [ ] Confirm the intended capture excludes/includes the prompter as desired. Whole-desktop recording can include it.
- [ ] Confirm both Chrome recognition and the recorder can use the chosen microphone together on this Mac.

## Latency record

Do not substitute the local matcher benchmark for speech-to-screen latency. For an approximate device measurement, record a test that captures both the spoken audio and the reader highlight; inspect the time difference for several words and note median/worst observed lag, browser version, microphone, and network. Treat this as an observational test, not a provider guarantee. If tracking feels slow, first inspect when Chrome returns the recognized text.

## Result

Date / Mac / Chrome version:
Microphone / recorder:
Passed checks:
Failed or untested checks:
Observed response time and method:
Tuning changes:
