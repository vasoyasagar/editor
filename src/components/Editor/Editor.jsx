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
  const updateContent = useDocStore((s) => s.updateContent)
  const currentDoc = useDocStore((s) => s.currentDoc)
  const currentDocId = useDocStore((s) => s.currentDocId)
  const lastDocIdRef = useRef(null)

  const { get } = useEditor((root) => {
    const content = currentDoc?.content || ''
    return MilkdownEditor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, content)
        ctx.get(listenerCtx)
          .markdownUpdated((_ctx, markdown, prevMarkdown) => {
            if (markdown !== prevMarkdown) {
              updateContent(markdown)
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

    if (!currentDocId) return
    if (currentDocId === lastDocIdRef.current) return
    lastDocIdRef.current = currentDocId

    const content = currentDoc?.content || ''

    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const parser = ctx.get(parserCtx)
      const doc = parser(content)
      if (!doc) return
      const { state } = view
      const tr = state.tr.replaceWith(0, state.doc.content.size, doc.content)
      // Place cursor at the start of the document
      tr.setSelection(tr.selection.constructor.atStart(tr.doc))
      view.dispatch(tr)
      view.dom.scrollTop = 0
    })
  }, [loading, currentDocId])

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
