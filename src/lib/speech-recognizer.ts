type SubscriberFunction = (
  final_transcript: string,
  interim_transcript: string,
) => void

export default class SpeechRecognizer {
  private recognizer: SpeechRecognition | null = null
  private subscribers: SubscriberFunction[] = []
  private shouldListen: boolean = false
  private errorHandler: (message: string) => void = () => {}
  private startHandler: () => void = () => {}

  constructor(language: string = "en-US") {
    // Feature-detect the Web Speech API: constructing the recognizer throws
    // a ReferenceError in browsers that do not implement it (e.g. Firefox).
    const SpeechRecognitionCtor: typeof SpeechRecognition | undefined =
      typeof SpeechRecognition !== "undefined"
        ? SpeechRecognition
        : typeof webkitSpeechRecognition !== "undefined"
          ? webkitSpeechRecognition
          : undefined

    if (SpeechRecognitionCtor === undefined) {
      return
    }

    const recognizer = new SpeechRecognitionCtor()
    this.recognizer = recognizer

    recognizer.lang = language
    recognizer.continuous = true
    recognizer.interimResults = true

    recognizer.onresult = e => {
      let final_transcript = ""
      let interim_transcript = ""

      for (let i = e.resultIndex; i < e.results.length; ++i) {
        const result = e.results[i]
        const transcript = result[0].transcript

        if (result.isFinal) {
          final_transcript += (final_transcript ? " " : "") + transcript
        } else {
          interim_transcript += (interim_transcript ? " " : "") + transcript
        }
      }

      for (let subscriber of this.subscribers) {
        subscriber(final_transcript, interim_transcript)
      }
    }

    recognizer.onstart = () => this.startHandler()
    recognizer.onerror = event => {
      if (event.error === "no-speech" || event.error === "aborted") return
      this.shouldListen = false
      const messages: Record<string, string> = {
        "not-allowed": "Microphone access was denied. Allow it in Chrome site settings, then try again.",
        "service-not-allowed": "Speech recognition is unavailable. Try desktop Chrome with its recognition service enabled.",
        "audio-capture": "No microphone is available. Connect or select a microphone, then try again.",
        "network": "Speech recognition could not connect. Check your connection, then try again.",
      }
      this.errorHandler(messages[event.error] || `Speech recognition stopped: ${event.error}. Try again.`)
    }
    recognizer.onend = () => {
      if (this.shouldListen) {
        try { recognizer.start() } catch {
          this.shouldListen = false
          this.errorHandler("Could not restart recognition. Press Start listening to retry.")
        }
      }
    }
  }

  start(): void {
    if (this.recognizer === null) {
      return
    }
    this.shouldListen = true
    this.recognizer.start()
  }

  stop(): void {
    if (this.recognizer === null) {
      return
    }
    this.shouldListen = false
    this.recognizer.stop()
  }

  onresult(subscriber: SubscriberFunction): void {
    this.subscribers.push(subscriber)
  }

  onerror(handler: (message: string) => void): void { this.errorHandler = handler }
  onstart(handler: () => void): void { this.startHandler = handler }

  setLanguage(language: string): void {
    if (this.recognizer === null) {
      return
    }
    const wasListening = this.shouldListen
    if (wasListening) {
      this.stop()
    }
    this.recognizer.lang = language
    if (wasListening) {
      this.start()
    }
  }

  getIsSupported(): boolean {
    return this.recognizer !== null
  }
}
