-- ============================================================
-- SubLift — Initial Schema Migration
-- 001_initial_schema.sql
-- ============================================================

-- Enable pgcrypto for gen_random_uuid() (already available on Supabase)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Helper: updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. vessel
-- ============================================================
CREATE TABLE vessel (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     text NOT NULL,
  vessel_type              text NOT NULL CHECK (vessel_type IN ('PLSV', 'LCV', 'HLV')),
  description              text,
  deck_length_m            numeric NOT NULL,
  deck_width_m             numeric NOT NULL,
  deck_origin_x            numeric NOT NULL DEFAULT 0,
  deck_origin_y            numeric NOT NULL DEFAULT 0,
  crane_type               text NOT NULL CHECK (crane_type IN ('OMC', 'knuckle_boom')),
  crane_pedestal_x         numeric NOT NULL,
  crane_pedestal_y         numeric NOT NULL,
  crane_pedestal_height_m  numeric NOT NULL,
  crane_boom_length_m      numeric NOT NULL,
  crane_jib_length_m       numeric,
  crane_slew_min_deg       numeric DEFAULT 0,
  crane_slew_max_deg       numeric DEFAULT 360,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vessel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON vessel
  FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER vessel_updated_at
  BEFORE UPDATE ON vessel
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 2. vessel_barrier
-- ============================================================
CREATE TABLE vessel_barrier (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id  uuid NOT NULL REFERENCES vessel(id) ON DELETE CASCADE,
  name       text NOT NULL,
  x_m        numeric NOT NULL,
  y_m        numeric NOT NULL,
  length_m   numeric NOT NULL,
  width_m    numeric NOT NULL,
  height_m   numeric DEFAULT 1.0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vessel_barrier ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON vessel_barrier
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_vessel_barrier_vessel ON vessel_barrier(vessel_id);

-- ============================================================
-- 3. deck_load_zone
-- ============================================================
CREATE TABLE deck_load_zone (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id           uuid NOT NULL REFERENCES vessel(id) ON DELETE CASCADE,
  name                text NOT NULL,
  x_m                 numeric NOT NULL,
  y_m                 numeric NOT NULL,
  length_m            numeric NOT NULL,
  width_m             numeric NOT NULL,
  capacity_t_per_m2   numeric NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE deck_load_zone ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON deck_load_zone
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_deck_load_zone_vessel ON deck_load_zone(vessel_id);

-- ============================================================
-- 4. crane_curve_point
-- ============================================================
CREATE TABLE crane_curve_point (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id       uuid NOT NULL REFERENCES vessel(id) ON DELETE CASCADE,
  radius_m        numeric NOT NULL,
  capacity_t      numeric NOT NULL,
  boom_angle_deg  numeric,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE crane_curve_point ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON crane_curve_point
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_crane_curve_point_vessel ON crane_curve_point(vessel_id);

-- ============================================================
-- 5. equipment_library
-- ============================================================
CREATE TABLE equipment_library (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text NOT NULL,
  description          text,
  length_m             numeric NOT NULL,
  width_m              numeric NOT NULL,
  height_m             numeric NOT NULL,
  dry_weight_t         numeric NOT NULL,
  geometry_type        text NOT NULL CHECK (geometry_type IN ('box', 'cylinder')),
  submerged_volume_m3  numeric,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE equipment_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON equipment_library
  FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER equipment_library_updated_at
  BEFORE UPDATE ON equipment_library
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 6. project
-- ============================================================
CREATE TABLE project (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  description      text,
  field_name       text,
  water_depth_m    numeric,
  vessel_id        uuid NOT NULL REFERENCES vessel(id) ON DELETE RESTRICT,
  vessel_snapshot  jsonb,
  status           text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'analyzed', 'complete')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE project ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON project
  FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER project_updated_at
  BEFORE UPDATE ON project
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_project_vessel ON project(vessel_id);

-- ============================================================
-- 7. project_equipment
-- ============================================================
CREATE TABLE project_equipment (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id                    uuid NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  equipment_id                  uuid NOT NULL REFERENCES equipment_library(id) ON DELETE RESTRICT,
  label                         text,
  deck_pos_x                    numeric NOT NULL,
  deck_pos_y                    numeric NOT NULL,
  deck_rotation_deg             numeric NOT NULL DEFAULT 0,
  overboard_pos_x               numeric,
  overboard_pos_y               numeric,
  crane_slew_deck_deg           numeric,
  crane_boom_angle_deck_deg     numeric,
  crane_radius_deck_m           numeric,
  crane_capacity_deck_t         numeric,
  crane_slew_overboard_deg      numeric,
  crane_boom_angle_overboard_deg numeric,
  crane_radius_overboard_m      numeric,
  crane_capacity_overboard_t    numeric,
  deck_load_ok                  boolean,
  capacity_check_deck_ok        boolean,
  capacity_check_overboard_ok   boolean,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE project_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON project_equipment
  FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER project_equipment_updated_at
  BEFORE UPDATE ON project_equipment
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_project_equipment_project ON project_equipment(project_id);
CREATE INDEX idx_project_equipment_equipment ON project_equipment(equipment_id);

-- ============================================================
-- 8. rao_entry
-- ============================================================
CREATE TABLE rao_entry (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id                  uuid NOT NULL REFERENCES project(id) ON DELETE CASCADE,
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

ALTER TABLE rao_entry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON rao_entry
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_rao_entry_project ON rao_entry(project_id);

-- ============================================================
-- 9. splash_zone_result
-- ============================================================
CREATE TABLE splash_zone_result (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_equipment_id  uuid NOT NULL REFERENCES project_equipment(id) ON DELETE CASCADE,
  cd_x                  numeric NOT NULL,
  cd_y                  numeric NOT NULL,
  cd_z                  numeric NOT NULL,
  ca                    numeric NOT NULL,
  cs                    numeric NOT NULL,
  projected_area_x_m2   numeric NOT NULL,
  projected_area_y_m2   numeric NOT NULL,
  projected_area_z_m2   numeric NOT NULL,
  submerged_volume_m3   numeric NOT NULL,
  crane_tip_heave_m     numeric NOT NULL,
  crane_tip_lateral_m   numeric NOT NULL,
  daf                   numeric NOT NULL,
  max_hs_m              numeric NOT NULL,
  calculated_at         timestamptz NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE splash_zone_result ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON splash_zone_result
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 10. sea_state_limit
-- ============================================================
CREATE TABLE sea_state_limit (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  splash_zone_result_id uuid NOT NULL REFERENCES splash_zone_result(id) ON DELETE CASCADE,
  hs_m                  numeric NOT NULL,
  tp_s                  numeric NOT NULL,
  is_feasible           boolean NOT NULL,
  utilization_pct       numeric NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sea_state_limit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON sea_state_limit
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_sea_state_limit_result ON sea_state_limit(splash_zone_result_id);

-- ============================================================
-- 11. scatter_diagram_entry
-- ============================================================
CREATE TABLE scatter_diagram_entry (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  hs_m            numeric NOT NULL,
  tp_s            numeric NOT NULL,
  occurrence_pct  numeric NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE scatter_diagram_entry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON scatter_diagram_entry
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_scatter_diagram_entry_project ON scatter_diagram_entry(project_id);

-- ============================================================
-- 12. weather_window_result
-- ============================================================
CREATE TABLE weather_window_result (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_equipment_id  uuid NOT NULL REFERENCES project_equipment(id) ON DELETE CASCADE,
  operability_pct       numeric NOT NULL,
  max_hs_limit_m        numeric NOT NULL,
  calculated_at         timestamptz NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE weather_window_result ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON weather_window_result
  FOR ALL USING (true) WITH CHECK (true);
