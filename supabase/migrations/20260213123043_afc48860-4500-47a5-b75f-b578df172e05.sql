
-- ============================================
-- FIX 1: Restrict profiles SELECT to own + admin
-- ============================================
DROP POLICY "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile or admin"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR get_user_role() = 'admin');

-- Create a public view for non-sensitive display info (bypasses RLS as definer)
CREATE VIEW public.profiles_public AS
SELECT id, user_id, role, full_name, city, country, avatar_url, created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;

-- ============================================
-- FIX 2: Restrict notifications INSERT to own user_id
-- ============================================
DROP POLICY "Authenticated users can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert own notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Server-side function for cross-user notifications (e.g., notifying companies of applications)
CREATE OR REPLACE FUNCTION public.create_notification_for_user(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_link TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_link);
END;
$$;

-- ============================================
-- FIX 3: Harden SECURITY DEFINER functions with null checks
-- ============================================
CREATE OR REPLACE FUNCTION public.is_own_profile(check_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = check_profile_id
      AND user_id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN (SELECT role FROM public.profiles WHERE user_id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_profile_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN (SELECT id FROM public.profiles WHERE user_id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.get_company_profile_id_for_user()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN (
    SELECT cp.id FROM public.company_profiles cp
    JOIN public.profiles p ON cp.profile_id = p.id
    WHERE p.user_id = auth.uid()
  );
END;
$$;
