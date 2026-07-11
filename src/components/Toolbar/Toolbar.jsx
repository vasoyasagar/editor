import { useCallback } from 'react'
import { callCommand } from '@milkdown/kit/utils'
import {
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  wrapInBlockquoteCommand,
  createCodeBlockCommand,
  wrapInHeadingCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  turnIntoTextCommand,
  insertHrCommand,
} from '@milkdown/kit/preset/commonmark'
import { toggleStrikethroughCommand, insertTableCommand } from '@milkdown/kit/preset/gfm'
import { useEditorCtx } from '../Editor/EditorContext'
import useUIStore from '../../store/useUIStore'
import './Toolbar.css'

function Toolbar() {
  const { getInstance, loading } = useEditorCtx()
  const toggleFindPanel = useUIStore((s) => s.toggleFindPanel)

  const call = useCallback((command, payload) => {
    if (loading) return
    const editor = getInstance()
    if (!editor) return
    editor.action(callCommand(command, payload))
  }, [loading, getInstance])

  return (
    <div className="toolbar-card" role="toolbar" aria-label="Formatting toolbar">
      <div className="toolbar-scroll">
        <select
          className="toolbar-select"
          aria-label="Block type"
          title="Block type"
          onChange={(e) => {
            const v = e.target.value
            if (v === 'paragraph') call(turnIntoTextCommand.key)
            else if (v === 'heading1') call(wrapInHeadingCommand.key, 1)
            else if (v === 'heading2') call(wrapInHeadingCommand.key, 2)
            else if (v === 'heading3') call(wrapInHeadingCommand.key, 3)
          }}
          defaultValue="paragraph"
        >
          <option value="paragraph">Paragraph</option>
          <option value="heading1">Heading 1</option>
          <option value="heading2">Heading 2</option>
          <option value="heading3">Heading 3</option>
        </select>

        <div className="toolbar-separator" aria-hidden="true"></div>

        <button className="toolbar-btn" title="Bold (Ctrl+B)" aria-label="Bold" onClick={() => call(toggleStrongCommand.key)}>
          <b>B</b>
        </button>
        <button className="toolbar-btn" title="Italic (Ctrl+I)" aria-label="Italic" onClick={() => call(toggleEmphasisCommand.key)}>
          <i>I</i>
        </button>
        <button className="toolbar-btn" title="Strikethrough" aria-label="Strikethrough" onClick={() => call(toggleStrikethroughCommand.key)}>
          <s>S</s>
        </button>
        <button className="toolbar-btn" title="Inline code (Ctrl+E)" aria-label="Inline code" onClick={() => call(toggleInlineCodeCommand.key)}>
          &lt;/&gt;
        </button>

        <div className="toolbar-separator" aria-hidden="true"></div>

        <button className="toolbar-btn" title="Blockquote" aria-label="Blockquote" onClick={() => call(wrapInBlockquoteCommand.key)}>
          ❝
        </button>
        <button className="toolbar-btn" title="Code block" aria-label="Code block" onClick={() => call(createCodeBlockCommand.key)}>
          {'{ }'}
        </button>
        <button className="toolbar-btn" title="Bullet list" aria-label="Bullet list" onClick={() => call(wrapInBulletListCommand.key)}>
          •
        </button>
        <button className="toolbar-btn" title="Ordered list" aria-label="Ordered list" onClick={() => call(wrapInOrderedListCommand.key)}>
          1.
        </button>
        <button className="toolbar-btn" title="Insert table" aria-label="Insert table" onClick={() => call(insertTableCommand.key)}>
          ▦
        </button>
        <button className="toolbar-btn" title="Horizontal rule" aria-label="Horizontal rule" onClick={() => call(insertHrCommand.key)}>
          —
        </button>

        <div className="toolbar-separator" aria-hidden="true"></div>

        <button className="toolbar-btn" title="Find & replace (Ctrl+F)" aria-label="Find and replace" onClick={() => toggleFindPanel(true)}>
          🔍
        </button>
      </div>
    </div>
  )
}

export default Toolbar
