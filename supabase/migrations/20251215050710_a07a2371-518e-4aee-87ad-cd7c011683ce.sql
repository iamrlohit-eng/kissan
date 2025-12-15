-- Make the report-files bucket private
UPDATE storage.buckets SET public = false WHERE id = 'report-files';