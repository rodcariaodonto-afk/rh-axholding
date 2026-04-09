
CREATE TABLE public.lgpd_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  request_type TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.lgpd_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert lgpd requests" ON public.lgpd_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "No public read" ON public.lgpd_requests FOR SELECT USING (false);
