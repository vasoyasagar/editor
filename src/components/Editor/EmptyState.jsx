import './EmptyState.css'

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">📝</div>
      <h2 className="empty-state-title">Start writing</h2>
      <p className="empty-state-sub">
        Your work auto-saves to your browser. No account, no cloud.
      </p>
      <ul className="empty-state-tips">
        <li><kbd>Ctrl</kbd>+<kbd>N</kbd> New doc</li>
        <li><kbd>Ctrl</kbd>+<kbd>K</kbd> Link</li>
        <li><kbd>/</kbd> Slash menu</li>
        <li><kbd>Ctrl</kbd>+<kbd>\</kbd> Focus mode</li>
        <li><kbd>?</kbd> All shortcuts</li>
      </ul>
      <p className="empty-state-hint">
        Tip: Markdown shortcuts work too — <code># </code> <code>## </code> <code>&gt; </code> <code>- </code> <code>```</code>
      </p>
    </div>
  )
}

export default EmptyState
