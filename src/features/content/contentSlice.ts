import type { PayloadAction } from "@reduxjs/toolkit"
import { createAppSlice } from "../../app/createAppSlice"
import { type TextElement, tokenize } from "../../lib/word-tokenizer"
import { toggleEdit } from "../navbar/navbarSlice"

export interface ContentSliceState {
  matchConfidence: number | null
  rawText: string
  textElements: TextElement[]
  finalTranscriptIndex: number
  interimTranscriptIndex: number
}

export const sampleText = `[Look at the camera.]
Welcome. This is a short test of your voice-following teleprompter.

As you speak, the words change color and the script follows your place.

[Pause. Next: explain the benefit.]
Keep your next point in view, so you can focus on speaking clearly.

Choose Edit script or Menu → Import .txt to load your own script.`
let initialText = sampleText
try { initialText = localStorage.getItem("teleprompter-script-v1") || sampleText } catch { /* Storage can be disabled. */ }

const initialState: ContentSliceState = {
  matchConfidence: null,
  rawText: initialText,
  textElements: tokenize(initialText),
  finalTranscriptIndex: -1,
  interimTranscriptIndex: -1,
}

export const contentSlice = createAppSlice({
  name: "content",

  // `createSlice` will infer the state type from the `initialState` argument
  initialState,

  // The `reducers` field lets us define reducers and generate associated actions
  reducers: create => ({
    setMatchConfidence: create.reducer((state, action: PayloadAction<number | null>) => {
      state.matchConfidence = action.payload
    }),

    setContent: create.reducer((state, action: PayloadAction<string>) => {
      state.matchConfidence = null
      state.rawText = action.payload
      state.textElements = tokenize(action.payload)
      state.finalTranscriptIndex = -1
      state.interimTranscriptIndex = -1
    }),

    setFinalTranscriptIndex: create.reducer(
      (state, action: PayloadAction<number>) => {
        state.finalTranscriptIndex = action.payload
      },
    ),

    setInterimTranscriptIndex: create.reducer(
      (state, action: PayloadAction<number>) => {
        state.interimTranscriptIndex = action.payload
      },
    ),

    resetTranscriptionIndices: create.reducer(state => {
      state.finalTranscriptIndex = -1
      state.interimTranscriptIndex = -1
    }),
  }),

  extraReducers: builder =>
    builder.addCase(toggleEdit, state => {
      state.textElements = tokenize(state.rawText)
    }),

  selectors: {
    selectMatchConfidence: state => state.matchConfidence,
    selectRawText: state => state.rawText,
    selectTextElements: state => state.textElements,
    selectFinalTranscriptIndex: state => state.finalTranscriptIndex,
    selectInterimTranscriptIndex: state => state.interimTranscriptIndex,
  },
})

export const {
  setContent,
  setMatchConfidence,
  setFinalTranscriptIndex,
  setInterimTranscriptIndex,
  resetTranscriptionIndices,
} = contentSlice.actions

export const {
  selectRawText,
  selectMatchConfidence,
  selectTextElements,
  selectFinalTranscriptIndex,
  selectInterimTranscriptIndex,
} = contentSlice.selectors
