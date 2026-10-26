import { useLayoutEffect, useRef } from "react"
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import { setContent, setFinalTranscriptIndex, setInterimTranscriptIndex, selectRawText, selectTextElements, selectFinalTranscriptIndex, selectInterimTranscriptIndex } from "./contentSlice"
import { selectStatus, selectHorizontallyFlipped, selectVerticallyFlipped, selectFontSize, selectMargin, selectOpacity, selectScrollOffset } from "../navbar/navbarSlice"

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
  const currentIndex = Math.max(finalIndex, interimIndex)
  let currentWordIndex = -1
  for (const element of elements) {
    if (element.index > currentIndex) break
    if (element.type === "TOKEN") currentWordIndex = element.index
  }
  const containerRef = useRef<HTMLDivElement>(null)
  const currentRef = useRef<HTMLSpanElement>(null)
  const lastLine = useRef(-1)

  useLayoutEffect(() => {
    const container = containerRef.current, current = currentRef.current
    if (!container) return
    if (currentIndex < 0) { container.scrollTo({ top: 0, behavior: "auto" }); lastLine.current = -1; return }
    if (!current) return
    const line = current.offsetTop
    if (line === lastLine.current) return
    lastLine.current = line
    const ownerWindow = container.ownerDocument.defaultView
    const reducedMotion = ownerWindow?.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    container.scrollTo({ top: Math.max(0, line - Math.min(scrollOffset, container.clientHeight * 0.35)), behavior: reducedMotion ? "auto" : "smooth" })
  }, [currentIndex, scrollOffset, fontSize, margin, status])

  const style = { fontSize: `${compact ? Math.round(fontSize * 0.76) : fontSize}px`, paddingInline: `min(${margin}px, 8vw)` }
  return (
    <main className={`content-area ${status === "editing" ? "is-editing" : ""}`}>
      {status === "editing" ? <textarea className="script-editor" aria-label="Script" spellCheck={false} style={style} value={rawText} onChange={e => dispatch(setContent(e.target.value))} placeholder="Paste your script here. Put unspoken cues in [square brackets]." /> : (
        <div className="reader-content" ref={containerRef} tabIndex={0} aria-label="Script reader. Click a word to resume there, or use arrow keys." style={{ ...style, opacity: opacity / 100, transform: `scale(${mirrored ? -1 : 1}, ${flipped ? -1 : 1})` }}>
          {elements.length ? elements.map(element => {
            const isCurrent = element.type === "TOKEN" && element.index === currentWordIndex
            return <span key={element.index} ref={isCurrent ? currentRef : undefined} aria-current={isCurrent ? "step" : undefined} className={isCurrent ? "word-current" : element.index < currentIndex ? "word-spoken" : "word-upcoming"} onClick={() => { dispatch(setFinalTranscriptIndex(element.index - 1)); dispatch(setInterimTranscriptIndex(element.index - 1)); lastLine.current = -1 }}>
              {element.type === "DELIMITER" ? element.value.split(/(\[[^\]]*\])/g).map((part, i) => part.startsWith("[") && part.endsWith("]") ? <span className="speaker-cue" key={i}>{part.slice(1, -1)}</span> : part) : element.value}
            </span>
          }) : <span className="empty-script">Your script goes here.<br /><small>Choose Edit script or Import .txt to get started.</small></span>}
          <div className="reader-spacer" aria-hidden="true" />
        </div>
      )}
    </main>
  )
}
