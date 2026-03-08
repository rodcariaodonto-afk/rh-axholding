-- Create enum for feedback type
CREATE TYPE public.feedback_type AS ENUM ('positive', 'neutral', 'negative');

-- Create feedbacks table
CREATE TABLE public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  feedback_type feedback_type NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT feedbacks_sender_receiver_different CHECK (sender_id != receiver_id)
);

-- Enable RLS
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view feedbacks they sent or received
CREATE POLICY "feedbacks_select_own"
ON public.feedbacks
FOR SELECT
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Admin and People can view all feedbacks
CREATE POLICY "feedbacks_select_admin_people"
ON public.feedbacks
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'));

-- Users can create feedbacks (as sender)
CREATE POLICY "feedbacks_insert"
ON public.feedbacks
FOR INSERT
WITH CHECK (sender_id = auth.uid());

-- Only admin can delete feedbacks
CREATE POLICY "feedbacks_delete"
ON public.feedbacks
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE TRIGGER update_feedbacks_updated_at
BEFORE UPDATE ON public.feedbacks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_feedbacks_sender_id ON public.feedbacks(sender_id);
CREATE INDEX idx_feedbacks_receiver_id ON public.feedbacks(receiver_id);
CREATE INDEX idx_feedbacks_created_at ON public.feedbacks(created_at DESC);