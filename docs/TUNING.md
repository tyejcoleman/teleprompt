# Tune from user feedback

## The feedback loop

Keep the same checkout, Chrome profile, local URL, and dev server. Ask what the user sees or hears only when needed. Apply the smallest change directly; do not create a new app for each revision. Vite reloads the current page. Export the script before storage changes and restart listening after a page reload if necessary.

For a visual issue, capture the actual window dimensions and whether it occurs in the main, focus, or floating view. For a tracking issue, distinguish recognition from alignment: if the **Microphone** text is wrong, check the microphone, language, and service first. If the returned text is right but the cursor is wrong, reproduce the matcher behavior.

## Reading defaults — src/config.ts

- `fontSize`, `margin`, `scrollOffset`: initial reading appearance. Users can adjust these in Reading settings without editing code. Reading settings are session state; permanent defaults belong in config.
- `floatingWidth`, `floatingHeight`: requested floating-window dimensions; Chrome and the OS may constrain placement and size.
- `maxScriptBytes`: import safety limit, not the maximum microphone recording length.

Changes to defaults may not reset already-mounted Redux state during hot reload. If the value does not update, refresh the tab once, reload the saved script if needed, and restart listening. Ordinary stylesheet changes update without a reset.

## Appearance — src/theme.css and src/index.css

`theme.css` contains named color, font, line-height, and radius variables. Match the user's viewing distance and contrast needs. `index.css` controls layout, floating view, cue styling, progress, and responsive behavior.

Keep current words clearly distinct from upcoming words. Avoid fast animation, and preserve the reduced-motion rule. Style changes sync into an open floating reader; closing/reopening the floating reader is a useful recovery if Chrome blocks an update.

## Tracking defaults — src/config.ts

| Setting | If increased | If decreased |
| --- | --- | --- |
| `minimumConfidence` | Holds more often; rejects more false matches | Follows more loosely; greater risk of incorrect movement |
| `lookAheadWords` | Can recover from larger forward skips | Fewer opportunities to jump to a repeated phrase |
| `lookBehindWords` | Better tolerance for short rereads | Stronger preference for continuing forward |
| `singleWordLookAhead` | A lone word can move farther ahead | Less accidental movement on common words |
| `maxTranscriptWords` | More context and more matching work | Smaller matching work; less context in long phrases |

These are alignment settings. They do not change how quickly Chrome returns words, its speech model, or network latency. The confidence value is a heuristic alignment score, not a calibrated probability.

## Add a regression fixture

Add an object to `checks/fixtures/tracking.json`:

```json
{
  "name": "brief explanation of feedback",
  "script": "Welcome to the studio. Today we begin.",
  "speech": "today we begin",
  "confirmedWords": 4,
  "expectedReadWords": 7
}
```

Counts refer to spoken script words; bracketed cues do not count. Reproduce the actual recognized text, not an idealized transcript. Store real user content only with authorization; a synthetic equivalent is usually sufficient.

Run `npm test` and `npm run build` after code or tracking changes. Add cases for both desired recovery and unwanted movement. Confirm the specific fix on the real Mac after automated checks pass.
