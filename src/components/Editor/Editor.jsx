import './Editor.css'

function Editor() {
  return (
    <div className="markdown-editor" aria-label="Markdown editor">
      <div className="editor-placeholder">
        <div className="placeholder-icon">📝</div>
        <h2>Markdown Editor</h2>
        <p>Phase A complete — Milkdown editor will be integrated in Phase B.</p>
        <p className="placeholder-hint">
          Start typing Markdown here. Use <code>#</code> for headings, <code>**bold**</code>, <code>*italic*</code>, <code>- [ ]</code> for tasks.
        </p>
      </div>
    </div>
  )
}

export default Editor
