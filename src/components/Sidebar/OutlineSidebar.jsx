import './OutlineSidebar.css'

function OutlineSidebar() {
  return (
    <aside className="outline-sidebar" aria-label="Document outline">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Outline</h2>
      </div>
      <div className="sidebar-empty">
        No headings yet. Use <kbd>#</kbd>, <kbd>##</kbd>, or <kbd>###</kbd>.
      </div>
    </aside>
  )
}

export default OutlineSidebar
