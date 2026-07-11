export function formatRelativeTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now - d
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')

  if (diffMs < 60_000) return 'just now'

  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return hh + ':' + mm

  const yest = new Date(now)
  yest.setDate(now.getDate() - 1)
  if (d.toDateString() === yest.toDateString()) return 'Yesterday ' + hh + ':' + mm

  const weekMs = 6 * 24 * 60 * 60 * 1000
  if (diffMs < weekMs) {
    return d.toLocaleDateString(undefined, { weekday: 'short' }) + ' ' + hh + ':' + mm
  }

  return d.toLocaleDateString()
}

export function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}
