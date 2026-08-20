import { useState, useEffect, useRef, useCallback } from 'react'
import { STYLES } from '../../ai/prompts'
import { rewriteText } from '../../ai/aiService'
import { useEditorCtx } from './EditorContext'
import { showToast } from '../Toast/ToastContainer'
import './AIContextMenu.css'

function AIContextMenu() {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(false)
  const menuRef = useRef(null)
  const { editorRef } = useEditorCtx()

  useEffect(() => {
    const handleContextMenu = (e) => {
      const editorEl = e.target.closest('.prose-editor')
      if (!editorEl) return

      const selection = window.getSelection()
      const selectedText = selection?.toString()?.trim()
      if (!selectedText) return

      e.preventDefault()

      const menuWidth = 240
      const menuHeight = STYLES.length * 38 + 16
      const x = Math.min(e.clientX || 0, window.innerWidth - menuWidth - 8)
      const y = Math.min(e.clientY || 0, window.innerHeight - menuHeight - 8)
      setPosition({ x, y })
      setVisible(true)
    }

    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setVisible(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setVisible(false)
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleRewrite = useCallback(async (styleId) => {
    setVisible(false)

    const selectedText = window.getSelection()?.toString()?.trim()
    if (!selectedText) {
      showToast('Select some text first', 'error')
      return
    }

    setLoading(true)
    const style = STYLES.find((s) => s.id === styleId)
    showToast(`✍️ ${style?.label || 'Rewriting'}...`, 'info', 10000)

    try {
      const result = await rewriteText(styleId, selectedText)
      if (!result) { setLoading(false); return }
      editorRef.current?.insertMarkdown(result)
      showToast(`✅ ${style?.label} done!`, 'success')
    } catch (e) {
      showToast(`❌ ${e.message?.slice(0, 80)}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [editorRef])

  if (!visible) return null

  return (
    <div
      ref={menuRef}
      className="ai-context-menu"
      style={{ left: position.x, top: position.y }}
      role="menu"
    >
      <div className="ai-context-header">✨ AI Rewrite</div>
      {STYLES.map((style) => (
        <button
          key={style.id}
          className="ai-context-item"
          role="menuitem"
          disabled={loading}
          onClick={() => handleRewrite(style.id)}
        >
          <span className="ai-item-icon">{style.icon}</span>
          <span>{style.label}</span>
        </button>
      ))}
    </div>
  )
}

export default AIContextMenu
