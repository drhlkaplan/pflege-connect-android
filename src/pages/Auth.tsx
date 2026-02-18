import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Heart, Stethoscope, Building2, Users, Loader2, AlertCircle, CheckCircle, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { getCityNames } from "@/lib/germanCities";

type UserRole = Database["public"]["Enums"]["user_role"];

const emailSchema = z.string().email("Geçerli bir e-posta adresi girin");
const passwordSchema = z
  .string()
  .min(8, "Şifre en az 8 karakter olmalıdır")
  .regex(/[A-Z]/, "En az bir büyük harf içermelidir")
  .regex(/[a-z]/, "En az bir küçük harf içermelidir")
  .regex(/[0-9]/, "En az bir rakam içermelidir")
  .regex(/[^A-Za-z0-9]/, "En az bir özel karakter içermelidir");
const nameSchema = z.string().min(2, "İsim en az 2 karakter olmalıdır");

const CITY_OPTIONS = getCityNames();

const roles = [
  {
    value: "nurse" as UserRole,
    label: "Hemşire",
    icon: Stethoscope,
    description: "Kariyer fırsatları arıyorum",
    gradient: "pflege-gradient-nurse",
  },
  {
    value: "company" as UserRole,
    label: "Şirket",
    icon: Building2,
    description: "Personel arıyorum",
    gradient: "pflege-gradient-company",
  },
  {
    value: "patient_relative" as UserRole,
    label: "Hasta Yakını",
    icon: Users,
    description: "Bakım hizmeti arıyorum",
    gradient: "pflege-gradient-relative",
  },
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("nurse");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    try { emailSchema.parse(email); } catch (e) {
      if (e instanceof z.ZodError) newErrors.email = e.errors[0].message;
    }

    try { passwordSchema.parse(password); } catch (e) {
      if (e instanceof z.ZodError) newErrors.password = e.errors.map(err => err.message).join(", ");
    }

    if (!isLogin) {
      try { nameSchema.parse(fullName); } catch (e) {
        if (e instanceof z.ZodError) newErrors.fullName = e.errors[0].message;
      }
      if (!gdprConsent) {
        newErrors.gdpr = "GDPR/KVKK onayı gereklidir";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({ variant: "destructive", title: "Giriş Başarısız", description: "E-posta veya şifre hatalı." });
          } else if (error.message.includes("Email not confirmed")) {
            toast({ variant: "destructive", title: "E-posta Doğrulanmadı", description: "Lütfen e-postanızdaki doğrulama bağlantısına tıklayın." });
          } else {
            toast({ variant: "destructive", title: "Hata", description: error.message });
          }
        }
      } else {
        const { error } = await signUp(email, password, selectedRole, fullName, selectedCity || undefined);
        if (error) {
          if (error.message.includes("User already registered")) {
            toast({ variant: "destructive", title: "Kayıt Başarısız", description: "Bu e-posta adresi zaten kayıtlı." });
          } else {
            toast({ variant: "destructive", title: "Hata", description: error.message });
          }
        } else {
          setSuccessMessage("Kayıt başarılı! Lütfen e-postanızı kontrol edin ve hesabınızı doğrulayın.");
          setEmail(""); setPassword(""); setFullName(""); setSelectedCity(""); setGdprConsent(false);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setSocialLoading(provider);
    try {
      const { error } = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast({ variant: "destructive", title: "Hata", description: `${provider} ile giriş yapılamadı.` });
      }
    } catch {
      toast({ variant: "destructive", title: "Hata", description: "Sosyal giriş sırasında hata oluştu." });
    } finally {
      setSocialLoading(null);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) {
        toast({ variant: "destructive", title: "Hata", description: error.message });
      } else {
        toast({ title: "Başarılı", description: "Şifre sıfırlama bağlantısı e-postanıza gönderildi." });
        setShowResetForm(false);
        setResetEmail("");
      }
    } finally {
      setResetLoading(false);
    }
  };

  if (showResetForm) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 pflege-gradient-hero">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        </div>
        <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-display text-2xl">Şifre Sıfırlama</CardTitle>
            <CardDescription>E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">E-posta</Label>
                <Input id="reset-email" type="email" placeholder="ornek@email.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} disabled={resetLoading} />
              </div>
              <Button type="submit" className="w-full" variant="hero" disabled={resetLoading}>
                {resetLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Gönderiliyor...</> : "Sıfırlama Bağlantısı Gönder"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setShowResetForm(false)}>
                Giriş sayfasına dön
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pflege-gradient-hero">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <a href="/" className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl pflege-gradient-nurse flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
          </a>
          <CardTitle className="font-display text-2xl">
            Pflege<span className="text-primary">Connect</span>
          </CardTitle>
          <CardDescription>
            {isLogin ? "Hesabınıza giriş yapın" : "Yeni hesap oluşturun"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={isLogin ? "login" : "register"} onValueChange={(v) => {
            setIsLogin(v === "login");
            setErrors({});
            setSuccessMessage("");
          }}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Giriş Yap</TabsTrigger>
              <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-posta</Label>
                  <Input id="login-email" type="email" placeholder="ornek@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                  {errors.email && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Şifre</Label>
                  <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                  {errors.password && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
                </div>

                <Button type="submit" className="w-full" variant="hero" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Giriş yapılıyor...</> : "Giriş Yap"}
                </Button>

                <button type="button" onClick={() => setShowResetForm(true)} className="text-sm text-primary hover:underline w-full text-center block">
                  Şifremi unuttum
                </button>

                {/* Social Login */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">veya</span></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button type="button" variant="outline" className="w-full" onClick={() => handleSocialLogin("google")} disabled={!!socialLoading}>
                    {socialLoading === "google" ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    )}
                    Google
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={() => handleSocialLogin("apple")} disabled={!!socialLoading}>
                    {socialLoading === "apple" ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                    )}
                    Apple
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="register">
              {successMessage ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Kayıt Başarılı!</h3>
                  <p className="text-muted-foreground text-sm">{successMessage}</p>
                  <Button variant="outline" className="mt-4" onClick={() => { setIsLogin(true); setSuccessMessage(""); }}>Giriş Yap</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Role Selection */}
                  <div className="space-y-2">
                    <Label>Hesap Türü</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {roles.map((role) => (
                        <button key={role.value} type="button" onClick={() => setSelectedRole(role.value)}
                          className={`p-3 rounded-xl border-2 transition-all text-center ${selectedRole === role.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                          <div className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${role.gradient}`}>
                            <role.icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-xs font-medium block">{role.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      {roles.find(r => r.value === selectedRole)?.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-name">{selectedRole === "company" ? "Şirket Adı" : "Ad Soyad"}</Label>
                    <Input id="register-name" type="text" placeholder={selectedRole === "company" ? "Şirket adınız" : "Adınız Soyadınız"} value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={loading} />
                    {errors.fullName && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.fullName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-city" className="flex items-center gap-1"><MapPin className="w-3 h-3" />Şehir</Label>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger id="register-city" disabled={loading}><SelectValue placeholder="Şehir seçin (opsiyonel)" /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {CITY_OPTIONS.map((city) => (<SelectItem key={city} value={city}>{city}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Şehir seçtiğinizde haritada görünür olursunuz</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">E-posta</Label>
                    <Input id="register-email" type="email" placeholder="ornek@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                    {errors.email && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Şifre</Label>
                    <Input id="register-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                    {errors.password && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
                    <p className="text-xs text-muted-foreground">En az 8 karakter, büyük/küçük harf, rakam ve özel karakter</p>
                  </div>

                  {/* GDPR Consent */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Checkbox id="gdpr-consent" checked={gdprConsent} onCheckedChange={(checked) => setGdprConsent(checked === true)} className="mt-1" />
                      <label htmlFor="gdpr-consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                        <a href="/privacy" className="text-primary hover:underline" target="_blank">Gizlilik Politikası</a>,{" "}
                        <a href="/terms" className="text-primary hover:underline" target="_blank">Kullanım Koşulları</a>'nı okudum ve kişisel verilerimin işlenmesini kabul ediyorum (GDPR/KVKK).
                      </label>
                    </div>
                    {errors.gdpr && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.gdpr}</p>}
                  </div>

                  <Button type="submit" className="w-full" variant="hero" disabled={loading}>
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Kayıt yapılıyor...</> : "Kayıt Ol"}
                  </Button>

                  {/* Social Login for Register */}
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">veya</span></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button type="button" variant="outline" className="w-full" onClick={() => handleSocialLogin("google")} disabled={!!socialLoading}>
                      {socialLoading === "google" ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      )}
                      Google
                    </Button>
                    <Button type="button" variant="outline" className="w-full" onClick={() => handleSocialLogin("apple")} disabled={!!socialLoading}>
                      {socialLoading === "apple" ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                      )}
                      Apple
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
