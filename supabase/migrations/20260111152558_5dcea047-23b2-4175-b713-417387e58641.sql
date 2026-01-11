-- Add policy to allow reading emergency scans by guest identifier (for shareable links)
CREATE POLICY "Anyone can view emergency scans by identifier"
ON public.emergency_scans
FOR SELECT
USING (true);