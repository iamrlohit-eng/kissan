-- Set report-files bucket to private to prevent direct URL access
-- This ensures RLS policies are respected and files require signed URLs
UPDATE storage.buckets 
SET public = false 
WHERE id = 'report-files';