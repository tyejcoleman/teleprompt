import { type TextElement, tokenize } from "./word-tokenizer"
import { levenshteinDistance } from "./levenshtein"
import { prompterConfig } from "../config"

const settings = prompterConfig.tracking
const normalize = (word: string) => word.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
type ScriptWord = { word: string; index: number }
const cache = new WeakMap<TextElement[], ScriptWord[]>()
function scriptWords(elements: TextElement[]): ScriptWord[] {
  let words = cache.get(elements)
  if (!words) {
    words = elements.filter(element => element.type === "TOKEN").map(element => ({ word: normalize(element.value), index: element.index }))
    cache.set(elements, words)
  }
  return words
}

export interface SpeechMatch { index: number; confidence: number; matched: boolean }

/**
 * Bounded word-sequence alignment with free script-prefix skipping. Extra spoken
 * words and small recognition errors are tolerated. Weak matches hold position.
 * This is script alignment, not a semantic understanding or generation model.
 */
export function matchSpeech(
  recognized: string,
  reference: TextElement[],
  lastConfirmedIndex: number,
  interimHintIndex = lastConfirmedIndex,
): SpeechMatch {
  const hold = { index: lastConfirmedIndex, confidence: 0, matched: false }
  const spoken = tokenize(recognized).filter(t => t.type === "TOKEN").map(t => normalize(t.value)).slice(-settings.maxTranscriptWords)
  const words = scriptWords(reference)
  if (!spoken.length || !words.length) return hold
  const next = words.findIndex(w => w.index > lastConfirmedIndex)
  if (next < 0) return { index: lastConfirmedIndex, confidence: 1, matched: true }
  const hint = Math.max(next, words.findIndex(w => w.index >= interimHintIndex))
  const start = Math.max(0, Math.max(next, hint - spoken.length) - settings.lookBehindWords)
  const end = Math.min(words.length, Math.max(next + settings.lookAheadWords, hint + settings.lookAheadWords))
  const nearby = words.slice(start, end)
  const rows: number[][] = [new Array(nearby.length + 1).fill(0)]
  const costs: number[][] = []
  for (let i = 1; i <= spoken.length; i++) {
    const row = [i]
    const substitutions = [1]
    for (let j = 1; j <= nearby.length; j++) {
      const a = spoken[i - 1], b = nearby[j - 1].word
      const fuzzy = a.length >= settings.fuzzyMinLength && b.length >= settings.fuzzyMinLength && a[0] === b[0] && Math.abs(a.length - b.length) <= 1 && levenshteinDistance(a, b) <= 1
      const cost = a === b ? 0 : fuzzy ? 0.35 : 1
      substitutions[j] = cost
      row[j] = Math.min(rows[i - 1][j - 1] + cost, rows[i - 1][j] + 1, row[j - 1] + 0.9)
    }
    rows.push(row)
    costs.push(substitutions)
  }
  let best = hold, bestScore = Infinity
  for (let endColumn = 1; endColumn <= nearby.length; endColumn++) {
    const wordPosition = start + endColumn - 1
    if (nearby[endColumn - 1].index < lastConfirmedIndex) continue
    if (spoken.length === 1 && wordPosition > next + settings.singleWordLookAhead) continue
    const confidence = Math.max(0, 1 - rows[spoken.length][endColumn] / spoken.length)
    if (confidence < settings.minimumConfidence) continue
    // Count grounded word matches. This rejects short accidental fuzzy alignments.
    let i = spoken.length, j = endColumn, matches = 0
    while (i > 0 && j > 0) {
      const diagonal = rows[i - 1][j - 1] + costs[i - 1][j]
      if (Math.abs(rows[i][j] - diagonal) < 0.00001) {
        if (costs[i - 1][j] < 1) matches++
        i--; j--
      } else if (Math.abs(rows[i][j] - (rows[i - 1][j] + 1)) < 0.00001) i--
      else j--
    }
    if (matches < Math.max(1, Math.ceil(spoken.length * 0.6))) continue
    const expected = Math.max(next + spoken.length - 1, hint)
    const score = (1 - confidence) + Math.abs(wordPosition - expected) * 0.001
    if (score < bestScore) {
      bestScore = score
      best = { index: nearby[endColumn - 1].index, confidence, matched: true }
    }
  }
  return best
}

export const computeSpeechRecognitionTokenIndex = (recognized: string, reference: TextElement[], lastIndex: number) => matchSpeech(recognized, reference, lastIndex).index
