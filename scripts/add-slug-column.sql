-- Add slug column to spaces table (nullable initially)
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS slug TEXT;
