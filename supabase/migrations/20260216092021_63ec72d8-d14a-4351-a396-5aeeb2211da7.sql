
-- Recreate profiles_public view WITHOUT security_invoker so all authenticated users can read public profile data
-- The view already excludes sensitive fields (phone, email, cookie_preferences, gdpr_consent_at, etc.)
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
SELECT 
  id,
  user_id,
  role,
  full_name,
  city,
  country,
  avatar_url,
  latitude,
  longitude,
  created_at,
  show_name
FROM public.profiles;

-- Grant access to authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;
