
-- Admin can manage carescore_criteria
CREATE POLICY "Admin can insert criteria"
ON public.carescore_criteria FOR INSERT
WITH CHECK (get_user_role() = 'admin'::user_role);

CREATE POLICY "Admin can update criteria"
ON public.carescore_criteria FOR UPDATE
USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Admin can delete criteria"
ON public.carescore_criteria FOR DELETE
USING (get_user_role() = 'admin'::user_role);

-- Admin can manage subscription_plans
CREATE POLICY "Admin can insert plans"
ON public.subscription_plans FOR INSERT
WITH CHECK (get_user_role() = 'admin'::user_role);

CREATE POLICY "Admin can update plans"
ON public.subscription_plans FOR UPDATE
USING (get_user_role() = 'admin'::user_role);

CREATE POLICY "Admin can delete plans"
ON public.subscription_plans FOR DELETE
USING (get_user_role() = 'admin'::user_role);

-- Admin can view all subscriptions
CREATE POLICY "Admin can view all subscriptions"
ON public.company_subscriptions FOR SELECT
USING (get_user_role() = 'admin'::user_role);

-- Admin can update subscriptions
CREATE POLICY "Admin can update subscriptions"
ON public.company_subscriptions FOR UPDATE
USING (get_user_role() = 'admin'::user_role);

-- Admin can view all payment logs
CREATE POLICY "Admin can view all payments"
ON public.payment_logs FOR SELECT
USING (get_user_role() = 'admin'::user_role);

-- Admin can view all carescore criteria (including inactive)
CREATE POLICY "Admin can view all criteria"
ON public.carescore_criteria FOR SELECT
USING (get_user_role() = 'admin'::user_role);
