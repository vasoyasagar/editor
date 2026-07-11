import { useState, useEffect, useRef, useCallback } from 'react'
import { callCommand } from '@milkdown/kit/utils'
import { editorViewCtx, parserCtx } from '@milkdown/kit/core'
import {
  createCodeBlockCommand,
  insertHrCommand,
} from '@milkdown/kit/preset/commonmark'
import { useEditorCtx } from './EditorContext'
import './SlashMenu.css'

function getToday() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function getNow() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const MILKDOWN_COMMANDS = [
  { id: 'hr', icon: '—', label: 'Horizontal Rule', category: 'insert', command: insertHrCommand },
  { id: 'codeblock', icon: '{}', label: 'Code Block', category: 'block', command: createCodeBlockCommand },
]

const TEXT_COMMANDS = [
  { id: 'date', icon: '📅', label: "Today's Date", category: 'insert', text: () => getToday() },
  { id: 'datetime', icon: '🕐', label: 'Date + Time', category: 'insert', text: () => getNow() },
  { id: 'code', icon: '📝', label: 'Code Block (```)', category: 'insert', text: () => '\n```\n\n```\n' },
  {
    id: 'table',
    icon: '▦',
    label: 'Table',
    category: 'insert',
    text: () => {
      const input = prompt('Table size (rows x cols):', '3x3')
      if (!input) return null
      const match = input.match(/(\d+)\s*[xX×,]\s*(\d+)/)
      const rows = match ? Math.min(20, Math.max(1, parseInt(match[1]))) : 3
      const cols = match ? Math.min(10, Math.max(1, parseInt(match[2]))) : 3
      const header = '| ' + Array.from({ length: cols }, (_, i) => `Col ${i + 1}`).join(' | ') + ' |'
      const sep = '| ' + Array.from({ length: cols }, () => '---').join(' | ') + ' |'
      const row = '| ' + Array.from({ length: cols }, () => '   ').join(' | ') + ' |'
      const bodyRows = Array.from({ length: rows }, () => row).join('\n')
      return `\n${header}\n${sep}\n${bodyRows}\n\n`
    },
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
  const visibleRef = useRef(false)
  const activeIndexRef = useRef(0)
  const filteredRef = useRef(ALL_COMMANDS)

  // Keep refs in sync with state
  visibleRef.current = visible
  activeIndexRef.current = activeIndex

  const filtered = ALL_COMMANDS.filter((cmd) =>
    cmd.id.includes(query.toLowerCase()) || cmd.label.toLowerCase().includes(query.toLowerCase())
  )
  filteredRef.current = filtered

  const runCommand = useCallback((cmd) => {
    if (loading) return
    const editor = getInstance()
    if (!editor) return

    // Remove the slash trigger text first
    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const { state } = view
      const { from } = state.selection
      const text = state.doc.textBetween(Math.max(0, from - 20), from, '\n', '\n')
      const slashIdx = text.lastIndexOf('/')
      if (slashIdx >= 0) {
        const charsToDelete = text.length - slashIdx
        view.dispatch(state.tr.delete(from - charsToDelete, from))
      }
    })

    // If it's a text command, parse as Markdown; otherwise use Milkdown command
    if (cmd.text) {
      const markdown = cmd.text()
      if (!markdown) { setVisible(false); setQuery(''); return }
      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        const parser = ctx.get(parserCtx)
        const { state } = view
        const { from } = state.selection
        const doc = parser(markdown)
        if (doc) {
          view.dispatch(state.tr.replaceWith(from, from, doc.content))
        }
        view.focus()
      })
    } else {
      editor.action(callCommand(cmd.command.key, cmd.payload))
    }

    setVisible(false)
    setQuery('')
  }, [loading, getInstance])

  // Single persistent keydown handler on the editor DOM element
  useEffect(() => {
    if (loading) return
    const editor = getInstance()
    if (!editor) return

    let dom = null
    try {
      editor.action((ctx) => { dom = ctx.get(editorViewCtx).dom })
    } catch { return }
    if (!dom) return

    const handleKeyDown = (e) => {
      if (!visibleRef.current) return
      const list = filteredRef.current

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        setActiveIndex((i) => (i + 1) % list.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        setActiveIndex((i) => (i - 1 + list.length) % list.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        const cmd = list[activeIndexRef.current]
        if (cmd) runCommand(cmd)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        setVisible(false)
        setQuery('')
      }
    }

    // Attach directly to the editor DOM element in capture phase
    dom.addEventListener('keydown', handleKeyDown, true)
    return () => dom.removeEventListener('keydown', handleKeyDown, true)
  }, [loading, runCommand])

  // Listen for slash trigger — re-attaches whenever loading changes
  useEffect(() => {
    if (loading) return
    const editor = getInstance()
    if (!editor) return

    let view = null
    try {
      editor.action((ctx) => { view = ctx.get(editorViewCtx) })
    } catch { return }
    if (!view) return

    const dom = view.dom

    const checkSlash = () => {
      try {
        const { state } = view
        const { from } = state.selection
        // Use '\n' as block separator so "/" at start of paragraph is detected
        const textBefore = state.doc.textBetween(Math.max(0, from - 20), from, '\n', '\n')
        const match = textBefore.match(/(?:^|[\s\n])\/([\w]*)$/)

        if (match) {
          setQuery(match[1])
          setActiveIndex(0)
          const coords = view.coordsAtPos(from)
          const editorRect = dom.closest('.editor-card')?.getBoundingClientRect() || dom.getBoundingClientRect()
          setPosition({
            top: coords.bottom - editorRect.top + 8,
            left: coords.left - editorRect.left,
          })
          setVisible(true)
        } else if (visibleRef.current) {
          setVisible(false)
          setQuery('')
        }
      } catch { /* view may be destroyed */ }
    }

    dom.addEventListener('input', checkSlash)
    return () => {
      dom.removeEventListener('input', checkSlash)
    }
  }, [loading])

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
