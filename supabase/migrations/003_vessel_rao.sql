-- ============================================================
-- SubLift — Vessel RAO Entry Table
-- 003_vessel_rao.sql
--
-- Moves RAO data ownership to the vessel so that RAOs are
-- entered once per vessel (in the Vessel Editor) and then
-- auto-copied into each project that uses that vessel.
-- ============================================================

CREATE TABLE vessel_rao_entry (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id                   uuid NOT NULL REFERENCES vessel(id) ON DELETE CASCADE,
  wave_direction_deg          numeric NOT NULL,
  wave_period_s               numeric NOT NULL,
  heave_amplitude_m_per_m     numeric NOT NULL,
  heave_phase_deg             numeric NOT NULL,
  roll_amplitude_deg_per_m    numeric NOT NULL,
  roll_phase_deg              numeric NOT NULL,
  pitch_amplitude_deg_per_m   numeric NOT NULL,
  pitch_phase_deg             numeric NOT NULL,
  created_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vessel_rao_entry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON vessel_rao_entry
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_vessel_rao_entry_vessel ON vessel_rao_entry(vessel_id);
