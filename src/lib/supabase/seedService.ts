/**
 * seedService — populate Supabase with demo data from SEED_DATA.md.
 * All values are realistic but fictional, based on typical SURF operations
 * in Brazilian pre-salt fields.
 */

import { supabase } from '../supabase'
import { saveVessel, saveVesselBarriers, saveDeckLoadZones, saveCraneCurve } from './vesselService'
import { saveEquipment } from './equipmentService'
import { createProject } from './projectService'
import { addEquipmentToProject, updateEquipmentOverboard } from './projectEquipmentService'
import { saveRaoEntries } from './raoService'
import { saveScatterDiagram } from './weatherService'

type SeedResult = { ok: boolean; error?: string }

// ── Check whether the DB is empty ────────────────────────────────────────────

/** Returns true when no vessels AND no equipment exist. Shows the "Load Demo Data" button. */
export async function isDatabaseEmpty(): Promise<boolean> {
  try {
    const [{ count: vCount }, { count: eCount }] = await Promise.all([
      supabase.from('vessel').select('id', { count: 'exact', head: true }),
      supabase.from('equipment_library').select('id', { count: 'exact', head: true }),
    ])
    return (vCount ?? 0) === 0 && (eCount ?? 0) === 0
  } catch {
    return false
  }
}

// ── Vessel 1: Seven Seas ──────────────────────────────────────────────────────

const SEVEN_SEAS_BARRIERS = [
  { name: 'Pipe Rack Port',       x_m:  5, y_m:  0, length_m: 50, width_m:  3, height_m: 2.5 },
  { name: 'Pipe Rack Starboard',  x_m:  5, y_m: 22, length_m: 50, width_m:  3, height_m: 2.5 },
  { name: 'Moonpool',             x_m: 30, y_m:  9, length_m:  8, width_m:  7, height_m: 0.5 },
  { name: 'Tensioner Area',       x_m: 55, y_m:  3, length_m: 12, width_m: 19, height_m: 3.0 },
  { name: 'A-Frame Base',         x_m:  0, y_m:  8, length_m:  4, width_m:  9, height_m: 4.0 },
]

const SEVEN_SEAS_ZONES = [
  { name: 'Forward Deck', x_m:  0, y_m: 3, length_m: 30, width_m: 19, capacity_t_per_m2: 5  },
  { name: 'Mid Deck',     x_m: 30, y_m: 3, length_m: 25, width_m: 19, capacity_t_per_m2: 10 },
  { name: 'Aft Deck',     x_m: 55, y_m: 3, length_m: 25, width_m: 19, capacity_t_per_m2: 8  },
]

const SEVEN_SEAS_CRANE = [
  { radius_m: 10, capacity_t: 400, boom_angle_deg: 75.5 },
  { radius_m: 12, capacity_t: 370, boom_angle_deg: 72.5 },
  { radius_m: 14, capacity_t: 340, boom_angle_deg: 69.5 },
  { radius_m: 16, capacity_t: 310, boom_angle_deg: 66.0 },
  { radius_m: 18, capacity_t: 280, boom_angle_deg: 62.0 },
  { radius_m: 20, capacity_t: 250, boom_angle_deg: 60.0 },
  { radius_m: 22, capacity_t: 220, boom_angle_deg: 56.5 },
  { radius_m: 24, capacity_t: 195, boom_angle_deg: 53.0 },
  { radius_m: 26, capacity_t: 170, boom_angle_deg: 49.5 },
  { radius_m: 28, capacity_t: 145, boom_angle_deg: 45.5 },
  { radius_m: 30, capacity_t: 120, boom_angle_deg: 41.5 },
  { radius_m: 32, capacity_t: 100, boom_angle_deg: 36.5 },
  { radius_m: 34, capacity_t:  80, boom_angle_deg: 31.5 },
  { radius_m: 36, capacity_t:  60, boom_angle_deg: 26.0 },
  { radius_m: 38, capacity_t:  45, boom_angle_deg: 19.0 },
  { radius_m: 40, capacity_t:  30, boom_angle_deg: 10.0 },
]

// ── Vessel 2: Skandi Búzios ───────────────────────────────────────────────────

