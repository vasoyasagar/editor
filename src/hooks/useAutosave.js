import { useEffect, useRef } from 'react'

/**
 * Debounced autosave hook.
 * Calls `saveFn` after `delay`ms of inactivity when `content` changes.
 */
export default function useAutosave(content, saveFn, delay = 400) {
  const timerRef = useRef(null)
  const saveFnRef = useRef(saveFn)
  saveFnRef.current = saveFn

  useEffect(() => {
    if (content === null || content === undefined) return

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      saveFnRef.current(content)
    }, delay)

    return () => clearTimeout(timerRef.current)
  }, [content, delay])

  // Flush on unmount
  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])
}
