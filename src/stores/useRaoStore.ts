import { create } from 'zustand'
import type { RaoEntry, RaoEntryInsert } from '../types/database'
import {
  loadRaoEntries,
  saveRaoEntries as persistRaoEntries,
} from '../lib/supabase/raoService'

type RaoState = {
  entries: RaoEntry[]
  isLoading: boolean
  isSaving: boolean
  error: string | null

  /**
   * Load all RAO entries for a project.
   * Ordered by wave_direction_deg then wave_period_s.
   */
  loadRaos: (projectId: string) => Promise<void>
  /**
   * Replace all RAO entries for a project with the provided array.
   * Used when the user submits the full RAO table (e.g. CSV import or manual entry).
   */
  saveRaos: (
    projectId: string,
    entries: Omit<RaoEntryInsert, 'project_id'>[],
  ) => Promise<void>
  /** Clear in-memory RAO entries (e.g. when navigating away from a project). */
  clearRaos: () => void
}

export const useRaoStore = create<RaoState>((set) => ({
  entries: [],
  isLoading: false,
  isSaving: false,
  error: null,

  loadRaos: async (projectId) => {
    set({ isLoading: true, error: null })
    const { data, error } = await loadRaoEntries(projectId)
    if (error) {
      set({ isLoading: false, error })
      return
    }
    set({ entries: data ?? [], isLoading: false })
  },

  saveRaos: async (projectId, entries) => {
    set({ isSaving: true, error: null })
    const { data, error } = await persistRaoEntries(projectId, entries)
    if (error) {
      set({ isSaving: false, error })
      return
    }
    set({ entries: data ?? [], isSaving: false })
  },

  clearRaos: () => {
    set({ entries: [], error: null })
  },
}))
