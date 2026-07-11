import { useMemo, useState, useEffect } from 'react'
import useDocStore from '../../store/useDocStore'
import useUIStore from '../../store/useUIStore'
import { formatBytes } from '../../utils/formatTime'
import './StatusBar.css'

function StatusBar() {
  const currentDoc = useDocStore((s) => s.currentDoc)
  const saveStatus = useDocStore((s) => s.saveStatus)
  const openModal = useUIStore((s) => s.openModal)
  const [quota, setQuota] = useState(null)

  const stats = useMemo(() => {
    const text = (currentDoc?.content || '').trim()
    if (!text) return { words: 0, chars: 0, readTime: 0 }
    const words = text.split(/\s+/).filter(Boolean).length
    return { words, chars: text.length, readTime: Math.max(1, Math.ceil(words / 200)) }
  }, [currentDoc?.content])

  // Update storage quota periodically
  useEffect(() => {
    async function check() {
      if (!navigator.storage?.estimate) return
      try {
        const { usage = 0, quota: q = 0 } = await navigator.storage.estimate()
        const pct = q ? (usage / q) * 100 : 0
        setQuota({ usage, quota: q, pct })
      } catch { /* ignore */ }
    }
    check()
    const interval = setInterval(check, 10000)
    return () => clearInterval(interval)
  }, [])

  const statusText = saveStatus === 'saving' ? 'Saving…' : saveStatus === 'error' ? 'Save failed' : 'Saved'
  const indicatorClass = `save-indicator ${saveStatus === 'saving' ? 'is-saving' : ''} ${saveStatus === 'error' ? 'is-error' : ''}`

  return (
    <div className="status-bar" role="status" aria-live="polite">
      <span className={indicatorClass}></span>
      <span>{statusText}</span>
      <span>Words: {stats.words} | Chars: {stats.chars}</span>
      <span>~{stats.readTime} min read</span>
      {quota && (
        <button
          className="quota-btn"
          onClick={() => openModal('settings')}
          title={`Storage: ${formatBytes(quota.usage)} / ${formatBytes(quota.quota)} (${quota.pct.toFixed(1)}%)`}
        >
          <svg className="quota-ring" viewBox="0 0 36 36" width="18" height="18">
            <circle className="quota-ring-bg" cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" strokeWidth="3" />
            <circle
              className="quota-ring-fg"
              cx="18" cy="18" r="15.9"
              fill="none"
              stroke={quota.pct > 80 ? 'var(--danger)' : 'var(--accent)'}
              strokeWidth="3"
              strokeDasharray={`${Math.min(100, quota.pct)} 100`}
              strokeLinecap="round"
              transform="rotate(-90 18 18)"
            />
          </svg>
          <span className="quota-label">{quota.pct < 0.1 ? '<0.1' : quota.pct.toFixed(0)}%</span>
        </button>
      )}
    </div>
  )
}

export default StatusBar
