import type { AppThunk } from "./store"
import { start, stop, setSpeechMessage } from "../features/navbar/navbarSlice"
import {
  setFinalTranscriptIndex,
  setInterimTranscriptIndex,
  setMatchConfidence,
} from "../features/content/contentSlice"
import SpeechRecognizer from "../lib/speech-recognizer"
import { matchSpeech } from "../lib/speech-matcher"

let speechRecognizer: SpeechRecognizer | null = null

export const startTeleprompter = (): AppThunk => (dispatch, getState) => {
  if (speechRecognizer) speechRecognizer.stop()
  dispatch(setMatchConfidence(null))
  dispatch(start())
  dispatch(setSpeechMessage("Connecting to microphone… Allow access if Chrome asks."))

  const { language } = getState().navbar
  speechRecognizer = new SpeechRecognizer(language)

  if (!speechRecognizer.getIsSupported()) {
    dispatch(stop())
    dispatch(setSpeechMessage("Voice recognition is unavailable in this browser. Open in desktop Chrome; click words or use arrows to navigate manually."))
    return
  }

  speechRecognizer.onresult(
    (final_transcript: string, interim_transcript: string) => {
      const { textElements, finalTranscriptIndex, interimTranscriptIndex } = getState().content
      let baseline = finalTranscriptIndex
      let match
      if (final_transcript.trim()) {
        match = matchSpeech(final_transcript, textElements, baseline, interimTranscriptIndex)
        baseline = match.index
        dispatch(setFinalTranscriptIndex(baseline))
        dispatch(setInterimTranscriptIndex(match.matched ? baseline : Math.max(baseline, interimTranscriptIndex)))
      }
      if (interim_transcript.trim()) {
        match = matchSpeech(interim_transcript, textElements, baseline, interimTranscriptIndex)
        dispatch(setInterimTranscriptIndex(match.matched ? match.index : Math.max(baseline, interimTranscriptIndex)))
      }
      if (match) {
        dispatch(setMatchConfidence(match.confidence))
        const heard = (interim_transcript || final_transcript).slice(-150)
        dispatch(setSpeechMessage(`${match.matched ? "Following" : "Holding your place"} · ${heard}`))
      }
    },
  )

  speechRecognizer.onstart(() => dispatch(setSpeechMessage("Listening · Read your script aloud to test the response time.")))
  speechRecognizer.onerror(message => {
    dispatch(stopTeleprompter())
    dispatch(setSpeechMessage(message))
  })
  try { speechRecognizer.start() } catch {
    dispatch(stopTeleprompter())
    dispatch(setSpeechMessage("Could not start recognition. Check microphone access and try again."))
  }
}

export const stopTeleprompter = (): AppThunk => dispatch => {
  if (speechRecognizer !== null) {
    speechRecognizer.stop()
    speechRecognizer = null
  }

  dispatch(stop())
  dispatch(setSpeechMessage("Paused. Click a word to choose your place, or start listening to resume."))
}

export const changeLanguage = (language: string): AppThunk => () => {
  if (speechRecognizer !== null) {
    speechRecognizer.setLanguage(language)
  }
}
