-- ============================================================
-- EIM Consult — Full RLS Policies
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- Helper: reusable admin check
-- A user is admin if their profile row has role = 'admin'
-- ============================================================


-- ========================
-- 1. PROFILES
-- ========================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );


-- ========================
-- 2. EVENTS
-- ========================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Anyone can read published events
CREATE POLICY "Public can read published events"
  ON public.events FOR SELECT
  USING (status = 'published');

-- Admins can read all events (including drafts)
CREATE POLICY "Admins can read all events"
  ON public.events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Admins can create events
CREATE POLICY "Admins can insert events"
  ON public.events FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Admins can update events
CREATE POLICY "Admins can update events"
  ON public.events FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Admins can delete events
CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );


-- ========================
-- 3. EVENT TICKETS
-- ========================
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;

-- Anyone can read active tickets
CREATE POLICY "Public can read active tickets"
  ON public.event_tickets FOR SELECT
  USING (is_active = true);

-- Admins full access
CREATE POLICY "Admins can read all tickets"
  ON public.event_tickets FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert tickets"
  ON public.event_tickets FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update tickets"
  ON public.event_tickets FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete tickets"
  ON public.event_tickets FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );


-- ========================
-- 4. EVENT REGISTRATIONS
-- ========================
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can register for events
CREATE POLICY "Users can insert their own registration"
  ON public.event_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own registrations
CREATE POLICY "Users can read their own registrations"
  ON public.event_registrations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can cancel their own registration
CREATE POLICY "Users can update their own registrations"
  ON public.event_registrations FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins can read all registrations"
  ON public.event_registrations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all registrations"
  ON public.event_registrations FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete registrations"
  ON public.event_registrations FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );


-- ========================
-- 5. COMPANIES
-- ========================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Anyone can read verified companies
CREATE POLICY "Public can read verified companies"
  ON public.companies FOR SELECT
  USING (is_verified = true);

-- Company owners can read their own
CREATE POLICY "Owners can read their own company"
  ON public.companies FOR SELECT
  USING (auth.uid() = user_id);

-- Company owners can update their own
CREATE POLICY "Owners can update their own company"
  ON public.companies FOR UPDATE
  USING (auth.uid() = user_id);

-- Authenticated users can create a company
CREATE POLICY "Users can insert a company"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins can read all companies"
  ON public.companies FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all companies"
  ON public.companies FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete companies"
  ON public.companies FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );


-- ========================
-- 6. JOB POSTINGS
-- ========================
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- Anyone can read published jobs
CREATE POLICY "Public can read published jobs"
  ON public.job_postings FOR SELECT
  USING (status = 'published');

-- Posters can read their own jobs
CREATE POLICY "Posters can read their own jobs"
  ON public.job_postings FOR SELECT
  USING (auth.uid() = posted_by);

-- Posters can create jobs
CREATE POLICY "Users can insert jobs"
  ON public.job_postings FOR INSERT
  WITH CHECK (auth.uid() = posted_by);

-- Posters can update their own jobs
CREATE POLICY "Posters can update their own jobs"
  ON public.job_postings FOR UPDATE
  USING (auth.uid() = posted_by);

-- Admins full access
CREATE POLICY "Admins can read all jobs"
  ON public.job_postings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all jobs"
  ON public.job_postings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete jobs"
  ON public.job_postings FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );


-- ========================
-- 7. JOB APPLICATIONS
-- ========================
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Users can submit applications
CREATE POLICY "Users can insert their own applications"
  ON public.job_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own applications
CREATE POLICY "Users can read their own applications"
  ON public.job_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own applications
CREATE POLICY "Users can update their own applications"
  ON public.job_applications FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins can read all applications"
  ON public.job_applications FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all applications"
  ON public.job_applications FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );


-- ========================
-- 8. MENTOR APPLICATIONS
-- ========================
ALTER TABLE public.mentor_applications ENABLE ROW LEVEL SECURITY;

-- Users can submit their own application
CREATE POLICY "Users can insert their own mentor application"
  ON public.mentor_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own application
