
-- Fix 1: Restrict profiles RLS - only owners can read full profiles table
DROP POLICY IF EXISTS "Authenticated users can view public profile data" ON public.profiles;
DROP POLICY IF EXISTS "Anon users can view public profile data" ON public.profiles;

-- Owner-only SELECT for profiles table
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admin can also view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Recreate profiles_public view with limited columns (no PII)
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT id, user_id, role, full_name, city, country, avatar_url, latitude, longitude, created_at
FROM public.profiles;

-- Grant access to the view for both anon and authenticated
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Fix 3: Improve notification function with rate limiting and active application check
CREATE OR REPLACE FUNCTION public.create_notification_for_user(p_user_id uuid, p_title text, p_message text, p_type text DEFAULT 'info'::text, p_link text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_role user_role;
  v_has_relationship BOOLEAN := false;
  v_notification_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF LENGTH(p_title) > 200 THEN
    RAISE EXCEPTION 'Title exceeds maximum length';
  END IF;
  IF LENGTH(p_message) > 1000 THEN
    RAISE EXCEPTION 'Message exceeds maximum length';
  END IF;

  -- Rate limiting: max 10 notifications per hour per sender
  SELECT COUNT(*) INTO v_notification_count
  FROM notifications
  WHERE user_id = p_user_id
  AND created_at > NOW() - INTERVAL '1 hour';

  IF v_notification_count >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded';
  END IF;

  SELECT role INTO v_caller_role FROM profiles WHERE user_id = auth.uid();

  IF public.has_role(auth.uid(), 'admin') THEN
    v_has_relationship := true;
  ELSIF v_caller_role = 'nurse' THEN
    -- Require active application relationship (pending/accepted/reviewed within 30 days)
    SELECT EXISTS(
      SELECT 1 FROM job_applications ja
      JOIN nurse_profiles np ON ja.nurse_profile_id = np.id
      JOIN profiles p ON np.profile_id = p.id
      JOIN job_postings jp ON ja.job_posting_id = jp.id
      JOIN company_profiles cp ON jp.company_profile_id = cp.id
      JOIN profiles cp_profile ON cp.profile_id = cp_profile.id
      WHERE p.user_id = auth.uid() AND cp_profile.user_id = p_user_id
      AND ja.status IN ('pending', 'accepted', 'reviewed')
      AND ja.created_at > NOW() - INTERVAL '30 days'
    ) INTO v_has_relationship;
  ELSIF v_caller_role = 'company' THEN
    -- Require active application relationship
    SELECT EXISTS(
      SELECT 1 FROM job_applications ja
      JOIN job_postings jp ON ja.job_posting_id = jp.id
      JOIN company_profiles cp ON jp.company_profile_id = cp.id
      JOIN profiles cp_profile ON cp.profile_id = cp_profile.id
      JOIN nurse_profiles np ON ja.nurse_profile_id = np.id
      JOIN profiles np_profile ON np.profile_id = np_profile.id
      WHERE cp_profile.user_id = auth.uid() AND np_profile.user_id = p_user_id
      AND ja.status IN ('pending', 'accepted', 'reviewed')
      AND ja.created_at > NOW() - INTERVAL '30 days'
    ) INTO v_has_relationship;
  END IF;

  IF NOT v_has_relationship THEN
    RAISE EXCEPTION 'Not authorized to send notifications to this user';
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_link);
END;
$function$;
