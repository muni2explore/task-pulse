import { useEffect, useRef, useState } from 'react'
import { useToastStore } from '../store/useToastStore'

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const wasOffline = useRef(false)
  const pushToast = useToastStore((s) => s.push)

  useEffect(() => {
    function goOnline() {
      setOnline(true)
      if (wasOffline.current) {
        pushToast({ message: 'Back online' })
        wasOffline.current = false
      }
    }
    function goOffline() {
      setOnline(false)
      wasOffline.current = true
    }

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [pushToast])

  return online
}
