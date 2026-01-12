-- Add follow-up tracking columns to emergency_scans table
ALTER TABLE public.emergency_scans 
ADD COLUMN IF NOT EXISTS follow_up_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS follow_up_notes TEXT,
ADD COLUMN IF NOT EXISTS followed_up_by UUID,
ADD COLUMN IF NOT EXISTS followed_up_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN public.emergency_scans.follow_up_status IS 'Status: pending, contacted, converted, not_interested';
COMMENT ON COLUMN public.emergency_scans.follow_up_notes IS 'Admin notes about the follow-up';
COMMENT ON COLUMN public.emergency_scans.followed_up_by IS 'Admin who performed the follow-up';
COMMENT ON COLUMN public.emergency_scans.followed_up_at IS 'When the follow-up was done';