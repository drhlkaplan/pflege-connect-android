
-- The previous policies were created as RESTRICTIVE (the table default)
-- We need them PERMISSIVE so OR logic applies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Explicitly create as PERMISSIVE
CREATE POLICY "Users can view own profile"
ON public.profiles
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Also need anon access for the profiles_public view (security_invoker)
CREATE POLICY "Anon can read own profile via view"
ON public.profiles
AS PERMISSIVE
FOR SELECT
TO anon
USING (false);
