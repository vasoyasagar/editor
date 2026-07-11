import { create } from 'zustand'

const useUIStore = create((set, get) => ({
  outlineSidebarCollapsed: false,
  docSidebarMobileOpen: false,
  outlineSidebarMobileOpen: false,
  activeModal: null, // 'settings' | 'help' | 'link' | 'table' | null
  findPanelOpen: false,

  toggleOutlineSidebar: () => {
    const isNarrow = window.matchMedia('(max-width: 980px)').matches
    if (isNarrow) {
      set((s) => ({ outlineSidebarMobileOpen: !s.outlineSidebarMobileOpen, docSidebarMobileOpen: false }))
    } else {
      set((s) => ({ outlineSidebarCollapsed: !s.outlineSidebarCollapsed }))
    }
  },

  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),

  toggleFindPanel: (open) => set((s) => ({ findPanelOpen: open ?? !s.findPanelOpen })),
}))

export default useUIStore
