import { create } from 'zustand'

const useUIStore = create((set, get) => ({
  docSidebarCollapsed: false,
  docSidebarMobileOpen: false,
  activeModal: null,

  toggleDocSidebar: () => {
    const isNarrow = window.matchMedia('(max-width: 980px)').matches
    if (isNarrow) {
      set((s) => ({ docSidebarMobileOpen: !s.docSidebarMobileOpen }))
    } else {
      set((s) => ({ docSidebarCollapsed: !s.docSidebarCollapsed }))
    }
  },
  closeDocSidebarMobile: () => set({ docSidebarMobileOpen: false }),

  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),
}))

export default useUIStore
