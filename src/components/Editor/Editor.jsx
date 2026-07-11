import { useEffect, useRef } from 'react'
import { Milkdown, MilkdownProvider, useEditor, useInstance } from '@milkdown/react'
import { Editor as MilkdownEditor, defaultValueCtx, editorViewCtx, parserCtx, rootCtx } from '@milkdown/kit/core'
import { commonmark, toggleStrongCommand, toggleEmphasisCommand, wrapInBlockquoteCommand, turnIntoTextCommand, insertHrCommand } from '@milkdown/kit/preset/commonmark'
import { gfm, toggleStrikethroughCommand, insertTableCommand } from '@milkdown/kit/preset/gfm'
import { history } from '@milkdown/kit/plugin/history'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
import { clipboard } from '@milkdown/kit/plugin/clipboard'
import { trailing } from '@milkdown/kit/plugin/trailing'
import { indent } from '@milkdown/kit/plugin/indent'
import { cursor } from '@milkdown/kit/plugin/cursor'
import { callCommand } from '@milkdown/kit/utils'
import { EditorProvider } from './EditorContext'
import useDocStore from '../../store/useDocStore'
import './Editor.css'

const DEFAULT_CONTENT = `# Welcome to Markdown Editor

Start writing in **Markdown** — everything is saved locally in your browser.

## Features

- [x] Bold, italic, and inline \`code\`
- [x] Headings, blockquotes, and lists
- [ ] Tables (GFM)
- [ ] Task lists

> This is a blockquote. Use \`>\` at the start of a line.

### Code Block

\`\`\`js
console.log("Hello, Markdown!")
\`\`\`

---

Try the **slash menu** by typing \`/\` at the start of a line.
`

// Export command keys so Toolbar can use them
export {
  toggleStrongCommand,
  toggleEmphasisCommand,
  wrapInBlockquoteCommand,
  turnIntoTextCommand,
  insertHrCommand,
  toggleStrikethroughCommand,
  insertTableCommand,
}

function MilkdownEditorInner({ children }) {
  const updateCurrentDoc = useDocStore((s) => s.updateCurrentDoc)
  const currentDoc = useDocStore((s) => s.currentDoc)
  const lastDocIdRef = useRef(null)

  const { get } = useEditor((root) => {
    const content = currentDoc?.content || DEFAULT_CONTENT
    return MilkdownEditor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, content)
        ctx.get(listenerCtx)
          .markdownUpdated((_ctx, markdown, prevMarkdown) => {
            if (markdown !== prevMarkdown) {
              updateCurrentDoc({ content: markdown })
            }
          })
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(listener)
      .use(clipboard)
      .use(trailing)
      .use(indent)
      .use(cursor)
  }, [])

  const [loading, getInstance] = useInstance()

  // When current doc changes externally, replace editor content
  useEffect(() => {
    if (loading) return
    const editor = getInstance()
    if (!editor) return

    const docId = currentDoc?.id
    if (!docId) return
    if (docId === lastDocIdRef.current) return
    lastDocIdRef.current = docId

    const content = currentDoc?.content || DEFAULT_CONTENT

    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const parser = ctx.get(parserCtx)
      const doc = parser(content)
      if (!doc) return
      const { state } = view
      view.dispatch(state.tr.replaceWith(0, state.doc.content.size, doc.content))
    })
  }, [loading, currentDoc?.id])

  return (
    <EditorProvider value={{ getInstance, loading }}>
      {children}
    </EditorProvider>
  )
}

function Editor({ children }) {
  return (
    <MilkdownProvider>
      <MilkdownEditorInner>
        {children}
      </MilkdownEditorInner>
    </MilkdownProvider>
  )
}

export function MilkdownRenderer() {
  return <Milkdown />
}

export default Editor
