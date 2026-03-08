-- Add DELETE policy for time_off_requests (admin only)
CREATE POLICY "Admin can delete requests"
ON public.time_off_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));