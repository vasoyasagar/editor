import { create } from 'zustand'

const useDocStore = create((set, get) => ({
  docs: [],
  currentDocId: null,
  currentDoc: null,

  setDocs: (docs) => set({ docs }),
  setCurrentDocId: (id) => set({ currentDocId: id }),
  setCurrentDoc: (doc) => set({ currentDoc: doc }),

  getDocById: (id) => get().docs.find((d) => d.id === id),

  updateCurrentDoc: (updates) => {
    const current = get().currentDoc
    if (!current) return
    set({ currentDoc: { ...current, ...updates, updatedAt: Date.now() } })
  },

  addDoc: (doc) => {
    set((state) => ({ docs: [doc, ...state.docs] }))
  },

  removeDoc: (id) => {
    set((state) => ({ docs: state.docs.filter((d) => d.id !== id) }))
  },

  updateDocInList: (id, updates) => {
    set((state) => ({
      docs: state.docs.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    }))
  },
}))

export default useDocStore
