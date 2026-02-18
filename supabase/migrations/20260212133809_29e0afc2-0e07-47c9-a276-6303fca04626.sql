
-- ===== 1. GDPR: Consent Logs =====
CREATE TABLE public.consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL, -- 'cookie_analytics', 'cookie_marketing', 'data_processing', 'terms'
  granted BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents" ON public.consent_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consents" ON public.consent_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_consent_logs_user ON public.consent_logs(user_id);

-- ===== 2. GDPR: Data Deletion Requests =====
CREATE TABLE public.data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed
  reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deletion requests" ON public.data_deletion_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create deletion requests" ON public.data_deletion_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===== 3. Referral System =====
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, converted, expired
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at TIMESTAMPTZ
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_user_id);
CREATE POLICY "Users can create referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referrer_user_id);
CREATE POLICY "System can update referrals" ON public.referrals FOR UPDATE USING (auth.uid() = referrer_user_id);

CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_user_id);

-- ===== 4. Pricing & Plans =====
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_tr TEXT,
  name_de TEXT,
  name_en TEXT,
  description TEXT,
  description_tr TEXT,
  description_de TEXT,
  description_en TEXT,
  price_eur NUMERIC NOT NULL DEFAULT 0,
  billing_period TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly, one_time
  max_job_postings INTEGER NOT NULL DEFAULT 1,
  featured_listings INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans FOR SELECT USING (is_active = true);

-- Insert default plans
INSERT INTO public.subscription_plans (name, name_tr, name_de, name_en, description_tr, description_de, description_en, price_eur, billing_period, max_job_postings, featured_listings, sort_order) VALUES
  ('basic', 'Temel Plan', 'Basisplan', 'Basic Plan', 'Tek ilan yayınlama', 'Eine Stellenanzeige', 'Single job posting', 0, 'one_time', 1, 0, 1),
  ('standard', 'Standart Plan', 'Standardplan', 'Standard Plan', '3 ilan + öne çıkan', '3 Anzeigen + hervorgehoben', '3 postings + featured', 49.99, 'monthly', 3, 1, 2),
  ('premium', 'Premium Plan', 'Premiumplan', 'Premium Plan', 'Sınırsız ilan + öne çıkan + öncelikli destek', 'Unbegrenzte Anzeigen + hervorgehoben + Prioritätssupport', 'Unlimited postings + featured + priority support', 99.99, 'monthly', 999, 5, 3);

-- Company subscriptions
CREATE TABLE public.company_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_profile_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, expired
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_company_profile_id_for_user()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cp.id FROM public.company_profiles cp
  JOIN public.profiles p ON cp.profile_id = p.id
  WHERE p.user_id = auth.uid()
$$;

CREATE POLICY "Companies can view own subscriptions" ON public.company_subscriptions FOR SELECT USING (company_profile_id = get_company_profile_id_for_user());
CREATE POLICY "Companies can insert own subscriptions" ON public.company_subscriptions FOR INSERT WITH CHECK (company_profile_id = get_company_profile_id_for_user());

-- Payment logs (mock)
CREATE TABLE public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_eur NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  payment_method TEXT DEFAULT 'mock',
  plan_id UUID REFERENCES public.subscription_plans(id),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON public.payment_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON public.payment_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===== 5. Audit & Security Logs =====
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- login, logout, profile_update, password_change, etc.
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ===== 6. SMS/OTP Verification =====
CREATE TABLE public.sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent', -- sent, verified, expired, failed
  provider TEXT NOT NULL DEFAULT 'mock', -- mock, twilio, firebase
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ
);

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sms logs" ON public.sms_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can insert sms logs" ON public.sms_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can update own sms logs" ON public.sms_logs FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_sms_logs_phone ON public.sms_logs(phone);

-- Add phone_verified to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gdpr_consent_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cookie_preferences JSONB DEFAULT '{"essential": true, "analytics": false, "marketing": false}'::jsonb;

-- ===== 7. CareScore Criteria (Admin-managed) =====
CREATE TABLE public.carescore_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label_tr TEXT NOT NULL,
  label_de TEXT NOT NULL,
  label_en TEXT NOT NULL,
  max_points INTEGER NOT NULL DEFAULT 20,
  weight NUMERIC NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.carescore_criteria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active criteria" ON public.carescore_criteria FOR SELECT USING (is_active = true);

-- Insert default criteria
INSERT INTO public.carescore_criteria (key, label_tr, label_de, label_en, max_points, weight, sort_order) VALUES
  ('experience', 'Deneyim Süresi', 'Berufserfahrung', 'Experience Duration', 20, 1.0, 1),
  ('german_level', 'Almanca Seviyesi', 'Deutschkenntnisse', 'German Level', 20, 1.0, 2),
  ('specializations', 'Uzmanlık Alanları', 'Spezialisierungen', 'Specializations', 20, 1.0, 3),
  ('certifications', 'Sertifikalar', 'Zertifikate', 'Certifications', 20, 1.0, 4),
  ('profile_completeness', 'Profil Tamamlama', 'Profilvollständigkeit', 'Profile Completeness', 20, 1.0, 5);
