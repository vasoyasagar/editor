import { useState } from 'react'
import useUIStore from '../../store/useUIStore'
import usePrefsStore from '../../store/usePrefsStore'
import { wipeAllData } from '../../hooks/useIndexedDB'
import { showToast } from '../Toast/ToastContainer'
import './HelpModal.css'

const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'sepia', label: 'Sepia' },
  { value: 'solarized', label: 'Solarized Light' },
  { value: 'nord', label: 'Nord' },
]

const FONTS = [
  { value: '"JetBrains Mono", monospace', label: 'JetBrains Mono' },
  { value: '"Inter", system-ui, sans-serif', label: 'Inter (sans)' },
  { value: '"Lora", Georgia, serif', label: 'Lora (serif)' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Georgia' },
  { value: 'system-ui, -apple-system, sans-serif', label: 'System UI' },
]

function SettingsModal() {
  const activeModal = useUIStore((s) => s.activeModal)
  const closeModal = useUIStore((s) => s.closeModal)

  const theme = usePrefsStore((s) => s.theme)
  const font = usePrefsStore((s) => s.font)
  const fontSize = usePrefsStore((s) => s.fontSize)
  const lineHeight = usePrefsStore((s) => s.lineHeight)
  const spellcheck = usePrefsStore((s) => s.spellcheck)
  const geminiApiKey = usePrefsStore((s) => s.geminiApiKey)
  const setTheme = usePrefsStore((s) => s.setTheme)
  const setFont = usePrefsStore((s) => s.setFont)
  const setFontSize = usePrefsStore((s) => s.setFontSize)
  const setLineHeight = usePrefsStore((s) => s.setLineHeight)
  const setSpellcheck = usePrefsStore((s) => s.setSpellcheck)
  const setGeminiApiKey = usePrefsStore((s) => s.setGeminiApiKey)
  const resetPrefs = usePrefsStore((s) => s.resetPrefs)

  const [showKey, setShowKey] = useState(false)

  if (activeModal !== 'settings') return null

  const handleWipe = async () => {
    if (!confirm('Delete ALL documents and settings? This cannot be undone.')) return
    await wipeAllData()
    location.reload()
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
        <div className="modal-header">
          <h2 id="settingsTitle">Settings</h2>
          <button className="icon-btn" onClick={closeModal} aria-label="Close">✖️</button>
        </div>
        <div className="modal-body">
          <label className="field">
            <span>Theme</span>
            <select className="field-input" value={theme} onChange={(e) => setTheme(e.target.value)}>
              {THEMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>

          <label className="field">
            <span>Editor Font</span>
            <select className="field-input" value={font} onChange={(e) => setFont(e.target.value)}>
              {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </label>

          <label className="field">
            <span>Font Size: {fontSize}px</span>
            <input
              type="range"
              className="field-input"
              min="12"
              max="28"
              step="1"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
          </label>

          <label className="field">
            <span>Line Height: {lineHeight.toFixed(2)}</span>
            <input
              type="range"
              className="field-input"
              min="1.2"
              max="2.2"
              step="0.05"
              value={lineHeight}
              onChange={(e) => setLineHeight(Number(e.target.value))}
            />
          </label>

          <label className="field-check">
            <input type="checkbox" checked={spellcheck} onChange={(e) => setSpellcheck(e.target.checked)} />
            Spellcheck
          </label>

          <hr className="modal-divider" />

          <label className="field">
            <span>✨ Gemini API Key</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type={showKey ? 'text' : 'password'}
                className="field-input"
                placeholder="Enter your Gemini API key"
                value={geminiApiKey || ''}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="toolbar-btn" onClick={() => setShowKey(!showKey)} style={{ flexShrink: 0 }}>
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
            <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>
              Get a free key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style={{ color: 'var(--accent)' }}>aistudio.google.com/apikey</a>
            </small>
          </label>

          <hr className="modal-divider" />

          <div className="modal-actions">
            <button className="toolbar-btn" onClick={() => { resetPrefs(); showToast('Settings reset', 'success') }}>
              Reset Defaults
            </button>
            <button className="toolbar-btn" style={{ color: 'var(--danger)' }} onClick={handleWipe}>
              🗑️ Wipe All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
