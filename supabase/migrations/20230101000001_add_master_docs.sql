-- Add master resume and cover letter fields to user profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS master_resume TEXT,
ADD COLUMN IF NOT EXISTS master_cover_letter TEXT;
