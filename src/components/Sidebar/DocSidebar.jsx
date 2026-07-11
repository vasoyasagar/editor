import './DocSidebar.css'

function DocSidebar() {
  return (
    <aside className="doc-sidebar" aria-label="Documents">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Documents</h2>
        <button className="icon-btn" title="New document" aria-label="New document">➕</button>
      </div>
      <input
        type="search"
        className="field-input sidebar-search"
        placeholder="Search documents…"
        aria-label="Search documents"
      />
      <ul className="doc-list" role="list">
        <li className="doc-item is-active">
          <div className="doc-item-main">
            <div className="doc-item-title">Welcome</div>
            <div className="doc-item-meta">just now</div>
          </div>
        </li>
      </ul>
    </aside>
  )
}

export default DocSidebar
