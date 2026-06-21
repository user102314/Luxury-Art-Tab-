-- =============================================================================
-- Supabase Storage — bucket pour images produits
-- Exécuter dans Supabase SQL Editor
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Lecture publique des images
CREATE POLICY "Images produits lisibles publiquement"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Upload via service role (backend) — pas de policy anon requise si backend utilise service_role
