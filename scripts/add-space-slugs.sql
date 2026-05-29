-- Add slug column to spaces table
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS spaces_slug_unique ON spaces (slug) WHERE slug IS NOT NULL;

-- Generate basic slugs for existing spaces using id as suffix to ensure uniqueness
UPDATE spaces
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRIM(title) || '-' || SUBSTRING(id::TEXT, 1, 8),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- Make slug NOT NULL after populating
ALTER TABLE spaces ALTER COLUMN slug SET NOT NULL;
