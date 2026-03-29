import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Send, Github, Twitter, Instagram, Mail, Shield, Zap, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/app-toast";

const Footer: React.FC = () => {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const year = new Date().getFullYear();

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings-footer"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value").in("key", ["site_name", "logo_url", "site_icon_url"]);
      const map: Record<string, any> = {};
      data?.forEach((s) => { const val = s.value; map[s.key] = typeof val === "object" && val !== null ? (val as any).value ?? val : val; });
      return map;
    },
    staleTime: 10 * 60 * 1000,
  });

  const rawName = siteSettings?.site_name;
  const siteName = String(typeof rawName === "object" && rawName !== null ? (rawName as any).value ?? "" : rawName ?? "");
  const logoUrl = (siteSettings?.logo_url as string) || "";
  const siteIconUrl = (siteSettings?.site_icon_url as string) || "";

  const { data: footerCategories = [] } = useQuery({
    queryKey: ["footer-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("name, slug").eq("is_active", true).is("parent_id", null).order("sort_order").limit(5);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const handleSubscribe = async () => {
    if (!email.trim() || subscribing) return;
    setSubscribing(true);
    const { error } = await supabase.from("email_subscriptions").insert({ email: email.trim().toLowerCase() });
    setSubscribing(false);
    if (error?.code === "23505") toast.success("You're already subscribed!");
    else if (error) toast.error("Subscription failed.");
    else { toast.success("Subscribed!"); setEmail(""); }
  };

  const quickLinks = [
    { label: "About", to: "/page/about" },
    { label: "FAQ", to: "/page/faq" },
    { label: "Support", to: "/support" },
    { label: "Privacy", to: "/page/privacy" },
    { label: "Terms", to: "/page/terms" },
  ];

  const socials = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Github, href: "#", label: "Github" },
    { icon: Mail, href: "#", label: "Email" },
  ];

  return (
    <footer className="relative mt-12 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="relative max-w-[1440px] mx-auto px-4 lg:px-6">
        {/* Compact grid */}
        <div className="py-8 grid grid-cols-2 md:grid-cols-5 gap-6 items-start">
          {/* Brand + Newsletter combined */}
          <div className="col-span-2">
            <Link to="/home" className="inline-flex items-center gap-2 mb-3 group">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="w-7 h-7 rounded-full object-cover" />
              ) : siteIconUrl ? (
                <img src={siteIconUrl} alt={siteName} className="w-7 h-7 rounded-full object-cover" />
              ) : siteName ? (
                <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xs">{siteName.charAt(0)}</span>
                </div>
              ) : null}
              {siteName && <span className="font-display font-bold text-foreground">{siteName}</span>}
            </Link>
            <div className="flex gap-2 max-w-xs mb-3">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                placeholder="your@email.com"
                className="flex-1 px-3.5 py-2 rounded-full glass border border-border/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all" />
              <button onClick={handleSubscribe} disabled={subscribing}
                className="shrink-0 w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground hover:shadow-[0_0_14px_hsl(var(--primary)/0.4)] transition-shadow disabled:opacity-50">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {socials.map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} aria-label={label}
                  className="w-7 h-7 rounded-full border border-border/40 flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-all">
                  <Icon className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground mb-2">Navigate</h4>
            <ul className="space-y-1.5">
              {quickLinks.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="group inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {label}
                    <ArrowUpRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground mb-2">Categories</h4>
            <ul className="space-y-1.5">
              {footerCategories.map((cat) => (
                <li key={cat.slug}>
                  <Link to={`/categories/${cat.slug}`} className="group inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {cat.name}
                    <ArrowUpRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground mb-2">Promise</h4>
            <div className="space-y-2">
              {[
                { icon: Shield, title: "Secure", desc: "256-bit SSL" },
                { icon: Zap, title: "Fast", desc: "Express delivery" },
                { icon: Globe, title: "Global", desc: "Ship worldwide" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-2">
                  <Icon className="w-3 h-3 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] font-medium text-foreground leading-none">{title}</p>
                    <p className="text-[9px] text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/30 py-3 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">{siteName ? `© ${year} ${siteName}` : `© ${year}`}</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] text-muted-foreground">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
