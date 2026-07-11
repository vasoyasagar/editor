import { useEffect } from 'react'
import Header from './components/Header/Header'
import Toolbar from './components/Toolbar/Toolbar'
import StatusBar from './components/Toolbar/StatusBar'
import DocSidebar from './components/Sidebar/DocSidebar'
import OutlineSidebar from './components/Sidebar/OutlineSidebar'
import Editor, { MilkdownRenderer } from './components/Editor/Editor'
import SlashMenu from './components/Editor/SlashMenu'
import BubbleToolbar from './components/Editor/BubbleToolbar'
import EmptyState from './components/Editor/EmptyState'
import DocMeta from './components/Editor/DocMeta'
import FindPanel from './components/FindReplace/FindPanel'
import FocusExit from './components/FocusExit/FocusExit'
import HelpModal from './components/Modals/HelpModal'
import SettingsModal from './components/Modals/SettingsModal'
import LinkModal from './components/Modals/LinkModal'
import TableModal from './components/Modals/TableModal'
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
  const docCollapsed = useUIStore((s) => s.docSidebarCollapsed)
  const outlineCollapsed = useUIStore((s) => s.outlineSidebarCollapsed)
  const docMobileOpen = useUIStore((s) => s.docSidebarMobileOpen)
  const outlineMobileOpen = useUIStore((s) => s.outlineSidebarMobileOpen)
  const focusMode = useUIStore((s) => s.focusMode)
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
    docCollapsed && 'doc-collapsed',
    outlineCollapsed && 'outline-collapsed',
    docMobileOpen && 'is-doc-open',
    outlineMobileOpen && 'is-outline-open',
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
            <div className="editor-card" style={{ position: 'relative' }} spellCheck={spellcheck}>
              <DocMeta />
              {(!currentDoc?.content || currentDoc.content.trim() === '') && <EmptyState />}
              <MilkdownRenderer />
              <SlashMenu />
              <BubbleToolbar />
            </div>
          </div>
          <OutlineSidebar />
        </main>
        <StatusBar />
        <FindPanel />
      </Editor>
      <FocusExit />
      <HelpModal />
      <SettingsModal />
      <LinkModal />
      <TableModal />
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
