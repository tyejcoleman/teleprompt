import { prompterConfig } from "./config"
import { useCallback, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { NavBar } from "./features/navbar/NavBar"
import { Content } from "./features/content/Content"
import { useAppDispatch, useAppSelector } from "./app/hooks"
import { selectSpeechMessage, selectStatus } from "./features/navbar/navbarSlice"
import { selectTextElements, selectFinalTranscriptIndex, selectInterimTranscriptIndex, selectMatchConfidence } from "./features/content/contentSlice"
import { startTeleprompter, stopTeleprompter } from "./app/thunks"
import { useFloatingWindow } from "./hooks/useFloatingWindow"
import { useReaderKeys } from "./hooks/useReaderKeys"

const App = () => {
  const dispatch = useAppDispatch()
  const speechMessage = useAppSelector(selectSpeechMessage)
  const status = useAppSelector(selectStatus)
  const confidence = useAppSelector(selectMatchConfidence)
  const elements = useAppSelector(selectTextElements)
  const finalIndex = useAppSelector(selectFinalTranscriptIndex)
  const interimIndex = useAppSelector(selectInterimTranscriptIndex)
  const currentIndex = Math.max(finalIndex, interimIndex)
  const [focused, setFocused] = useState(false)
  const toggleFocus = useCallback(() => setFocused(value => !value), [])
  const floating = useFloatingWindow()
  useReaderKeys(floating.floatingWindow, toggleFocus)
  const words = useMemo(() => elements.filter(t => t.type === "TOKEN"), [elements])
  const read = words.filter(t => t.index <= currentIndex).length
  const percent = words.length ? Math.round(read / words.length * 100) : 0
  const label = status === "editing" ? "Editing script" : status === "started" ? confidence === null ? "Listening" : confidence >= prompterConfig.tracking.minimumConfidence ? "Following your voice" : "Holding your place" : "Ready when you are"
  const reader = <section className={`reading-shell ${floating.floatingWindow ? "is-floating" : ""}`} aria-label="Teleprompter">
    <div className="reading-top"><span className={`live-state ${status === "started" ? "is-live" : ""} ${confidence !== null && confidence < prompterConfig.tracking.minimumConfidence ? "is-holding" : ""}`}><span className="state-dot" />{label}</span><span className="reading-counter">{read} / {words.length} words</span>
      {focused && !floating.floatingWindow ? <button className="mini-button" disabled={status === "editing"} onClick={() => dispatch(status === "started" ? stopTeleprompter() : startTeleprompter())}>{status === "started" ? "Pause" : "Start"}</button> : null}
      {floating.floatingWindow ? <><button className="mini-button" disabled={status === "editing"} onClick={() => dispatch(status === "started" ? stopTeleprompter() : startTeleprompter())}>{status === "started" ? "Pause" : "Start"}</button><button className="mini-button" onClick={floating.closeFloating}>Return ↗</button></> : <button className="mini-button" aria-pressed={focused} onClick={toggleFocus}>{focused ? "Exit focus" : "Focus view"} <kbd>F</kbd></button>}
    </div>
    <Content compact={Boolean(floating.floatingWindow)} />
    <div className="reading-bottom"><div className="progress-track" role="progressbar" aria-label="Script progress" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${percent}%` }} /></div><span>{percent}%</span><span className="reader-hint">Click a word to find your place</span></div>
  </section>
  return <div className={`app ${focused ? "is-focused" : ""}`}>
    <NavBar onFloating={() => void floating.openFloating()} canFloat={floating.canFloat} />
    <div className="workspace">
      <div className="workspace-intro"><div><span className="eyebrow">YOUR VOICE. YOUR PACE.</span><h1>Stay in the flow.</h1></div><p>Read naturally. Pause when you need to.<br />Your next words stay right in front of you.</p></div>
      {floating.floatingError ? <div className="notice" role="status">{floating.floatingError}</div> : null}
      {floating.floatingWindow ? <div className="floating-placeholder"><span className="floating-icon">↗</span><h2>Your prompter is floating.</h2><p>Place it near your camera, then switch to your recording app.<br />Keep this tab open so the microphone stays connected.</p><button className="control-button" onClick={floating.closeFloating}>Bring reader back</button>{createPortal(reader, floating.floatingWindow.document.body)}</div> : reader}
      <div className="speech-status" role="status" aria-live="off"><span className="speech-label">MICROPHONE</span><span>{speechMessage}</span></div>
    </div>
    <footer className="app-footer"><span>Record separately in QuickTime, OBS, or your preferred app.</span><span>Space: listen / pause <span aria-hidden="true">·</span> Arrows: move <span aria-hidden="true">·</span> Esc: stop</span><a href="https://github.com/jlecomte/voice-activated-teleprompter" target="_blank" rel="noreferrer">Built on open source ↗</a></footer>
  </div>
}
export default App
