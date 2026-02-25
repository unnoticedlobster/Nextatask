-- Add remote and distance filter fields to profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS remote_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS distance_miles INTEGER DEFAULT 25;

-- Add URL field to Jobs
ALTER TABLE public.job_logs
ADD COLUMN IF NOT EXISTS url TEXT;
