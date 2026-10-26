// Check a cued script against the user's original: spoken words must be identical,
// and cues must be well-formed. Usage: npm run cues -- original.txt cued.txt
import { readFileSync } from 'node:fs'

const [originalPath, cuedPath] = process.argv.slice(2)
if (!originalPath || !cuedPath) {
  console.error('Usage: npm run cues -- <original.txt> <cued.txt>')
  process.exit(2)
}
const read = path => readFileSync(path, 'utf8').replace(/^﻿/, '')
const original = read(originalPath), cued = read(cuedPath)

// Same word rule as the app tokenizer (src/lib/word-tokenizer.ts).
const words = text => text.replace(/\[[^\]]*\]/g, ' ').match(/[A-Za-zÀ-ÿА-Яа-я0-9_]+/g) ?? []
const lineOf = (text, offset) => text.slice(0, offset).split('\n').length
const errors = [], warnings = []

const a = words(original), b = words(cued)
const first = a.findIndex((word, i) => word !== b[i])
if (first >= 0 || a.length !== b.length) {
  const at = first >= 0 ? first : Math.min(a.length, b.length)
  errors.push(`Spoken words changed at word ${at + 1}: original "${a.slice(at, at + 6).join(' ')}" vs cued "${b.slice(at, at + 6).join(' ')}". Only add [cues]; never edit the script.`)
}
if (words(original).length !== (original.match(/[A-Za-zÀ-ÿА-Яа-я0-9_]+/g) ?? []).length) warnings.push('The original already contains [cues]; they were ignored when comparing.')

const cues = [...cued.matchAll(/\[([^\]]*)\]/g)]
for (const match of cues) {
  const text = match[1].trim(), line = lineOf(cued, match.index)
  if (!text) errors.push(`Line ${line}: empty cue [].`)
  if (text.includes('[')) errors.push(`Line ${line}: nested bracket in cue [${text}].`)
  if (text.split(/\s+/).length > 12) warnings.push(`Line ${line}: long cue (${text.split(/\s+/).length} words). Keep cues under ~8 words so they read at a glance.`)
}
const unclosed = cued.replace(/\[[^\]]*\]/g, '').search(/[[\]]/)
if (unclosed >= 0) errors.push(`Line ${lineOf(cued.replace(/\[[^\]]*\]/g, ''), unclosed)}: unmatched bracket. The app would show it as script text.`)
const backToBack = cued.match(/\][\s]*\[/g)?.length ?? 0
if (backToBack) warnings.push(`${backToBack} place(s) with two cues in a row. Merge them into one.`)
const added = cues.length - (original.match(/\[[^\]]*\]/g)?.length ?? 0)
if (b.length && added > Math.ceil(b.length / 20)) warnings.push(`${added} cues for ${b.length} words is dense (more than one per ~20 words). Keep only the ones that change delivery.`)

warnings.forEach(w => console.log(`WARN: ${w}`))
errors.forEach(e => console.error(`FAIL: ${e}`))
if (errors.length) process.exit(1)
console.log(`PASS: ${b.length} spoken words unchanged; ${cues.length} cues (${added} added).`)
