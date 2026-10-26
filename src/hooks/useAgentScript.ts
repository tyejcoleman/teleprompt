import { useCallback, useEffect, useState } from "react"
import { useAppDispatch } from "../app/hooks"
import { store } from "../app/store"
import { sampleText, setContent } from "../features/content/contentSlice"

/** A setup agent copies the user's script here (gitignored). See AGENTS.md. */
export const AGENT_SCRIPT_URL = "/local/script.txt"
const LAST_KEY = "teleprompter-agent-script-v1"
const remember = (text: string) => { try { localStorage.setItem(LAST_KEY, text) } catch { /* Storage may be disabled. */ } }

/**
 * Loads a script the agent dropped in. It replaces the sample directly, but never
 * overwrites a different script the user already has: that waits for their click.
 */
export function useAgentScript() {
  const dispatch = useAppDispatch()
  const [pending, setPending] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch(AGENT_SCRIPT_URL, { cache: "no-store" })
      .then(response => response.ok && response.headers.get("content-type")?.startsWith("text/plain") ? response.text() : null)
      .then(raw => {
        const text = raw?.replace(/^﻿/, "")
        if (cancelled || !text?.trim()) return
        let last: string | null = null
        try { last = localStorage.getItem(LAST_KEY) } catch { /* Storage may be disabled. */ }
        if (text === last) return
        const current = store.getState().content.rawText
        if (current === text || current === sampleText || !current.trim()) { dispatch(setContent(text)); remember(text); return }
        setPending(text)
      })
      .catch(() => { /* No agent script: nothing to do. */ })
    return () => { cancelled = true }
  }, [dispatch])
  const load = useCallback(() => { if (pending === null) return; dispatch(setContent(pending)); remember(pending); setPending(null) }, [dispatch, pending])
  const dismiss = useCallback(() => { if (pending !== null) remember(pending); setPending(null) }, [pending])
  return { pending: pending !== null, load, dismiss }
}
