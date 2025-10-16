-- This script removes unused columns from the 'letters' table and drops the 'music_tracks' table.
-- Make sure to back up your data before running this script, as these changes are irreversible.

-- Step 1: Drop specified columns from the 'letters' table.
ALTER TABLE public.letters
  DROP COLUMN IF EXISTS content,
  DROP COLUMN IF EXISTS music_id,
  DROP COLUMN IF EXISTS audio_url,
  DROP COLUMN IF EXISTS receiver_name,
  DROP COLUMN IF EXISTS upgraded_by,
  DROP COLUMN IF EXISTS is_finalized,
  DROP COLUMN IF EXISTS opened_at,
  DROP COLUMN IF EXISTS is_permanent,
  DROP COLUMN IF EXISTS is_paid;

-- Step 2: Drop the 'music_tracks' table.
DROP TABLE IF EXISTS public.music_tracks;