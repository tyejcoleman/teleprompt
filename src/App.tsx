import { useCallback, useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { NavBar } from "./features/navbar/NavBar"
import { Content } from "./features/content/Content"
import { useAppDispatch, useAppSelector } from "./app/hooks"
import { selectStatus } from "./features/navbar/navbarSlice"
import { selectTextElements, selectFinalTranscriptIndex, selectInterimTranscriptIndex } from "./features/content/contentSlice"
import { startTeleprompter, stopTeleprompter } from "./app/thunks"
import { useFloatingWindow } from "./hooks/useFloatingWindow"
import { useReaderKeys } from "./hooks/useReaderKeys"
import { useAgentScript } from "./hooks/useAgentScript"

const App = () => {
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectStatus)
  const elements = useAppSelector(selectTextElements)
  const finalIndex = useAppSelector(selectFinalTranscriptIndex)
  const interimIndex = useAppSelector(selectInterimTranscriptIndex)
  const currentIndex = Math.max(finalIndex, interimIndex)
  const [focused, setFocused] = useState(false)
  // Focus view uses real full screen where the browser allows it, so the reading line is the top edge of the display.
  const toggleFocus = useCallback(() => {
    if (!document.fullscreenEnabled) { setFocused(value => !value); return }
    if (document.fullscreenElement) void document.exitFullscreen()
    else document.documentElement.requestFullscreen().catch(() => setFocused(value => !value))
  }, [])
  useEffect(() => {
    const sync = () => setFocused(Boolean(document.fullscreenElement))
    // Chrome exits real full screen on Esc itself; this covers the no-full-screen fallback.
    const escape = (event: KeyboardEvent) => { if (event.code === "Escape" && !document.fullscreenElement) setFocused(false) }
    document.addEventListener("fullscreenchange", sync)
    window.addEventListener("keydown", escape)
    return () => { document.removeEventListener("fullscreenchange", sync); window.removeEventListener("keydown", escape) }
  }, [])
  const floating = useFloatingWindow()
  const agentScript = useAgentScript()
  useReaderKeys(floating.floatingWindow, toggleFocus)
  const words = useMemo(() => elements.filter(t => t.type === "TOKEN"), [elements])
  const read = words.filter(t => t.index <= currentIndex).length
  const percent = words.length ? Math.round(read / words.length * 100) : 0
  const progress = <div className="progress-line" role="progressbar" aria-label="Script progress" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${percent}%` }} /></div>
  const reader = <section className={`reading-shell ${floating.floatingWindow ? "is-floating" : ""}`} aria-label="Teleprompter">
    {floating.floatingWindow ? <div className="floating-controls">{progress}<button className="mini-button" disabled={status === "editing"} onClick={() => dispatch(status === "started" ? stopTeleprompter() : startTeleprompter())}>{status === "started" ? "Pause" : "Start"}</button><button className="mini-button" onClick={floating.closeFloating}>Return ↗</button></div> : null}
    <Content compact={Boolean(floating.floatingWindow)} />
  </section>
  return <div className={`app ${focused ? "is-focused" : ""} ${status === "started" ? "is-listening" : ""}`}>
    {progress}
    <NavBar onFloating={() => void floating.openFloating()} canFloat={floating.canFloat} onFullScreen={toggleFocus} />
    {(focused || status === "started") && !floating.floatingWindow ? <div className={`dock ${status === "started" ? "" : "is-paused"}`} role="toolbar" aria-label="Reading controls">
      <button className="dock-button dock-primary" disabled={status === "editing"} onClick={() => dispatch(status === "started" ? stopTeleprompter() : startTeleprompter())}>{status === "started" ? "Pause" : "Start listening"} <kbd>Space</kbd></button>
      {focused ? <button className="dock-button" onClick={toggleFocus}>Exit full screen <kbd>Esc</kbd></button> : null}
    </div> : null}
    {agentScript.pending && status === "stopped" ? <div className="agent-script" role="status">Your agent set up a new script. <button className="control-button start-button" onClick={agentScript.load}>Load it</button><button className="quiet-button" onClick={agentScript.dismiss}>Keep current</button></div> : null}
    {floating.floatingError ? <div className="notice" role="status">{floating.floatingError}</div> : null}
    {floating.floatingWindow ? <div className="floating-placeholder"><span className="floating-icon">↗</span><h2>Your prompter is floating.</h2><p>Place it near your camera, then switch to your recording app.<br />Keep this tab open so the microphone stays connected.</p><button className="control-button" onClick={floating.closeFloating}>Bring reader back</button>{createPortal(reader, floating.floatingWindow.document.body)}</div> : reader}
  </div>
}
export default App
