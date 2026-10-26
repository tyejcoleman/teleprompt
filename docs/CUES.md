# Adding cues to a script (for agents)

A cue is a short, unspoken instruction in `[square brackets]`. The reader shows it in amber just before the sentence it belongs to, and voice tracking ignores it. Cues help the presenter deliver the script; they never change what is said.

Add cues when the user asks, or offer to after loading their script. Do not add them silently.

## The one rule

**Never change, add, remove, or reorder a spoken word.** Insert cues only. The checker below enforces this.

## Steps

1. Keep the user's original file unchanged. Write the cued version next to it as `<name>.cued.txt`.
2. Add cues using the guide below.
3. Check it:
   ```bash
   npm run cues -- script.txt script.cued.txt
   ```
   `FAIL` means a spoken word changed or a bracket is broken. Fix it before going on. Act on any `WARN` lines where they make sense.
4. Show the user the cues you added, as a short list of cue + the words it sits before, not the whole script. Apply their edits.
5. Load the cued file into the app with **Menu → Import .txt**. Their previous script stays in the original file.

## Where cues make sense

Aim for about one cue per paragraph, and only where it changes the delivery. Too many cues are noise.

| Spot in the script | Cue |
| --- | --- |
| Very start | `[Look at the camera. Smile.]` |
| Section or topic change | `[Next: pricing.]`, a heads-up on what's coming |
| After a key point, a question, or before a reveal | `[Pause.]` or `[Pause 2 seconds.]` |
| Numbers, names, prices, dates, URLs | `[Slow down.]` |
| The one word that carries the sentence | `[Stress "free".]` |
| Before a long sentence | `[Breathe.]` |
| Script refers to something on screen | `[Show the dashboard.]` |
| A warm or personal line | `[Smile.]` |
| Call to action | `[Look at the camera.]` |
| End | `[Hold 2 seconds. Stop recording.]` |

## Format

- Put a section cue on its own line above the paragraph. Put pause or stress cues at a sentence boundary, right before the sentence they affect. Use a mid-sentence cue only for a pause.
- Keep cues to about 2–8 words, written as an instruction, starting with a capital letter and ending with a period.
- Use one cue per spot. Merge two into one bracket: `[Pause. Next: pricing.]`.
- Don't nest brackets, and don't quote long passages of the script inside a cue.
- Write cues in the presenter's language, even if the script mixes languages.

## Example

Original:

```text
Most teams track too many numbers. We help you pick the three that matter. It takes ten minutes and it's free. Here's how it works.
```

Cued:

```text
[Look at the camera. Smile.]
Most teams track too many numbers. [Pause.] We help you pick the three that matter. [Slow down. Stress "free".] It takes ten minutes and it's free.
[Next: the demo.]
Here's how it works.
```
