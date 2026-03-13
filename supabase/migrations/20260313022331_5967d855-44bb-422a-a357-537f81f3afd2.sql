
-- Company documents: add visibility and access fields
ALTER TABLE public.company_documents
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS access_roles TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS valid_from DATE,
  ADD COLUMN IF NOT EXISTS valid_until DATE;
