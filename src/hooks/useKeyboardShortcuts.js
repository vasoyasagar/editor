import { useEffect } from 'react'
import useUIStore from '../store/useUIStore'
import usePrefsStore from '../store/usePrefsStore'
import useDocStore from '../store/useDocStore'

const VALID_THEMES = ['light', 'dark', 'sepia', 'solarized', 'nord']

export default function useKeyboardShortcuts() {
  const toggleDocSidebar = useUIStore((s) => s.toggleDocSidebar)
  const toggleOutlineSidebar = useUIStore((s) => s.toggleOutlineSidebar)
  const toggleFocusMode = useUIStore((s) => s.toggleFocusMode)
  const setFocusMode = useUIStore((s) => s.setFocusMode)
  const toggleFindPanel = useUIStore((s) => s.toggleFindPanel)
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const openModal = useUIStore((s) => s.openModal)
  const focusMode = useUIStore((s) => s.focusMode)
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
        if (focusMode) { setFocusMode(false); return }
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
        if (k === 'e') { e.preventDefault(); toggleDocSidebar(); return }
        if (k === 'l') { e.preventDefault(); toggleOutlineSidebar(); return }
        if (k === 'd') {
          e.preventDefault()
          // Quick cycle: light → dark → light
          const next = (theme === 'dark' || theme === 'nord') ? 'light' : 'dark'
          setTheme(next)
          return
        }
        return
      }

      const key = e.key.toLowerCase()
      if (key === 'n') { e.preventDefault(); createDoc(); return }
      if (key === 'f') { e.preventDefault(); toggleFindPanel(true); return }
      if (key === ',') { e.preventDefault(); openModal('settings'); return }
      if (key === '\\' || e.code === 'Backslash') { e.preventDefault(); toggleFocusMode(); return }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeModal, findPanelOpen, focusMode, theme])
}
