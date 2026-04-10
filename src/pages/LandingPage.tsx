import React, { useRef } from "react";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ShoppingBag, Shield, Truck, Sparkles, Star, Zap, Globe, Package, Users, Heart, ChevronRight } from "lucide-react";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  hero_title_line1: "", hero_title_line2: "", hero_subtitle: "", hero_badge: "",
  hero_cta_primary: "Start Shopping", hero_cta_secondary: "Explore Categories", hero_bg_url: "",
  features: [], stats: [], show_stats: true, show_features: true, show_categories: true,
  show_testimonials: false, show_cta: true, cta_title: "", cta_subtitle: "", cta_button: "Create Account", testimonials: [],
};

const LandingPage: React.FC = () => {
  useSeoMeta("landing", "Welcome");
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings-landing"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value").in("key", ["site_name", "logo_url", "landing_config"]);
      const map: Record<string, any> = {};
      data?.forEach((s) => { const val = s.value; map[s.key] = typeof val === "object" && val !== null ? (val as any).value ?? val : val; });
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Floating header */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-[1440px] px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between px-5 py-2.5 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/30">
            <Link to="/" className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="w-7 h-7 rounded-lg object-cover" />
              ) : siteName ? (
                <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xs">{siteName.charAt(0)}</span>
                </div>
              ) : null}
              {siteName && <span className="font-display font-bold text-foreground">{siteName}</span>}
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/home" className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-secondary/50">Shop</Link>
              <Link to="/auth" className="text-xs font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-full hover:bg-primary/90 transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        {/* Layered depth background */}
        <div className="absolute inset-0">
          {cfg.hero_bg_url ? (
            <>
              <img src={cfg.hero_bg_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
            </>
          ) : (
            <>
              {/* Multi-layer gradient depth */}
              <div className="absolute inset-0 bg-background" />
              <motion.div className="absolute inset-0" style={{ y: heroY }}>
                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                  backgroundImage: `linear-gradient(hsl(var(--primary)/0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.3) 1px, transparent 1px)`,
                  backgroundSize: '60px 60px',
                }} />
                {/* Primary glow orb */}
                <div className="absolute top-[15%] right-[20%] w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px]" />
                {/* Accent glow orb */}
                <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] rounded-full bg-accent/6 blur-[100px]" />
                {/* Small decorative shapes */}
                <motion.div
                  className="absolute top-[30%] right-[15%] w-40 h-40 border border-primary/10 rounded-3xl"
                  animate={{ rotate: [0, 90], y: [0, -20, 0] }}
                  transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                />
                <motion.div
                  className="absolute top-[50%] right-[35%] w-20 h-20 border border-accent/10 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 6 }}
                />
                <motion.div
                  className="absolute bottom-[30%] right-[25%] w-2 h-2 rounded-full bg-primary/40"
                  animate={{ y: [0, -30, 0], x: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                />
                <motion.div
                  className="absolute top-[25%] left-[40%] w-1.5 h-1.5 rounded-full bg-accent/50"
                  animate={{ y: [0, -20, 0] }}
                  transition={{ repeat: Infinity, duration: 3, delay: 1 }}
                />
                {/* Corner marks */}
                <div className="absolute top-[20%] right-[10%] w-16 h-16">
                  <div className="absolute top-0 left-0 w-4 h-px bg-primary/20" />
                  <div className="absolute top-0 left-0 w-px h-4 bg-primary/20" />
                </div>
                <div className="absolute bottom-[25%] right-[45%] w-16 h-16">
                  <div className="absolute bottom-0 right-0 w-4 h-px bg-primary/15" />
                  <div className="absolute bottom-0 right-0 w-px h-4 bg-primary/15" />
                </div>
              </motion.div>
            </>
          )}
        </div>

        <motion.div className="relative container mx-auto px-4 py-24 pt-32" style={{ scale: heroScale, opacity: heroOpacity }}>
          <div className="max-w-3xl">
            {cfg.hero_badge && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.15em] border border-primary/30 text-primary bg-primary/5 mb-6">
                  <Sparkles className="w-3 h-3" /> {cfg.hero_badge}
                </span>
              </motion.div>
            )}
            {hasHeroContent && (
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-display leading-[1.05] mb-6 tracking-tight">
                {cfg.hero_title_line1 && <span className="text-foreground block">{cfg.hero_title_line1}</span>}
                {cfg.hero_title_line2 && <span className="text-gradient block">{cfg.hero_title_line2}</span>}
              </motion.h1>
            )}
            {cfg.hero_subtitle && (
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                className="text-base md:text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
                {cfg.hero_subtitle}
              </motion.p>
            )}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="flex flex-wrap gap-3">
              <Link to="/home">
                <motion.span whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-[0_4px_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_4px_30px_hsl(var(--primary)/0.5)] transition-shadow">
                  {cfg.hero_cta_primary || "Start Shopping"} <ArrowRight className="w-4 h-4" />
                </motion.span>
              </Link>
              <Link to="/home">
                <motion.span whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border/60 text-foreground font-medium text-sm hover:bg-secondary/50 transition-colors">
                  {cfg.hero_cta_secondary || "Explore"} <ChevronRight className="w-4 h-4" />
                </motion.span>
              </Link>
            </motion.div>
          </div>

          {/* Floating annotation labels like the reference */}
          {!cfg.hero_bg_url && (
            <div className="hidden lg:block">
              <motion.div
                className="absolute top-[35%] right-[12%]"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
              >
                <div className="flex items-start gap-2">
                  <div className="w-8 h-px bg-primary/30 mt-2" />
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-primary/60">[ CORE_ENTITY ]</p>
                    <p className="text-[9px] text-muted-foreground/60 max-w-[140px]">Curated marketplace<br/>premium selections</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                className="absolute bottom-[30%] right-[25%]"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
              >
                <div className="w-12 h-12 border border-primary/10 rounded-sm" />
                <div className="mt-2">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-primary/60">[ CONNECTIVITY ]</p>
                  <p className="text-[9px] text-muted-foreground/60 max-w-[160px]">Seamless experience<br/>across all devices</p>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </section>

      {/* Stats */}
      {cfg.show_stats && cfg.stats.length > 0 && (
        <section className="py-10 border-y border-border/20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {cfg.stats.map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="text-center">
                  <p className="text-2xl md:text-3xl font-bold font-display text-gradient">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      {cfg.show_features && cfg.features.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cfg.features.map((f, i) => {
                const Icon = iconMap[f.icon] || Sparkles;
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                    className="group rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm p-5 hover:border-primary/30 hover:bg-primary/5 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground text-sm mb-1">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {cfg.show_categories && categories.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary mb-2">Browse</p>
              <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">Shop by Category</h2>
              {productCount > 0 && <p className="text-sm text-muted-foreground mt-1">{productCount}+ products across {categories.length} categories</p>}
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {categories.map((cat, i) => (
                <motion.div key={cat.slug} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                  <Link to={`/categories/${cat.slug}`} className="group block rounded-2xl border border-border/30 bg-card/30 p-4 text-center hover:border-primary/30 hover:bg-primary/5 transition-all">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-14 h-14 mx-auto rounded-xl object-cover mb-2" />
                    ) : cat.icon_url ? (
                      <img src={cat.icon_url} alt={cat.name} className="w-10 h-10 mx-auto rounded-lg object-contain mb-2" />
                    ) : cat.icon ? (
                      <span className="text-2xl block mb-2">{cat.icon}</span>
                    ) : (
                      <Package className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    )}
                    <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{cat.name}</p>
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
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary mb-2">Testimonials</p>
              <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">What Customers Say</h2>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-4">
              {cfg.testimonials.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="rounded-2xl border border-border/30 bg-card/30 p-5">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-primary fill-primary" />)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">"{t.text}"</p>
                  <p className="text-xs font-semibold text-foreground">{t.name}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {cfg.show_cta && (cfg.cta_title || siteName) && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              className="rounded-3xl border border-border/30 bg-card/30 backdrop-blur-sm p-10 md:p-14 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ background: "var(--gradient-glow)" }} />
              <div className="relative z-10">
                <h2 className="text-2xl md:text-4xl font-bold font-display text-foreground mb-3">
                  {cfg.cta_title || (siteName ? <>Ready for <span className="text-gradient">{siteName}</span>?</> : "")}
                </h2>
                {cfg.cta_subtitle && <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">{cfg.cta_subtitle}</p>}
                <Link to="/auth">
                  <motion.span whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-[0_4px_20px_hsl(var(--primary)/0.3)]">
                    {cfg.cta_button || "Get Started"} <ArrowRight className="w-4 h-4" />
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
