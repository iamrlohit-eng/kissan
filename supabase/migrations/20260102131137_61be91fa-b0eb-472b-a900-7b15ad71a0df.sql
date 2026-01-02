-- Fix audit logs security issue: Update log_activity() to use server-determined user identity
-- Drop existing function and recreate with proper auth validation

CREATE OR REPLACE FUNCTION public.log_activity(
    _user_id UUID,
    _user_email TEXT,
    _activity_type activity_type,
    _description TEXT DEFAULT NULL,
    _metadata JSONB DEFAULT '{}',
    _ip_address TEXT DEFAULT NULL,
    _user_agent TEXT DEFAULT NULL,
    _page_path TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    log_id UUID;
    actual_user_id UUID;
    actual_user_email TEXT;
BEGIN
    -- Get authenticated user ID (cannot be spoofed by client)
    actual_user_id := auth.uid();
    
    -- Get user email from auth.users (trusted source)
    SELECT email INTO actual_user_email 
    FROM auth.users 
    WHERE id = actual_user_id;
    
    -- Log with server-determined user identity only (ignore _user_id and _user_email params)
    INSERT INTO public.audit_logs (
        user_id, user_email, activity_type, description, 
        metadata, ip_address, user_agent, page_path
    )
    VALUES (
        actual_user_id,
        actual_user_email,
        _activity_type, 
        _description, 
        _metadata, 
        _ip_address, 
        _user_agent, 
        _page_path
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- Update INSERT policy to be more restrictive
DROP POLICY IF EXISTS "Allow log insertion" ON public.audit_logs;

CREATE POLICY "Users can log their own activities"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());