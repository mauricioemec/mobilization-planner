-- ============================================================
-- SubLift — Ensure RLS policies exist on all tables
-- 002_ensure_rls.sql
--
-- Run this in the Supabase SQL editor if the "Load Demo Data"
-- button fails with permission errors, or if data isn't appearing
-- after insert operations.
--
-- This script is idempotent — safe to run multiple times.
-- ============================================================

DO $$ BEGIN

  -- ── vessel ──────────────────────────────────────────────────────────────────
  ALTER TABLE IF EXISTS vessel ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vessel' AND policyname = 'Allow all access'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow all access" ON vessel FOR ALL USING (true) WITH CHECK (true)';
  END IF;

  -- ── vessel_barrier ───────────────────────────────────────────────────────────
  ALTER TABLE IF EXISTS vessel_barrier ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vessel_barrier' AND policyname = 'Allow all access'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow all access" ON vessel_barrier FOR ALL USING (true) WITH CHECK (true)';
  END IF;

  -- ── deck_load_zone ───────────────────────────────────────────────────────────
  ALTER TABLE IF EXISTS deck_load_zone ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'deck_load_zone' AND policyname = 'Allow all access'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow all access" ON deck_load_zone FOR ALL USING (true) WITH CHECK (true)';
  END IF;

  -- ── crane_curve_point ────────────────────────────────────────────────────────
  ALTER TABLE IF EXISTS crane_curve_point ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'crane_curve_point' AND policyname = 'Allow all access'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow all access" ON crane_curve_point FOR ALL USING (true) WITH CHECK (true)';
  END IF;

  -- ── equipment_library ────────────────────────────────────────────────────────
  ALTER TABLE IF EXISTS equipment_library ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'equipment_library' AND policyname = 'Allow all access'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow all access" ON equipment_library FOR ALL USING (true) WITH CHECK (true)';
  END IF;

  -- ── project ──────────────────────────────────────────────────────────────────
  ALTER TABLE IF EXISTS project ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'project' AND policyname = 'Allow all access'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow all access" ON project FOR ALL USING (true) WITH CHECK (true)';
  END IF;

  -- ── project_equipment ────────────────────────────────────────────────────────
  ALTER TABLE IF EXISTS project_equipment ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'project_equipment' AND policyname = 'Allow all access'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow all access" ON project_equipment FOR ALL USING (true) WITH CHECK (true)';
  END IF;

  -- ── rao_entry ────────────────────────────────────────────────────────────────
  ALTER TABLE IF EXISTS rao_entry ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'rao_entry' AND policyname = 'Allow all access'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow all access" ON rao_entry FOR ALL USING (true) WITH CHECK (true)';
  END IF;

  -- ── splash_zone_result ───────────────────────────────────────────────────────
  ALTER TABLE IF EXISTS splash_zone_result ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'splash_zone_result' AND policyname = 'Allow all access'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow all access" ON splash_zone_result FOR ALL USING (true) WITH CHECK (true)';
  END IF;

  -- ── sea_state_limit ──────────────────────────────────────────────────────────
  ALTER TABLE IF EXISTS sea_state_limit ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sea_state_limit' AND policyname = 'Allow all access'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow all access" ON sea_state_limit FOR ALL USING (true) WITH CHECK (true)';
  END IF;

  -- ── scatter_diagram_entry ────────────────────────────────────────────────────
  ALTER TABLE IF EXISTS scatter_diagram_entry ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scatter_diagram_entry' AND policyname = 'Allow all access'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow all access" ON scatter_diagram_entry FOR ALL USING (true) WITH CHECK (true)';
  END IF;

  -- ── weather_window_result ────────────────────────────────────────────────────
  ALTER TABLE IF EXISTS weather_window_result ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'weather_window_result' AND policyname = 'Allow all access'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow all access" ON weather_window_result FOR ALL USING (true) WITH CHECK (true)';
  END IF;

END $$;
