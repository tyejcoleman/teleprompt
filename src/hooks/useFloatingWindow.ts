import { useCallback, useEffect, useRef, useState } from "react"
import { prompterConfig } from "../config"

type PictureInPictureAPI = { requestWindow: (options: { width: number; height: number }) => Promise<Window> }
export function useFloatingWindow() {
  const [floatingWindow, setFloatingWindow] = useState<Window | null>(null)
  const [floatingError, setFloatingError] = useState("")
  const windowRef = useRef<Window | null>(null)
  const observerRef = useRef<MutationObserver | null>(null)
  const api = (window as Window & { documentPictureInPicture?: PictureInPictureAPI }).documentPictureInPicture
  const openFloating = useCallback(async () => {
    if (!api) { setFloatingError("Floating view needs desktop Chrome with Document Picture-in-Picture support. Use Focus view instead."); return }
    if (windowRef.current && !windowRef.current.closed) { windowRef.current.focus(); return }
    try {
      const pip = await api.requestWindow({ width: prompterConfig.reading.floatingWidth, height: prompterConfig.reading.floatingHeight })
      pip.document.title = "Voice Follow · Prompter"
      pip.document.body.className = "floating-body"
      const syncStyles = () => {
        pip.document.head.querySelectorAll("[data-prompter-style]").forEach(style => style.remove())
        document.querySelectorAll('style, link[rel="stylesheet"]').forEach(style => {
          const clone = style.cloneNode(true) as HTMLElement
          clone.setAttribute("data-prompter-style", "")
          pip.document.head.appendChild(clone)
        })
      }
      syncStyles()
      observerRef.current?.disconnect()
      const observer = new window.MutationObserver(syncStyles)
      observer.observe(document.head, { subtree: true, childList: true, attributes: true, characterData: true })
      observerRef.current = observer
      windowRef.current = pip
      pip.addEventListener("pagehide", () => { observer.disconnect(); windowRef.current = null; setFloatingWindow(null) }, { once: true })
      setFloatingError("")
      setFloatingWindow(pip)
    } catch {
      setFloatingError("Chrome could not open the floating reader. Click Floating view again, or use Focus view.")
    }
  }, [api])
  const closeFloating = useCallback(() => { windowRef.current?.close(); windowRef.current = null; setFloatingWindow(null) }, [])
  useEffect(() => () => { observerRef.current?.disconnect(); windowRef.current?.close() }, [])
  return { floatingWindow, floatingError, openFloating, closeFloating, canFloat: Boolean(api) }
}
