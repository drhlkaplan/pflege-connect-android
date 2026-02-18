import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Users, Briefcase, Send, BarChart3, Stethoscope, Building2, Heart,
  Award, CreditCard, Edit, Plus, Trash2, Save, Settings
} from "lucide-react";

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [stats, setStats] = useState({ users: 0, nurses: 0, companies: 0, relatives: 0, jobs: 0, activeJobs: 0, applications: 0, pending: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [criteria, setCriteria] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editingCriteria, setEditingCriteria] = useState<any | null>(null);
  const [newCriteria, setNewCriteria] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!loading && !user) {
        navigate("/dashboard");
        return;
      }
      if (user) {
        // Server-side admin check via user_roles table
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        if (!roles) {
          navigate("/dashboard");
        } else {
          setIsAdmin(true);
        }
      }
    };
    if (!loading) checkAdmin();
  }, [user, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    const [profilesRes, jobsRes, appsRes, criteriaRes, subsRes, paymentsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("job_postings").select("*, company_profile:company_profiles(company_name)").order("created_at", { ascending: false }),
      supabase.from("job_applications").select("*, job_posting:job_postings(title)").order("created_at", { ascending: false }),
      supabase.from("carescore_criteria").select("*").order("sort_order"),
      supabase.from("company_subscriptions").select("*, plan:subscription_plans(name, price_eur)").order("created_at", { ascending: false }),
      supabase.from("payment_logs").select("*").order("created_at", { ascending: false }).limit(50),
    ]);

    const allUsers = profilesRes.data || [];
    const allJobs = jobsRes.data || [];
    const allApps = appsRes.data || [];

    setUsers(allUsers);
    setJobs(allJobs);
    setApplications(allApps);
    setCriteria(criteriaRes.data || []);
    setSubscriptions(subsRes.data || []);
    setPayments(paymentsRes.data || []);
    setStats({
      users: allUsers.length,
      nurses: allUsers.filter((u: any) => u.role === "nurse").length,
      companies: allUsers.filter((u: any) => u.role === "company").length,
      relatives: allUsers.filter((u: any) => u.role === "patient_relative").length,
      jobs: allJobs.length,
      activeJobs: allJobs.filter((j: any) => j.is_active).length,
      applications: allApps.length,
      pending: allApps.filter((a: any) => a.status === "pending").length,
    });
  };

  const handleUpdateUser = async (userId: string, updates: any) => {
    const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
    if (error) { toast.error("Güncelleme başarısız"); return; }
    toast.success("Kullanıcı güncellendi");
    setEditingUser(null);
    fetchData();
  };

  const handleSaveCriteria = async (item: any) => {
    if (item.id) {
      const { error } = await supabase.from("carescore_criteria").update({
        key: item.key, label_de: item.label_de, label_en: item.label_en, label_tr: item.label_tr,
        weight: item.weight, max_points: item.max_points, sort_order: item.sort_order, is_active: item.is_active,
      }).eq("id", item.id);
      if (error) { toast.error("Güncelleme başarısız"); return; }
    } else {
      const { error } = await supabase.from("carescore_criteria").insert([{
        key: item.key, label_de: item.label_de, label_en: item.label_en, label_tr: item.label_tr,
        weight: item.weight, max_points: item.max_points, sort_order: item.sort_order, is_active: item.is_active ?? true,
      }]);
      if (error) { toast.error("Ekleme başarısız"); return; }
    }
    toast.success("CareScore kriteri kaydedildi");
    setEditingCriteria(null);
    setNewCriteria(false);
    fetchData();
  };

  const handleDeleteCriteria = async (id: string) => {
    const { error } = await supabase.from("carescore_criteria").delete().eq("id", id);
    if (error) { toast.error("Silme başarısız"); return; }
    toast.success("Kriter silindi");
    fetchData();
  };

  if (loading || !isAdmin) return null;

  const roleIcons: Record<string, any> = { nurse: Stethoscope, company: Building2, patient_relative: Heart, admin: Users };
  const roleBadgeColors: Record<string, string> = { nurse: "bg-primary/10 text-primary", company: "bg-secondary/10 text-secondary", patient_relative: "bg-purple-100 text-purple-700", admin: "bg-destructive/10 text-destructive" };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <h1 className="font-display text-3xl font-bold mb-8">{t("admin.title")}</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card><CardContent className="p-4 text-center"><Users className="w-6 h-6 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{stats.users}</div><div className="text-xs text-muted-foreground">{t("admin.totalUsers")}</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Briefcase className="w-6 h-6 mx-auto mb-2 text-secondary" /><div className="text-2xl font-bold">{stats.jobs}</div><div className="text-xs text-muted-foreground">{t("admin.totalJobs")}</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Send className="w-6 h-6 mx-auto mb-2 text-accent" /><div className="text-2xl font-bold">{stats.applications}</div><div className="text-xs text-muted-foreground">{t("admin.totalApplications")}</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><BarChart3 className="w-6 h-6 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{stats.activeJobs}</div><div className="text-xs text-muted-foreground">{t("admin.activeJobs")}</div></CardContent></Card>
        </div>

        {/* Role breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card><CardContent className="p-4 flex items-center gap-3"><Stethoscope className="w-5 h-5 text-primary" /><div><div className="text-xl font-bold">{stats.nurses}</div><div className="text-xs text-muted-foreground">{t("admin.totalNurses")}</div></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Building2 className="w-5 h-5 text-secondary" /><div><div className="text-xl font-bold">{stats.companies}</div><div className="text-xs text-muted-foreground">{t("admin.totalCompanies")}</div></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Heart className="w-5 h-5 text-purple-500" /><div><div className="text-xl font-bold">{stats.relatives}</div><div className="text-xs text-muted-foreground">{t("admin.totalRelatives")}</div></div></CardContent></Card>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="users">{t("admin.users")} ({stats.users})</TabsTrigger>
            <TabsTrigger value="jobs">{t("admin.jobPostings")} ({stats.jobs})</TabsTrigger>
            <TabsTrigger value="applications">{t("admin.applications")} ({stats.applications})</TabsTrigger>
            <TabsTrigger value="carescore" className="flex items-center gap-1"><Award className="w-3 h-3" /> CareScore</TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> Abonelikler</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/50"><th className="p-3 text-left">{t("admin.name")}</th><th className="p-3 text-left">{t("admin.role")}</th><th className="p-3 text-left">Şehir</th><th className="p-3 text-left">{t("admin.date")}</th><th className="p-3 text-left">{t("admin.actions")}</th></tr></thead>
                    <tbody>
                      {users.map((u: any) => {
                        const RoleIcon = roleIcons[u.role] || Users;
                        return (
                          <tr key={u.id} className="border-b hover:bg-muted/30">
                            <td className="p-3 font-medium">{u.full_name || "—"}</td>
                            <td className="p-3"><Badge variant="outline" className={roleBadgeColors[u.role]}><RoleIcon className="w-3 h-3 mr-1" />{u.role}</Badge></td>
                            <td className="p-3 text-muted-foreground">{u.city || "—"}</td>
                            <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                            <td className="p-3">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => setEditingUser({ ...u })}>
                                    <Edit className="w-3 h-3 mr-1" /> Düzenle
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader><DialogTitle>Kullanıcı Düzenle</DialogTitle></DialogHeader>
                                  {editingUser && editingUser.id === u.id && (
                                    <div className="space-y-4">
                                      <div>
                                        <Label>Ad Soyad</Label>
                                        <Input value={editingUser.full_name || ""} onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })} />
                                      </div>
                                      <div>
                                        <Label>Şehir</Label>
                                        <Input value={editingUser.city || ""} onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value })} />
                                      </div>
                                      <div>
                                        <Label>Rol</Label>
                                        <Select value={editingUser.role} onValueChange={(v) => setEditingUser({ ...editingUser, role: v })}>
                                          <SelectTrigger><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="nurse">Hemşire</SelectItem>
                                            <SelectItem value="company">Şirket</SelectItem>
                                            <SelectItem value="patient_relative">Hasta Yakını</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <Button onClick={() => handleUpdateUser(editingUser.id, { full_name: editingUser.full_name, city: editingUser.city, role: editingUser.role })}>
                                        <Save className="w-4 h-4 mr-1" /> Kaydet
                                      </Button>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/50"><th className="p-3 text-left">İlan</th><th className="p-3 text-left">Şirket</th><th className="p-3 text-left">{t("admin.status")}</th><th className="p-3 text-left">{t("admin.date")}</th></tr></thead>
                    <tbody>
                      {jobs.map((j: any) => (
                        <tr key={j.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-medium">{j.title}</td>
                          <td className="p-3">{j.company_profile?.company_name || "—"}</td>
                          <td className="p-3"><Badge variant={j.is_active ? "default" : "secondary"}>{j.is_active ? t("admin.active") : t("admin.inactive")}</Badge></td>
                          <td className="p-3 text-muted-foreground">{new Date(j.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/50"><th className="p-3 text-left">İlan</th><th className="p-3 text-left">{t("admin.status")}</th><th className="p-3 text-left">{t("admin.date")}</th></tr></thead>
                    <tbody>
                      {applications.map((a: any) => (
                        <tr key={a.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-medium">{a.job_posting?.title || "—"}</td>
                          <td className="p-3"><Badge variant={a.status === "accepted" ? "default" : a.status === "rejected" ? "destructive" : "secondary"}>{a.status}</Badge></td>
                          <td className="p-3 text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CareScore Tab */}
          <TabsContent value="carescore">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5" /> CareScore Kriterleri</CardTitle>
                <Button size="sm" onClick={() => { setNewCriteria(true); setEditingCriteria({ key: "", label_de: "", label_en: "", label_tr: "", weight: 1, max_points: 20, sort_order: criteria.length, is_active: true }); }}>
                  <Plus className="w-4 h-4 mr-1" /> Yeni Kriter
                </Button>
              </CardHeader>
              <CardContent>
                {(newCriteria || editingCriteria) && (
                  <div className="mb-6 p-4 border rounded-lg bg-muted/30 space-y-3">
                    <h4 className="font-semibold text-sm">{editingCriteria?.id ? "Kriter Düzenle" : "Yeni Kriter Ekle"}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div><Label>Key</Label><Input value={editingCriteria?.key || ""} onChange={(e) => setEditingCriteria({ ...editingCriteria, key: e.target.value })} placeholder="experience_years" /></div>
                      <div><Label>Label (DE)</Label><Input value={editingCriteria?.label_de || ""} onChange={(e) => setEditingCriteria({ ...editingCriteria, label_de: e.target.value })} /></div>
                      <div><Label>Label (EN)</Label><Input value={editingCriteria?.label_en || ""} onChange={(e) => setEditingCriteria({ ...editingCriteria, label_en: e.target.value })} /></div>
                      <div><Label>Label (TR)</Label><Input value={editingCriteria?.label_tr || ""} onChange={(e) => setEditingCriteria({ ...editingCriteria, label_tr: e.target.value })} /></div>
                      <div><Label>Ağırlık</Label><Input type="number" value={editingCriteria?.weight || 1} onChange={(e) => setEditingCriteria({ ...editingCriteria, weight: Number(e.target.value) })} /></div>
                      <div><Label>Max Puan</Label><Input type="number" value={editingCriteria?.max_points || 20} onChange={(e) => setEditingCriteria({ ...editingCriteria, max_points: Number(e.target.value) })} /></div>
                      <div><Label>Sıralama</Label><Input type="number" value={editingCriteria?.sort_order || 0} onChange={(e) => setEditingCriteria({ ...editingCriteria, sort_order: Number(e.target.value) })} /></div>
                      <div className="flex items-center gap-2 pt-6"><Switch checked={editingCriteria?.is_active ?? true} onCheckedChange={(v) => setEditingCriteria({ ...editingCriteria, is_active: v })} /><Label>Aktif</Label></div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveCriteria(editingCriteria)}><Save className="w-3 h-3 mr-1" /> Kaydet</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingCriteria(null); setNewCriteria(false); }}>İptal</Button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/50"><th className="p-3 text-left">Key</th><th className="p-3 text-left">Label (TR)</th><th className="p-3 text-left">Ağırlık</th><th className="p-3 text-left">Max Puan</th><th className="p-3 text-left">Durum</th><th className="p-3 text-left">İşlemler</th></tr></thead>
                    <tbody>
                      {criteria.map((c: any) => (
                        <tr key={c.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-mono text-xs">{c.key}</td>
                          <td className="p-3">{c.label_tr}</td>
                          <td className="p-3">{c.weight}</td>
                          <td className="p-3">{c.max_points}</td>
                          <td className="p-3"><Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Aktif" : "Pasif"}</Badge></td>
                          <td className="p-3 flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setEditingCriteria({ ...c })}><Edit className="w-3 h-3" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteCriteria(c.id)} className="text-destructive"><Trash2 className="w-3 h-3" /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <div className="space-y-6">
              {/* Active subscriptions */}
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> Aktif Abonelikler</CardTitle></CardHeader>
                <CardContent>
                  {subscriptions.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Henüz abonelik yok.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b bg-muted/50"><th className="p-3 text-left">Plan</th><th className="p-3 text-left">Fiyat</th><th className="p-3 text-left">Durum</th><th className="p-3 text-left">Başlangıç</th><th className="p-3 text-left">Bitiş</th></tr></thead>
                        <tbody>
                          {subscriptions.map((s: any) => (
                            <tr key={s.id} className="border-b hover:bg-muted/30">
                              <td className="p-3 font-medium">{s.plan?.name || "—"}</td>
                              <td className="p-3">{s.plan?.price_eur ? `€${s.plan.price_eur}` : "—"}</td>
                              <td className="p-3"><Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge></td>
                              <td className="p-3 text-muted-foreground">{new Date(s.started_at).toLocaleDateString()}</td>
                              <td className="p-3 text-muted-foreground">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment logs */}
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Son Ödemeler</CardTitle></CardHeader>
                <CardContent>
                  {payments.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Henüz ödeme kaydı yok.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b bg-muted/50"><th className="p-3 text-left">Tutar</th><th className="p-3 text-left">Yöntem</th><th className="p-3 text-left">Durum</th><th className="p-3 text-left">Tarih</th></tr></thead>
                        <tbody>
                          {payments.map((p: any) => (
                            <tr key={p.id} className="border-b hover:bg-muted/30">
                              <td className="p-3 font-medium">€{p.amount_eur}</td>
                              <td className="p-3">{p.payment_method || "—"}</td>
                              <td className="p-3"><Badge variant={p.status === "completed" ? "default" : p.status === "failed" ? "destructive" : "secondary"}>{p.status}</Badge></td>
                              <td className="p-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
