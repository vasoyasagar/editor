import { useEffect, useRef, useCallback } from 'react'
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  tablePlugin,
  imagePlugin,
  frontmatterPlugin,
  diffSourcePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin,
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import { EditorProvider, useEditorCtx } from './EditorContext'
import EditorToolbar from './EditorToolbar'
import useDocStore from '../../store/useDocStore'
import usePrefsStore from '../../store/usePrefsStore'
import './Editor.css'

function EditorWrapper({ children }) {
  const editorRef = useRef(null)
  const currentDocId = useDocStore((s) => s.currentDocId)
  const currentDoc = useDocStore((s) => s.currentDoc)
  const lastDocIdRef = useRef(null)

  // When current doc changes, replace editor content
  useEffect(() => {
    if (!currentDocId) return
    if (currentDocId === lastDocIdRef.current) return
    lastDocIdRef.current = currentDocId

    const content = currentDoc?.content || ''
    editorRef.current?.setMarkdown(content)
  }, [currentDocId])

  return (
    <EditorProvider value={{ editorRef }}>
      {children}
    </EditorProvider>
  )
}

function EditorRenderer() {
  const { editorRef } = useEditorCtx()
  const currentDoc = useDocStore((s) => s.currentDoc)
  const updateContent = useDocStore((s) => s.updateContent)
  const theme = usePrefsStore((s) => s.theme)

  const handleChange = useCallback((markdown) => {
    updateContent(markdown)
  }, [updateContent])

  const initialMarkdown = currentDoc?.content || ''
  const isDark = theme === 'dark' || theme === 'nord'

  return (
    <MDXEditor
      ref={editorRef}
      className={isDark ? 'dark-theme' : ''}
      markdown={initialMarkdown}
      onChange={handleChange}
      contentEditableClassName="prose-editor"
      plugins={[
        headingsPlugin({ allowedHeadingLevels: [1, 2, 3, 4, 5, 6] }),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        tablePlugin(),
        imagePlugin(),
        frontmatterPlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
        codeMirrorPlugin({
          codeBlockLanguages: {
            js: 'JavaScript',
            ts: 'TypeScript',
            jsx: 'JSX',
            tsx: 'TSX',
            css: 'CSS',
            html: 'HTML',
            json: 'JSON',
            python: 'Python',
            bash: 'Bash',
            sql: 'SQL',
            markdown: 'Markdown',
            '': 'Plain Text',
          },
        }),
        diffSourcePlugin({ viewMode: 'rich-text' }),
        toolbarPlugin({
          toolbarContents: () => <EditorToolbar />,
        }),
      ]}
    />
  )
}

export { EditorWrapper, EditorRenderer }
export default EditorWrapper
