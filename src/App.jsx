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

function App() {
  const theme = usePrefsStore((s) => s.theme)
  const docCollapsed = useUIStore((s) => s.docSidebarCollapsed)
  const outlineCollapsed = useUIStore((s) => s.outlineSidebarCollapsed)
  const focusMode = useUIStore((s) => s.focusMode)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

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

export default App
