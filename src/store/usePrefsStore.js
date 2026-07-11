import { create } from 'zustand'

const DEFAULT_PREFS = {
  theme: 'light',
  font: '"JetBrains Mono", monospace',
  fontSize: 16,
  lineHeight: 1.6,
  spellcheck: true,
}

const usePrefsStore = create((set, get) => ({
  ...DEFAULT_PREFS,

  setTheme: (theme) => set({ theme }),
  setFont: (font) => set({ font }),
  setFontSize: (fontSize) => set({ fontSize }),
  setLineHeight: (lineHeight) => set({ lineHeight }),
  setSpellcheck: (spellcheck) => set({ spellcheck }),

  loadPrefs: (stored) => set({ ...DEFAULT_PREFS, ...stored }),
  getPrefs: () => {
    const { setTheme, setFont, setFontSize, setLineHeight, setSpellcheck, loadPrefs, getPrefs, resetPrefs, ...prefs } = get()
    return prefs
  },
  resetPrefs: () => set(DEFAULT_PREFS),
}))

export default usePrefsStore