const SKANDI_BARRIERS = [
  { name: 'Pipe Rack Port',       x_m:  5, y_m:    0, length_m: 55, width_m:  3.5, height_m: 2.5 },
  { name: 'Pipe Rack Starboard',  x_m:  5, y_m: 24.5, length_m: 55, width_m:  3.5, height_m: 2.5 },
  { name: 'Moonpool',             x_m: 35, y_m:   10, length_m:  9, width_m:  8.0, height_m: 0.5 },
  { name: 'Reel Drive Area',      x_m: 60, y_m:    4, length_m: 15, width_m: 20.0, height_m: 4.0 },
]

const SKANDI_ZONES = [
  { name: 'Forward Deck', x_m:  0, y_m: 3.5, length_m: 35, width_m: 21, capacity_t_per_m2: 5  },
  { name: 'Mid Deck',     x_m: 35, y_m: 3.5, length_m: 25, width_m: 21, capacity_t_per_m2: 10 },
  { name: 'Aft Deck',     x_m: 60, y_m: 3.5, length_m: 30, width_m: 21, capacity_t_per_m2: 8  },
]

const SKANDI_CRANE = [
  { radius_m: 10, capacity_t: 600, boom_angle_deg: 78.0 },
  { radius_m: 13, capacity_t: 540, boom_angle_deg: 74.0 },
  { radius_m: 16, capacity_t: 470, boom_angle_deg: 70.0 },
  { radius_m: 19, capacity_t: 400, boom_angle_deg: 65.0 },
  { radius_m: 22, capacity_t: 340, boom_angle_deg: 60.0 },
  { radius_m: 25, capacity_t: 280, boom_angle_deg: 55.0 },
  { radius_m: 28, capacity_t: 230, boom_angle_deg: 49.0 },
  { radius_m: 31, capacity_t: 185, boom_angle_deg: 43.0 },
  { radius_m: 34, capacity_t: 150, boom_angle_deg: 37.0 },
  { radius_m: 37, capacity_t: 120, boom_angle_deg: 30.0 },
  { radius_m: 40, capacity_t:  95, boom_angle_deg: 23.0 },
  { radius_m: 43, capacity_t:  70, boom_angle_deg: 15.0 },
  { radius_m: 45, capacity_t:  50, boom_angle_deg:  8.0 },
]

// ── Equipment library ─────────────────────────────────────────────────────────

const EQUIPMENT_ITEMS = [
  { name: 'Manifold M1',   description: '6-slot production manifold, Búzios field',        geometry_type: 'box'      as const, length_m: 5.0,  width_m: 3.0, height_m: 2.5, dry_weight_t: 25.0, submerged_volume_m3: null },
  { name: 'PLET-A',        description: 'Production PLET with hub connection',              geometry_type: 'box'      as const, length_m: 3.0,  width_m: 2.0, height_m: 1.5, dry_weight_t:  8.0, submerged_volume_m3: null },
  { name: 'Template T1',   description: 'Subsea template, 4-well',                          geometry_type: 'box'      as const, length_m: 8.0,  width_m: 6.0, height_m: 3.0, dry_weight_t: 45.0, submerged_volume_m3: null },
  { name: 'Jumper Spool',  description: 'Rigid jumper spool, 8-inch bore',                  geometry_type: 'cylinder' as const, length_m: 12.0, width_m: 0.5, height_m: 0.5, dry_weight_t:  3.5, submerged_volume_m3: null },
  { name: 'PLET-B',        description: 'Gas injection PLET',                               geometry_type: 'box'      as const, length_m: 2.5,  width_m: 1.8, height_m: 1.2, dry_weight_t:  6.0, submerged_volume_m3: null },
]

// ── RAO data (Beam seas 270°) ─────────────────────────────────────────────────

