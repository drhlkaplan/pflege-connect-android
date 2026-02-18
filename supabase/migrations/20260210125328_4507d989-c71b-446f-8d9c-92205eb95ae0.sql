
-- Drop the overly permissive INSERT policy
DROP POLICY "Authenticated users can insert notifications" ON public.notifications;

-- Create a more restrictive INSERT policy - only authenticated users can insert
CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);
