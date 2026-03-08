-- Create pdi_comments table
CREATE TABLE public.pdi_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pdi_id uuid NOT NULL REFERENCES public.pdis(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pdi_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "pdi_comments_select" ON public.pdi_comments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM pdis
    WHERE pdis.id = pdi_comments.pdi_id
    AND (
      pdis.employee_id = auth.uid()
      OR pdis.manager_id = auth.uid()
      OR has_role(auth.uid(), 'people')
      OR has_role(auth.uid(), 'admin')
    )
  )
);

CREATE POLICY "pdi_comments_insert" ON public.pdi_comments
FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM pdis
    WHERE pdis.id = pdi_comments.pdi_id
    AND (
      pdis.employee_id = auth.uid()
      OR pdis.manager_id = auth.uid()
      OR has_role(auth.uid(), 'people')
      OR has_role(auth.uid(), 'admin')
    )
  )
);

CREATE POLICY "pdi_comments_delete" ON public.pdi_comments
FOR DELETE USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'admin')
);

-- Add index for performance
CREATE INDEX idx_pdi_comments_pdi_id ON public.pdi_comments(pdi_id);
CREATE INDEX idx_pdi_comments_created_at ON public.pdi_comments(created_at DESC);