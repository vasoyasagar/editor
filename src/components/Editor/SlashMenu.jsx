import { useState, useEffect, useRef, useCallback } from 'react'
import { callCommand } from '@milkdown/kit/utils'
import { editorViewCtx } from '@milkdown/kit/core'
import {
  wrapInHeadingCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  createCodeBlockCommand,
  insertHrCommand,
  turnIntoTextCommand,
} from '@milkdown/kit/preset/commonmark'
import { insertTableCommand } from '@milkdown/kit/preset/gfm'
import { useEditorCtx } from './EditorContext'
import './SlashMenu.css'

function getToday() {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function getNow() {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

// Commands that use Milkdown's built-in command system
const MILKDOWN_COMMANDS = [
  { id: 'h1', icon: 'H1', label: 'Heading 1', category: 'block', command: wrapInHeadingCommand, payload: 1 },
  { id: 'h2', icon: 'H2', label: 'Heading 2', category: 'block', command: wrapInHeadingCommand, payload: 2 },
  { id: 'h3', icon: 'H3', label: 'Heading 3', category: 'block', command: wrapInHeadingCommand, payload: 3 },
  { id: 'paragraph', icon: '¶', label: 'Paragraph', category: 'block', command: turnIntoTextCommand },
  { id: 'quote', icon: '❝', label: 'Blockquote', category: 'block', command: wrapInBlockquoteCommand },
  { id: 'bullet', icon: '•', label: 'Bullet List', category: 'block', command: wrapInBulletListCommand },
  { id: 'numbered', icon: '1.', label: 'Numbered List', category: 'block', command: wrapInOrderedListCommand },
  { id: 'table', icon: '▦', label: 'Table', category: 'insert', command: insertTableCommand },
  { id: 'hr', icon: '—', label: 'Horizontal Rule', category: 'insert', command: insertHrCommand },
  { id: 'codeblock', icon: '{}', label: 'Code Block', category: 'block', command: createCodeBlockCommand },
]

// Commands that insert raw text
const TEXT_COMMANDS = [
  {
    id: 'date',
    icon: '📅',
    label: "Today's Date",
    category: 'insert',
    text: () => getToday(),
  },
  {
    id: 'datetime',
    icon: '🕐',
    label: 'Date + Time',
    category: 'insert',
    text: () => getNow(),
  },
  {
    id: 'note',
    icon: 'ℹ️',
    label: 'Callout: Note',
    category: 'insert',
    text: () => '\n> [!NOTE]\n> Your note here\n\n',
  },
  {
    id: 'warning',
    icon: '⚠️',
    label: 'Callout: Warning',
    category: 'insert',
    text: () => '\n> [!WARNING]\n> Warning message here\n\n',
  },
  {
    id: 'tip',
    icon: '💡',
    label: 'Callout: Tip',
    category: 'insert',
    text: () => '\n> [!TIP]\n> Helpful tip here\n\n',
  },
  {
    id: 'codejs',
    icon: '📝',
    label: 'Code: JavaScript',
    category: 'insert',
    text: () => '\n```js\n\n```\n\n',
  },
  {
    id: 'codepy',
    icon: '🐍',
    label: 'Code: Python',
    category: 'insert',
    text: () => '\n```python\n\n```\n\n',
  },
  {
    id: 'codesql',
    icon: '🗄️',
    label: 'Code: SQL',
    category: 'insert',
    text: () => '\n```sql\n\n```\n\n',
  },
  {
    id: 'math',
    icon: '∑',
    label: 'Math Block',
    category: 'insert',
    text: () => '\n$$\nE = mc^2\n$$\n\n',
  },
  {
    id: 'mermaid',
    icon: '📊',
    label: 'Mermaid Diagram',
    category: 'insert',
    text: () => '\n```mermaid\ngraph TD\n    A[Start] --> B[End]\n```\n\n',
  },
  {
    id: 'details',
    icon: '▶️',
    label: 'Collapsible Section',
    category: 'insert',
    text: () => '\n<details>\n<summary>Click to expand</summary>\n\nHidden content here\n\n</details>\n\n',
  },
  {
    id: 'footnote',
    icon: '📌',
    label: 'Footnote',
    category: 'insert',
    text: () => '[^1]\n\n[^1]: Footnote text here',
  },
]

const ALL_COMMANDS = [...MILKDOWN_COMMANDS, ...TEXT_COMMANDS]

function SlashMenu() {
  const { getInstance, loading } = useEditorCtx()
  const [visible, setVisible] = useState(false)
  const [query, setQuery] = useState('')
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [activeIndex, setActiveIndex] = useState(0)
  const menuRef = useRef(null)

  const filtered = ALL_COMMANDS.filter((cmd) =>
    cmd.id.includes(query.toLowerCase()) || cmd.label.toLowerCase().includes(query.toLowerCase())
  )

  const insertText = useCallback((textFn) => {
    if (loading) return
    const editor = getInstance()
    if (!editor) return

    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const { state } = view
      const { from } = state.selection
      const text = textFn()
      const tr = state.tr.insertText(text, from)
      view.dispatch(tr)
      view.focus()
    })
  }, [loading, getInstance])

  const runCommand = useCallback((cmd) => {
    if (loading) return
    const editor = getInstance()
    if (!editor) return

    // Remove the slash trigger text first
    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const { state } = view
      const { from } = state.selection
      const text = state.doc.textBetween(Math.max(0, from - 20), from)
      const slashIdx = text.lastIndexOf('/')
      if (slashIdx >= 0) {
        const deleteFrom = from - (text.length - slashIdx)
        view.dispatch(state.tr.delete(deleteFrom, from))
      }
    })

    // If it's a text command, insert text; otherwise use Milkdown command
    if (cmd.text) {
      insertText(cmd.text)
    } else {
      editor.action(callCommand(cmd.command.key, cmd.payload))
    }

    setVisible(false)
    setQuery('')
  }, [loading, getInstance, insertText])

  useEffect(() => {
    if (loading) return

    const handleKeyDown = (e) => {
      if (!visible) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % filtered.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        if (filtered[activeIndex]) runCommand(filtered[activeIndex])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setVisible(false)
        setQuery('')
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [loading, visible, filtered, activeIndex, runCommand])

  // Listen for slash trigger in the editor
  useEffect(() => {
    if (loading) return
    const editor = getInstance()
    if (!editor) return

    let view = null
    try {
      editor.action((ctx) => {
        view = ctx.get(editorViewCtx)
      })
    } catch { return }
    if (!view) return

    const dom = view.dom

    const handleInput = () => {
      const { state } = view
      const { from } = state.selection
      const textBefore = state.doc.textBetween(Math.max(0, from - 20), from)
      const match = textBefore.match(/(?:^|\s)\/([\w]*)$/)

      if (match) {
        setQuery(match[1])
        setActiveIndex(0)

        // Position the menu near cursor
        const coords = view.coordsAtPos(from)
        const editorRect = dom.closest('.editor-card')?.getBoundingClientRect() || dom.getBoundingClientRect()
        setPosition({
          top: coords.bottom - editorRect.top + 8,
          left: coords.left - editorRect.left,
        })
        setVisible(true)
      } else {
        if (visible) {
          setVisible(false)
          setQuery('')
        }
      }
    }

    dom.addEventListener('input', handleInput)
    dom.addEventListener('keyup', handleInput)

    return () => {
      dom.removeEventListener('input', handleInput)
      dom.removeEventListener('keyup', handleInput)
    }
  }, [loading, visible])

  // Scroll active item into view
  useEffect(() => {
    if (!visible || !menuRef.current) return
    const active = menuRef.current.querySelector('.is-active')
    if (active) active.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, visible])

  if (!visible || !filtered.length) return null

  return (
    <div
      className="slash-menu"
      ref={menuRef}
      style={{ top: position.top, left: position.left }}
      role="listbox"
      aria-label="Slash commands"
    >
      <div className="slash-menu-header">
        Type to filter · <kbd>↑↓</kbd> navigate · <kbd>Enter</kbd> select
      </div>
      {filtered.map((cmd, i) => (
        <div
          key={cmd.id}
          className={`slash-item ${i === activeIndex ? 'is-active' : ''}`}
          role="option"
          aria-selected={i === activeIndex}
          onMouseDown={(e) => {
            e.preventDefault()
            runCommand(cmd)
          }}
          onMouseEnter={() => setActiveIndex(i)}
        >
          <span className="slash-item-icon">{cmd.icon}</span>
          <span className="slash-item-label">{cmd.label}</span>
          <span className="slash-item-category">{cmd.category}</span>
        </div>
      ))}
    </div>
  )
}

export default SlashMenu
