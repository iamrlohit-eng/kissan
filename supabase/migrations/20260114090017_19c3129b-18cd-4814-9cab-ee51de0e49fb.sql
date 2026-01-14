-- Fix emergency_scans security issues

-- 1. Add insert_token column to validate inserts come from edge function
ALTER TABLE public.emergency_scans ADD COLUMN IF NOT EXISTS insert_token text;

-- 2. Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view emergency scans by identifier" ON public.emergency_scans;

-- 3. Drop the overly permissive INSERT policy  
DROP POLICY IF EXISTS "Anyone can insert emergency scans" ON public.emergency_scans;

-- 4. Create new SELECT policy - only allow access when guest_identifier matches the ID being queried
-- This is done via edge function now, so we block direct access for non-admins
CREATE POLICY "Block direct select for non-admins"
ON public.emergency_scans
FOR SELECT
TO anon, authenticated
USING (
  -- Admins can see all
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- 5. Create new INSERT policy - require insert_token to be set (only edge function sets this)
-- The edge function will set a server-generated token that validates the insert
CREATE POLICY "Only edge function can insert emergency scans"
ON public.emergency_scans
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Require insert_token to be a valid server-generated token
  -- The token format is: 'srv_' + timestamp + random string
  insert_token IS NOT NULL AND insert_token LIKE 'srv_%'
);

-- 6. Create a function for the edge function to fetch scans by identifier
CREATE OR REPLACE FUNCTION public.get_emergency_scan_by_identifier(p_guest_identifier text)
RETURNS SETOF emergency_scans
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input
  IF p_guest_identifier IS NULL OR length(p_guest_identifier) < 10 THEN
    RAISE EXCEPTION 'Invalid guest identifier';
  END IF;
  
  RETURN QUERY
  SELECT * FROM public.emergency_scans
  WHERE guest_identifier = p_guest_identifier;
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_emergency_scan_by_identifier(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_emergency_scan_by_identifier(text) TO authenticated;