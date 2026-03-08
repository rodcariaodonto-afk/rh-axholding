-- Add closed_at column to track when job was closed
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ DEFAULT NULL;

-- Create function to auto-update closed_at when status changes to 'closed'
CREATE OR REPLACE FUNCTION update_job_closed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'closed' AND (OLD.status IS NULL OR OLD.status != 'closed') THEN
    NEW.closed_at = NOW();
  ELSIF NEW.status != 'closed' THEN
    NEW.closed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating closed_at
DROP TRIGGER IF EXISTS trigger_update_job_closed_at ON public.jobs;
CREATE TRIGGER trigger_update_job_closed_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION update_job_closed_at();

-- Backfill existing closed jobs with updated_at as closed_at
UPDATE public.jobs 
SET closed_at = updated_at 
WHERE status = 'closed' AND closed_at IS NULL;