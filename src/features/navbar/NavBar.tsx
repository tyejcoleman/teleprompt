import { prompterConfig } from "../../config"
import { useRef, useState } from "react"
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import { startTeleprompter, stopTeleprompter, changeLanguage } from "../../app/thunks"
import {
  toggleEdit, flipHorizontally, setFontSize, setMargin, setScrollOffset,
  setLanguage, selectStatus, selectHorizontallyFlipped, selectFontSize,
  selectMargin, selectScrollOffset, selectLanguage, SUPPORTED_LOCALES,
} from "./navbarSlice"
import { resetTranscriptionIndices, setContent, selectRawText } from "../content/contentSlice"

export const NavBar = ({ onFloating, canFloat }: { onFloating: () => void; canFloat: boolean }) => {
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectStatus)
  const fontSize = useAppSelector(selectFontSize)
  const margin = useAppSelector(selectMargin)
  const scrollOffset = useAppSelector(selectScrollOffset)
  const mirrored = useAppSelector(selectHorizontallyFlipped)
  const language = useAppSelector(selectLanguage)
  const rawText = useAppSelector(selectRawText)
  const inputRef = useRef<HTMLInputElement>(null)
  const [notice, setNotice] = useState("")
  const [help, setHelp] = useState(false)

  const importFile = async (file: File) => {
    if (file.size > prompterConfig.reading.maxScriptBytes) { setNotice("Choose a smaller text script. See the configured script size limit."); return }
    try {
      const text = (await file.text()).replace(/^\uFEFF/, "")
      if (!text.trim()) throw new Error("This script is empty.")
      dispatch(setContent(text))
      setNotice(`Loaded ${file.name}. Ready to read.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not read this file.")
    }
  }

  const exportScript = () => {
    const url = URL.createObjectURL(new Blob([rawText], { type: "text/plain;charset=utf-8" }))
    const a = document.createElement("a")
    a.href = url; a.download = "teleprompter-script.txt"; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <header className="prompter-header">
      <div className="top-row">
        <div className="brand"><span className="brand-dot" aria-hidden="true" />Voice Follow <span className="brand-sub">STUDIO</span></div>
        <span className="browser-note">Voice-following teleprompter · No API key</span>
        <a className="subtle-link" href="/agent-handoff.txt" download>Agent setup guide ↓</a>
      </div>
      <nav className="controls" aria-label="Teleprompter controls">
        <button className="control-button" disabled={status === "started"} onClick={() => dispatch(toggleEdit())}>{status === "editing" ? "Save script" : "Edit script"}</button>
        <button className="control-button" disabled={status !== "stopped"} onClick={() => inputRef.current?.click()}>Import .txt</button>
        <input ref={inputRef} type="file" accept=".txt,text/plain" aria-label="Import script file" hidden onChange={e => { const file = e.currentTarget.files?.[0]; if (file) void importFile(file); e.currentTarget.value = "" }} />
        <button className="control-button" onClick={exportScript}>Export script</button>
        <label className="language-control"><span className="sr-only">Speech language</span><select aria-label="Speech language" disabled={status !== "stopped"} value={language} onChange={e => { dispatch(setLanguage(e.currentTarget.value)); dispatch(changeLanguage(e.currentTarget.value)) }}>{Object.entries(SUPPORTED_LOCALES).map(([locale, label]) => <option key={locale} value={locale}>{label}</option>)}</select></label>
        <details className="settings"><summary>Reading settings</summary><div className="settings-panel">
          <label>Text size <input aria-label="Text size" type="range" min="20" max="100" step="2" value={fontSize} onChange={e => dispatch(setFontSize(Number(e.currentTarget.value)))} /></label>
          <label>Side margin <input aria-label="Side margin" type="range" min="0" max="250" step="10" value={margin} onChange={e => dispatch(setMargin(Number(e.currentTarget.value)))} /></label>
          <label>Reading position <input aria-label="Reading position" type="range" min="20" max="240" step="10" value={scrollOffset} onChange={e => dispatch(setScrollOffset(Number(e.currentTarget.value)))} /></label>
          <button className="control-button" aria-pressed={mirrored} onClick={() => dispatch(flipHorizontally())}>Mirror text: {mirrored ? "on" : "off"}</button>
        </div></details>
        <button className="control-button" disabled={status !== "stopped"} onClick={() => dispatch(resetTranscriptionIndices())}>Restart</button>
        <button className="control-button floating-button" onClick={onFloating} disabled={!canFloat} title={canFloat ? "Always-on-top reader in desktop Chrome" : "Requires desktop Chrome Document Picture-in-Picture support"}>Float reader ↗</button>
        <button className="control-button start-button" disabled={status === "editing"} onClick={() => dispatch(status === "started" ? stopTeleprompter() : startTeleprompter())}>{status === "started" ? "Pause listening" : "Start listening"}</button>
        <button className="help-button" aria-expanded={help} onClick={() => setHelp(!help)}>Help</button>
      </nav>
      {notice ? <div className="notice" role="status">{notice}</div> : null}
      {help ? <div className="help-panel">Import a .txt script or choose Edit script, then Save script. Select your speech language and Start listening. Allow microphone access. Text follows interim speech results. Click any word to resume there; use arrow keys to move, Space to start or pause, and Escape to stop. Put unspoken cues in [square brackets]. Use Float reader to keep the script near your camera while recording separately in QuickTime or OBS. Keep the original tab open. Recognition may use your browser provider’s online service. Actual response time depends on your microphone, browser, and connection.</div> : null}
    </header>
  )
}
