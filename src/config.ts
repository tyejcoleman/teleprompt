/** Agent tuning surface. Vite reloads these changes in the running app. */
export const prompterConfig = {
  reading: {
    fontSize: 46,
    margin: 36,
    scrollOffset: 100,
    floatingWidth: 720,
    floatingHeight: 420,
    maxScriptBytes: 500_000,
  },
  tracking: {
    /** A bounded transcript tail keeps matching work small during long phrases. */
    maxTranscriptWords: 40,
    /** Search near the last confirmed position; require several words for jumps. */
    lookAheadWords: 64,
    lookBehindWords: 5,
    minimumConfidence: 0.62,
    /** A single common word must not jump the reader to a distant paragraph. */
    singleWordLookAhead: 3,
    /** Partial-word or spelling errors are tolerated for words of this length. */
    fuzzyMinLength: 4,
  },
} as const
