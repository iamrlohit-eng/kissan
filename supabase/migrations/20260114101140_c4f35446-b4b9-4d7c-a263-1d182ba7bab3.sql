-- Add SELECT policy for emergency_scans allowing guests to view their own scan via RPC only
-- The existing get_emergency_scan_by_identifier RPC provides secure access
-- Add policy allowing users to view their own role
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Add policy allowing users to view their own audit logs
CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Add DELETE policy for admins to manage audit logs
CREATE POLICY "Admins can delete audit logs"
ON public.audit_logs
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add DELETE policy for admins to remove old admin requests
CREATE POLICY "Admins can delete admin requests"
ON public.admin_requests
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));