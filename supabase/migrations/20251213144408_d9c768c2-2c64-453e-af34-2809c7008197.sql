-- Create storage bucket for report files (PDFs, images)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('report-files', 'report-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload report files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'report-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view their own files
CREATE POLICY "Users can view own report files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'report-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own report files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'report-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add file reference and language columns to fertilizer_reports
ALTER TABLE public.fertilizer_reports 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';