import { useState, useEffect } from 'react'
import './Toast.css'

const toasts = []
let listeners = []

export function showToast(message, type = 'info', duration = 2500) {
  const id = Date.now() + Math.random()
  const toast = { id, message, type }
  toasts.push(toast)
  listeners.forEach((fn) => fn([...toasts]))
  setTimeout(() => {
    const idx = toasts.findIndex((t) => t.id === id)
    if (idx !== -1) toasts.splice(idx, 1)
    listeners.forEach((fn) => fn([...toasts]))
  }, duration)
}

function ToastContainer() {
  const [items, setItems] = useState([])

  useEffect(() => {
    listeners.push(setItems)
    return () => {
      listeners = listeners.filter((fn) => fn !== setItems)
    }
  }, [])

  if (!items.length) return null

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}

export default ToastContainer
