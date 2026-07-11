import './Toolbar.css'

function Toolbar() {
  return (
    <div className="toolbar-card" role="toolbar" aria-label="Formatting toolbar">
      <div className="toolbar-scroll">
        <select className="toolbar-select" aria-label="Block type" title="Block type">
          <option value="paragraph">Paragraph</option>
          <option value="heading1">Heading 1</option>
          <option value="heading2">Heading 2</option>
          <option value="heading3">Heading 3</option>
        </select>

        <div className="toolbar-separator" aria-hidden="true"></div>

        <button className="toolbar-btn" title="Bold (Ctrl+B)" aria-label="Bold"><b>B</b></button>
        <button className="toolbar-btn" title="Italic (Ctrl+I)" aria-label="Italic"><i>I</i></button>
        <button className="toolbar-btn" title="Inline code (Ctrl+E)" aria-label="Inline code">&lt;/&gt;</button>
        <button className="toolbar-btn" title="Highlight (Ctrl+H)" aria-label="Highlight">🖍️</button>
        <button className="toolbar-btn" title="Insert link (Ctrl+K)" aria-label="Insert link">🔗</button>

        <div className="toolbar-separator" aria-hidden="true"></div>

        <button className="toolbar-btn" title="Blockquote" aria-label="Blockquote">❝</button>
        <button className="toolbar-btn" title="Code block" aria-label="Code block">{'{ }'}</button>
        <button className="toolbar-btn" title="Checklist" aria-label="Insert checklist">☑️</button>
        <button className="toolbar-btn" title="Insert table" aria-label="Insert table">▦</button>

        <div className="toolbar-separator" aria-hidden="true"></div>

        <button className="toolbar-btn" title="Find & replace (Ctrl+F)" aria-label="Find and replace">🔍</button>
      </div>
    </div>
  )
}

export default Toolbar
