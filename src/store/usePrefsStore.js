import { create } from 'zustand'
import { loadPrefs as loadPrefsDB, savePrefs as savePrefsDB } from '../hooks/useIndexedDB'

const DEFAULT_PREFS = {
  theme: 'light',
  font: '"JetBrains Mono", monospace',
  fontSize: 16,
  lineHeight: 1.6,
  spellcheck: true,
}

const usePrefsStore = create((set, get) => ({
  ...DEFAULT_PREFS,
  initialized: false,

  init: async () => {
    const stored = await loadPrefsDB()
    set({ ...DEFAULT_PREFS, ...stored, initialized: true })
  },

  setTheme: async (theme) => {
    set({ theme })
    await savePrefsDB(get().getPrefs())
  },
  setFont: async (font) => {
    set({ font })
    await savePrefsDB(get().getPrefs())
  },
  setFontSize: async (fontSize) => {
    set({ fontSize })
    await savePrefsDB(get().getPrefs())
  },
  setLineHeight: async (lineHeight) => {
    set({ lineHeight })
    await savePrefsDB(get().getPrefs())
  },
  setSpellcheck: async (spellcheck) => {
    set({ spellcheck })
    await savePrefsDB(get().getPrefs())
  },

  getPrefs: () => {
    const { theme, font, fontSize, lineHeight, spellcheck } = get()
    return { theme, font, fontSize, lineHeight, spellcheck }
  },

  resetPrefs: async () => {
    set(DEFAULT_PREFS)
    await savePrefsDB(DEFAULT_PREFS)
  },
}))

export default usePrefsStore
