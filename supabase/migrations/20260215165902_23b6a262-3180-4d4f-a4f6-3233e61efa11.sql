-- Allow anonymous users to read basic profile location data for the public map
CREATE POLICY "Anon users can view public profile data"
ON public.profiles
FOR SELECT
TO anon
USING (true);