import useUIStore from '../../store/useUIStore'
import './HelpModal.css'

function HelpModal() {
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)

  if (activeModal !== 'help') return null

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="helpTitle">
        <div className="modal-header">
          <h2 id="helpTitle">Keyboard Shortcuts</h2>
          <button className="icon-btn" onClick={closeModal} aria-label="Close">✖️</button>
        </div>
        <div className="modal-body">
          <dl className="shortcuts">
            <dt><kbd>Ctrl</kbd>+<kbd>N</kbd></dt><dd>New document</dd>
            <dt><kbd>Ctrl</kbd>+<kbd>B</kbd></dt><dd>Bold</dd>
            <dt><kbd>Ctrl</kbd>+<kbd>I</kbd></dt><dd>Italic</dd>
            <dt><kbd>Ctrl</kbd>+<kbd>E</kbd></dt><dd>Inline code</dd>
            <dt><kbd>Ctrl</kbd>+<kbd>K</kbd></dt><dd>Insert link</dd>
            <dt><kbd>Ctrl</kbd>+<kbd>F</kbd></dt><dd>Find & replace</dd>
            <dt><kbd>Ctrl</kbd>+<kbd>\</kbd></dt><dd>Focus mode</dd>
            <dt><kbd>Ctrl</kbd>+<kbd>,</kbd></dt><dd>Settings</dd>
            <dt><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd></dt><dd>Toggle documents sidebar</dd>
            <dt><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>L</kbd></dt><dd>Toggle outline sidebar</dd>
            <dt><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd></dt><dd>Toggle dark mode</dd>
            <dt><kbd>/</kbd></dt><dd>Slash menu (start of line)</dd>
            <dt><kbd>?</kbd></dt><dd>Show this help</dd>
            <dt><kbd>Esc</kbd></dt><dd>Close dialog / exit focus</dd>
          </dl>
          <h3 className="modal-subtitle">Markdown Shortcuts</h3>
          <dl className="shortcuts">
            <dt><code># </code></dt><dd>Heading 1</dd>
            <dt><code>## </code></dt><dd>Heading 2</dd>
            <dt><code>### </code></dt><dd>Heading 3</dd>
            <dt><code>&gt; </code></dt><dd>Blockquote</dd>
            <dt><code>- </code></dt><dd>Bullet list</dd>
            <dt><code>1. </code></dt><dd>Numbered list</dd>
            <dt><code>```</code></dt><dd>Code block</dd>
            <dt><code>- [ ] </code></dt><dd>Task item</dd>
          </dl>
        </div>
      </div>
    </div>
  )
}

export default HelpModal