const RAO_ENTRIES = [
  { wave_direction_deg: 270, wave_period_s:  4, heave_amplitude_m_per_m: 0.02, heave_phase_deg:   0, roll_amplitude_deg_per_m: 0.5, roll_phase_deg:   0, pitch_amplitude_deg_per_m: 0.10, pitch_phase_deg:   0 },
  { wave_direction_deg: 270, wave_period_s:  5, heave_amplitude_m_per_m: 0.05, heave_phase_deg:  10, roll_amplitude_deg_per_m: 1.2, roll_phase_deg:  15, pitch_amplitude_deg_per_m: 0.25, pitch_phase_deg:  12 },
  { wave_direction_deg: 270, wave_period_s:  6, heave_amplitude_m_per_m: 0.10, heave_phase_deg:  25, roll_amplitude_deg_per_m: 2.1, roll_phase_deg:  30, pitch_amplitude_deg_per_m: 0.50, pitch_phase_deg:  28 },
  { wave_direction_deg: 270, wave_period_s:  7, heave_amplitude_m_per_m: 0.20, heave_phase_deg:  45, roll_amplitude_deg_per_m: 3.5, roll_phase_deg:  50, pitch_amplitude_deg_per_m: 0.80, pitch_phase_deg:  42 },
  { wave_direction_deg: 270, wave_period_s:  8, heave_amplitude_m_per_m: 0.35, heave_phase_deg:  65, roll_amplitude_deg_per_m: 4.8, roll_phase_deg:  72, pitch_amplitude_deg_per_m: 1.10, pitch_phase_deg:  60 },
  { wave_direction_deg: 270, wave_period_s:  9, heave_amplitude_m_per_m: 0.55, heave_phase_deg:  85, roll_amplitude_deg_per_m: 5.5, roll_phase_deg:  88, pitch_amplitude_deg_per_m: 1.30, pitch_phase_deg:  78 },
  { wave_direction_deg: 270, wave_period_s: 10, heave_amplitude_m_per_m: 0.70, heave_phase_deg: 100, roll_amplitude_deg_per_m: 5.2, roll_phase_deg:  98, pitch_amplitude_deg_per_m: 1.20, pitch_phase_deg:  90 },
  { wave_direction_deg: 270, wave_period_s: 11, heave_amplitude_m_per_m: 0.80, heave_phase_deg: 115, roll_amplitude_deg_per_m: 4.5, roll_phase_deg: 108, pitch_amplitude_deg_per_m: 1.00, pitch_phase_deg: 100 },
  { wave_direction_deg: 270, wave_period_s: 12, heave_amplitude_m_per_m: 0.85, heave_phase_deg: 130, roll_amplitude_deg_per_m: 3.8, roll_phase_deg: 120, pitch_amplitude_deg_per_m: 0.80, pitch_phase_deg: 112 },
  { wave_direction_deg: 270, wave_period_s: 13, heave_amplitude_m_per_m: 0.82, heave_phase_deg: 145, roll_amplitude_deg_per_m: 3.0, roll_phase_deg: 135, pitch_amplitude_deg_per_m: 0.60, pitch_phase_deg: 125 },
  { wave_direction_deg: 270, wave_period_s: 14, heave_amplitude_m_per_m: 0.75, heave_phase_deg: 160, roll_amplitude_deg_per_m: 2.5, roll_phase_deg: 150, pitch_amplitude_deg_per_m: 0.45, pitch_phase_deg: 140 },
  { wave_direction_deg: 270, wave_period_s: 15, heave_amplitude_m_per_m: 0.65, heave_phase_deg: 172, roll_amplitude_deg_per_m: 2.0, roll_phase_deg: 162, pitch_amplitude_deg_per_m: 0.35, pitch_phase_deg: 155 },
  { wave_direction_deg: 270, wave_period_s: 16, heave_amplitude_m_per_m: 0.55, heave_phase_deg: 180, roll_amplitude_deg_per_m: 1.6, roll_phase_deg: 170, pitch_amplitude_deg_per_m: 0.28, pitch_phase_deg: 165 },
  { wave_direction_deg: 270, wave_period_s: 18, heave_amplitude_m_per_m: 0.40, heave_phase_deg: 185, roll_amplitude_deg_per_m: 1.0, roll_phase_deg: 178, pitch_amplitude_deg_per_m: 0.18, pitch_phase_deg: 175 },
  { wave_direction_deg: 270, wave_period_s: 20, heave_amplitude_m_per_m: 0.30, heave_phase_deg: 188, roll_amplitude_deg_per_m: 0.7, roll_phase_deg: 182, pitch_amplitude_deg_per_m: 0.12, pitch_phase_deg: 180 },
]

// ── Scatter diagram (Búzios — typical annual) ─────────────────────────────────

