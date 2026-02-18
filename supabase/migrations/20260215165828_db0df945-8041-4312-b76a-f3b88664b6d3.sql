-- Fix the profiles_public view to use security_invoker for proper RLS
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
  SELECT id, user_id, role, full_name, city, country, avatar_url, latitude, longitude, created_at
  FROM public.profiles;