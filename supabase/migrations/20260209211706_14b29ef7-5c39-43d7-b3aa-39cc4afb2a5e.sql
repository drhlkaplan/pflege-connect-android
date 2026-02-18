
-- Create job applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  nurse_profile_id UUID NOT NULL REFERENCES public.nurse_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  cover_letter TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_posting_id, nurse_profile_id)
);

-- Enable RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Nurses can view their own applications
CREATE POLICY "Nurses can view their own applications"
ON public.job_applications
FOR SELECT
USING (nurse_profile_id IN (
  SELECT np.id FROM nurse_profiles np WHERE np.profile_id = get_user_profile_id()
));

-- Nurses can insert their own applications
CREATE POLICY "Nurses can insert their own applications"
ON public.job_applications
FOR INSERT
WITH CHECK (
  get_user_role() = 'nurse'::user_role
  AND nurse_profile_id IN (
    SELECT np.id FROM nurse_profiles np WHERE np.profile_id = get_user_profile_id()
  )
);

-- Nurses can delete their own applications
CREATE POLICY "Nurses can delete their own applications"
ON public.job_applications
FOR DELETE
USING (nurse_profile_id IN (
  SELECT np.id FROM nurse_profiles np WHERE np.profile_id = get_user_profile_id()
));

-- Companies can view applications to their postings
CREATE POLICY "Companies can view applications to their postings"
ON public.job_applications
FOR SELECT
USING (job_posting_id IN (
  SELECT jp.id FROM job_postings jp
  WHERE jp.company_profile_id IN (
    SELECT cp.id FROM company_profiles cp WHERE cp.profile_id = get_user_profile_id()
  )
));

-- Companies can update application status
CREATE POLICY "Companies can update applications to their postings"
ON public.job_applications
FOR UPDATE
USING (job_posting_id IN (
  SELECT jp.id FROM job_postings jp
  WHERE jp.company_profile_id IN (
    SELECT cp.id FROM company_profiles cp WHERE cp.profile_id = get_user_profile_id()
  )
));

-- Trigger for updated_at
CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
