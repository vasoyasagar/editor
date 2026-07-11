import { useEffect } from 'react'
import Header from './components/Header/Header'
import Toolbar from './components/Toolbar/Toolbar'
import StatusBar from './components/Toolbar/StatusBar'
import DocSidebar from './components/Sidebar/DocSidebar'
import OutlineSidebar from './components/Sidebar/OutlineSidebar'
import Editor, { MilkdownRenderer } from './components/Editor/Editor'
import SlashMenu from './components/Editor/SlashMenu'
import ToastContainer from './components/Toast/ToastContainer'
import usePrefsStore from './store/usePrefsStore'
import useUIStore from './store/useUIStore'
import useDocStore from './store/useDocStore'
import useAutosave from './hooks/useAutosave'

function AppContent() {
  const theme = usePrefsStore((s) => s.theme)
  const docCollapsed = useUIStore((s) => s.docSidebarCollapsed)
  const outlineCollapsed = useUIStore((s) => s.outlineSidebarCollapsed)
  const focusMode = useUIStore((s) => s.focusMode)
  const currentDoc = useDocStore((s) => s.currentDoc)
  const persistCurrent = useDocStore((s) => s.persistCurrent)

  // Apply theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // Autosave: persist to IndexedDB when content changes
  useAutosave(currentDoc?.content, () => {
    persistCurrent()
  }, 500)

  const bodyClasses = [
    docCollapsed && 'doc-collapsed',
    outlineCollapsed && 'outline-collapsed',
    focusMode && 'is-focus',
  ].filter(Boolean).join(' ')

  return (
    <div className={`app ${bodyClasses}`}>
      <Editor>
        <Header />
        <Toolbar />
        <main className="workspace">
          <DocSidebar />
          <div className="editor-container">
            <div className="editor-card" style={{ position: 'relative' }}>
              <MilkdownRenderer />
              <SlashMenu />
            </div>
          </div>
          <OutlineSidebar />
        </main>
        <StatusBar />
      </Editor>
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
    initPrefs()
    initDocs()
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
