import { useMemo } from 'react'
import useDocStore from '../../store/useDocStore'
import './StatusBar.css'

function StatusBar() {
  const currentDoc = useDocStore((s) => s.currentDoc)
  const saveStatus = useDocStore((s) => s.saveStatus)

  const stats = useMemo(() => {
    const text = (currentDoc?.content || '').trim()
    if (!text) return { words: 0, chars: 0, readTime: 0 }
    const words = text.split(/\s+/).filter(Boolean).length
    return { words, chars: text.length, readTime: Math.max(1, Math.ceil(words / 200)) }
  }, [currentDoc?.content])

  const statusText = saveStatus === 'saving' ? 'Saving…' : saveStatus === 'error' ? 'Save failed' : 'Saved'
  const indicatorClass = `save-indicator ${saveStatus === 'saving' ? 'is-saving' : ''} ${saveStatus === 'error' ? 'is-error' : ''}`

  return (
    <div className="status-bar" role="status" aria-live="polite">
      <span className={indicatorClass}></span>
      <span>{statusText}</span>
      <span>Words: {stats.words} | Chars: {stats.chars}</span>
      <span>~{stats.readTime} min read</span>
    </div>
  )
}

export default StatusBar
