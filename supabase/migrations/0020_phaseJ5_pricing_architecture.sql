-- Phase J.5 — Pricing Architecture: Single vs Variant Products
-- Eliminates dual-pricing model (product.price + variant.price)
-- After this migration, a product is EITHER simple (has_variants=false, uses product.price)
-- OR has variants (has_variants=true, each variant owns price/stock/sku/prep_time)

-- 1. Add has_variants column (default: simple product)
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants boolean NOT NULL DEFAULT false;

-- 2. Mark existing products that have non-Default variants as variant products.
-- Simple products have a system-generated "Default" variant; they remain has_variants=false.
UPDATE products 
SET has_variants = true 
WHERE id IN (
  SELECT DISTINCT product_id FROM product_variants WHERE name != 'Default'
);

-- 3. Create default variants for simple products that have none
-- Every product MUST have at least one variant for the cart system to function
INSERT INTO product_variants (product_id, name, price, stock_quantity, is_available, option_values, position)
SELECT 
  p.id, 
  'Default', 
  p.price, 
  CASE WHEN p.is_available THEN 999 ELSE 0 END,
  p.is_available, 
  '[]'::jsonb, 
  0
FROM products p
WHERE p.has_variants = false
AND p.id NOT IN (SELECT product_id FROM product_variants);

-- 4. Set product.price to 0 for variant products (price is now on variants only)
UPDATE products 
SET price = 0 
WHERE has_variants = true AND price != 0;

-- 5. Fix RLS: grant anonymous read access to product_variants
-- (public-facing pages use the anon key and need to read variant data)
DROP POLICY IF EXISTS "product_variants_read_anon" ON public.product_variants;
CREATE POLICY "product_variants_read_anon" ON public.product_variants FOR SELECT TO anon USING (true);
