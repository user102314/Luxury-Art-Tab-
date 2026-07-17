-- =============================================================================
-- LUXURY ART — Migration Instagram (aucune nouvelle table)
-- Exécuter dans Supabase → SQL Editor si la base existe déjà
-- =============================================================================

BEGIN;

-- 1) Autoriser le canal INSTAGRAM
ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_canal;

ALTER TABLE orders
  ADD CONSTRAINT chk_orders_canal
  CHECK (canal IN ('SITE_WEB', 'FACEBOOK', 'INSTAGRAM'));

-- 2) Référence conversation / publication Instagram
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS reference_instagram VARCHAR(255);

COMMENT ON COLUMN orders.reference_instagram IS 'Réf. DM / publication Instagram';
COMMENT ON TABLE orders IS 'Commandes (site web + Facebook + Instagram)';

COMMIT;

-- Vérification
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'orders' AND column_name IN ('canal', 'reference_instagram');
-- SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint WHERE conname = 'chk_orders_canal';
