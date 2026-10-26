import { useEffect } from "react"
import { useAppDispatch } from "../app/hooks"
import { store } from "../app/store"
import { startTeleprompter, stopTeleprompter } from "../app/thunks"
import { setFinalTranscriptIndex, setInterimTranscriptIndex } from "../features/content/contentSlice"

export function useReaderKeys(floatingWindow: Window | null, toggleFocus: () => void) {
  const dispatch = useAppDispatch()
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (event.metaKey || event.ctrlKey || event.altKey || target?.closest?.("input, textarea, select, [contenteditable=true]")) return
      const { navbar: { status }, content } = store.getState()
      if (status === "editing") return
      if (event.code === "Space" && target?.closest?.("button, summary, a")) return
      if (event.code === "Escape") { dispatch(stopTeleprompter()); return }
      if (event.code === "KeyF") { event.preventDefault(); toggleFocus(); return }
      if (event.code === "Space") {
        event.preventDefault()
        dispatch(status === "started" ? stopTeleprompter() : startTeleprompter())
        return
      }
      const steps: Record<string, number> = { ArrowLeft: -5, ArrowRight: 5, ArrowUp: -15, ArrowDown: 15 }
      const step = steps[event.code]
      if (step === undefined) return
      event.preventDefault()
      const current = Math.max(content.finalTranscriptIndex, content.interimTranscriptIndex)
      const index = Math.max(-1, Math.min(content.textElements.length - 1, current + step))
      dispatch(setFinalTranscriptIndex(index)); dispatch(setInterimTranscriptIndex(index))
    }
    const windows = floatingWindow ? [window, floatingWindow] : [window]
    windows.forEach(w => w.addEventListener("keydown", handleKey))
    return () => windows.forEach(w => w.removeEventListener("keydown", handleKey))
  }, [dispatch, floatingWindow, toggleFocus])
}
