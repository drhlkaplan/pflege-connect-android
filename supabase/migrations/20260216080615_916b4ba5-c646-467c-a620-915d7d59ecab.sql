
-- Drop the permissive messaging policy
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

-- Create restricted policy requiring accepted contact request or job application relationship
CREATE POLICY "Users can send messages to contacts" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      -- Contact request was accepted between the two users
      EXISTS (
        SELECT 1 FROM contact_requests cr
        WHERE (
          (cr.requester_id = auth.uid() AND cr.target_id = receiver_id)
          OR (cr.target_id = auth.uid() AND cr.requester_id = receiver_id)
        )
        AND cr.status = 'accepted'
      )
      OR
      -- Or they have a job application relationship (nurse applied to company's posting)
      EXISTS (
        SELECT 1 FROM job_applications ja
        JOIN job_postings jp ON ja.job_posting_id = jp.id
        JOIN company_profiles cp ON jp.company_profile_id = cp.id
        JOIN profiles cp_profile ON cp.profile_id = cp_profile.id
        JOIN nurse_profiles np ON ja.nurse_profile_id = np.id
        JOIN profiles np_profile ON np.profile_id = np_profile.id
        WHERE (
          (np_profile.user_id = auth.uid() AND cp_profile.user_id = receiver_id)
          OR (cp_profile.user_id = auth.uid() AND np_profile.user_id = receiver_id)
        )
      )
      OR
      -- Admins can message anyone
      has_role(auth.uid(), 'admin'::app_role)
    )
  );