const SCATTER_ENTRIES = [
  { hs_m: 0.5, tp_s:  4, occurrence_pct: 0.5 }, { hs_m: 0.5, tp_s:  6, occurrence_pct: 1.5 },
  { hs_m: 0.5, tp_s:  8, occurrence_pct: 2.0 }, { hs_m: 0.5, tp_s: 10, occurrence_pct: 1.5 },
  { hs_m: 0.5, tp_s: 12, occurrence_pct: 0.8 }, { hs_m: 0.5, tp_s: 14, occurrence_pct: 0.3 },
  { hs_m: 0.5, tp_s: 16, occurrence_pct: 0.1 }, { hs_m: 0.5, tp_s: 18, occurrence_pct: 0.0 },
  { hs_m: 1.0, tp_s:  4, occurrence_pct: 0.8 }, { hs_m: 1.0, tp_s:  6, occurrence_pct: 3.5 },
  { hs_m: 1.0, tp_s:  8, occurrence_pct: 5.5 }, { hs_m: 1.0, tp_s: 10, occurrence_pct: 4.5 },
  { hs_m: 1.0, tp_s: 12, occurrence_pct: 2.5 }, { hs_m: 1.0, tp_s: 14, occurrence_pct: 1.0 },
  { hs_m: 1.0, tp_s: 16, occurrence_pct: 0.3 }, { hs_m: 1.0, tp_s: 18, occurrence_pct: 0.1 },
  { hs_m: 1.5, tp_s:  4, occurrence_pct: 0.3 }, { hs_m: 1.5, tp_s:  6, occurrence_pct: 2.8 },
  { hs_m: 1.5, tp_s:  8, occurrence_pct: 6.5 }, { hs_m: 1.5, tp_s: 10, occurrence_pct: 6.0 },
  { hs_m: 1.5, tp_s: 12, occurrence_pct: 4.0 }, { hs_m: 1.5, tp_s: 14, occurrence_pct: 1.8 },
  { hs_m: 1.5, tp_s: 16, occurrence_pct: 0.5 }, { hs_m: 1.5, tp_s: 18, occurrence_pct: 0.1 },
  { hs_m: 2.0, tp_s:  4, occurrence_pct: 0.1 }, { hs_m: 2.0, tp_s:  6, occurrence_pct: 1.5 },
  { hs_m: 2.0, tp_s:  8, occurrence_pct: 4.5 }, { hs_m: 2.0, tp_s: 10, occurrence_pct: 5.5 },
  { hs_m: 2.0, tp_s: 12, occurrence_pct: 4.5 }, { hs_m: 2.0, tp_s: 14, occurrence_pct: 2.2 },
  { hs_m: 2.0, tp_s: 16, occurrence_pct: 0.8 }, { hs_m: 2.0, tp_s: 18, occurrence_pct: 0.2 },
  { hs_m: 2.5, tp_s:  4, occurrence_pct: 0.0 }, { hs_m: 2.5, tp_s:  6, occurrence_pct: 0.5 },
  { hs_m: 2.5, tp_s:  8, occurrence_pct: 2.5 }, { hs_m: 2.5, tp_s: 10, occurrence_pct: 4.0 },
  { hs_m: 2.5, tp_s: 12, occurrence_pct: 3.8 }, { hs_m: 2.5, tp_s: 14, occurrence_pct: 2.5 },
  { hs_m: 2.5, tp_s: 16, occurrence_pct: 1.2 }, { hs_m: 2.5, tp_s: 18, occurrence_pct: 0.3 },
  { hs_m: 3.0, tp_s:  4, occurrence_pct: 0.0 }, { hs_m: 3.0, tp_s:  6, occurrence_pct: 0.1 },
  { hs_m: 3.0, tp_s:  8, occurrence_pct: 1.0 }, { hs_m: 3.0, tp_s: 10, occurrence_pct: 2.5 },
  { hs_m: 3.0, tp_s: 12, occurrence_pct: 3.0 }, { hs_m: 3.0, tp_s: 14, occurrence_pct: 2.2 },
  { hs_m: 3.0, tp_s: 16, occurrence_pct: 1.0 }, { hs_m: 3.0, tp_s: 18, occurrence_pct: 0.4 },
  { hs_m: 3.5, tp_s:  4, occurrence_pct: 0.0 }, { hs_m: 3.5, tp_s:  6, occurrence_pct: 0.0 },
  { hs_m: 3.5, tp_s:  8, occurrence_pct: 0.3 }, { hs_m: 3.5, tp_s: 10, occurrence_pct: 1.2 },
  { hs_m: 3.5, tp_s: 12, occurrence_pct: 2.0 }, { hs_m: 3.5, tp_s: 14, occurrence_pct: 1.5 },
  { hs_m: 3.5, tp_s: 16, occurrence_pct: 0.8 }, { hs_m: 3.5, tp_s: 18, occurrence_pct: 0.3 },
  { hs_m: 4.0, tp_s:  4, occurrence_pct: 0.0 }, { hs_m: 4.0, tp_s:  6, occurrence_pct: 0.0 },
  { hs_m: 4.0, tp_s:  8, occurrence_pct: 0.1 }, { hs_m: 4.0, tp_s: 10, occurrence_pct: 0.5 },
  { hs_m: 4.0, tp_s: 12, occurrence_pct: 1.0 }, { hs_m: 4.0, tp_s: 14, occurrence_pct: 1.0 },
  { hs_m: 4.0, tp_s: 16, occurrence_pct: 0.5 }, { hs_m: 4.0, tp_s: 18, occurrence_pct: 0.2 },
  { hs_m: 4.5, tp_s:  4, occurrence_pct: 0.0 }, { hs_m: 4.5, tp_s:  6, occurrence_pct: 0.0 },
  { hs_m: 4.5, tp_s:  8, occurrence_pct: 0.0 }, { hs_m: 4.5, tp_s: 10, occurrence_pct: 0.2 },
  { hs_m: 4.5, tp_s: 12, occurrence_pct: 0.5 }, { hs_m: 4.5, tp_s: 14, occurrence_pct: 0.5 },
  { hs_m: 4.5, tp_s: 16, occurrence_pct: 0.3 }, { hs_m: 4.5, tp_s: 18, occurrence_pct: 0.1 },
  { hs_m: 5.0, tp_s:  4, occurrence_pct: 0.0 }, { hs_m: 5.0, tp_s:  6, occurrence_pct: 0.0 },
  { hs_m: 5.0, tp_s:  8, occurrence_pct: 0.0 }, { hs_m: 5.0, tp_s: 10, occurrence_pct: 0.1 },
  { hs_m: 5.0, tp_s: 12, occurrence_pct: 0.2 }, { hs_m: 5.0, tp_s: 14, occurrence_pct: 0.3 },
  { hs_m: 5.0, tp_s: 16, occurrence_pct: 0.2 }, { hs_m: 5.0, tp_s: 18, occurrence_pct: 0.1 },
]