CREATE POLICY "Users can read their own mentor application"
  ON public.mentor_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins can read all mentor applications"
  ON public.mentor_applications FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all mentor applications"
  ON public.mentor_applications FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );


-- ========================
-- 9. MENTORSHIPS
-- ========================
ALTER TABLE public.mentorships ENABLE ROW LEVEL SECURITY;

-- Mentors and mentees can read their own mentorships
CREATE POLICY "Mentors can read their mentorships"
  ON public.mentorships FOR SELECT
  USING (auth.uid() = mentor_id);

CREATE POLICY "Mentees can read their mentorships"
  ON public.mentorships FOR SELECT
  USING (auth.uid() = mentee_id);

-- Mentees can request a mentorship
CREATE POLICY "Mentees can insert mentorships"
  ON public.mentorships FOR INSERT
  WITH CHECK (auth.uid() = mentee_id);

-- Mentors can update their mentorships (accept/reject)
CREATE POLICY "Mentors can update their mentorships"
  ON public.mentorships FOR UPDATE
  USING (auth.uid() = mentor_id);

-- Admins full access
CREATE POLICY "Admins can read all mentorships"
  ON public.mentorships FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all mentorships"
  ON public.mentorships FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete mentorships"
  ON public.mentorships FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );


-- ========================
-- 10. POSTS (Blog)
-- ========================
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts
CREATE POLICY "Public can read published posts"
  ON public.posts FOR SELECT
  USING (status = 'published');

-- Admins full access
CREATE POLICY "Admins can read all posts"
  ON public.posts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert posts"
  ON public.posts FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update posts"
  ON public.posts FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete posts"
  ON public.posts FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );


-- ========================
-- 11. POST CATEGORIES
-- ========================
ALTER TABLE public.post_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read categories
CREATE POLICY "Public can read categories"
  ON public.post_categories FOR SELECT
  USING (true);

-- Admins can manage categories
CREATE POLICY "Admins can insert categories"
  ON public.post_categories FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update categories"
  ON public.post_categories FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete categories"
  ON public.post_categories FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );


-- ========================
-- 12. NEWSLETTER SUBSCRIBERS
-- ========================
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert) — no auth required
CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- Subscribers can update their own row (unsubscribe, confirm)
CREATE POLICY "Subscribers can update by email match"
  ON public.newsletter_subscribers FOR SELECT
  USING (true);  -- Needed for confirm/unsubscribe token lookups

-- Admins full access
CREATE POLICY "Admins can read all subscribers"
  ON public.newsletter_subscribers FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update subscribers"
  ON public.newsletter_subscribers FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete subscribers"
  ON public.newsletter_subscribers FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );


-- ========================
-- 13. NEWSLETTER CAMPAIGNS
-- ========================
ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- Admins only
CREATE POLICY "Admins can read campaigns"
  ON public.newsletter_campaigns FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert campaigns"
  ON public.newsletter_campaigns FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update campaigns"
  ON public.newsletter_campaigns FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete campaigns"
  ON public.newsletter_campaigns FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );


-- ========================
-- 14. CAMPAIGN ANALYTICS
-- ========================
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;

-- Admins only
CREATE POLICY "Admins can read campaign analytics"
  ON public.campaign_analytics FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert campaign analytics"
  ON public.campaign_analytics FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update campaign analytics"
  ON public.campaign_analytics FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );


-- ========================
-- 15. APP SETTINGS
-- ========================
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (public config)
CREATE POLICY "Public can read settings"
  ON public.app_settings FOR SELECT
  USING (true);

-- Admins can manage settings
CREATE POLICY "Admins can insert settings"
  ON public.app_settings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update settings"
  ON public.app_settings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );


-- ========================
-- 16. PUBLIC READ FOR MENTORS DIRECTORY
-- ========================
-- The mentors page shows approved mentors publicly.
-- This allows reading profiles with role = 'mentor' for the directory.
CREATE POLICY "Public can read mentor profiles"
  ON public.profiles FOR SELECT
  USING (role = 'mentor');
