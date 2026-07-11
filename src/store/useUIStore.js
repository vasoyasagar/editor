import { create } from 'zustand'

const useUIStore = create((set, get) => ({
  docSidebarCollapsed: false,
  outlineSidebarCollapsed: false,
  docSidebarMobileOpen: false,
  outlineSidebarMobileOpen: false,
  focusMode: false,
  activeModal: null, // 'settings' | 'help' | 'link' | 'table' | null
  findPanelOpen: false,

  toggleDocSidebar: () => {
    const isNarrow = window.matchMedia('(max-width: 980px)').matches
    if (isNarrow) {
      set((s) => ({ docSidebarMobileOpen: !s.docSidebarMobileOpen, outlineSidebarMobileOpen: false }))
    } else {
      set((s) => ({ docSidebarCollapsed: !s.docSidebarCollapsed }))
    }
  },
  toggleOutlineSidebar: () => {
    const isNarrow = window.matchMedia('(max-width: 980px)').matches
    if (isNarrow) {
      set((s) => ({ outlineSidebarMobileOpen: !s.outlineSidebarMobileOpen, docSidebarMobileOpen: false }))
    } else {
      set((s) => ({ outlineSidebarCollapsed: !s.outlineSidebarCollapsed }))
    }
  },
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  setFocusMode: (v) => set({ focusMode: v }),

  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),

  toggleFindPanel: (open) => set((s) => ({ findPanelOpen: open ?? !s.findPanelOpen })),
}))

export default useUIStore
