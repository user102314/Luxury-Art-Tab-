-- WhatsApp canal + référence
BEGIN;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_canal;
ALTER TABLE orders ADD CONSTRAINT chk_orders_canal
  CHECK (canal IN ('SITE_WEB', 'FACEBOOK', 'INSTAGRAM', 'WHATSAPP'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reference_whatsapp VARCHAR(255);
COMMIT;
