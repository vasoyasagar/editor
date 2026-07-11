import { useState, useEffect, useRef } from 'react'
import { editorViewCtx } from '@milkdown/kit/core'
import { callCommand } from '@milkdown/kit/utils'
import { toggleLinkCommand, updateLinkCommand } from '@milkdown/kit/preset/commonmark'
import { useEditorCtx } from '../Editor/EditorContext'
import useUIStore from '../../store/useUIStore'
import './Modals.css'

function LinkModal() {
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const { getInstance, loading } = useEditorCtx()

  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const urlRef = useRef(null)

  // On open, grab selected text and any existing link
  useEffect(() => {
    if (activeModal !== 'link') return
    if (loading) return
    const editor = getInstance()
    if (!editor) return

    try {
      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        const { state } = view
        const { from, to } = state.selection

        // Get selected text
        const selectedText = state.doc.textBetween(from, to, ' ')
        setText(selectedText)

        // Check if inside a link mark
        const $from = state.doc.resolve(from)
        const linkMark = $from.marks().find((m) => m.type.name === 'link')
        if (linkMark) {
          setUrl(linkMark.attrs.href || '')
          setText(selectedText || linkMark.attrs.title || '')
        } else {
          setUrl('')
        }
      })
    } catch { /* editor not ready */ }

    setTimeout(() => urlRef.current?.focus(), 50)
  }, [activeModal, loading])

  if (activeModal !== 'link') return null

  const handleInsert = () => {
    if (!url.trim()) return
    const editor = getInstance()
    if (!editor) { closeModal(); return }

    try {
      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        const { state } = view
        const { from, to, empty } = state.selection
        const schema = state.schema
        const linkMark = schema.marks.link

        if (empty && text.trim()) {
          // No selection but have text — insert link text with mark
          const linkNode = schema.text(text.trim(), [linkMark.create({ href: url.trim() })])
          view.dispatch(state.tr.replaceSelectionWith(linkNode, false))
        } else if (!empty) {
          // Has selection — apply link mark to selection
          const tr = state.tr.addMark(from, to, linkMark.create({ href: url.trim() }))
          view.dispatch(tr)
        } else {
          // No selection, no text — just insert the URL as link text
          const linkNode = schema.text(url.trim(), [linkMark.create({ href: url.trim() })])
          view.dispatch(state.tr.replaceSelectionWith(linkNode, false))
        }
        view.focus()
      })
    } catch (e) {
      console.warn('Link insert failed:', e)
    }

    closeModal()
  }

  const handleRemove = () => {
    const editor = getInstance()
    if (!editor) { closeModal(); return }

    try {
      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        const { state } = view
        const { from, to } = state.selection
        const linkMark = state.schema.marks.link

        if (from === to) {
          // Cursor in link — find the link extent
          const $pos = state.doc.resolve(from)
          const mark = $pos.marks().find((m) => m.type === linkMark)
          if (mark) {
            // Find link boundaries
            let start = from, end = from
            state.doc.nodesBetween(Math.max(0, from - 200), Math.min(state.doc.content.size, from + 200), (node, pos) => {
              if (node.isText && node.marks.some((m) => m.type === linkMark && m.attrs.href === mark.attrs.href)) {
                start = Math.min(start, pos)
                end = Math.max(end, pos + node.nodeSize)
              }
            })
            view.dispatch(state.tr.removeMark(start, end, linkMark))
          }
        } else {
          view.dispatch(state.tr.removeMark(from, to, linkMark))
        }
        view.focus()
      })
    } catch (e) {
      console.warn('Link remove failed:', e)
    }

    closeModal()
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
      <div className="modal modal-sm" role="dialog" aria-modal="true" aria-labelledby="linkTitle">
        <div className="modal-header">
          <h2 id="linkTitle">Insert Link</h2>
          <button className="icon-btn" onClick={closeModal} aria-label="Close">✖️</button>
        </div>
        <div className="modal-body">
          <label className="field">
            <span>URL</span>
            <input
              ref={urlRef}
              type="url"
              className="field-input"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleInsert() } }}
            />
          </label>
          <label className="field">
            <span>Text (optional)</span>
            <input
              type="text"
              className="field-input"
              placeholder="Link text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleInsert() } }}
            />
          </label>
          <div className="modal-actions">
            <button className="toolbar-btn" onClick={handleRemove}>Remove Link</button>
            <button className="toolbar-btn primary" onClick={handleInsert}>Insert</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LinkModal
