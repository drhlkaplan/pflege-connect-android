-- Replace the existing profiles_public view to include latitude/longitude for map
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public AS
  SELECT id, user_id, role, full_name, city, country, avatar_url, latitude, longitude, created_at
  FROM public.profiles;

-- Add a SELECT policy allowing all authenticated users to read basic profile data for map/directory
CREATE POLICY "Authenticated users can view public profile data"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Drop the old restrictive select policy since the new one covers it
DROP POLICY IF EXISTS "Users can view own profile or admin" ON public.profiles;