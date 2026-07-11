import useDocStore from '../../store/useDocStore'
import './DocMeta.css'

function formatDate(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

function DocMeta() {
  const currentDoc = useDocStore((s) => s.currentDoc)

  if (!currentDoc) return null

  return (
    <div className="doc-meta-bar">
      <span className="doc-meta-item" title="Created">
        <span className="doc-meta-label">Created</span>
        <span className="doc-meta-value">{formatDate(currentDoc.createdAt)}</span>
      </span>
      <span className="doc-meta-sep">·</span>
      <span className="doc-meta-item" title="Last Modified">
        <span className="doc-meta-label">Modified</span>
        <span className="doc-meta-value">{formatDate(currentDoc.updatedAt)}</span>
      </span>
      <span className="doc-meta-sep">·</span>
      <span className="doc-meta-item" title="Last Opened">
        <span className="doc-meta-label">Opened</span>
        <span className="doc-meta-value">{formatDate(currentDoc.lastOpenedAt)}</span>
      </span>
    </div>
  )
}

export default DocMeta
