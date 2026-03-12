import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Shield, Truck, Sparkles, Star, Zap, Globe, Package, Users, Heart } from "lucide-react";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";

const iconMap: Record<string, any> = { ShoppingBag, Shield, Truck, Sparkles, Star, Zap, Globe, Package, Users, Heart };

interface LandingConfig {
  hero_title_line1: string;
  hero_title_line2: string;
  hero_subtitle: string;
  hero_badge: string;
  hero_cta_primary: string;
  hero_cta_secondary: string;
  hero_bg_url: string;
  features: { icon: string; title: string; desc: string }[];
  stats: { value: string; label: string }[];
  show_stats: boolean;
  show_features: boolean;
  show_categories: boolean;
  show_testimonials: boolean;
  show_cta: boolean;
  cta_title: string;
  cta_subtitle: string;
  cta_button: string;
  testimonials: { name: string; text: string; rating: number }[];
}

const defaultLandingConfig: LandingConfig = {
  hero_title_line1: "",
  hero_title_line2: "",
  hero_subtitle: "",
  hero_badge: "",
  hero_cta_primary: "Start Shopping",
  hero_cta_secondary: "Explore Categories",
  hero_bg_url: "",
  features: [],
  stats: [],
  show_stats: true,
  show_features: true,
  show_categories: true,
  show_testimonials: false,
  show_cta: true,
  cta_title: "",
  cta_subtitle: "",
  cta_button: "Create Account",
  testimonials: [],
};

const LandingPage: React.FC = () => {
  useSeoMeta("landing", "Welcome");

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings-landing"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value").in("key", ["site_name", "logo_url", "landing_config"]);
      const map: Record<string, any> = {};
      data?.forEach((s) => {
        const val = s.value;
        map[s.key] = typeof val === "object" && val !== null ? (val as any).value ?? val : val;
      });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  const rawName = siteSettings?.site_name;
  const siteName = String(typeof rawName === "object" && rawName !== null ? (rawName as any).value ?? "" : rawName ?? "");
  const logoUrl = (siteSettings?.logo_url as string) || "";

  const landingRaw = siteSettings?.landing_config;
  const cfg: LandingConfig = { ...defaultLandingConfig, ...(typeof landingRaw === "object" && landingRaw !== null ? landingRaw : {}) };

  const { data: categories = [] } = useQuery({
    queryKey: ["landing-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("name, slug, icon, icon_url, image_url").eq("is_active", true).is("parent_id", null).order("sort_order").limit(6);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: productCount = 0 } = useQuery({
    queryKey: ["landing-product-count"],
    queryFn: async () => {
      const { count } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true);
      return count || 0;
    },
    staleTime: 10 * 60 * 1000,
  });

  const hasHeroContent = cfg.hero_title_line1 || cfg.hero_title_line2 || cfg.hero_subtitle;

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar-like header for landing */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="w-8 h-8 rounded-full object-cover" />
            ) : siteName ? (
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">{siteName.charAt(0)}</span>
              </div>
            ) : null}
            {siteName && <span className="font-display font-bold text-xl text-foreground">{siteName}</span>}
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/home" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Shop</Link>
            <Link to="/auth" className="btn-pill bg-gradient-primary text-primary-foreground font-medium text-sm px-5 py-2">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {cfg.hero_bg_url && (
          <div className="absolute inset-0">
            <img src={cfg.hero_bg_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
          </div>
        )}
        {!cfg.hero_bg_url && (
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-accent/10 blur-[100px]" />
          </div>
        )}

        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-3xl">
            {cfg.hero_badge && (
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                <span className="inline-block btn-pill glass text-primary text-sm mb-6 border border-primary/30">
                  ✨ {cfg.hero_badge}
                </span>
              </motion.div>
            )}
            {hasHeroContent && (
              <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
                className="text-5xl md:text-7xl lg:text-8xl font-bold font-display leading-tight mb-6">
                {cfg.hero_title_line1 && <><span className="text-foreground">{cfg.hero_title_line1} </span><br /></>}
                {cfg.hero_title_line2 && <span className="text-gradient">{cfg.hero_title_line2}</span>}
              </motion.h1>
            )}
            {cfg.hero_subtitle && (
              <motion.p initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
                className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl">
                {cfg.hero_subtitle}
              </motion.p>
            )}
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="flex flex-wrap gap-4">
              <Link to="/home">
                <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 btn-pill bg-gradient-primary text-primary-foreground font-semibold text-lg px-8 py-3.5 glow-primary">
                  {cfg.hero_cta_primary || "Start Shopping"} <ArrowRight className="w-5 h-5" />
                </motion.span>
              </Link>
              <Link to="/home">
                <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 btn-pill glass text-foreground font-semibold text-lg px-8 py-3.5">
                  {cfg.hero_cta_secondary || "Explore"}
                </motion.span>
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-30" style={{ background: "var(--gradient-glow)" }} />
      </section>

      {/* Stats Section */}
      {cfg.show_stats && cfg.stats.length > 0 && (
        <section className="py-12 border-y border-border/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {cfg.stats.map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="text-center">
                  <p className="text-3xl md:text-4xl font-bold font-display text-gradient">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      {cfg.show_features && cfg.features.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {cfg.features.map((f, i) => {
                const Icon = iconMap[f.icon] || Sparkles;
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className="glass rounded-3xl p-6 text-center group hover:border-primary/30 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground text-sm mb-1">{f.title}</h3>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Categories Preview */}
      {cfg.show_categories && categories.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-2">Shop by Category</h2>
              <p className="text-muted-foreground">{productCount > 0 ? `Browse ${productCount}+ products across ${categories.length} categories` : ""}</p>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((cat, i) => (
                <motion.div key={cat.slug} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <Link to={`/categories/${cat.slug}`} className="group glass rounded-2xl p-4 text-center block hover:border-primary/30 transition-all">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-16 h-16 mx-auto rounded-xl object-cover mb-3" />
                    ) : cat.icon_url ? (
                      <img src={cat.icon_url} alt={cat.name} className="w-12 h-12 mx-auto rounded-lg object-contain mb-3" />
                    ) : cat.icon ? (
                      <span className="text-3xl block mb-3">{cat.icon}</span>
                    ) : (
                      <Package className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    )}
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{cat.name}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {cfg.show_testimonials && cfg.testimonials.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-2">What Our Customers Say</h2>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6">
              {cfg.testimonials.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="glass rounded-2xl p-6">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 text-primary fill-primary" />)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">"{t.text}"</p>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {cfg.show_cta && (cfg.cta_title || siteName) && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              className="glass-strong rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{ background: "var(--gradient-glow)" }} />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold font-display text-foreground mb-4">
                  {cfg.cta_title || (siteName ? <>Ready to Experience <span className="text-gradient">{siteName}</span>?</> : "")}
                </h2>
                {cfg.cta_subtitle && <p className="text-muted-foreground mb-8 max-w-lg mx-auto">{cfg.cta_subtitle}</p>}
                <Link to="/auth">
                  <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 btn-pill bg-gradient-primary text-primary-foreground font-semibold text-lg px-10 py-4 glow-primary">
                    {cfg.cta_button || "Get Started"} <ArrowRight className="w-5 h-5" />
                  </motion.span>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default LandingPage;
