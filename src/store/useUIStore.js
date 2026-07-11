import { create } from 'zustand'

const useUIStore = create((set, get) => ({
  docSidebarCollapsed: false,
  outlineSidebarCollapsed: false,
  focusMode: false,
  activeModal: null, // 'settings' | 'help' | 'link' | 'table' | null
  findPanelOpen: false,

  toggleDocSidebar: () => set((s) => ({ docSidebarCollapsed: !s.docSidebarCollapsed })),
  toggleOutlineSidebar: () => set((s) => ({ outlineSidebarCollapsed: !s.outlineSidebarCollapsed })),
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  setFocusMode: (v) => set({ focusMode: v }),

  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),

  toggleFindPanel: (open) => set((s) => ({ findPanelOpen: open ?? !s.findPanelOpen })),
}))

export default useUIStore
