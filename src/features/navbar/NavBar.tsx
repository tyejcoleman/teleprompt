import { prompterConfig } from "../../config"
import { useRef, useState } from "react"
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import { startTeleprompter, stopTeleprompter, changeLanguage } from "../../app/thunks"
import {
  toggleEdit, flipHorizontally, setFontSize, setMargin, setScrollOffset,
  setLanguage, selectStatus, selectHorizontallyFlipped, selectFontSize,
  selectMargin, selectScrollOffset, selectLanguage, selectSpeechMessage, SUPPORTED_LOCALES,
} from "./navbarSlice"
import { resetTranscriptionIndices, setContent, selectRawText, selectMatchConfidence } from "../content/contentSlice"

export const NavBar = ({ onFloating, canFloat, onFullScreen }: { onFloating: () => void; canFloat: boolean; onFullScreen: () => void }) => {
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectStatus)
  const fontSize = useAppSelector(selectFontSize)
  const margin = useAppSelector(selectMargin)
  const scrollOffset = useAppSelector(selectScrollOffset)
  const mirrored = useAppSelector(selectHorizontallyFlipped)
  const language = useAppSelector(selectLanguage)
  const rawText = useAppSelector(selectRawText)
  const speechMessage = useAppSelector(selectSpeechMessage)
  const confidence = useAppSelector(selectMatchConfidence)
  const inputRef = useRef<HTMLInputElement>(null)
  const [notice, setNotice] = useState("")
  const [help, setHelp] = useState(false)
  const holding = status === "started" && confidence !== null && confidence < prompterConfig.tracking.minimumConfidence
  const label = status === "editing" ? "Editing script" : status === "started" ? confidence === null ? "Listening" : holding ? "Holding your place" : "Following your voice" : speechMessage

  const importFile = async (file: File) => {
    if (file.size > prompterConfig.reading.maxScriptBytes) { setNotice("Choose a smaller text script. See the configured script size limit."); return }
    try {
      const text = (await file.text()).replace(/^﻿/, "")
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
      <nav className="controls" aria-label="Teleprompter controls">
        <span className={`live-state ${status === "started" ? "is-live" : ""} ${holding ? "is-holding" : ""}`} role="status" title={speechMessage}><span className="state-dot" /><span className="live-label">{label}</span></span>
        <button className="quiet-button" disabled={status === "started"} onClick={() => { setNotice(""); dispatch(toggleEdit()) }}>{status === "editing" ? "Save script" : "Edit script"}</button>
        <button className="quiet-button" onClick={onFullScreen}>Full screen <kbd>F</kbd></button>
        <details className="settings"><summary className="quiet-button">Menu</summary><div className="settings-panel">
          <div className="menu-row">
            <button className="control-button" disabled={status !== "stopped"} onClick={() => inputRef.current?.click()}>Import .txt</button>
            <button className="control-button" onClick={exportScript}>Export script</button>
            <button className="control-button" disabled={status !== "stopped"} onClick={() => dispatch(resetTranscriptionIndices())}>Restart</button>
          </div>
          <label className="language-control">Language <select aria-label="Speech language" disabled={status !== "stopped"} value={language} onChange={e => { dispatch(setLanguage(e.currentTarget.value)); dispatch(changeLanguage(e.currentTarget.value)) }}>{Object.entries(SUPPORTED_LOCALES).map(([locale, label]) => <option key={locale} value={locale}>{label}</option>)}</select></label>
          <label>Text size <input aria-label="Text size" type="range" min="20" max="100" step="2" value={fontSize} onChange={e => dispatch(setFontSize(Number(e.currentTarget.value)))} /></label>
          <label>Side margin <input aria-label="Side margin" type="range" min="0" max="250" step="10" value={margin} onChange={e => dispatch(setMargin(Number(e.currentTarget.value)))} /></label>
          <label>Reading line <input aria-label="Reading position" type="range" min="0" max="240" step="10" value={scrollOffset} onChange={e => dispatch(setScrollOffset(Number(e.currentTarget.value)))} /></label>
          <div className="menu-row">
            <button className="control-button" aria-pressed={mirrored} onClick={() => dispatch(flipHorizontally())}>Mirror: {mirrored ? "on" : "off"}</button>
            <button className="control-button floating-button" onClick={onFloating} disabled={!canFloat} title={canFloat ? "Always-on-top reader in desktop Chrome" : "Requires desktop Chrome Document Picture-in-Picture support"}>Float reader ↗</button>
            <button className="control-button" aria-expanded={help} onClick={() => setHelp(!help)}>Help</button>
          </div>
          {help ? <div className="help-panel">Space starts or pauses. F toggles full screen. Arrows move; click any word to resume there. Put unspoken cues in [square brackets]. Float reader keeps the script on top while you record in QuickTime or OBS; keep this tab open. Recognition may use Chrome’s online service.</div> : null}
          <a className="subtle-link" href="/agent-handoff.txt" download>Agent setup guide ↓</a>
        </div></details>
        <input ref={inputRef} type="file" accept=".txt,text/plain" aria-label="Import script file" hidden onChange={e => { const file = e.currentTarget.files?.[0]; if (file) void importFile(file); e.currentTarget.value = "" }} />
        <button className="control-button start-button" disabled={status === "editing"} onClick={() => { setNotice(""); dispatch(status === "started" ? stopTeleprompter() : startTeleprompter()) }}>{status === "started" ? "Pause" : "Start listening"}</button>
      </nav>
      {notice ? <div className="notice" role="status">{notice}</div> : null}
    </header>
  )
}
