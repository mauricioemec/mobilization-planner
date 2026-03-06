import { supabase } from '../supabase'
import type { RaoEntry, RaoEntryInsert } from '../../types/database'

type ServiceResult<T> = Promise<{ data: T | null; error: string | null }>

/**
 * Load all RAO entries for a project.
 * Ordered by wave_direction_deg then wave_period_s for consistent table display.
 */
export async function loadRaoEntries(projectId: string): ServiceResult<RaoEntry[]> {
  try {
    const { data, error } = await supabase
      .from('rao_entry')
      .select('*')
      .eq('project_id', projectId)
      .order('wave_direction_deg')
      .order('wave_period_s')
    if (error) return { data: null, error: error.message }
    return { data: data as RaoEntry[], error: null }
  } catch {
    return { data: null, error: 'Network error' }
  }
}

/**
 * Replace all RAO entries for a project with the provided array.
 * Deletes existing entries then batch-inserts the new set.
 * Typical input: 200–600 rows (10–20 directions × 20–30 periods).
 */
export async function saveRaoEntries(
  projectId: string,
  entries: Omit<RaoEntryInsert, 'project_id'>[],
): ServiceResult<RaoEntry[]> {
  try {
    const { error: deleteError } = await supabase
      .from('rao_entry')
      .delete()
      .eq('project_id', projectId)
    if (deleteError) return { data: null, error: deleteError.message }

    if (entries.length === 0) return { data: [], error: null }

    const rows: RaoEntryInsert[] = entries.map((e) => ({
      ...e,
      project_id: projectId,
    }))
    const { data, error } = await supabase
      .from('rao_entry')
      .insert(rows)
      .select()
    if (error) return { data: null, error: error.message }
    return { data: data as RaoEntry[], error: null }
  } catch {
    return { data: null, error: 'Network error' }
  }
}
