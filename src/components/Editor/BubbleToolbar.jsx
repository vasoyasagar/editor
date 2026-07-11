import { useState, useEffect, useRef, useCallback } from 'react'
import { editorViewCtx } from '@milkdown/kit/core'
import { callCommand } from '@milkdown/kit/utils'
import {
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
} from '@milkdown/kit/preset/commonmark'
import { toggleStrikethroughCommand } from '@milkdown/kit/preset/gfm'
import { useEditorCtx } from './EditorContext'
import useUIStore from '../../store/useUIStore'
import './BubbleToolbar.css'

function BubbleToolbar() {
  const { getInstance, loading } = useEditorCtx()
  const activeModal = useUIStore((s) => s.activeModal)
  const openModal = useUIStore((s) => s.openModal)
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const bubbleRef = useRef(null)

  const call = useCallback((command) => {
    if (loading) return
    const editor = getInstance()
    if (!editor) return
    editor.action(callCommand(command.key))
  }, [loading, getInstance])

  useEffect(() => {
    if (loading) return
    const editor = getInstance()
    if (!editor) return

    let view = null
    try {
      editor.action((ctx) => { view = ctx.get(editorViewCtx) })
    } catch { return }
    if (!view) return

    const update = () => {
      // Don't show if a modal is open
      if (activeModal) { setVisible(false); return }

      const { state } = view
      const { from, to, empty } = state.selection

      if (empty || from === to) {
        setVisible(false)
        return
      }

      // Get coords of selection
      const start = view.coordsAtPos(from)
      const end = view.coordsAtPos(to)
      const editorCard = view.dom.closest('.editor-card')
      if (!editorCard) { setVisible(false); return }
      const cardRect = editorCard.getBoundingClientRect()

      const bubbleWidth = 200
      const top = start.top - cardRect.top - 44
      const left = Math.max(
        8,
        Math.min(
          cardRect.width - bubbleWidth - 8,
          (start.left + end.left) / 2 - cardRect.left - bubbleWidth / 2
        )
      )

      setPosition({ top, left })
      setVisible(true)
    }

    // Listen to selection changes
    const handleSelectionChange = () => {
      requestAnimationFrame(update)
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [loading, activeModal])

  // Hide on mousedown outside
  useEffect(() => {
    if (!visible) return
    const hide = (e) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target)) {
        // Don't hide immediately — wait for next selection update
      }
    }
    document.addEventListener('mousedown', hide)
    return () => document.removeEventListener('mousedown', hide)
  }, [visible])

  if (!visible) return null

  return (
    <div
      ref={bubbleRef}
      className="bubble-toolbar"
      style={{ top: position.top, left: position.left }}
      role="toolbar"
      aria-label="Selection toolbar"
      onMouseDown={(e) => e.preventDefault()}
    >
      <button className="bubble-btn" title="Bold" onClick={() => call(toggleStrongCommand)}>
        <b>B</b>
      </button>
      <button className="bubble-btn" title="Italic" onClick={() => call(toggleEmphasisCommand)}>
        <i>I</i>
      </button>
      <button className="bubble-btn" title="Strikethrough" onClick={() => call(toggleStrikethroughCommand)}>
        <s>S</s>
      </button>
      <button className="bubble-btn" title="Code" onClick={() => call(toggleInlineCodeCommand)}>
        &lt;/&gt;
      </button>
      <button className="bubble-btn" title="Link" onClick={() => openModal('link')}>
        🔗
      </button>
    </div>
  )
}

export default BubbleToolbar
