-- Create job postings table for companies
CREATE TABLE public.job_postings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_profile_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[] DEFAULT '{}'::text[],
    benefits TEXT[] DEFAULT '{}'::text[],
    location TEXT,
    employment_type TEXT DEFAULT 'full_time', -- full_time, part_time, contract, temporary
    salary_min NUMERIC,
    salary_max NUMERIC,
    experience_required INTEGER DEFAULT 0,
    german_level_required TEXT,
    specializations_required TEXT[] DEFAULT '{}'::text[],
    is_active BOOLEAN DEFAULT true,
    applications_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active job postings
CREATE POLICY "Anyone can view active job postings"
ON public.job_postings
FOR SELECT
USING (is_active = true);

-- Companies can view all their own postings
CREATE POLICY "Companies can view all their postings"
ON public.job_postings
FOR SELECT
USING (
    company_profile_id IN (
        SELECT cp.id FROM public.company_profiles cp
        WHERE cp.profile_id = get_user_profile_id()
    )
);

-- Companies can insert their own postings
CREATE POLICY "Companies can insert their own postings"
ON public.job_postings
FOR INSERT
WITH CHECK (
    get_user_role() = 'company' AND
    company_profile_id IN (
        SELECT cp.id FROM public.company_profiles cp
        WHERE cp.profile_id = get_user_profile_id()
    )
);

-- Companies can update their own postings
CREATE POLICY "Companies can update their own postings"
ON public.job_postings
FOR UPDATE
USING (
    company_profile_id IN (
        SELECT cp.id FROM public.company_profiles cp
        WHERE cp.profile_id = get_user_profile_id()
    )
);

-- Companies can delete their own postings
CREATE POLICY "Companies can delete their own postings"
ON public.job_postings
FOR DELETE
USING (
    company_profile_id IN (
        SELECT cp.id FROM public.company_profiles cp
        WHERE cp.profile_id = get_user_profile_id()
    )
);

-- Add trigger for updated_at
CREATE TRIGGER update_job_postings_updated_at
BEFORE UPDATE ON public.job_postings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();