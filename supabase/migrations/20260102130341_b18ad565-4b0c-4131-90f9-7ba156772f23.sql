-- Enable realtime for audit_logs table
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;

-- Create a view to get user info with roles for admin management
CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  role TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    au.id as user_id,
    au.email,
    au.created_at,
    COALESCE(ur.role::text, 'user') as role
  FROM auth.users au
  LEFT JOIN public.user_roles ur ON au.id = ur.user_id
  ORDER BY au.created_at DESC;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_all_users_with_roles() TO authenticated;