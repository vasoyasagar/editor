import { useState, useRef, useEffect, useCallback } from 'react'
import { STYLES } from '../../ai/prompts'
import { rewriteText } from '../../ai/aiService'
import { useEditorCtx } from './EditorContext'
import { showToast } from '../Toast/ToastContainer'
import AIAnswerModal from './AIAnswerModal'
import './AIDropdown.css'

function AIDropdown() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const [answerModal, setAnswerModal] = useState({ open: false, styleId: null, source: '' })
  const menuRef = useRef(null)
  const btnRef = useRef(null)
  const { editorRef } = useEditorCtx()

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const toggleMenu = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 6, left: rect.right - 220 })
    }
    setOpen(!open)
  }

  const handleRewrite = useCallback(async (styleId) => {
    setOpen(false)

    const selection = window.getSelection()
    const selectedText = selection?.toString()?.trim()
    if (!selectedText) {
      showToast('Select some text first', 'error')
      return
    }

    if (styleId === 'answer' || styleId === 'reply') {
      setAnswerModal({ open: true, styleId, source: selectedText })
      return
    }

    setLoading(true)
    const style = STYLES.find((s) => s.id === styleId)
    showToast(`✍️ ${style?.label || 'Rewriting'}...`, 'info', 10000)

    try {
      const result = await rewriteText(styleId, selectedText)
      if (!result) { setLoading(false); return }
      // Collapse selection to end, then insert on new line
      window.getSelection()?.collapseToEnd()
      editorRef.current?.insertMarkdown('\n\n' + result + '\n\n')
      showToast(`✅ ${style?.label} done!`, 'success')
    } catch (e) {
      showToast(`❌ ${e.message?.slice(0, 80)}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [editorRef])

  return (
    <div className="ai-dropdown-wrap">
      <button
        ref={btnRef}
        className={`ai-toolbar-btn ${loading ? 'is-loading' : ''}`}
        onClick={toggleMenu}
        disabled={loading}
        title="AI Rewrite (select text first)"
        aria-label="AI Rewrite"
        aria-haspopup="true"
        aria-expanded={open}
      >
        ✨ {loading ? '...' : 'AI'}
      </button>
      {open && (
        <div ref={menuRef} className="ai-dropdown-menu" style={{ top: menuPos.top, left: menuPos.left }} role="menu">
          {STYLES.map((style) => (
            <button
              key={style.id}
              className="ai-dropdown-item"
              role="menuitem"
              title={style.usage}
              onClick={() => handleRewrite(style.id)}
            >
              <span className="ai-item-icon">{style.icon}</span>
              <span className="ai-item-text">
                <span>{style.label}</span>
                <span className="ai-item-tip">{style.tip}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      <AIAnswerModal
        open={answerModal.open}
        styleId={answerModal.styleId}
        sourceText={answerModal.source}
        onInsert={(text) => {
          const md = editorRef.current?.getMarkdown() || ''
          const src = answerModal.source
          const idx = md.indexOf(src)
          if (idx !== -1) {
            const insertAt = idx + src.length
            const updated = md.slice(0, insertAt) + '\n\n' + text + '\n\n' + md.slice(insertAt)
            editorRef.current?.setMarkdown(updated)
          } else {
            editorRef.current?.insertMarkdown('\n\n' + text + '\n\n')
          }
        }}
        onClose={() => setAnswerModal({ open: false, styleId: null, source: '' })}
      />
    </div>
  )
}

export default AIDropdown
