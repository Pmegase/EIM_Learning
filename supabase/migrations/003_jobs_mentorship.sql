-- ============================================================
-- EIM Platform: Jobs & Mentorship System
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Companies table (corporate partner profiles)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  industry TEXT NOT NULL DEFAULT 'other',
  website TEXT,
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  location TEXT,
  country TEXT,
  employee_count TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view verified companies"
  ON public.companies FOR SELECT USING (is_verified = true);

CREATE POLICY "Owners can view own company"
  ON public.companies FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Owners can insert own company"
  ON public.companies FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update own company"
  ON public.companies FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all companies"
  ON public.companies FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );


-- 2. Job Postings table
CREATE TABLE IF NOT EXISTS public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  posted_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  requirements TEXT NOT NULL DEFAULT '',
  responsibilities TEXT NOT NULL DEFAULT '',
  -- Classification
  job_type TEXT NOT NULL DEFAULT 'full-time' CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship', 'volunteer')),
  experience_level TEXT NOT NULL DEFAULT 'entry' CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
  industry TEXT NOT NULL DEFAULT 'other',
  -- Location
  location TEXT,
  country TEXT,
  is_remote BOOLEAN NOT NULL DEFAULT false,
  -- Compensation
  salary_min DECIMAL(10,2),
  salary_max DECIMAL(10,2),
  salary_currency TEXT DEFAULT 'GHS',
  show_salary BOOLEAN NOT NULL DEFAULT false,
  -- Dates
  deadline TIMESTAMPTZ,
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'filled')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  -- Metadata
  application_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published jobs"
  ON public.job_postings FOR SELECT USING (status = 'published');

CREATE POLICY "Company owners can manage own jobs"
  ON public.job_postings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.companies c WHERE c.id = job_postings.company_id AND c.user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all jobs"
  ON public.job_postings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );


-- 3. Job Applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Applicant info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cover_letter TEXT,
  resume_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  -- Status
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'shortlisted', 'interview', 'offered', 'rejected', 'withdrawn')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
  ON public.job_applications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON public.job_applications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Company owners can view applications for their jobs"
  ON public.job_applications FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.job_postings jp
      JOIN public.companies c ON c.id = jp.company_id
      WHERE jp.id = job_applications.job_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all applications"
  ON public.job_applications FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );


-- 4. Mentorships table (matching approved mentors with mentees)
CREATE TABLE IF NOT EXISTS public.mentorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Request details
  message TEXT,
  goals TEXT,
  preferred_schedule TEXT,
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'declined', 'cancelled')),
  -- Dates
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  -- Admin/mentor notes
  mentor_notes TEXT,
  admin_notes TEXT,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mentor_id, mentee_id)
);

ALTER TABLE public.mentorships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their mentorships"
  ON public.mentorships FOR SELECT USING (
    auth.uid() = mentor_id OR auth.uid() = mentee_id
  );

CREATE POLICY "Mentees can request mentorship"
  ON public.mentorships FOR INSERT WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Mentors can update their mentorships"
  ON public.mentorships FOR UPDATE USING (auth.uid() = mentor_id);

CREATE POLICY "Mentees can update their mentorships"
  ON public.mentorships FOR UPDATE USING (auth.uid() = mentee_id);

CREATE POLICY "Admins can manage all mentorships"
  ON public.mentorships FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );


-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_slug ON public.job_postings(slug);
CREATE INDEX IF NOT EXISTS idx_job_postings_company_id ON public.job_postings(company_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON public.job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_job_type ON public.job_postings(job_type);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON public.job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_mentor_id ON public.mentorships(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_mentee_id ON public.mentorships(mentee_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_status ON public.mentorships(status);

-- 6. Triggers
CREATE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_mentorships_updated_at
  BEFORE UPDATE ON public.mentorships
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. Increment application count on job
CREATE OR REPLACE FUNCTION public.increment_application_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.job_postings SET application_count = application_count + 1 WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_job_application_created
  AFTER INSERT ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.increment_application_count();
