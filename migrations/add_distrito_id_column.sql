-- ============================================================================
-- MIGRATION: Add distrito_id Foreign Key to Conductores Table
-- Date: 2026-01-08
-- Purpose: Link conductores to distritos table for referential integrity
-- ============================================================================

-- Add distrito_id column
ALTER TABLE conductores
ADD COLUMN IF NOT EXISTS distrito_id INTEGER;

-- Add foreign key constraint
ALTER TABLE conductores
ADD CONSTRAINT fk_conductores_distrito 
  FOREIGN KEY (distrito_id) 
  REFERENCES distritos(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_conductores_distrito_id ON conductores(distrito_id);

-- Migrate existing data from domicilioDistrito to distrito_id
-- Match district names to IDs
UPDATE conductores c
SET distrito_id = d.id
FROM distritos d
WHERE UPPER(TRIM(c."domicilioDistrito")) = UPPER(TRIM(d.nombre))
  AND c.distrito_id IS NULL
  AND c."domicilioDistrito" IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN conductores.distrito_id IS 'Foreign key to distritos table - district where conductor lives';

-- Verify migration
SELECT 
    COUNT(*) as total_conductores,
    COUNT(distrito_id) as con_distrito_id,
    COUNT("domicilioDistrito") as con_distrito_texto,
    COUNT(*) - COUNT(distrito_id) as sin_distrito_id
FROM conductores;

-- Success message
DO $$
DECLARE
    migrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migrated_count FROM conductores WHERE distrito_id IS NOT NULL;
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE 'Added distrito_id column with foreign key constraint';
    RAISE NOTICE 'Migrated % conductores from domicilioDistrito to distrito_id', migrated_count;
END $$;
