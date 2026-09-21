import { useEffect, useRef, useState } from 'react'

function getRecognitionCtor(): { new (): SpeechRecognition } | undefined {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition
}

export function useVoiceInput(onResult: (transcript: string) => void) {
  const [listening, setListening] = useState(false)
  const [supported] = useState(() => Boolean(getRecognitionCtor()))
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const onResultRef = useRef(onResult)

  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  useEffect(() => {
    return () => recognitionRef.current?.stop()
  }, [])

  function start() {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return

    const recognition = new Ctor()
    recognition.lang = navigator.language || 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim()
      if (transcript) onResultRef.current(transcript)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  function stop() {
    recognitionRef.current?.stop()
  }

  return { start, stop, listening, supported }
}
