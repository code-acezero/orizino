import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Moon, Sun, Palette, Bell, Globe, Shield, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/app-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const themes = [
  { id: "default", label: "Cyber Emerald", color: "160 84% 45%" },
  { id: "ocean", label: "Ocean Blue", color: "200 90% 50%" },
  { id: "sunset", label: "Sunset Orange", color: "25 95% 55%" },
  { id: "rose", label: "Rose Pink", color: "340 82% 55%" },
  { id: "violet", label: "Royal Violet", color: "270 80% 60%" },
  { id: "crimson", label: "Crimson Red", color: "0 85% 55%" },
  { id: "gold", label: "Golden Hour", color: "45 90% 50%" },
  { id: "mint", label: "Fresh Mint", color: "170 70% 45%" },
];

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"dark" | "light">("dark");
  const [theme, setTheme] = useState("default");
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("preferences").eq("id", user.id).single().then(({ data }) => {
      if (data?.preferences) {
        const prefs = data.preferences as Record<string, string>;
        if (prefs.mode) setMode(prefs.mode as "dark" | "light");
        if (prefs.theme) setTheme(prefs.theme);
        if (prefs.notifications !== undefined) setNotifications(prefs.notifications !== "false");
      }
    });
  }, [user]);

  // NOTE: These theme changes apply ONLY to profile page frame/personalization
  // The site-wide theme is controlled from admin settings

  const savePrefs = async (prefs: Record<string, string | boolean>) => {
    if (!user) return;
    setLoading(true);
    const current = { mode, theme, notifications: String(notifications), ...prefs };
    await supabase.from("profiles").update({ preferences: current }).eq("id", user.id);
    setLoading(false);
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

  const toggleNotifications = () => {
    const newVal = !notifications;
    setNotifications(newVal);
    savePrefs({ notifications: String(newVal) });
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold font-display text-foreground mb-8">Settings</h1>

          <div className="space-y-4">
            {/* Profile Theme */}
            <div className="glass-strong rounded-3xl p-6 space-y-4">
              <h2 className="text-lg font-semibold font-display text-foreground">Profile Theme</h2>
              <p className="text-xs text-muted-foreground">These settings customize your profile page appearance only.</p>

              <button onClick={toggleMode} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-3">
                  {mode === "dark" ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">{mode === "dark" ? "On" : "Off"}</p>
                  </div>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors relative ${mode === "dark" ? "bg-primary" : "bg-muted"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-primary-foreground transition-transform ${mode === "dark" ? "left-[22px]" : "left-0.5"}`} />
                </div>
              </button>

              <div>
                <div className="flex items-center gap-2 mb-3 px-3">
                  <Palette className="w-5 h-5 text-primary" />
                  <p className="text-sm font-medium text-foreground">Profile Color Theme</p>
                </div>
                <div className="grid grid-cols-2 gap-2 px-3">
                  {themes.map((t) => (
                    <button key={t.id} onClick={() => selectTheme(t.id)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${theme === t.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}>
                      <div className="w-6 h-6 rounded-full" style={{ background: `hsl(${t.color})` }} />
                      <span className="text-sm text-foreground">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="glass-strong rounded-3xl p-6">
              <h2 className="text-lg font-semibold font-display text-foreground mb-4">Notifications</h2>
              <button onClick={toggleNotifications} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">Offers, order updates & announcements</p>
                  </div>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors relative ${notifications ? "bg-primary" : "bg-muted"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-primary-foreground transition-transform ${notifications ? "left-[22px]" : "left-0.5"}`} />
                </div>
              </button>
            </div>

            {/* Account */}
            <div className="glass-strong rounded-3xl p-6 space-y-1">
              <h2 className="text-lg font-semibold font-display text-foreground mb-4">Account</h2>
              {[
                { icon: Shield, label: "Privacy & Security", desc: "Password, 2FA" },
                { icon: Globe, label: "Language & Region", desc: "English (US)" },
              ].map((item) => (
                <button key={item.label} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default SettingsPage;
