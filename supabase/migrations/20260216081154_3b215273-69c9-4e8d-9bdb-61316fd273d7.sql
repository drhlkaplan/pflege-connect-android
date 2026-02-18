
-- Add show_name field to profiles for controlling name visibility in search
ALTER TABLE public.profiles ADD COLUMN show_name boolean NOT NULL DEFAULT true;

-- Update profiles_public view to include show_name for directory usage
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT id, user_id, role, full_name, city, country, avatar_url, latitude, longitude, created_at, show_name
FROM public.profiles;
