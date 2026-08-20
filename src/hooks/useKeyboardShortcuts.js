import { useEffect } from 'react'
import useUIStore from '../store/useUIStore'
import usePrefsStore from '../store/usePrefsStore'
import useDocStore from '../store/useDocStore'
import { exportCurrentDoc } from '../utils/fileOps'
import { rewriteText } from '../ai/aiService'
import { showToast } from '../components/Toast/ToastContainer'

export default function useKeyboardShortcuts(editorRef) {
  const toggleDocSidebar = useUIStore((s) => s.toggleDocSidebar)
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)
  const openModal = useUIStore((s) => s.openModal)

  const theme = usePrefsStore((s) => s.theme)
  const setTheme = usePrefsStore((s) => s.setTheme)

  const createDoc = useDocStore((s) => s.createDoc)

  useEffect(() => {
    const handleKeyDown = (e) => {
      const mod = e.ctrlKey || e.metaKey

      // Escape — close modals
      if (e.key === 'Escape') {
        if (activeModal) { closeModal(); return }
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
        if (k === 'g') {
          e.preventDefault()
          const selected = window.getSelection()?.toString()?.trim()
          if (!selected) { showToast('Select some text first', 'error'); return }
          showToast('✍️ Fixing grammar...', 'info', 10000)
          rewriteText('grammar', selected).then((result) => {
            if (result) {
              window.getSelection()?.collapseToEnd()
              editorRef?.current?.insertMarkdown('\n\n' + result + '\n\n')
              showToast('✅ Grammar fixed!', 'success')
            }
          }).catch((err) => showToast(`❌ ${err.message?.slice(0, 80)}`, 'error'))
          return
        }
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
      if (key === ',') { e.preventDefault(); openModal('settings'); return }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeModal, theme])
}
