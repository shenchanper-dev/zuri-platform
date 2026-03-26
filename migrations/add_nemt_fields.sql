-- ============================================================================
-- MIGRATION: Add NEMT-Specific Fields to Conductores Table
-- Date: 2026-01-07
-- Purpose: Add missing fields for NEMT compliance (services, equipment, photos)
-- ============================================================================

-- Add missing NEMT-specific columns
ALTER TABLE conductores
ADD COLUMN IF NOT EXISTS servicios JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS equipamiento JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "fotoVehiculo" TEXT,
ADD COLUMN IF NOT EXISTS "licencia_categoria" VARCHAR(10),
ADD COLUMN IF NOT EXISTS "soatVencimiento" DATE,
ADD COLUMN IF NOT EXISTS "revisionTecnicaVencimiento" DATE,
ADD COLUMN IF NOT EXISTS "colorAuto" VARCHAR(50);

-- Add indexes for performance on JSONB columns
CREATE INDEX IF NOT EXISTS idx_conductores_servicios ON conductores USING GIN (servicios);
CREATE INDEX IF NOT EXISTS idx_conductores_equipamiento ON conductores USING GIN (equipamiento);

-- Add comments for documentation
COMMENT ON COLUMN conductores.servicios IS 'NEMT services enabled for this driver (JSONB array of service codes)';
COMMENT ON COLUMN conductores.equipamiento IS 'NEMT equipment available in vehicle (JSONB array of equipment codes)';
COMMENT ON COLUMN conductores."fotoVehiculo" IS 'URL or base64 of vehicle photo';
COMMENT ON COLUMN conductores."licencia_categoria" IS 'Driver license category (e.g., A-IIb)';
COMMENT ON COLUMN conductores."soatVencimiento" IS 'SOAT insurance expiration date';
COMMENT ON COLUMN conductores."revisionTecnicaVencimiento" IS 'Technical review expiration date';
COMMENT ON COLUMN conductores."colorAuto" IS 'Vehicle color';

-- Verify migration
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'conductores' 
  AND column_name IN ('servicios', 'equipamiento', 'fotoVehiculo', 'licencia_categoria', 'soatVencimiento', 'revisionTecnicaVencimiento', 'colorAuto')
ORDER BY column_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE 'Added columns: servicios, equipamiento, fotoVehiculo, licencia_categoria, soatVencimiento, revisionTecnicaVencimiento, colorAuto';
END $$;
