import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Send, Github, Twitter, Instagram, Mail, Zap, Globe, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Footer: React.FC = () => {
  const [email, setEmail] = useState("");
  const year = new Date().getFullYear();

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings-name"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value").in("key", ["site_name"]);
      const map: Record<string, any> = {};
      data?.forEach((s) => {
        const val = s.value;
        map[s.key] = typeof val === "object" && val !== null ? (val as any).value ?? val : val;
      });
      return map;
    },
    staleTime: 10 * 60 * 1000,
  });

  const rawName = siteSettings?.site_name;
  const siteName = String(typeof rawName === "object" && rawName !== null ? (rawName as any).value ?? "Zero" : rawName ?? "Zero");

  const { data: footerCategories = [] } = useQuery({
    queryKey: ["footer-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("name, slug")
        .eq("is_active", true)
        .is("parent_id", null)
        .order("sort_order")
        .limit(5);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const quickLinks = [
    { label: "About", to: "#" },
    { label: "FAQ", to: "#" },
    { label: "Shipping", to: "#" },
    { label: "Returns", to: "#" },
    { label: "Contact", to: "#" },
  ];

  const socials = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Github, href: "#", label: "Github" },
    { icon: Mail, href: "#", label: "Email" },
  ];

  return (
    <footer className="relative mt-24 overflow-hidden">
      {/* Decorative top edge */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-primary shadow-[0_0_20px_hsl(var(--primary)/0.6)]" />

      {/* Glow orbs */}
      <div className="absolute top-12 left-[10%] w-64 h-64 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-[15%] w-48 h-48 rounded-full bg-accent/5 blur-[80px] pointer-events-none" />

      <div className="relative">
        {/* Newsletter section */}
        <div className="border-b border-border/30">
          <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-16">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="max-w-md">
                <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Stay ahead</span>
                </motion.div>
                <h3 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-2">Get the latest drops</h3>
                <p className="text-sm text-muted-foreground">Exclusive deals, new arrivals, and curated picks — straight to your inbox.</p>
              </div>
              <div className="w-full lg:w-auto">
                <div className="flex gap-2 max-w-sm">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
                    className="flex-1 px-5 py-3 rounded-full glass border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all" />
                  <button className="shrink-0 w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] transition-shadow">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/home" className="inline-flex items-center gap-2.5 mb-5 group">
                <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center group-hover:shadow-[0_0_16px_hsl(var(--primary)/0.5)] transition-shadow">
                  <span className="text-primary-foreground font-bold text-sm">{siteName.charAt(0)}</span>
                </div>
                <span className="font-display font-bold text-lg text-foreground">{siteName}</span>
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed mb-5 max-w-[200px]">Premium marketplace for the modern shopper. Quality first, always.</p>
              <div className="flex items-center gap-3 text-muted-foreground">
                {socials.map(({ icon: Icon, href, label }) => (
                  <a key={label} href={href} aria-label={label}
                    className="w-8 h-8 rounded-full border border-border/50 flex items-center justify-center hover:border-primary/50 hover:text-primary hover:shadow-[0_0_10px_hsl(var(--primary)/0.2)] transition-all">
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground mb-4">Navigate</h4>
              <ul className="space-y-2.5">
                {quickLinks.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dynamic Categories */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground mb-4">Categories</h4>
              <ul className="space-y-2.5">
                {footerCategories.map((cat) => (
                  <li key={cat.slug}>
                    <Link to={`/categories/${cat.slug}`} className="group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {cat.name}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trust signals */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground mb-4">We promise</h4>
              <div className="space-y-4">
                {[
                  { icon: Shield, title: "Secure Payments", desc: "256-bit SSL encryption" },
                  { icon: Zap, title: "Fast Delivery", desc: "Express & standard options" },
                  { icon: Globe, title: "Global Shipping", desc: "We deliver worldwide" },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{title}</p>
                      <p className="text-[11px] text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/30">
          <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground">© {year} {siteName} Mall. All rights reserved.</p>
              <div className="flex items-center gap-4">
                {["Privacy", "Terms", "Cookies"].map((item) => (
                  <Link key={item} to="#" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">{item}</Link>
                ))}
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  All systems operational
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
