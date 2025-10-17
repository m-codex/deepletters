-- This script removes columns from the 'letters' table that are no longer in use
-- after the removal of encryption, voice recording, and expiration features.

ALTER TABLE letters
DROP COLUMN expires_at,
DROP COLUMN storage_path;


-- Instructions for Storage Bucket Cleanup:
-- The 'encrypted-letters' storage bucket is no longer used by the application.
-- To delete it, please follow these steps in your Supabase project dashboard:
-- 1. Go to the 'Storage' section.
-- 2. Find the 'encrypted-letters' bucket.
-- 3. Click the three dots (...) next to the bucket name and select 'Delete bucket'.
-- 4. Confirm the deletion.
--
-- The 'music-tracks' bucket is still in use and should NOT be deleted.