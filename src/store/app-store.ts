/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { create } from 'zustand'
import type { Section, Settings } from '@/types/domain'
import { api } from '@/lib/api'

interface AppState {
  settings: Settings | null
  sections: Section[]
  ready: boolean
  error: string | null

  bootstrap: () => Promise<void>
  refreshSettings: () => Promise<void>
  refreshSections: () => Promise<void>
  setSettings: (settings: Settings) => void
}

export const useAppStore = create<AppState>((set) => ({
  settings: null,
  sections: [],
  ready: false,
  error: null,

  bootstrap: async () => {
    try {
      const [settings, sections] = await Promise.all([api.settings.get(), api.sections.list(false)])
      set({ settings, sections, ready: true, error: null })
    } catch (error) {
      set({
        ready: true,
        error: error instanceof Error ? error.message : 'The application could not start.',
      })
    }
  },

  refreshSettings: async () => {
    const settings = await api.settings.get()
    set({ settings })
  },

  refreshSections: async () => {
    const sections = await api.sections.list(false)
    set({ sections })
  },

  setSettings: (settings) => set({ settings }),
}))

