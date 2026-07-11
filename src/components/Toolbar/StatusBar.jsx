import './StatusBar.css'

function StatusBar() {
  return (
    <div className="status-bar" role="status" aria-live="polite">
      <span className="save-indicator"></span>
      <span>Auto-saved</span>
      <span>Words: 0 | Chars: 0</span>
      <span>~0 min read</span>
    </div>
  )
}

export default StatusBar
