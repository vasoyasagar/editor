import { useState, useRef, useEffect } from 'react'
import { editorViewCtx } from '@milkdown/kit/core'
import { callCommand } from '@milkdown/kit/utils'
import { insertTableCommand } from '@milkdown/kit/preset/gfm'
import { useEditorCtx } from '../Editor/EditorContext'
import useUIStore from '../../store/useUIStore'
import './Modals.css'

function TableModal() {
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const { getInstance, loading } = useEditorCtx()

  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  const rowsRef = useRef(null)

  useEffect(() => {
    if (activeModal === 'table') {
      setTimeout(() => rowsRef.current?.focus(), 50)
    }
  }, [activeModal])

  if (activeModal !== 'table') return null

  const handleInsert = () => {
    if (loading) return
    const editor = getInstance()
    if (!editor) { closeModal(); return }

    // insertTableCommand takes { row, col } payload in Milkdown GFM
    editor.action(callCommand(insertTableCommand.key))
    closeModal()
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
      <div className="modal modal-sm" role="dialog" aria-modal="true" aria-labelledby="tableTitle">
        <div className="modal-header">
          <h2 id="tableTitle">Insert Table</h2>
          <button className="icon-btn" onClick={closeModal} aria-label="Close">✖️</button>
        </div>
        <div className="modal-body">
          <label className="field">
            <span>Rows</span>
            <input
              ref={rowsRef}
              type="number"
              className="field-input"
              min="1"
              max="20"
              value={rows}
              onChange={(e) => setRows(Math.max(1, Math.min(20, Number(e.target.value))))}
            />
          </label>
          <label className="field">
            <span>Columns</span>
            <input
              type="number"
              className="field-input"
              min="1"
              max="10"
              value={cols}
              onChange={(e) => setCols(Math.max(1, Math.min(10, Number(e.target.value))))}
            />
          </label>
          <div className="modal-actions">
            <button className="toolbar-btn primary" onClick={handleInsert}>Insert Table</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TableModal
