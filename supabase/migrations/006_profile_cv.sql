-- Add CV storage path to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cv_url TEXT;
