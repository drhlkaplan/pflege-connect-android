-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('nurse', 'company', 'patient_relative');

-- Create profiles table (base table for all users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    role user_role NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    city TEXT,
    country TEXT DEFAULT 'Germany',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create nurse_profiles table (extension for nurses)
CREATE TABLE public.nurse_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    experience_years INTEGER DEFAULT 0,
    german_level TEXT CHECK (german_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native')),
    specializations TEXT[] DEFAULT '{}',
    certifications TEXT[] DEFAULT '{}',
    availability TEXT CHECK (availability IN ('full_time', 'part_time', 'flexible')),
    hourly_rate DECIMAL(10,2),
    bio TEXT,
    pediatric_experience BOOLEAN DEFAULT false,
    icu_experience BOOLEAN DEFAULT false,
    care_score INTEGER DEFAULT 0 CHECK (care_score >= 0 AND care_score <= 100),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create company_profiles table (extension for companies)
CREATE TABLE public.company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    company_name TEXT NOT NULL,
    company_type TEXT CHECK (company_type IN ('hospital', 'nursing_home', 'home_care', 'clinic', 'agency', 'other')),
    address TEXT,
    website TEXT,
    description TEXT,
    employee_count INTEGER,
    founded_year INTEGER,
    is_verified BOOLEAN DEFAULT false,
    subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'single', 'triple', 'featured')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create patient_relative_profiles table (extension for patient relatives)
CREATE TABLE public.patient_relative_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    relationship_type TEXT CHECK (relationship_type IN ('spouse', 'child', 'parent', 'sibling', 'other')),
    patient_age INTEGER,
    care_needs TEXT[] DEFAULT '{}',
    preferred_care_type TEXT CHECK (preferred_care_type IN ('home_care', 'nursing_home', 'hospital', 'flexible')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create helper function to check profile ownership
CREATE OR REPLACE FUNCTION public.is_own_profile(check_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = check_profile_id
      AND user_id = auth.uid()
  )
$$;

-- Create helper function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE user_id = auth.uid()
$$;

-- Create helper function to get current user's profile id
CREATE OR REPLACE FUNCTION public.get_user_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.profiles
  WHERE user_id = auth.uid()
$$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nurse_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_relative_profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" 
ON public.profiles FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Nurse Profiles RLS Policies
CREATE POLICY "Anyone can view nurse profiles" 
ON public.nurse_profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Nurses can insert their own profile" 
ON public.nurse_profiles FOR INSERT 
TO authenticated 
WITH CHECK (public.is_own_profile(profile_id) AND public.get_user_role() = 'nurse');

CREATE POLICY "Nurses can update their own profile" 
ON public.nurse_profiles FOR UPDATE 
TO authenticated 
USING (public.is_own_profile(profile_id) AND public.get_user_role() = 'nurse');

CREATE POLICY "Nurses can delete their own profile" 
ON public.nurse_profiles FOR DELETE 
TO authenticated 
USING (public.is_own_profile(profile_id) AND public.get_user_role() = 'nurse');

-- Company Profiles RLS Policies
CREATE POLICY "Anyone can view company profiles" 
ON public.company_profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Companies can insert their own profile" 
ON public.company_profiles FOR INSERT 
TO authenticated 
WITH CHECK (public.is_own_profile(profile_id) AND public.get_user_role() = 'company');

CREATE POLICY "Companies can update their own profile" 
ON public.company_profiles FOR UPDATE 
TO authenticated 
USING (public.is_own_profile(profile_id) AND public.get_user_role() = 'company');

CREATE POLICY "Companies can delete their own profile" 
ON public.company_profiles FOR DELETE 
TO authenticated 
USING (public.is_own_profile(profile_id) AND public.get_user_role() = 'company');

-- Patient Relative Profiles RLS Policies
CREATE POLICY "Relatives can view their own profile" 
ON public.patient_relative_profiles FOR SELECT 
TO authenticated 
USING (public.is_own_profile(profile_id));

CREATE POLICY "Relatives can insert their own profile" 
ON public.patient_relative_profiles FOR INSERT 
TO authenticated 
WITH CHECK (public.is_own_profile(profile_id) AND public.get_user_role() = 'patient_relative');

CREATE POLICY "Relatives can update their own profile" 
ON public.patient_relative_profiles FOR UPDATE 
TO authenticated 
USING (public.is_own_profile(profile_id) AND public.get_user_role() = 'patient_relative');

CREATE POLICY "Relatives can delete their own profile" 
ON public.patient_relative_profiles FOR DELETE 
TO authenticated 
USING (public.is_own_profile(profile_id) AND public.get_user_role() = 'patient_relative');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nurse_profiles_updated_at
BEFORE UPDATE ON public.nurse_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_profiles_updated_at
BEFORE UPDATE ON public.company_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_relative_profiles_updated_at
BEFORE UPDATE ON public.patient_relative_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_location ON public.profiles(latitude, longitude);
CREATE INDEX idx_nurse_profiles_profile_id ON public.nurse_profiles(profile_id);
CREATE INDEX idx_company_profiles_profile_id ON public.company_profiles(profile_id);
CREATE INDEX idx_patient_relative_profiles_profile_id ON public.patient_relative_profiles(profile_id);