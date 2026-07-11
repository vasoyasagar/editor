import { useEffect } from 'react'
import useUIStore from '../store/useUIStore'
import usePrefsStore from '../store/usePrefsStore'
import useDocStore from '../store/useDocStore'
import { exportCurrentDoc } from '../utils/fileOps'

export default function useKeyboardShortcuts() {
  const toggleOutlineSidebar = useUIStore((s) => s.toggleOutlineSidebar)
  const toggleFindPanel = useUIStore((s) => s.toggleFindPanel)
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const openModal = useUIStore((s) => s.openModal)
  const findPanelOpen = useUIStore((s) => s.findPanelOpen)

  const theme = usePrefsStore((s) => s.theme)
  const setTheme = usePrefsStore((s) => s.setTheme)

  const createDoc = useDocStore((s) => s.createDoc)

  useEffect(() => {
    const handleKeyDown = (e) => {
      const mod = e.ctrlKey || e.metaKey

      // Escape — close things in priority order
      if (e.key === 'Escape') {
        if (activeModal) { closeModal(); return }
        if (findPanelOpen) { toggleFindPanel(false); return }
        return
      }

      // ? — help (only when not typing in an input)
      const isTyping = ['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable
      if (e.key === '?' && !isTyping && !mod) {
        e.preventDefault()
        openModal('help')
        return
      }

      if (!mod) return

      // Ctrl+Shift combos
      if (e.shiftKey) {
        const k = e.key.toLowerCase()
        if (k === 'l') { e.preventDefault(); toggleOutlineSidebar(); return }
        if (k === 'd') {
          e.preventDefault()
          const next = (theme === 'dark' || theme === 'nord') ? 'light' : 'dark'
          setTheme(next)
          return
        }
        return
      }

      const key = e.key.toLowerCase()
      if (key === 'n') { e.preventDefault(); createDoc(); return }
      if (key === 's') { e.preventDefault(); exportCurrentDoc(); return }
      if (key === 'f') { e.preventDefault(); toggleFindPanel(true); return }
      if (key === 'k') { e.preventDefault(); openModal('link'); return }
      if (key === ',') { e.preventDefault(); openModal('settings'); return }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeModal, findPanelOpen, theme])
}
