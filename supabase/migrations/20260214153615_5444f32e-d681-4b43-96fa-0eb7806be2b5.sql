
-- Add is_featured column to job_postings
ALTER TABLE public.job_postings 
ADD COLUMN is_featured boolean NOT NULL DEFAULT false;

-- Add index for featured jobs queries
CREATE INDEX idx_job_postings_featured ON public.job_postings (is_featured, is_active);
