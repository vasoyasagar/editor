import { useState, useRef, useEffect } from 'react'
import { rewriteAnswer } from '../../ai/aiService'
import { showToast } from '../Toast/ToastContainer'
import '../Modals/Modals.css'

function AIAnswerModal({ open, styleId, sourceText, onInsert, onClose }) {
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const draftRef = useRef(null)

  useEffect(() => {
    if (open) {
      setDraft('')
      setResult('')
      setLoading(false)
      setTimeout(() => draftRef.current?.focus(), 80)
    }
  }, [open, styleId])

  if (!open) return null

  const isReply = styleId === 'reply'
  const title = isReply ? '↩️ AI Reply' : '💡 AI Answer'

  const handleGenerate = async () => {
    setLoading(true)
    setResult('')
    try {
      const res = await rewriteAnswer(styleId, sourceText, draft)
      if (res) setResult(res)
    } catch (e) {
      showToast(`❌ ${e.message?.slice(0, 80)}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleInsert = () => {
    if (result) {
      onInsert(result)
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} disabled={loading} aria-label="Close">✖️</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label className="field">
            <span>Source message</span>
            <textarea
              className="field-input"
              rows={4}
              value={sourceText}
              readOnly
              style={{ resize: 'none', opacity: 0.8, cursor: 'default' }}
            />
          </label>

          <label className="field">
            <span>Your draft {isReply ? 'reply' : 'answer'} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></span>
            <textarea
              ref={draftRef}
              className="field-input"
              rows={3}
              placeholder={`Type your rough ${isReply ? 'reply' : 'answer'} here, or leave empty for AI to generate one...`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={loading}
              style={{ resize: 'vertical' }}
            />
          </label>

          {result && (
            <label className="field">
              <span>✨ AI Result</span>
              <textarea
                className="field-input"
                rows={4}
                value={result}
                onChange={(e) => setResult(e.target.value)}
                style={{ resize: 'vertical', borderColor: 'var(--accent)' }}
              />
            </label>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {result && (
              <button className="toolbar-btn primary" onClick={handleInsert}>
                Insert
              </button>
            )}
            <button className="toolbar-btn" onClick={handleGenerate} disabled={loading}>
              {loading ? '✍️ Generating...' : result ? 'Regenerate' : 'Generate'}
            </button>
            <button className="toolbar-btn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIAnswerModal
