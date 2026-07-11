import { useMemo } from 'react'
import { editorViewCtx } from '@milkdown/kit/core'
import useDocStore from '../../store/useDocStore'
import { useEditorCtx } from '../Editor/EditorContext'
import './OutlineSidebar.css'

function parseOutline(markdown) {
  if (!markdown) return []
  const headings = []
  for (const line of markdown.split('\n')) {
    const m = line.match(/^(#{1,3})\s+(.+)/)
    if (m) headings.push({ level: m[1].length, text: m[2].replace(/[*_`~]/g, '') })
  }
  return headings
}

function OutlineSidebar() {
  const currentDoc = useDocStore((s) => s.currentDoc)
  const { getInstance, loading } = useEditorCtx()

  const headings = useMemo(() => parseOutline(currentDoc?.content), [currentDoc?.content])

  const scrollToHeading = (index) => {
    if (loading) return
    const editor = getInstance()
    if (!editor) return

    try {
      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        const { doc } = view.state
        let headingCount = 0

        doc.descendants((node, pos) => {
          if (node.type.name === 'heading') {
            if (headingCount === index) {
              const domNode = view.nodeDOM(pos)
              if (domNode) {
                domNode.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              // Move cursor to heading
              view.dispatch(view.state.tr.setSelection(
                view.state.selection.constructor.near(view.state.doc.resolve(pos + 1))
              ))
              view.focus()
              return false
            }
            headingCount++
          }
        })
      })
    } catch { /* ignore if editor not ready */ }
  }

  return (
    <aside className="outline-sidebar" aria-label="Document outline">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Outline</h2>
      </div>
      {headings.length === 0 ? (
        <div className="sidebar-empty">
          No headings yet. Use <kbd>#</kbd>, <kbd>##</kbd>, or <kbd>###</kbd>.
        </div>
      ) : (
        <ul className="outline-list" role="list">
          {headings.map((h, i) => (
            <li
              key={i}
              className={`outline-item outline-h${h.level}`}
              onClick={() => scrollToHeading(i)}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') scrollToHeading(i) }}
            >
              {h.text}
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}

export default OutlineSidebar
