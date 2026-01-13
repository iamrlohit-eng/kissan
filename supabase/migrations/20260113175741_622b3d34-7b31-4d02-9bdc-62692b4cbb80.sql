-- Create a dedicated storage bucket for emergency scans
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'emergency-scans',
  'emergency-scans',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Create policy for anyone to upload emergency scans (to 'scans' folder)
CREATE POLICY "Anyone can upload emergency scans"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'emergency-scans'
  AND (storage.foldername(name))[1] = 'scans'
);

-- Create policy for anyone to view emergency scans (needed for signed URLs)
CREATE POLICY "Anyone can view emergency scans"
ON storage.objects FOR SELECT
USING (bucket_id = 'emergency-scans');