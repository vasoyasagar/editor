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

const COMMANDS = [
  { id: 'h1', icon: 'H1', label: 'Heading 1', command: wrapInHeadingCommand, payload: 1 },
  { id: 'h2', icon: 'H2', label: 'Heading 2', command: wrapInHeadingCommand, payload: 2 },
  { id: 'h3', icon: 'H3', label: 'Heading 3', command: wrapInHeadingCommand, payload: 3 },
  { id: 'p', icon: '¶', label: 'Paragraph', command: turnIntoTextCommand },
  { id: 'quote', icon: '❝', label: 'Blockquote', command: wrapInBlockquoteCommand },
  { id: 'code', icon: '{}', label: 'Code Block', command: createCodeBlockCommand },
  { id: 'ul', icon: '•', label: 'Bullet List', command: wrapInBulletListCommand },
  { id: 'ol', icon: '1.', label: 'Numbered List', command: wrapInOrderedListCommand },
  { id: 'table', icon: '▦', label: 'Table', command: insertTableCommand },
  { id: 'hr', icon: '—', label: 'Divider', command: insertHrCommand },
]

function SlashMenu() {
  const { getInstance, loading } = useEditorCtx()
  const [visible, setVisible] = useState(false)
  const [query, setQuery] = useState('')
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [activeIndex, setActiveIndex] = useState(0)
  const menuRef = useRef(null)

  const filtered = COMMANDS.filter((cmd) =>
    cmd.id.includes(query.toLowerCase()) || cmd.label.toLowerCase().includes(query.toLowerCase())
  )

  const runCommand = useCallback((cmd) => {
    if (loading) return
    const editor = getInstance()
    if (!editor) return

    // Remove the slash trigger text first
    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const { state } = view
      const { from } = state.selection
      // Find the slash character and delete from there to cursor
      const text = state.doc.textBetween(Math.max(0, from - 20), from)
      const slashIdx = text.lastIndexOf('/')
      if (slashIdx >= 0) {
        const deleteFrom = from - (text.length - slashIdx)
        view.dispatch(state.tr.delete(deleteFrom, from))
      }
    })

    // Run the command
    editor.action(callCommand(cmd.command.key, cmd.payload))
    setVisible(false)
    setQuery('')
  }, [loading, getInstance])

  useEffect(() => {
    if (loading) return
    const editor = getInstance()
    if (!editor) return

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

  if (!visible || !filtered.length) return null

  return (
    <div
      className="slash-menu"
      ref={menuRef}
      style={{ top: position.top, left: position.left }}
      role="listbox"
      aria-label="Slash commands"
    >
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
        </div>
      ))}
    </div>
  )
}

export default SlashMenu
