import { createContext, useContext } from 'react'

const EditorContext = createContext({ editorRef: { current: null } })

export const EditorProvider = EditorContext.Provider

export function useEditorCtx() {
  return useContext(EditorContext)
}
