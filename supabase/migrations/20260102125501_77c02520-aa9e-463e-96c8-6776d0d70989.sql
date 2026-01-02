-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create activity_type enum for different types of activities
CREATE TYPE public.activity_type AS ENUM (
    'login', 
    'logout', 
    'signup',
    'page_view',
    'field_create',
    'field_update',
    'field_delete',
    'report_create',
    'report_update',
    'report_delete',
    'report_upload',
    'ai_analysis',
    'ai_chat',
    'profile_update'
);

-- Create audit_logs table for comprehensive activity tracking
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    activity_type activity_type NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    page_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_activity_type ON public.audit_logs(activity_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS on both tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to log activity (security definer to bypass RLS)
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
BEGIN
    INSERT INTO public.audit_logs (user_id, user_email, activity_type, description, metadata, ip_address, user_agent, page_path)
    VALUES (_user_id, _user_email, _activity_type, _description, _metadata, _ip_address, _user_agent, _page_path)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- RLS Policies for user_roles: Only admins can view/manage roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for audit_logs: Only admins can view
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can insert logs (via the security definer function)
CREATE POLICY "Allow log insertion"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);