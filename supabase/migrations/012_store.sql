CREATE TABLE IF NOT EXISTS public.store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  price NUMERIC(10,2),
  currency TEXT NOT NULL DEFAULT 'GHS',
  purchase_url TEXT,
  is_free BOOLEAN NOT NULL DEFAULT false,
  pickup_location TEXT,
  pickup_instructions TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_items_status ON public.store_items(status);
CREATE INDEX IF NOT EXISTS idx_store_items_slug ON public.store_items(slug);
