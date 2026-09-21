declare global {
  interface SpeechRecognitionResultEvent extends Event {
    results: {
      [index: number]: {
        [index: number]: { transcript: string; confidence: number }
        isFinal: boolean
        length: number
      }
      length: number
    }
  }

  interface SpeechRecognition extends EventTarget {
    lang: string
    interimResults: boolean
    maxAlternatives: number
    start(): void
    stop(): void
    abort(): void
    onresult: ((event: SpeechRecognitionResultEvent) => void) | null
    onend: (() => void) | null
    onerror: ((event: Event) => void) | null
  }

  interface Window {
    SpeechRecognition?: { new (): SpeechRecognition }
    webkitSpeechRecognition?: { new (): SpeechRecognition }
  }
}

export {}
