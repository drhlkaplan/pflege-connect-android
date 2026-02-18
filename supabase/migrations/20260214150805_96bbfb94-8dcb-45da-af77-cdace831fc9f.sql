
-- 1. Create app_role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Create has_role function FIRST
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 3. Now create policies on user_roles
CREATE POLICY "Admins can view all user_roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Migrate existing admin users
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles
WHERE role = 'admin'::user_role
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. Prevent role escalation via profiles table
CREATE OR REPLACE FUNCTION public.prevent_admin_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin'::user_role THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Cannot set admin role without proper authorization';
    END IF;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_admin_role_escalation
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_admin_role_escalation();

-- 6. Admin RLS on job_postings and job_applications
CREATE POLICY "Admins can view all job postings"
ON public.job_postings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update job postings"
ON public.job_postings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete job postings"
ON public.job_postings FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all applications"
ON public.job_applications FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Fix profiles_public view
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker=true) AS
SELECT id, user_id, role, full_name, city, country, avatar_url, created_at
FROM public.profiles
WHERE role IN ('nurse', 'company');

GRANT SELECT ON public.profiles_public TO authenticated;
REVOKE ALL ON public.profiles_public FROM anon;

-- 8. Fix notification RPC
CREATE OR REPLACE FUNCTION public.create_notification_for_user(
  p_user_id UUID, p_title TEXT, p_message TEXT,
  p_type TEXT DEFAULT 'info'::text, p_link TEXT DEFAULT NULL::text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_caller_role user_role;
  v_has_relationship BOOLEAN := false;
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

  SELECT role INTO v_caller_role FROM profiles WHERE user_id = auth.uid();

  IF public.has_role(auth.uid(), 'admin') THEN
    v_has_relationship := true;
  ELSIF v_caller_role = 'nurse' THEN
    SELECT EXISTS(
      SELECT 1 FROM job_applications ja
      JOIN nurse_profiles np ON ja.nurse_profile_id = np.id
      JOIN profiles p ON np.profile_id = p.id
      JOIN job_postings jp ON ja.job_posting_id = jp.id
      JOIN company_profiles cp ON jp.company_profile_id = cp.id
      JOIN profiles cp_profile ON cp.profile_id = cp_profile.id
      WHERE p.user_id = auth.uid() AND cp_profile.user_id = p_user_id
      AND ja.created_at > NOW() - INTERVAL '5 minutes'
    ) INTO v_has_relationship;
  ELSIF v_caller_role = 'company' THEN
    SELECT EXISTS(
      SELECT 1 FROM job_applications ja
      JOIN job_postings jp ON ja.job_posting_id = jp.id
      JOIN company_profiles cp ON jp.company_profile_id = cp.id
      JOIN profiles cp_profile ON cp.profile_id = cp_profile.id
      JOIN nurse_profiles np ON ja.nurse_profile_id = np.id
      JOIN profiles np_profile ON np.profile_id = np_profile.id
      WHERE cp_profile.user_id = auth.uid() AND np_profile.user_id = p_user_id
    ) INTO v_has_relationship;
  END IF;

  IF NOT v_has_relationship THEN
    RAISE EXCEPTION 'Not authorized to send notifications to this user';
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_link);
END;
$$;

-- 9. Update existing admin RLS policies to use has_role
DROP POLICY IF EXISTS "Users can view own profile or admin" ON public.profiles;
CREATE POLICY "Users can view own profile or admin"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can insert criteria" ON public.carescore_criteria;
DROP POLICY IF EXISTS "Admin can update criteria" ON public.carescore_criteria;
DROP POLICY IF EXISTS "Admin can delete criteria" ON public.carescore_criteria;
DROP POLICY IF EXISTS "Admin can view all criteria" ON public.carescore_criteria;
CREATE POLICY "Admin can insert criteria" ON public.carescore_criteria FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update criteria" ON public.carescore_criteria FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete criteria" ON public.carescore_criteria FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can view all criteria" ON public.carescore_criteria FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can view all subscriptions" ON public.company_subscriptions;
DROP POLICY IF EXISTS "Admin can update subscriptions" ON public.company_subscriptions;
CREATE POLICY "Admin can view all subscriptions" ON public.company_subscriptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update subscriptions" ON public.company_subscriptions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can view all payments" ON public.payment_logs;
CREATE POLICY "Admin can view all payments" ON public.payment_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can insert plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admin can update plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admin can delete plans" ON public.subscription_plans;
CREATE POLICY "Admin can insert plans" ON public.subscription_plans FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update plans" ON public.subscription_plans FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete plans" ON public.subscription_plans FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
