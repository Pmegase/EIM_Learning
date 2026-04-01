-- ============================================================
-- EIM Platform: App Settings (admin-configurable)
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed by API routes)
CREATE POLICY "Anyone can read settings"
  ON public.app_settings FOR SELECT USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can manage settings"
  ON public.app_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Seed default email settings
INSERT INTO public.app_settings (key, value) VALUES
  ('email_provider', '"gmail"'::jsonb)
ON CONFLICT (key) DO NOTHING;
