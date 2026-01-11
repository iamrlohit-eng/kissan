-- Create a table for emergency/guest soil scans
CREATE TABLE public.emergency_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_identifier TEXT NOT NULL,
  guest_name TEXT,
  guest_phone TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  location_text TEXT,
  file_url TEXT,
  file_type TEXT,
  nitrogen NUMERIC,
  phosphorus NUMERIC,
  potassium NUMERIC,
  ph NUMERIC,
  organic_matter NUMERIC,
  moisture NUMERIC,
  temperature NUMERIC,
  ai_analysis TEXT,
  recommended_crops TEXT[],
  improvement_techniques TEXT[],
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.emergency_scans ENABLE ROW LEVEL SECURITY;

-- Create policy for guests to insert their own scans (no auth required)
CREATE POLICY "Anyone can insert emergency scans"
ON public.emergency_scans
FOR INSERT
WITH CHECK (true);

-- Create policy for admins to view all emergency scans
CREATE POLICY "Admins can view all emergency scans"
ON public.emergency_scans
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policy for admins to delete emergency scans
CREATE POLICY "Admins can delete emergency scans"
ON public.emergency_scans
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));