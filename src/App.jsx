import { useEffect } from 'react'
import Header from './components/Header/Header'
import StatusBar from './components/Toolbar/StatusBar'
import DocSidebar from './components/Sidebar/DocSidebar'
import { EditorWrapper, EditorRenderer } from './components/Editor/Editor'
import HelpModal from './components/Modals/HelpModal'
import SettingsModal from './components/Modals/SettingsModal'
import ToastContainer from './components/Toast/ToastContainer'
import usePrefsStore from './store/usePrefsStore'
import useUIStore from './store/useUIStore'
import useDocStore from './store/useDocStore'
import useAutosave from './hooks/useAutosave'
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts'

function AppContent() {
  const theme = usePrefsStore((s) => s.theme)
  const font = usePrefsStore((s) => s.font)
  const fontSize = usePrefsStore((s) => s.fontSize)
  const lineHeight = usePrefsStore((s) => s.lineHeight)
  const spellcheck = usePrefsStore((s) => s.spellcheck)
  const docSidebarCollapsed = useUIStore((s) => s.docSidebarCollapsed)
  const docMobileOpen = useUIStore((s) => s.docSidebarMobileOpen)
  const currentDoc = useDocStore((s) => s.currentDoc)
  const persistCurrent = useDocStore((s) => s.persistCurrent)

  // Keyboard shortcuts
  useKeyboardShortcuts()

  // Apply theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // Apply editor font prefs as CSS vars
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--editor-font', font)
    root.style.setProperty('--editor-font-size', fontSize + 'px')
    root.style.setProperty('--editor-line-height', String(lineHeight))
  }, [font, fontSize, lineHeight])

  // Autosave: persist to IndexedDB when content changes
  useAutosave(currentDoc?.content, () => {
    persistCurrent()
  }, 500)

  const bodyClasses = [
    docSidebarCollapsed && 'doc-collapsed',
    docMobileOpen && 'is-doc-open',
  ].filter(Boolean).join(' ')

  const closeDocSidebarMobile = useUIStore((s) => s.closeDocSidebarMobile)

  return (
    <div className={`app ${bodyClasses}`}>
      <EditorWrapper>
        <Header />
        <main className="workspace">
          {docMobileOpen && (
            <div className="mobile-backdrop" onClick={closeDocSidebarMobile} />
          )}
          <DocSidebar />
          <div className="editor-container">
            <div className="editor-card" spellCheck={spellcheck}>
              <EditorRenderer />
            </div>
          </div>
        </main>
        <StatusBar />
      </EditorWrapper>
      <HelpModal />
      <SettingsModal />
      <ToastContainer />
    </div>
  )
}

function App() {
  const docsInitialized = useDocStore((s) => s.initialized)
  const prefsInitialized = usePrefsStore((s) => s.initialized)
  const initDocs = useDocStore((s) => s.init)
  const initPrefs = usePrefsStore((s) => s.init)

  useEffect(() => {
    async function boot() {
      // Run legacy migration before loading docs (non-blocking on failure)
      try {
        const { migrateLegacyData } = await import('./utils/migrate.js')
        await migrateLegacyData()
      } catch (e) {
        console.warn('Migration skipped:', e)
      }
      await initPrefs()
      await initDocs()
    }
    boot()
  }, [])

  if (!docsInitialized || !prefsInitialized) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</p>
      </div>
    )
  }

  return <AppContent />
}

export default App
