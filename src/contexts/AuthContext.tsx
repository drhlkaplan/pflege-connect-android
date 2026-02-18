import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getCityCoordinates } from "@/lib/germanCities";
import { logAuditEvent } from "@/hooks/useAuditLog";

type UserRole = Database["public"]["Enums"]["user_role"];

// Stripe product/price mapping
export const STRIPE_PLANS = {
  pro: {
    product_id: "prod_Tyi6Gn42AqZCor",
    monthly_price_id: "price_1T0kfxJFh9UYITdlOdrKgVe4",
    yearly_price_id: "price_1T0kgEJFh9UYITdlJFsYL9Pp",
    db_plan: "standard",
  },
  elite: {
    product_id: "prod_Tyi6e5fBKHsrrS",
    monthly_price_id: "price_1T0kgPJFh9UYITdlgDWsGwnU",
    yearly_price_id: "price_1T0kgeJFh9UYITdlmHXgkift",
    db_plan: "premium",
  },
} as const;

export type SubscriptionTier = "free" | "pro" | "elite";

export function getSubscriptionTier(productId: string | null): SubscriptionTier {
  if (!productId) return "free";
  if (productId === STRIPE_PLANS.elite.product_id) return "elite";
  if (productId === STRIPE_PLANS.pro.product_id) return "pro";
  return "free";
}

interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  phone_verified: boolean | null;
  referral_code: string | null;
  referred_by: string | null;
  gdpr_consent_at: string | null;
  cookie_preferences: unknown;
  show_email: boolean;
  show_phone: boolean;
  show_name: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionEnd: string | null;
  checkingSubscription: boolean;
  signUp: (email: string, password: string, role: UserRole, fullName: string, city?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("free");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data as Profile | null;
  };

  const ensureProfile = async (user: User): Promise<Profile | null> => {
    let profileData = await fetchProfile(user.id);
    if (profileData) return profileData;

    // Auto-create profile for OAuth users who don't have one
    const meta = user.user_metadata;
    const fullName = meta?.full_name || meta?.name || user.email?.split("@")[0] || "";
    const role: UserRole = "nurse"; // default role for OAuth sign-ups

    const { error: insertError } = await supabase.from("profiles").insert({
      user_id: user.id,
      role,
      full_name: fullName,
      avatar_url: meta?.avatar_url || meta?.picture || null,
    });

    if (insertError) {
      console.error("Error auto-creating profile:", insertError);
      return null;
    }

    profileData = await fetchProfile(user.id);
    if (profileData) {
      // Create role-specific profile
      await supabase.from("nurse_profiles").insert({ profile_id: profileData.id });
    }
    return profileData;
  };

  const refreshSubscription = useCallback(async () => {
    if (!session) return;
    setCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) {
        console.error("Subscription check error:", error);
        return;
      }
      if (data?.subscribed) {
        setSubscriptionTier(getSubscriptionTier(data.product_id));
        setSubscriptionEnd(data.subscription_end);
      } else {
        setSubscriptionTier("free");
        setSubscriptionEnd(null);
      }
    } catch (err) {
      console.error("Subscription check failed:", err);
    } finally {
      setCheckingSubscription(false);
    }
  }, [session]);

  const refreshProfile = async () => {
    if (user) {
      const profileData = await ensureProfile(user);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            ensureProfile(session.user).then(setProfile);
          }, 0);
        } else {
          setProfile(null);
          setSubscriptionTier("free");
          setSubscriptionEnd(null);
        }

        if (event === "INITIAL_SESSION") {
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureProfile(session.user).then(setProfile);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check subscription when session changes
  useEffect(() => {
    if (session) {
      refreshSubscription();
    }
  }, [session, refreshSubscription]);

  // Periodic refresh every 60 seconds
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(refreshSubscription, 60000);
    return () => clearInterval(interval);
  }, [session, refreshSubscription]);

  const signUp = async (email: string, password: string, role: UserRole, fullName: string, city?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const coordinates = city ? getCityCoordinates(city) : undefined;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: fullName, role },
        },
      });

      if (error) return { error };

      if (data.user && data.session) {
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          role,
          full_name: fullName,
          city: city || null,
          latitude: coordinates?.latitude || null,
          longitude: coordinates?.longitude || null,
        });

        if (profileError) {
          console.error("Error creating profile:", profileError);
          return { error: new Error("Profil oluşturulurken hata oluştu.") };
        }

        const profileData = await fetchProfile(data.user.id);
        if (profileData) {
          if (role === "nurse") {
            await supabase.from("nurse_profiles").insert({ profile_id: profileData.id });
          } else if (role === "company") {
            await supabase.from("company_profiles").insert({ profile_id: profileData.id, company_name: fullName });
          } else if (role === "patient_relative") {
            await supabase.from("patient_relative_profiles").insert({ profile_id: profileData.id });
          }
        }
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };

      const currentSession = await supabase.auth.getSession();
      if (currentSession.data.session?.user) {
        logAuditEvent(currentSession.data.session.user.id, "login");
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    if (user) logAuditEvent(user.id, "logout");
    await supabase.auth.signOut();
    setProfile(null);
    setSubscriptionTier("free");
    setSubscriptionEnd(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        subscriptionTier,
        subscriptionEnd,
        checkingSubscription,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        refreshSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
