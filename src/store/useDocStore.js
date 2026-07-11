import { create } from 'zustand'
import { showToast } from '../components/Toast/ToastContainer'
import {
  genId,
  loadDocIndex,
  saveDocIndex,
  loadDoc,
  saveDoc,
  deleteDoc as deleteDocDB,
  loadCurrentDocId,
  saveCurrentDocId,
} from '../hooks/useIndexedDB'

const useDocStore = create((set, get) => ({
  docs: [],          // index: [{id, title, pinned, updatedAt}]
  currentDocId: null,
  currentDoc: null,  // full doc: {id, title, content, pinned, createdAt, updatedAt}
  initialized: false,
  saveStatus: 'saved', // 'saved' | 'saving' | 'error'

  // ---- Initialize from IndexedDB ----
  init: async () => {
    let index = await loadDocIndex()
    let currentId = await loadCurrentDocId()

    // No documents — create the first one with welcome content
    if (!index.length) {
      const now = Date.now()
      const id = genId()
      const doc = {
        id,
        title: 'Welcome',
        content: `# Welcome to Markdown Editor\n\nStart writing in **Markdown** — everything is saved locally in your browser.\n\n## Features\n\n- [x] Bold, italic, and inline \`code\`\n- [x] Headings, blockquotes, and lists\n- [ ] Tables (GFM)\n- [ ] Task lists\n\n> This is a blockquote.\n\n### Try It\n\nType \`/\` at the start of a line for slash commands.\n`,
        pinned: false,
        createdAt: now,
        updatedAt: now,
      }
      await saveDoc(doc)
      index = [{ id, title: 'Welcome', pinned: false, updatedAt: now }]
      await saveDocIndex(index)
      currentId = id
      await saveCurrentDocId(id)
    }

    // Validate currentId
    if (!currentId || !index.find((d) => d.id === currentId)) {
      currentId = index[0].id
      await saveCurrentDocId(currentId)
    }

    const currentDoc = await loadDoc(currentId)
    if (currentDoc) {
      currentDoc.lastOpenedAt = Date.now()
      await saveDoc(currentDoc)
    }
    set({ docs: index, currentDocId: currentId, currentDoc, initialized: true })
  },

  // ---- Switch document ----
  switchDoc: async (id) => {
    const { currentDocId, persistCurrent } = get()
    if (id === currentDocId) return

    // Save current first
    await persistCurrent()

    const doc = await loadDoc(id)
    if (!doc) return

    // Track lastOpenedAt
    doc.lastOpenedAt = Date.now()
    await saveDoc(doc)

    await saveCurrentDocId(id)
    set({ currentDocId: id, currentDoc: doc, saveStatus: 'saved' })
  },

  // ---- Create new doc ----
  createDoc: async (title = 'Untitled') => {
    const { persistCurrent } = get()
    await persistCurrent()

    const id = genId()
    const now = Date.now()
    const doc = {
      id,
      title,
      content: '',
      pinned: false,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    }
    await saveDoc(doc)

    const index = [...get().docs]
    index.unshift({ id, title, pinned: false, updatedAt: now })
    await saveDocIndex(index)
    await saveCurrentDocId(id)

    set({ docs: index, currentDocId: id, currentDoc: doc, saveStatus: 'saved' })
    return doc
  },

  // ---- Update current doc content (in memory only, for autosave) ----
  updateContent: (content) => {
    const { currentDoc } = get()
    if (!currentDoc) return
    set({
      currentDoc: { ...currentDoc, content, updatedAt: Date.now() },
      saveStatus: 'saving',
    })
  },

  // ---- Persist current doc to IndexedDB ----
  persistCurrent: async () => {
    const { currentDoc, docs } = get()
    if (!currentDoc) return

    try {
      const updated = { ...currentDoc, updatedAt: Date.now() }
      await saveDoc(updated)

      // Update index
      const newIndex = docs.map((d) =>
        d.id === updated.id
          ? { ...d, title: updated.title, updatedAt: updated.updatedAt }
          : d
      )
      await saveDocIndex(newIndex)
      set({ currentDoc: updated, docs: newIndex, saveStatus: 'saved' })
    } catch (e) {
      console.error('Save failed:', e)
      set({ saveStatus: 'error' })
    }
  },

  // ---- Rename ----
  renameDoc: async (id, newTitle) => {
    const title = newTitle.trim() || 'Untitled'
    const doc = await loadDoc(id)
    if (!doc) return
    doc.title = title
    doc.updatedAt = Date.now()
    await saveDoc(doc)

    const index = get().docs.map((d) =>
      d.id === id ? { ...d, title, updatedAt: doc.updatedAt } : d
    )
    await saveDocIndex(index)

    const update = { docs: index }
    if (id === get().currentDocId) {
      update.currentDoc = doc
    }
    set(update)
  },

  // ---- Pin/Unpin ----
  togglePin: async (id) => {
    const doc = await loadDoc(id)
    if (!doc) return
    doc.pinned = !doc.pinned
    doc.updatedAt = Date.now()
    await saveDoc(doc)

    const index = get().docs.map((d) =>
      d.id === id ? { ...d, pinned: doc.pinned, updatedAt: doc.updatedAt } : d
    )
    await saveDocIndex(index)
    set({ docs: index })
  },

  // ---- Delete ----
  deleteDocById: async (id) => {
    await deleteDocDB(id)
    let index = get().docs.filter((d) => d.id !== id)
    await saveDocIndex(index)

    if (id === get().currentDocId) {
      if (index.length) {
        const nextDoc = await loadDoc(index[0].id)
        await saveCurrentDocId(index[0].id)
        set({ docs: index, currentDocId: index[0].id, currentDoc: nextDoc })
      } else {
        // Create a new empty doc
        const now = Date.now()
        const newId = genId()
        const newDoc = { id: newId, title: 'Untitled', content: '', pinned: false, createdAt: now, updatedAt: now }
        await saveDoc(newDoc)
        index = [{ id: newId, title: 'Untitled', pinned: false, updatedAt: now }]
        await saveDocIndex(index)
        await saveCurrentDocId(newId)
        set({ docs: index, currentDocId: newId, currentDoc: newDoc })
      }
    } else {
      set({ docs: index })
    }
    showToast('Document deleted', 'success')
  },

  // ---- Rename current doc title (header input) ----
  setCurrentTitle: (title) => {
    const { currentDoc } = get()
    if (!currentDoc) return
    set({ currentDoc: { ...currentDoc, title } })
  },
}))

export default useDocStore
