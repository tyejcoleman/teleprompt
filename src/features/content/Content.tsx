import { memo, useLayoutEffect, useMemo, useRef, type RefObject } from "react"
import { prompterConfig } from "../../config"
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import { setContent, setFinalTranscriptIndex, setInterimTranscriptIndex, selectRawText, selectTextElements, selectFinalTranscriptIndex, selectInterimTranscriptIndex } from "./contentSlice"
import { selectStatus, selectHorizontallyFlipped, selectVerticallyFlipped, selectFontSize, selectMargin, selectOpacity, selectScrollOffset } from "../navbar/navbarSlice"
import type { TextElement } from "../../lib/word-tokenizer"

/** Sentence number per element. A cue belongs to the sentence it introduces. */
function sentenceIds(elements: TextElement[]) {
  let sentence = 0
  return elements.map(element => {
    if (element.type !== "DELIMITER") return sentence
    if (element.value.includes("[")) return ++sentence
    if (/[.!?\n]/.test(element.value)) return sentence++
    return sentence
  })
}

const tiers = ["is-past", "is-now", "is-next", "is-later"]
const tierOf = (sentence: number, current: number) => sentence < current ? 0 : sentence === current ? 1 : sentence === current + 1 ? 2 : 3

type WordProps = { element: TextElement; className: string; isCurrent: boolean; currentRef: RefObject<HTMLSpanElement | null>; onPick: (index: number) => void }
const Word = memo(({ element, className, isCurrent, currentRef, onPick }: WordProps) =>
  <span ref={isCurrent ? currentRef : undefined} aria-current={isCurrent ? "step" : undefined} className={className} onClick={() => onPick(element.index)}>
    {element.type === "DELIMITER" ? element.value.split(/(\[[^\]]*\])/g).map((part, i) => part.startsWith("[") && part.endsWith("]") ? <span className="speaker-cue" key={i}>{part.slice(1, -1)}</span> : part) : element.value}
  </span>)

export const Content = ({ compact = false }: { compact?: boolean }) => {
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectStatus)
  const fontSize = useAppSelector(selectFontSize)
  const margin = useAppSelector(selectMargin)
  const opacity = useAppSelector(selectOpacity)
  const scrollOffset = useAppSelector(selectScrollOffset)
  const mirrored = useAppSelector(selectHorizontallyFlipped)
  const flipped = useAppSelector(selectVerticallyFlipped)
  const rawText = useAppSelector(selectRawText)
  const elements = useAppSelector(selectTextElements)
  const finalIndex = useAppSelector(selectFinalTranscriptIndex)
  const interimIndex = useAppSelector(selectInterimTranscriptIndex)
  const heardIndex = Math.max(finalIndex, interimIndex)
  const sentences = useMemo(() => sentenceIds(elements), [elements])
  // Recognition reports a word after it is spoken, so the highlight leads to the word to say next.
  const lead = prompterConfig.tracking.highlightNextWord
  let currentWordIndex = -1
  for (const element of elements) {
    if (element.type !== "TOKEN") continue
    currentWordIndex = element.index
    if (lead ? element.index > heardIndex : element.index >= heardIndex) break
  }
  const currentSentence = currentWordIndex >= 0 ? sentences[currentWordIndex] : 0
  const containerRef = useRef<HTMLDivElement>(null)
  const currentRef = useRef<HTMLSpanElement>(null)
  const lastLine = useRef(-1)
  const pick = useMemo(() => (index: number) => { dispatch(setFinalTranscriptIndex(index - 1)); dispatch(setInterimTranscriptIndex(index - 1)); lastLine.current = -1 }, [dispatch])

  useLayoutEffect(() => {
    const container = containerRef.current, current = currentRef.current
    if (!container) return
    if (heardIndex < 0) { container.scrollTo({ top: 0, behavior: "auto" }); lastLine.current = -1; return }
    if (!current) return
    const line = current.offsetTop
    if (line === lastLine.current) return
    lastLine.current = line
    const ownerWindow = container.ownerDocument.defaultView
    const reducedMotion = ownerWindow?.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    container.scrollTo({ top: Math.max(0, line - Math.min(scrollOffset, container.clientHeight * 0.35)), behavior: reducedMotion ? "auto" : "smooth" })
  }, [heardIndex, currentWordIndex, scrollOffset, fontSize, margin, status])

  const style = { fontSize: `${compact ? Math.round(fontSize * 0.76) : fontSize}px`, paddingInline: `max(min(${margin}px, 6vw), calc((100% - ${prompterConfig.reading.columnWidth}px) / 2))`, paddingTop: `${scrollOffset}px` }
  return (
    <main className={`content-area ${status === "editing" ? "is-editing" : ""}`}>
      {status === "editing" ? <textarea className="script-editor" aria-label="Script" spellCheck={false} style={style} value={rawText} onChange={e => dispatch(setContent(e.target.value))} placeholder="Paste your script here. Put unspoken cues in [square brackets]." /> : (
        <div className="reader-content" ref={containerRef} tabIndex={0} aria-label="Script reader. Click a word to resume there, or use arrow keys." style={{ ...style, opacity: opacity / 100, transform: `scale(${mirrored ? -1 : 1}, ${flipped ? -1 : 1})` }}>
          {elements.length ? elements.map((element, i) => {
            const isCurrent = element.index === currentWordIndex
            const state = isCurrent ? "word-current" : element.index < currentWordIndex ? "word-spoken" : "word-upcoming"
            return <Word key={element.index} element={element} isCurrent={isCurrent} currentRef={currentRef} onPick={pick} className={`${state} ${tiers[tierOf(sentences[i], currentSentence)]}`} />
          }) : <span className="empty-script">Your script goes here.<br /><small>Choose Edit script or Import .txt to get started.</small></span>}
          <div className="reader-spacer" aria-hidden="true" />
        </div>
      )}
    </main>
  )
}
