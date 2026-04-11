import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Send, Github, Twitter, Instagram, Mail, Shield, Zap, Globe, ArrowUpRight, Facebook, Youtube } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/app-toast";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface FooterConfig {
  show_newsletter: boolean;
  show_social: boolean;
  show_categories: boolean;
  show_quick_links: boolean;
  show_trust_badges: boolean;
  copyright_text: string;
  footer_style: "minimal" | "compact" | "expanded";
  bg_style: "transparent" | "glass" | "solid";
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
  social_tiktok: string;
  social_youtube: string;
}

const defaultFooterConfig: FooterConfig = {
  show_newsletter: true,
  show_social: true,
  show_categories: true,
  show_quick_links: true,
  show_trust_badges: true,
  copyright_text: "",
  footer_style: "compact",
  bg_style: "glass",
  social_facebook: "",
  social_instagram: "",
  social_twitter: "",
  social_tiktok: "",
  social_youtube: "",
};

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
    staleTime: 15 * 60 * 1000,
  });

  const { data: footerConfig } = useQuery({
    queryKey: ["footer-config"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "footer_config").maybeSingle();
      return data?.value ? { ...defaultFooterConfig, ...(data.value as unknown as FooterConfig) } : defaultFooterConfig;
    },
    staleTime: 15 * 60 * 1000,
  });

  const cfg = footerConfig || defaultFooterConfig;

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
    staleTime: 15 * 60 * 1000,
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
    { icon: Twitter, href: cfg.social_twitter || "#", label: "Twitter" },
    { icon: Instagram, href: cfg.social_instagram || "#", label: "Instagram" },
    { icon: Facebook, href: cfg.social_facebook || "#", label: "Facebook" },
    { icon: Youtube, href: cfg.social_youtube || "#", label: "YouTube" },
    { icon: Mail, href: "#", label: "Email" },
  ].filter(s => s.href !== "#" || !cfg.social_twitter); // show all if no custom configured

  const trustItems = [
    { icon: Shield, label: "256-bit SSL" },
    { icon: Zap, label: "Express Delivery" },
    { icon: Globe, label: "Ship Worldwide" },
  ];

  const bgClass = cfg.bg_style === "glass" ? "glass-strong" : cfg.bg_style === "solid" ? "bg-card" : "bg-transparent";
  const copyrightText = cfg.copyright_text || (siteName ? `© ${year} ${siteName}` : `© ${year}`);

  // Minimal: single bar
  if (cfg.footer_style === "minimal") {
    return (
      <footer className={`relative mt-8 ${bgClass}`}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl || siteIconUrl ? (
              <img src={logoUrl || siteIconUrl} alt={siteName} className="w-5 h-5 rounded-full object-cover" />
            ) : null}
            <p className="text-[11px] text-muted-foreground">{copyrightText}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] text-muted-foreground">Operational</span>
          </div>
        </div>
      </footer>
    );
  }

  // Expanded: full multi-row layout
  if (cfg.footer_style === "expanded") {
    return (
      <footer className={`relative mt-8 overflow-hidden ${bgClass}`}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        {/* Decorative orbs */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-[1440px] mx-auto px-4 lg:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Brand + Newsletter */}
            <div className="col-span-2">
              <Link to="/home" className="inline-flex items-center gap-2 mb-3 group">
                {logoUrl ? <img src={logoUrl} alt={siteName} className="w-7 h-7 rounded-full object-cover" />
                  : siteIconUrl ? <img src={siteIconUrl} alt={siteName} className="w-7 h-7 rounded-full object-cover" />
                  : siteName ? <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center"><span className="text-primary-foreground font-bold text-xs">{siteName.charAt(0)}</span></div>
                  : null}
                {siteName && <span className="font-bold text-foreground" style={{ fontFamily: 'var(--font-title, var(--font-display))' }}>{siteName}</span>}
              </Link>
              {cfg.show_newsletter && (
                <div className="flex gap-2 max-w-xs mb-3">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                    placeholder="your@email.com"
                    className="flex-1 px-3.5 py-2 rounded-full glass border border-border/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
                  <button onClick={handleSubscribe} disabled={subscribing}
                    className="shrink-0 w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground hover:shadow-[0_0_14px_hsl(var(--primary)/0.4)] transition-shadow disabled:opacity-50">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {cfg.show_social && (
                <div className="flex items-center gap-2">
                  {socials.map(({ icon: Icon, href, label }) => (
                    <a key={label} href={href} aria-label={label}
                      className="w-7 h-7 rounded-full border border-border/40 flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-all">
                      <Icon className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {cfg.show_quick_links && (
              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground mb-2">Navigate</h4>
                <ul className="space-y-1.5">
                  {quickLinks.map(({ label, to }) => (
                    <li key={label}><Link to={to} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{label}</Link></li>
                  ))}
                </ul>
              </div>
            )}

            {cfg.show_categories && (
              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground mb-2">Categories</h4>
                <ul className="space-y-1.5">
                  {footerCategories.map((cat) => (
                    <li key={cat.slug}><Link to={`/categories/${cat.slug}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{cat.name}</Link></li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="border-t border-border/30 mt-6 pt-3 flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">{copyrightText}</p>
            <div className="flex items-center gap-3">
              {cfg.show_trust_badges && trustItems.map(({ icon: Icon, label }) => (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    <div className="w-5 h-5 rounded-full border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors cursor-help">
                      <Icon className="w-2.5 h-2.5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">{label}</p></TooltipContent>
                </Tooltip>
              ))}
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] text-muted-foreground">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Default: Compact — two row artistic layout
  return (
    <footer className={`relative mt-8 overflow-hidden ${bgClass}`}>
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      {/* Subtle decorative orbs */}
      <motion.div
        className="absolute -top-16 left-1/4 w-32 h-32 bg-primary/[0.03] rounded-full blur-3xl pointer-events-none"
        animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-8 right-1/3 w-24 h-24 bg-accent/[0.04] rounded-full blur-2xl pointer-events-none"
        animate={{ x: [0, -15, 0], y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 2 }}
      />

      <div className="relative max-w-[1440px] mx-auto px-4 lg:px-6">
        <div className="py-5 flex flex-col gap-4">
          {/* Top row: Brand + Links + Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Brand */}
            <Link to="/home" className="inline-flex items-center gap-2 group shrink-0">
              {logoUrl ? <img src={logoUrl} alt={siteName} className="w-6 h-6 rounded-full object-cover" />
                : siteIconUrl ? <img src={siteIconUrl} alt={siteName} className="w-6 h-6 rounded-full object-cover" />
                : siteName ? <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center"><span className="text-primary-foreground font-bold text-[10px]">{siteName.charAt(0)}</span></div>
                : null}
              {siteName && <span className="font-semibold text-sm text-foreground" style={{ fontFamily: 'var(--font-title, var(--font-display))' }}>{siteName}</span>}
            </Link>

            {/* Link pills — wrap on tablet */}
            {cfg.show_quick_links && (
              <div className="flex flex-wrap items-center gap-1">
                {quickLinks.map(({ label, to }) => (
                  <Link key={label} to={to}
                    className="px-3 py-1 rounded-full text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
                    {label}
                  </Link>
                ))}
                {cfg.show_categories && footerCategories.slice(0, 3).map((cat) => (
                  <Link key={cat.slug} to={`/categories/${cat.slug}`}
                    className="px-3 py-1 rounded-full text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Second row: trust + social + newsletter (wraps properly on tablet) */}
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {cfg.show_trust_badges && trustItems.map(({ icon: Icon, label }) => (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    <div className="w-6 h-6 rounded-full border border-border/30 flex items-center justify-center text-muted-foreground/60 hover:text-primary hover:border-primary/40 transition-all cursor-help">
                      <Icon className="w-3 h-3" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top"><p className="text-xs">{label}</p></TooltipContent>
                </Tooltip>
              ))}

              {cfg.show_social && (
                <div className="flex items-center gap-1 ml-1">
                  {socials.slice(0, 4).map(({ icon: Icon, href, label }) => (
                    <a key={label} href={href} aria-label={label}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-primary transition-all">
                      <Icon className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {cfg.show_newsletter && (
              <div className="flex gap-1.5">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                  placeholder="your@email.com"
                  className="w-36 px-3 py-1.5 rounded-full glass border border-border/40 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
                <button onClick={handleSubscribe} disabled={subscribing}
                  className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground hover:shadow-[0_0_10px_hsl(var(--primary)/0.3)] transition-shadow disabled:opacity-50">
                  <Send className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom strip */}
        <div className="border-t border-border/20 py-2.5 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground/70">{copyrightText}</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] text-muted-foreground/60">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
