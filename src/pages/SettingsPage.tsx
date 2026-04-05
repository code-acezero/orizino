import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Moon, Sun, Palette, Bell, Globe, Shield, ChevronRight, Eye, EyeOff,
  Lock, Smartphone, Mail, Volume2, VolumeX, Languages, Monitor, TrendingUp,
  Trash2, Download, HelpCircle, MessageSquare, FileText, Info,
  BellRing, BellOff, ShoppingBag, Tag, Package, Megaphone, AlertTriangle,
  Coins
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage, ALL_LANGUAGES } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/app-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { themePalettes } from "@/lib/theme-palettes";

interface NotifPrefs {
  orders: boolean;
  promotions: boolean;
  announcements: boolean;
  priceDrops: boolean;
  restockAlerts: boolean;
  email: boolean;
  push: boolean;
  sound: boolean;
}

const defaultNotifPrefs: NotifPrefs = {
  orders: true, promotions: true, announcements: true, priceDrops: true, restockAlerts: true, email: true, push: true, sound: true,
};

const ToggleRow: React.FC<{ icon: React.ReactNode; label: string; desc?: string; checked: boolean; onChange: () => void }> = ({ icon, label, desc, checked, onChange }) => (
  <button onClick={onChange} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-secondary/30 transition-colors">
    <div className="flex items-center gap-3">
      {icon}
      <div className="text-left">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
    </div>
    <div className={`w-11 h-6 rounded-full transition-colors relative ${checked ? "bg-primary" : "bg-muted"}`}>
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-primary-foreground transition-transform ${checked ? "left-[22px]" : "left-0.5"}`} />
    </div>
  </button>
);

const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { currency, setCurrency, enabledCurrencies } = useCurrency();
  const { language, setLanguage: setLang, t } = useLanguage();

  const [mode, setMode] = useState<"dark" | "light">("dark");
  const [theme, setTheme] = useState("default");
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(defaultNotifPrefs);
  const [loading, setLoading] = useState(false);

  // Security
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("preferences").eq("id", user.id).single().then(({ data }) => {
      if (data?.preferences) {
        const prefs = data.preferences as Record<string, any>;
        if (prefs.mode) setMode(prefs.mode);
        if (prefs.theme) setTheme(prefs.theme);
        if (prefs.notifPrefs) setNotifPrefs({ ...defaultNotifPrefs, ...prefs.notifPrefs });
      }
    });
  }, [user]);

  const savePrefs = async (prefs: Record<string, any>) => {
    if (!user) return;
    const current = (await supabase.from("profiles").select("preferences").eq("id", user.id).single()).data?.preferences as Record<string, any> || {};
    const updated = { ...current, ...prefs };
    await supabase.from("profiles").update({ preferences: updated }).eq("id", user.id);
    toast({ title: "Settings saved" });
  };

  const toggleMode = () => {
    const newMode = mode === "dark" ? "light" : "dark";
    setMode(newMode);
    savePrefs({ mode: newMode });
  };

  const selectTheme = (t: string) => {
    setTheme(t);
    savePrefs({ theme: t });
  };

  const updateNotifPref = (key: keyof NotifPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    savePrefs({ notifPrefs: updated });
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return; }
    if (newPassword !== confirmPassword) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Password updated successfully!" }); setChangePasswordOpen(false); setNewPassword(""); setConfirmPassword(""); }
  };

  const handleDeleteAccount = async () => {
    toast({ title: "Account deletion requested", description: "Please contact support to complete this process." });
    setDeleteAccountOpen(false);
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold font-display text-foreground mb-2">{t("nav.settings")}</h1>
          <p className="text-sm text-muted-foreground mb-6">Manage your preferences, security, and notifications</p>

          <Tabs defaultValue="appearance" className="space-y-6">
            <TabsList className="w-full grid grid-cols-4 h-auto p-1 rounded-2xl">
              <TabsTrigger value="appearance" className="rounded-xl text-xs sm:text-sm py-2.5 data-[state=active]:shadow-md">
                <Palette className="w-4 h-4 mr-1.5 hidden sm:block" /> {t("settings.appearance")}
              </TabsTrigger>
              <TabsTrigger value="notifications" className="rounded-xl text-xs sm:text-sm py-2.5 data-[state=active]:shadow-md">
                <Bell className="w-4 h-4 mr-1.5 hidden sm:block" /> {t("settings.notifications")}
              </TabsTrigger>
              <TabsTrigger value="security" className="rounded-xl text-xs sm:text-sm py-2.5 data-[state=active]:shadow-md">
                <Shield className="w-4 h-4 mr-1.5 hidden sm:block" /> {t("settings.security")}
              </TabsTrigger>
              <TabsTrigger value="general" className="rounded-xl text-xs sm:text-sm py-2.5 data-[state=active]:shadow-md">
                <Globe className="w-4 h-4 mr-1.5 hidden sm:block" /> {t("settings.general")}
              </TabsTrigger>
            </TabsList>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-4">
              <div className="glass-strong rounded-3xl p-6 space-y-4">
                <h2 className="text-lg font-semibold font-display text-foreground">Display</h2>
                <ToggleRow
                  icon={mode === "dark" ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                  label={t("settings.darkMode")} desc={mode === "dark" ? "Currently dark" : "Currently light"}
                  checked={mode === "dark"} onChange={toggleMode}
                />
              </div>

              <div className="glass-strong rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold font-display text-foreground">Profile Color Theme</h2>
                </div>
                <p className="text-xs text-muted-foreground">Customizes your profile page appearance</p>
                <div className="grid grid-cols-2 gap-2">
                  {themePalettes.map((th) => (
                    <button key={th.id} onClick={() => selectTheme(th.id)}
                      className={`flex items-center gap-2 p-3 rounded-2xl border transition-all ${theme === th.id ? "border-primary bg-primary/10 shadow-sm" : "border-border hover:border-primary/30"}`}>
                      <div className="flex gap-0.5 w-7 h-7 rounded-full overflow-hidden shadow-inner flex-shrink-0">
                        {th.preview.slice(0, 3).map((hex, i) => (
                          <div key={i} className="flex-1 h-full" style={{ background: hex }} />
                        ))}
                      </div>
                      <span className="text-xs text-foreground truncate">{th.name}</span>
                      {theme === th.id && <Badge variant="secondary" className="ml-auto text-[10px]">Active</Badge>}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <div className="glass-strong rounded-3xl p-6 space-y-1">
                <h2 className="text-lg font-semibold font-display text-foreground mb-3">Channels</h2>
                <ToggleRow icon={<BellRing className="w-5 h-5 text-primary" />} label="Push Notifications" desc="In-app alerts" checked={notifPrefs.push} onChange={() => updateNotifPref("push")} />
                <ToggleRow icon={<Mail className="w-5 h-5 text-primary" />} label="Email Notifications" desc="Get updates via email" checked={notifPrefs.email} onChange={() => updateNotifPref("email")} />
                <ToggleRow icon={notifPrefs.sound ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-primary" />} label="Sound" desc="Notification sounds" checked={notifPrefs.sound} onChange={() => updateNotifPref("sound")} />
              </div>
              <div className="glass-strong rounded-3xl p-6 space-y-1">
                <h2 className="text-lg font-semibold font-display text-foreground mb-3">Categories</h2>
                <ToggleRow icon={<Package className="w-5 h-5 text-primary" />} label="Order Updates" desc="Shipping, delivery status" checked={notifPrefs.orders} onChange={() => updateNotifPref("orders")} />
                <ToggleRow icon={<Tag className="w-5 h-5 text-primary" />} label="Promotions & Deals" desc="Sales, coupons, flash deals" checked={notifPrefs.promotions} onChange={() => updateNotifPref("promotions")} />
                <ToggleRow icon={<Megaphone className="w-5 h-5 text-primary" />} label="Announcements" desc="Store news and updates" checked={notifPrefs.announcements} onChange={() => updateNotifPref("announcements")} />
                <ToggleRow icon={<TrendingUp className="w-5 h-5 text-primary" />} label="Price Drop Alerts" desc="When wishlist items go on sale" checked={notifPrefs.priceDrops} onChange={() => updateNotifPref("priceDrops")} />
                <ToggleRow icon={<ShoppingBag className="w-5 h-5 text-primary" />} label="Restock Alerts" desc="When out-of-stock items return" checked={notifPrefs.restockAlerts} onChange={() => updateNotifPref("restockAlerts")} />
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4">
              <div className="glass-strong rounded-3xl p-6 space-y-1">
                <h2 className="text-lg font-semibold font-display text-foreground mb-3">Account Security</h2>
                <button onClick={() => setChangePasswordOpen(true)} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Change Password</p>
                      <p className="text-xs text-muted-foreground">Update your account password</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <div className="w-full flex items-center justify-between p-3 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                      <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
                </div>
                <div className="w-full flex items-center justify-between p-3 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Active Sessions</p>
                      <p className="text-xs text-muted-foreground">Manage devices logged into your account</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
                </div>
              </div>
              <div className="glass-strong rounded-3xl p-6 space-y-1">
                <h2 className="text-lg font-semibold font-display text-foreground mb-3 text-destructive">Danger Zone</h2>
                <button onClick={() => setDeleteAccountOpen(true)} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-destructive/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-destructive" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-destructive">Delete Account</p>
                      <p className="text-xs text-muted-foreground">Permanently delete your account and data</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </TabsContent>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4">
              {/* Language */}
              <div className="glass-strong rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Languages className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold font-display text-foreground">{t("settings.language")}</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLang(l.code)}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${language === l.code ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{l.nativeLabel}</p>
                        <p className="text-xs text-muted-foreground truncate">{l.label}</p>
                      </div>
                      {language === l.code && <Badge variant="secondary" className="text-[10px] flex-shrink-0">✓</Badge>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency */}
              {enabledCurrencies.length > 1 && (
                <div className="glass-strong rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold font-display text-foreground">{t("settings.currency")}</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">Select your preferred currency for displaying prices</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {enabledCurrencies.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => setCurrency(c.code)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${currency === c.code ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}
                      >
                        <span className="text-xl font-display">{c.symbol}</span>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium text-foreground">{c.code}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.name}</p>
                        </div>
                        {currency === c.code && <Badge variant="secondary" className="text-[10px]">✓</Badge>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Data & Privacy */}
              <div className="glass-strong rounded-3xl p-6 space-y-1">
                <h2 className="text-lg font-semibold font-display text-foreground mb-3">Data & Privacy</h2>
                <button className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Download My Data</p>
                      <p className="text-xs text-muted-foreground">Export your personal data</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Privacy Policy</p>
                      <p className="text-xs text-muted-foreground">Review our privacy terms</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="glass-strong rounded-3xl p-6 space-y-1">
                <h2 className="text-lg font-semibold font-display text-foreground mb-3">Support</h2>
                <button className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Help Center</p>
                      <p className="text-xs text-muted-foreground">FAQs and guides</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Contact Support</p>
                      <p className="text-xs text-muted-foreground">Get help from our team</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <div className="p-3 flex items-center gap-3">
                  <Info className="w-5 h-5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">App Version 2.0.0</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
      <Footer />

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your new password below</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 characters" className="rounded-xl pr-10" />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="rounded-xl" />
            </div>
            {newPassword && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Password strength:</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${newPassword.length >= i * 3 ? (newPassword.length >= 12 ? "bg-green-500" : newPassword.length >= 8 ? "bg-yellow-500" : "bg-red-500") : "bg-muted"}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleChangePassword} disabled={passwordLoading} className="rounded-xl">
              {passwordLoading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" /> Delete Account</DialogTitle>
            <DialogDescription>This action cannot be undone. All your data, orders, and preferences will be permanently deleted.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAccountOpen(false)} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} className="rounded-xl">Delete My Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
