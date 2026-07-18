import { useState, useRef } from 'react'
import useDocStore from '../../store/useDocStore'
import useUIStore from '../../store/useUIStore'
import { formatRelativeTime } from '../../utils/formatTime'
import './DocSidebar.css'

function DocSidebar() {
  const docs = useDocStore((s) => s.docs)
  const currentDocId = useDocStore((s) => s.currentDocId)
  const switchDoc = useDocStore((s) => s.switchDoc)
  const createDoc = useDocStore((s) => s.createDoc)
  const deleteDocById = useDocStore((s) => s.deleteDocById)
  const renameDoc = useDocStore((s) => s.renameDoc)
  const togglePin = useDocStore((s) => s.togglePin)
  const closeDocSidebarMobile = useUIStore((s) => s.closeDocSidebarMobile)

  const [search, setSearch] = useState('')
  const [renamingId, setRenamingId] = useState(null)
  const renameInputRef = useRef(null)

  const handleSwitchDoc = (id) => {
    switchDoc(id)
    closeDocSidebarMobile()
  }

  // Sort: pinned first, then by updatedAt desc
  const sorted = [...docs].sort((a, b) => {
    if (!!b.pinned !== !!a.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
    return (b.updatedAt || 0) - (a.updatedAt || 0)
  })

  const filtered = search
    ? sorted.filter((d) => (d.title || '').toLowerCase().includes(search.toLowerCase()))
    : sorted

  const handleRename = async (id, newTitle) => {
    setRenamingId(null)
    await renameDoc(id, newTitle)
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    await deleteDocById(id)
  }

  return (
    <aside className="doc-sidebar" aria-label="Documents">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Documents</h2>
        <button
          className="icon-btn"
          title="New document"
          aria-label="New document"
          onClick={() => createDoc()}
        >
          ➕
        </button>
      </div>
      <input
        type="search"
        className="field-input sidebar-search"
        placeholder="Search documents…"
        aria-label="Search documents"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {filtered.length === 0 ? (
        <div className="sidebar-empty">No documents match.</div>
      ) : (
        <ul className="doc-list" role="list">
          {filtered.map((entry) => (
            <li
              key={entry.id}
              className={`doc-item ${entry.id === currentDocId ? 'is-active' : ''} ${entry.pinned ? 'is-pinned' : ''}`}
              onClick={() => handleSwitchDoc(entry.id)}
            >
              <div className="doc-item-main">
                {renamingId === entry.id ? (
                  <input
                    ref={renameInputRef}
                    className="doc-item-rename"
                    type="text"
                    defaultValue={entry.title}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(entry.id, e.target.value)
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    onBlur={(e) => handleRename(entry.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="doc-item-title">
                    {entry.pinned && <span className="pin-icon">📌</span>}
                    {entry.title || 'Untitled'}
                  </div>
                )}
                <div className="doc-item-meta">Modified {formatRelativeTime(entry.updatedAt)}</div>
              </div>
              <div className="doc-item-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="icon-btn doc-action-btn"
                  title={entry.pinned ? 'Unpin' : 'Pin'}
                  onClick={() => togglePin(entry.id)}
                >
                  📌
                </button>
                <button
                  className="icon-btn doc-action-btn"
                  title="Rename"
                  onClick={() => setRenamingId(entry.id)}
                >
                  ✏️
                </button>
                <button
                  className="icon-btn doc-action-btn delete-btn"
                  title="Delete"
                  onClick={() => handleDelete(entry.id, entry.title)}
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}

export default DocSidebar
