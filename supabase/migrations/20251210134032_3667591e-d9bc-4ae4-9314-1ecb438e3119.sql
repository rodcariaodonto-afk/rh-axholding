-- Add edit tracking columns to pdi_comments
ALTER TABLE public.pdi_comments 
ADD COLUMN updated_at timestamp with time zone,
ADD COLUMN edit_history jsonb DEFAULT '[]'::jsonb;

-- Create function to log comment creation in pdi_logs
CREATE OR REPLACE FUNCTION public.log_pdi_comment_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO pdi_logs (pdi_id, logged_by, event_type, description)
  VALUES (
    NEW.pdi_id,
    NEW.user_id,
    'comment_added',
    'Comentário adicionado'
  );
  RETURN NEW;
END;
$function$;

-- Create trigger for comment creation
CREATE TRIGGER pdi_comment_created_log
AFTER INSERT ON public.pdi_comments
FOR EACH ROW
EXECUTE FUNCTION public.log_pdi_comment_created();

-- Add UPDATE policy for pdi_comments (only own comments)
CREATE POLICY "pdi_comments_update" ON public.pdi_comments
FOR UPDATE USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());