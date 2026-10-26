import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { performance } from "node:perf_hooks"
import { JSDOM } from "jsdom"
import React, { act } from "react"
import { createRoot } from "react-dom/client"

async function main() {
  const dom = new JSDOM('<head><style>:root { --accent: #a4efd5; }</style></head><body><div id="root"></div></body>', { url: "http://localhost:5173" })
  Object.defineProperty(globalThis, "window", { value: dom.window })
  Object.defineProperty(globalThis, "document", { value: dom.window.document })
  Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator })
  Object.defineProperty(globalThis, "localStorage", { value: dom.window.localStorage })
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  ;(dom.window.HTMLElement.prototype as any).scrollTo = () => {}
  class MockRecognition {
    static latest: MockRecognition
    starts = 0
    onstart?: () => void
    onend?: () => void
    onerror?: (event: { error: string }) => void
    onresult?: (event: any) => void
    constructor() { MockRecognition.latest = this }
    start() { this.starts++; this.onstart?.() }
    stop() { this.onend?.() }
  }
  ;(globalThis as any).webkitSpeechRecognition = MockRecognition
  const { store } = await import("../src/app/store")
  const { setContent } = await import("../src/features/content/contentSlice")
  const { tokenize } = await import("../src/lib/word-tokenizer")
  const { matchSpeech } = await import("../src/lib/speech-matcher")
  const { startTeleprompter, stopTeleprompter } = await import("../src/app/thunks")
  const fixtures = JSON.parse(readFileSync("checks/fixtures/tracking.json", "utf8"))
  for (const fixture of fixtures) {
    const elements = tokenize(fixture.script), words = elements.filter(t => t.type === "TOKEN")
    const baseline = fixture.confirmedWords ? words[fixture.confirmedWords - 1].index : -1
    const result = matchSpeech(fixture.speech, elements, baseline)
    assert.equal(words.filter(w => w.index <= result.index).length, fixture.expectedReadWords, fixture.name)
  }
  const longScript = tokenize(Array.from({ length: 10_000 }, (_, i) => `section${i}`).join(" "))
  const phrase = Array.from({ length: 20 }, (_, i) => `section${i}`).join(" ")
  const begin = performance.now()
  for (let i = 0; i < 100; i++) matchSpeech(phrase, longScript, -1)
  const averageMs = (performance.now() - begin) / 100
  assert(averageMs < 100, `Local matcher unexpectedly slow: ${averageMs}ms`)
  console.log(`PASS: ${fixtures.length} tracking fixtures; local matching averaged ${averageMs.toFixed(2)} ms on a 10,000-word script (not end-to-end microphone latency).`)

  const script = "Hello world.\n[Pause.] This is our next point."
  store.dispatch(setContent(script))
  assert.equal(store.getState().content.textElements.map(t => t.value).join(""), script)
  assert.equal(localStorage.getItem("teleprompter-script-v1"), script)
  assert.equal(tokenize("Hello [unfinished cue").map(t => t.value).join(""), "Hello [unfinished cue")
  assert(!tokenize(script).filter(t => t.type === "TOKEN").some(t => t.value === "Pause"))
  store.dispatch(startTeleprompter())
  const recognition = MockRecognition.latest
  const transcript = (text: string, isFinal: boolean) => Object.assign([{ transcript: text }], { isFinal })
  recognition.onresult?.({ resultIndex: 0, results: [transcript("Hello", false)] })
  assert.equal(store.getState().content.interimTranscriptIndex, 0, "first word must update")
  recognition.onresult?.({ resultIndex: 0, results: [transcript("Hello world", false)] })
  assert.equal(store.getState().content.interimTranscriptIndex, 2)
  assert.equal(store.getState().content.finalTranscriptIndex, -1, "do not wait for finalization")
  recognition.onresult?.({ resultIndex: 0, results: [transcript("Hello world", true), transcript("This is", false)] })
  const isWordIndex = tokenize(script).find(t => t.value === "is")!.index
  assert.equal(store.getState().content.finalTranscriptIndex, 2)
  assert.equal(store.getState().content.interimTranscriptIndex, isWordIndex, "partial must align after the final in the same event")
  recognition.onresult?.({ resultIndex: 0, results: [transcript("purple elephants juggle umbrellas", false)] })
  assert.equal(store.getState().content.interimTranscriptIndex, isWordIndex, "off script must hold place")
  assert.match(store.getState().navbar.speechMessage, /Holding/)
  recognition.onerror?.({ error: "not-allowed" })
  assert.equal(store.getState().navbar.status, "stopped")
  assert.match(store.getState().navbar.speechMessage, /denied/)
  assert.equal(recognition.starts, 1, "denial must not restart in a loop")
  delete (globalThis as any).webkitSpeechRecognition
  store.dispatch(startTeleprompter())
  assert.equal(store.getState().navbar.status, "stopped")
  assert.match(store.getState().navbar.speechMessage, /unavailable/)
  store.dispatch(stopTeleprompter())
  console.log("PASS: interim speech, final/partial handoff, off-script hold, persistence, cue parsing, permission errors, and unsupported-browser fallback.")

  const pip = new JSDOM('<html><head></head><body></body></html>', { url: "http://localhost:5173" })
  ;(pip.window.HTMLElement.prototype as any).scrollTo = () => {}
  const destroyPip = pip.window.close.bind(pip.window)
  ;(pip.window as any).close = () => pip.window.dispatchEvent(new pip.window.Event("pagehide"))
  ;(dom.window as any).documentPictureInPicture = { requestWindow: async () => pip.window }
  const { Provider } = await import("react-redux")
  const { default: App } = await import("../src/App")
  const root = createRoot(document.getElementById("root")!)
  await act(async () => { root.render(React.createElement(Provider, { store, children: React.createElement(App) })) })
  const buttons = () => [...document.querySelectorAll("button")]
  await act(async () => { buttons().find(b => b.textContent === "Edit script")!.click() })
  assert(document.querySelector('textarea[aria-label="Script"]'))
  await act(async () => { buttons().find(b => b.textContent === "Save script")!.click() })
  assert(!document.querySelector("textarea"))
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
  Object.defineProperty(fileInput, "files", { configurable: true, value: [{ name: "agent-script.txt", size: 80, text: async () => "A new agent script. [Pause.] The next point." }] })
  await act(async () => { fileInput.dispatchEvent(new dom.window.Event("change", { bubbles: true })); await Promise.resolve() })
  assert.equal(store.getState().content.rawText, "A new agent script. [Pause.] The next point.")
  assert.match(document.body.textContent!, /Loaded agent-script.txt/)
  assert.match(document.querySelector("main")!.textContent!, /A new agent script/)
  assert(document.querySelector(".speaker-cue"))
  await act(async () => { window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { code: "KeyF", bubbles: true })) })
  assert(document.querySelector(".app.is-focused"))
  await act(async () => { window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { code: "KeyF", bubbles: true })) })
  await act(async () => { buttons().find(b => b.textContent === "Float reader ↗")!.click(); await Promise.resolve() })
  assert(pip.window.document.querySelector("main"), "floating window must contain the reader")
  assert(pip.window.document.querySelector("style"), "floating window must receive styles")
  assert(!document.querySelector("main"), "reader must move rather than duplicate")
  await act(async () => { document.querySelector("style")!.textContent = ":root { --accent: #abcdef; }"; await Promise.resolve() })
  assert.match(pip.window.document.querySelector("style")!.textContent!, /abcdef/, "live visual feedback must update floating-window styles too")
  await act(async () => { pip.window.dispatchEvent(new pip.window.KeyboardEvent("keydown", { code: "ArrowRight", bubbles: true })) })
  assert(store.getState().content.finalTranscriptIndex >= 0, "floating window keyboard controls must work")
  await act(async () => { [...pip.window.document.querySelectorAll("button")].find(b => b.textContent === "Return ↗")!.click() })
  assert(document.querySelector("main"), "closing floating window must restore reader")
  assert(document.querySelector('[aria-current="step"]'), "current word must be visually identified")
  const storedScript = localStorage.getItem("teleprompter-script-v1")
  await act(async () => { root.unmount() })
  assert.equal(localStorage.getItem("teleprompter-script-v1"), storedScript, "UI remount must preserve script")
  destroyPip(); dom.window.close()
  console.log("PASS: editor, .txt import, focus mode, current-word visuals, floating-window portal/style transfer, keyboard navigation, and return flow (simulated DOM; not a real Chrome PiP test).")
}
main().catch(error => { console.error(error); process.exitCode = 1 })