// ── Main seed function ────────────────────────────────────────────────────────

/** Populate Supabase with all demo data from SEED_DATA.md. */
export async function seedDemoData(): Promise<SeedResult> {
  try {
    // 1. Insert vessels
    const { data: sevenSeas, error: e1 } = await saveVessel({
      name: 'Seven Seas', vessel_type: 'PLSV',
      description: 'Subsea7 PLSV, Brazilian fleet. Main boom crane OMC Huisman.',
      deck_length_m: 80, deck_width_m: 25, deck_origin_x: 0, deck_origin_y: 0,
      crane_type: 'OMC', crane_pedestal_x: 68, crane_pedestal_y: 12.5,
      crane_pedestal_height_m: 15, crane_boom_length_m: 40, crane_jib_length_m: null,
      crane_slew_min_deg: 0, crane_slew_max_deg: 360,
    })
    if (e1 || !sevenSeas) return { ok: false, error: e1 ?? 'Failed to create Seven Seas' }

    const { data: skandi, error: e2 } = await saveVessel({
      name: 'Skandi Búzios', vessel_type: 'PLSV',
      description: 'DOF Subsea PLSV, chartered for pre-salt operations. Knuckle boom crane.',
      deck_length_m: 90, deck_width_m: 28, deck_origin_x: 0, deck_origin_y: 0,
      crane_type: 'knuckle_boom', crane_pedestal_x: 75, crane_pedestal_y: 14,
      crane_pedestal_height_m: 18, crane_boom_length_m: 35, crane_jib_length_m: 20,
      crane_slew_min_deg: 0, crane_slew_max_deg: 360,
    })
    if (e2 || !skandi) return { ok: false, error: e2 ?? 'Failed to create Skandi Búzios' }

    // 2. Barriers, zones, crane curves for both vessels (parallel)
    const [b1, z1, c1, b2, z2, c2] = await Promise.all([
      saveVesselBarriers(sevenSeas.id, SEVEN_SEAS_BARRIERS),
      saveDeckLoadZones(sevenSeas.id, SEVEN_SEAS_ZONES),
      saveCraneCurve(sevenSeas.id, SEVEN_SEAS_CRANE),
      saveVesselBarriers(skandi.id, SKANDI_BARRIERS),
      saveDeckLoadZones(skandi.id, SKANDI_ZONES),
      saveCraneCurve(skandi.id, SKANDI_CRANE),
    ])
    for (const { error } of [b1, z1, c1, b2, z2, c2]) {
      if (error) return { ok: false, error }
    }

    // 3. Equipment library
    const eqIds: Record<string, string> = {}
    for (const item of EQUIPMENT_ITEMS) {
      const { data: eq, error } = await saveEquipment(item)
      if (error || !eq) return { ok: false, error: error ?? 'Failed to create equipment' }
      eqIds[item.name] = eq.id
    }

    // 4. Create sample project (auto-builds vessel_snapshot from Seven Seas)
    const { data: project, error: e3 } = await createProject({
      name: 'Búzios PLET Installation Campaign',
      description: 'Installation of 2 PLETs and 1 manifold at Búzios pre-salt field',
      field_name: 'Búzios',
      water_depth_m: 2100,
      vessel_id: sevenSeas.id,
      status: 'draft',
      vessel_snapshot: null,
    })
    if (e3 || !project) return { ok: false, error: e3 ?? 'Failed to create project' }

    // 5. Add equipment placements
    const placements = [
      {
        equipment_id: eqIds['Manifold M1'], label: 'Manifold M1 - Well A',
        deck_pos_x: 20, deck_pos_y: 12.5, deck_rotation_deg: 0,
        overboard_pos_x: 75, overboard_pos_y: -5,
      },
      {
        equipment_id: eqIds['PLET-A'], label: 'PLET-A - Well A Prod',
        deck_pos_x: 12, deck_pos_y: 8, deck_rotation_deg: 0,
        overboard_pos_x: 72, overboard_pos_y: -4,
      },
      {
        equipment_id: eqIds['PLET-B'], label: 'PLET-B - Well A Gas',
        deck_pos_x: 12, deck_pos_y: 16, deck_rotation_deg: 90,
        overboard_pos_x: 72, overboard_pos_y: -6,
      },
    ]

    for (const p of placements) {
      const { data: pe, error } = await addEquipmentToProject({
        project_id: project.id, ...p,
        crane_slew_deck_deg: null, crane_boom_angle_deck_deg: null,
        crane_radius_deck_m: null, crane_capacity_deck_t: null,
        deck_load_ok: null, capacity_check_deck_ok: null,
        crane_slew_overboard_deg: null, crane_boom_angle_overboard_deg: null,
        crane_radius_overboard_m: null, crane_capacity_overboard_t: null,
        capacity_check_overboard_ok: null,
      })
      if (error || !pe) return { ok: false, error: error ?? 'Failed to add equipment placement' }

      // Set overboard crane data (simplified — using direct radius calculation)
      const dx = (p.overboard_pos_x ?? 75) - 68
      const dy = (p.overboard_pos_y ?? -5) - 12.5
      const radius = Math.sqrt(dx * dx + dy * dy)
      const slewDeg = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360
      const clampedR = Math.min(radius, 40)
      const boomAngleDeg = (Math.acos(clampedR / 40) * 180) / Math.PI

      // Interpolate crane capacity
      const sortedCurve = [...SEVEN_SEAS_CRANE].sort((a, b) => a.radius_m - b.radius_m)
      let capacity = 0
      for (let i = 0; i < sortedCurve.length - 1; i++) {
        const lo = sortedCurve[i], hi = sortedCurve[i + 1]
        if (radius >= lo.radius_m && radius <= hi.radius_m) {
          const t = (radius - lo.radius_m) / (hi.radius_m - lo.radius_m)
          capacity = lo.capacity_t + t * (hi.capacity_t - lo.capacity_t)
          break
        }
      }

      await updateEquipmentOverboard(pe.id, {
        overboard_pos_x: p.overboard_pos_x,
        overboard_pos_y: p.overboard_pos_y,
        crane_slew_overboard_deg: slewDeg,
        crane_boom_angle_overboard_deg: boomAngleDeg,
        crane_radius_overboard_m: radius,
        crane_capacity_overboard_t: capacity,
        capacity_check_overboard_ok: capacity >= (EQUIPMENT_ITEMS.find(e => eqIds[e.name] === p.equipment_id)?.dry_weight_t ?? 0),
      })
    }

    // 6. RAO data
    const { error: e4 } = await saveRaoEntries(project.id, RAO_ENTRIES)
    if (e4) return { ok: false, error: e4 }

    // 7. Scatter diagram
    const { error: e5 } = await saveScatterDiagram(project.id, SCATTER_ENTRIES)
    if (e5) return { ok: false, error: e5 }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
