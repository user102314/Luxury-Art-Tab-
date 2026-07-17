-- =============================================================================
-- LUXURY ART — Migration numéro de colis
-- Exécuter dans Supabase → SQL Editor si la base existe déjà
-- =============================================================================

BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS numero_colis VARCHAR(64);

COMMENT ON COLUMN orders.numero_colis IS 'Numéro de suivi colis généré à la confirmation';

COMMIT;
