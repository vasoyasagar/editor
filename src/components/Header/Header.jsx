import useDocStore from '../../store/useDocStore'
import useUIStore from '../../store/useUIStore'
import './Header.css'

function Header() {
  const currentDoc = useDocStore((s) => s.currentDoc)
  const toggleDocSidebar = useUIStore((s) => s.toggleDocSidebar)
  const toggleOutlineSidebar = useUIStore((s) => s.toggleOutlineSidebar)
  const toggleFocusMode = useUIStore((s) => s.toggleFocusMode)
  const openModal = useUIStore((s) => s.openModal)

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
        <span className="header-title">{currentDoc?.title || 'Markdown Editor'}</span>
      </div>
      <div className="header-actions">
        <button className="icon-btn" title="New document (Ctrl+N)" aria-label="New document">
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
