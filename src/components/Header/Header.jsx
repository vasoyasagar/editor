import { useState, useRef } from 'react'
import useDocStore from '../../store/useDocStore'
import useUIStore from '../../store/useUIStore'
import usePrefsStore from '../../store/usePrefsStore'
import './Header.css'

function Header() {
  const currentDoc = useDocStore((s) => s.currentDoc)
  const renameDoc = useDocStore((s) => s.renameDoc)
  const createDoc = useDocStore((s) => s.createDoc)
  const toggleDocSidebar = useUIStore((s) => s.toggleDocSidebar)
  const toggleOutlineSidebar = useUIStore((s) => s.toggleOutlineSidebar)
  const toggleFocusMode = useUIStore((s) => s.toggleFocusMode)
  const openModal = useUIStore((s) => s.openModal)
  const theme = usePrefsStore((s) => s.theme)
  const setTheme = usePrefsStore((s) => s.setTheme)

  const [editing, setEditing] = useState(false)
  const inputRef = useRef(null)

  const handleSaveTitle = () => {
    const value = inputRef.current?.value?.trim() || 'Untitled'
    renameDoc(currentDoc.id, value)
    setEditing(false)
  }

  return (
    <header className="header-card" role="banner">
      <div className="header-left">
        <button
          className="icon-btn"
          onClick={toggleDocSidebar}
          title="Toggle documents (Ctrl+Shift+E)"
          aria-label="Toggle documents sidebar"
        >
          📑
        </button>
        <img src={`${import.meta.env.BASE_URL}rotate.png`} alt="" className="logo-img" aria-hidden="true" />
        {editing ? (
          <input
            ref={inputRef}
            className="header-title-input"
            type="text"
            defaultValue={currentDoc?.title || ''}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle()
              if (e.key === 'Escape') setEditing(false)
            }}
            onBlur={handleSaveTitle}
          />
        ) : (
          <span className="header-title" onDoubleClick={() => setEditing(true)}>
            {currentDoc?.title || 'Markdown Editor'}
          </span>
        )}
        {!editing && (
          <button className="icon-btn edit-title-btn" onClick={() => setEditing(true)} title="Edit title" aria-label="Edit title">
            ✏️
          </button>
        )}
      </div>
      <div className="header-actions">
        <button className="icon-btn" onClick={() => createDoc()} title="New document (Ctrl+N)" aria-label="New document">
          ➕
        </button>
        <button
          className="icon-btn"
          onClick={toggleFocusMode}
          title="Focus mode (Ctrl+\\)"
          aria-label="Toggle focus mode"
        >
          🎯
        </button>
        <button
          className="icon-btn"
          onClick={() => setTheme((theme === 'dark' || theme === 'nord') ? 'light' : 'dark')}
          title="Toggle dark mode (Ctrl+Shift+D)"
          aria-label="Toggle dark mode"
        >
          {(theme === 'dark' || theme === 'nord') ? '☀️' : '🌙'}
        </button>
        <button
          className="icon-btn"
          onClick={() => openModal('settings')}
          title="Settings (Ctrl+,)"
          aria-label="Open settings"
        >
          ⚙️
        </button>
        <button
          className="icon-btn"
          onClick={() => openModal('help')}
          title="Keyboard shortcuts (?)"
          aria-label="Keyboard shortcuts"
        >
          ❓
        </button>
        <button
          className="icon-btn"
          onClick={toggleOutlineSidebar}
          title="Toggle outline (Ctrl+Shift+L)"
          aria-label="Toggle outline sidebar"
        >
          📋
        </button>
      </div>
    </header>
  )
}

export default Header
