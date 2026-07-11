import { createContext, useContext } from 'react'

// Shared context so Toolbar and other components can call editor commands
const EditorContext = createContext({
  getInstance: () => null,
  loading: true,
})

export const EditorProvider = EditorContext.Provider

export function useEditorCtx() {
  return useContext(EditorContext)
}
