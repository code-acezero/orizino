import React, { useRef, useEffect, useState } from "react";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, animate } from "framer-motion";
import { ArrowRight, ShoppingBag, Shield, Truck, Sparkles, Star, Zap, Globe, Package, Users, Heart, ChevronRight, ChevronDown, Target, Eye } from "lucide-react";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";

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
  show_about: boolean;
  show_mission_vision: boolean;
  show_featured_products: boolean;
  cta_title: string;
  cta_subtitle: string;
  cta_button: string;
  testimonials: { name: string; text: string; rating: number }[];
  about_title: string;
  about_text: string;
  mission_text: string;
  vision_text: string;
}

const defaultLandingConfig: LandingConfig = {
  hero_title_line1: "", hero_title_line2: "", hero_subtitle: "", hero_badge: "",
  hero_cta_primary: "Start Shopping", hero_cta_secondary: "Explore Categories", hero_bg_url: "",
  features: [], stats: [], show_stats: true, show_features: true, show_categories: true,
  show_testimonials: false, show_cta: true, show_about: true, show_mission_vision: true,
  show_featured_products: true,
  cta_title: "", cta_subtitle: "", cta_button: "Create Account", testimonials: [],
  about_title: "Our Story", about_text: "We believe in curating only the finest products for our community.",
  mission_text: "To make premium quality accessible to everyone, everywhere.",
  vision_text: "A world where every purchase brings joy and lasting value.",
};

// Animated counter
const AnimatedCounter: React.FC<{ value: string; inView: boolean }> = ({ value, inView }) => {
  const num = parseInt(value.replace(/[^0-9]/g, ""));
  const suffix = value.replace(/[0-9]/g, "");
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView || isNaN(num)) return;
    const ctrl = animate(0, num, { duration: 1.8, ease: "easeOut", onUpdate: (v) => setDisplay(Math.round(v)) });
    return () => ctrl.stop();
  }, [inView, num]);
  if (isNaN(num)) return <span>{value}</span>;
  return <span>{display}{suffix}</span>;
};

// 3D tilt card
const TiltCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const sRotX = useSpring(rotX, { stiffness: 200, damping: 20 });
  const sRotY = useSpring(rotY, { stiffness: 200, damping: 20 });

  return (
    <motion.div
      ref={ref}
      style={{ rotateX: sRotX, rotateY: sRotY, transformPerspective: 800, transformStyle: "preserve-3d" }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        rotX.set(((e.clientY - rect.top) / rect.height - 0.5) * -12);
        rotY.set(((e.clientX - rect.left) / rect.width - 0.5) * 12);
      }}
      onMouseLeave={() => { rotX.set(0); rotY.set(0); }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const LandingPage: React.FC = () => {
  useSeoMeta("landing", "Welcome");
  const { formatPrice } = useCurrency();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

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

  const { data: featuredProducts = [] } = useQuery({
    queryKey: ["landing-featured-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, slug, price, compare_at_price, thumbnail, avg_rating")
        .eq("is_active", true).eq("is_featured", true).order("created_at", { ascending: false }).limit(6);
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

  // Refs for section in-view
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });

  const hasHeroContent = cfg.hero_title_line1 || cfg.hero_title_line2 || cfg.hero_subtitle;

  // Staggered letter animation
  const letterVariants = {
    hidden: { opacity: 0, y: 40, rotateX: -60 },
    visible: (i: number) => ({
      opacity: 1, y: 0, rotateX: 0,
      transition: { delay: 0.4 + i * 0.03, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Floating glass nav */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-[1440px] px-4 lg:px-6 py-3">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-between px-5 py-2.5 rounded-2xl bg-card/40 backdrop-blur-2xl border border-border/20 shadow-[0_8px_32px_hsl(0_0%_0%/0.12)]"
          >
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
              <Link to="/auth" className="text-xs font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-full hover:bg-primary/90 transition-colors shadow-[0_2px_12px_hsl(var(--primary)/0.3)]">
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </nav>

      {/* ═══════════════ HERO ═══════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden" style={{ perspective: "1200px" }}>
        <div className="absolute inset-0">
          {cfg.hero_bg_url ? (
            <>
              <img src={cfg.hero_bg_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-background" />
              <motion.div className="absolute inset-0" style={{ y: heroY }}>
                {/* Mesh grid */}
                <div className="absolute inset-0 opacity-[0.04]" style={{
                  backgroundImage: `linear-gradient(hsl(var(--primary)/0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.4) 1px, transparent 1px)`,
                  backgroundSize: '80px 80px',
                }} />
                {/* Glow orbs */}
                <motion.div className="absolute top-[10%] right-[15%] w-[600px] h-[600px] rounded-full blur-[150px]"
                  style={{ background: "radial-gradient(circle, hsl(var(--primary)/0.12), transparent 70%)" }}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
                  transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                />
                <motion.div className="absolute bottom-[15%] left-[5%] w-[500px] h-[500px] rounded-full blur-[120px]"
                  style={{ background: "radial-gradient(circle, hsl(var(--accent)/0.1), transparent 70%)" }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 2 }}
                />
                {/* 3D floating shapes */}
                <motion.div
                  className="absolute top-[25%] right-[12%] w-32 h-32 border border-primary/15 rounded-2xl"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{ rotateX: [0, 360], rotateY: [0, 180], y: [0, -30, 0] }}
                  transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                />
                <motion.div
                  className="absolute top-[55%] right-[30%] w-16 h-16 border border-accent/20 rounded-full"
                  animate={{ scale: [1, 1.4, 1], rotateZ: [0, 180, 360], opacity: [0.3, 0.7, 0.3] }}
                  transition={{ repeat: Infinity, duration: 12 }}
                />
                <motion.div
                  className="absolute top-[40%] right-[22%] w-24 h-24"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{ rotateY: [0, 360], rotateX: [0, 90, 0] }}
                  transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                >
                  <div className="w-full h-full border border-primary/10 transform rotate-45" />
                </motion.div>
                {/* Floating particles */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div key={i}
                    className="absolute w-1 h-1 rounded-full bg-primary/40"
                    style={{ left: `${15 + i * 10}%`, top: `${20 + (i % 3) * 25}%` }}
                    animate={{ y: [0, -(20 + i * 5), 0], opacity: [0.2, 0.7, 0.2] }}
                    transition={{ repeat: Infinity, duration: 3 + i * 0.5, delay: i * 0.3 }}
                  />
                ))}
              </motion.div>
            </>
          )}
        </div>

        <motion.div className="relative container mx-auto px-4 py-24 pt-32" style={{ scale: heroScale, opacity: heroOpacity }}>
          <div className="max-w-3xl" style={{ transformStyle: "preserve-3d" }}>
            {cfg.hero_badge && (
              <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.2em] border border-primary/30 text-primary bg-primary/5 mb-8 backdrop-blur-sm">
                  <Sparkles className="w-3 h-3" /> {cfg.hero_badge}
                </span>
              </motion.div>
            )}
            {hasHeroContent && (
              <div className="mb-8" style={{ perspective: "600px" }}>
                {cfg.hero_title_line1 && (
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-display leading-[1.05] tracking-tight text-foreground">
                    {cfg.hero_title_line1.split("").map((char, i) => (
                      <motion.span key={i} custom={i} variants={letterVariants} initial="hidden" animate="visible"
                        className="inline-block" style={{ transformOrigin: "bottom" }}>
                        {char === " " ? "\u00A0" : char}
                      </motion.span>
                    ))}
                  </h1>
                )}
                {cfg.hero_title_line2 && (
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-display leading-[1.05] tracking-tight text-gradient mt-1">
                    {cfg.hero_title_line2.split("").map((char, i) => (
                      <motion.span key={i} custom={i + (cfg.hero_title_line1?.length || 0)} variants={letterVariants} initial="hidden" animate="visible"
                        className="inline-block" style={{ transformOrigin: "bottom" }}>
                        {char === " " ? "\u00A0" : char}
                      </motion.span>
                    ))}
                  </h1>
                )}
              </div>
            )}
            {cfg.hero_subtitle && (
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.8 }}
                className="text-base md:text-lg text-muted-foreground mb-10 max-w-lg leading-relaxed">
                {cfg.hero_subtitle}
              </motion.p>
            )}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1 }} className="flex flex-wrap gap-3">
              <Link to="/home">
                <motion.span whileHover={{ scale: 1.04, boxShadow: "0 8px 40px hsl(var(--primary)/0.4)" }} whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-[0_4px_20px_hsl(var(--primary)/0.3)] transition-shadow">
                  {cfg.hero_cta_primary || "Start Shopping"} <ArrowRight className="w-4 h-4" />
                </motion.span>
              </Link>
              <Link to="/home">
                <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-border/60 text-foreground font-medium text-sm hover:bg-secondary/50 backdrop-blur-sm transition-colors">
                  {cfg.hero_cta_secondary || "Explore"} <ChevronRight className="w-4 h-4" />
                </motion.span>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground/50" />
        </motion.div>
      </section>

      {/* ═══════════════ ABOUT US ═══════════════ */}
      {cfg.show_about && (
        <section className="py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)/0.5) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }} />
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary mb-4">About Us</p>
                <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-6 leading-tight">
                  {cfg.about_title || "Our Story"}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {cfg.about_text || "We believe in curating only the finest products for our community."}
                </p>
                <div className="h-1 w-20 bg-gradient-to-r from-primary to-accent rounded-full" />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
                className="relative flex justify-center"
              >
                {/* Decorative 3D element */}
                <div className="relative w-72 h-72">
                  <motion.div
                    className="absolute inset-0 rounded-3xl border border-primary/20 bg-primary/5 backdrop-blur-sm"
                    animate={{ rotateY: [0, 10, 0, -10, 0], rotateX: [0, -5, 0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                    style={{ transformStyle: "preserve-3d", perspective: "800px" }}
                  />
                  <motion.div
                    className="absolute inset-4 rounded-2xl border border-accent/15 bg-accent/5"
                    animate={{ rotateY: [0, -8, 0, 8, 0], rotateX: [0, 6, 0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 1 }}
                    style={{ transformStyle: "preserve-3d" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ repeat: Infinity, duration: 4 }}
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center backdrop-blur-sm"
                    >
                      <Sparkles className="w-8 h-8 text-primary" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ MISSION & VISION ═══════════════ */}
      {cfg.show_mission_vision && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary mb-2">What Drives Us</p>
              <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground">Mission & Vision</h2>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                <TiltCard className="h-full">
                  <div className="rounded-3xl border border-border/30 bg-card/40 backdrop-blur-xl p-8 h-full hover:border-primary/30 transition-colors relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                        <Target className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="font-display font-bold text-xl text-foreground mb-3">Our Mission</h3>
                      <p className="text-muted-foreground leading-relaxed text-sm">
                        {cfg.mission_text || "To make premium quality accessible to everyone, everywhere."}
                      </p>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                <TiltCard className="h-full">
                  <div className="rounded-3xl border border-border/30 bg-card/40 backdrop-blur-xl p-8 h-full hover:border-accent/30 transition-colors relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
                        <Eye className="w-7 h-7 text-accent-foreground" />
                      </div>
                      <h3 className="font-display font-bold text-xl text-foreground mb-3">Our Vision</h3>
                      <p className="text-muted-foreground leading-relaxed text-sm">
                        {cfg.vision_text || "A world where every purchase brings joy and lasting value."}
                      </p>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ FEATURED PRODUCTS ═══════════════ */}
      {cfg.show_featured_products && featuredProducts.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary mb-2">Curated For You</p>
              <div className="flex items-end justify-between">
                <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">Featured Products</h2>
                <Link to="/home" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <motion.div className="h-0.5 bg-gradient-to-r from-primary to-transparent mt-3 rounded-full"
                initial={{ width: 0 }} whileInView={{ width: "120px" }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }}
              />
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {featuredProducts.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <TiltCard>
                    <Link to={`/product/${p.slug}`} className="group block rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm overflow-hidden hover:border-primary/30 transition-all">
                      <div className="aspect-square overflow-hidden relative">
                        <img src={p.thumbnail || "/placeholder.svg"} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                        {p.compare_at_price && (
                          <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground">
                            -{Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100)}%
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">{p.name}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-sm font-bold text-foreground">{formatPrice(p.price)}</span>
                          {p.compare_at_price && <span className="text-[10px] text-muted-foreground line-through">{formatPrice(p.compare_at_price)}</span>}
                        </div>
                        {p.avg_rating && p.avg_rating > 0 && (
                          <div className="flex items-center gap-0.5 mt-1">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <Star key={j} className={`w-2.5 h-2.5 ${j < Math.round(p.avg_rating!) ? "text-primary fill-primary" : "text-muted-foreground/30"}`} />
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ STATS ═══════════════ */}
      {cfg.show_stats && cfg.stats.length > 0 && (
        <section ref={statsRef} className="py-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
          <div className="container mx-auto px-4 relative">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {cfg.stats.map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}>
                  <TiltCard>
                    <div className="text-center rounded-2xl border border-border/20 bg-card/30 backdrop-blur-sm p-6 hover:border-primary/20 transition-colors">
                      <p className="text-3xl md:text-4xl font-bold font-display text-gradient">
                        <AnimatedCounter value={stat.value} inView={statsInView} />
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ FEATURES ═══════════════ */}
      {cfg.show_features && cfg.features.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary mb-2">Why Choose Us</p>
              <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">Built Different</h2>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {cfg.features.map((f, i) => {
                const Icon = iconMap[f.icon] || Sparkles;
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                    <TiltCard>
                      <div className="group rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm p-6 hover:border-primary/30 transition-all h-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10">
                          <motion.div
                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4"
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                          >
                            <Icon className="w-6 h-6 text-primary" />
                          </motion.div>
                          <h3 className="font-display font-semibold text-foreground text-sm mb-1.5">{f.title}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                        </div>
                      </div>
                    </TiltCard>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ CATEGORIES ═══════════════ */}
      {cfg.show_categories && categories.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary mb-2">Browse</p>
              <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">Shop by Category</h2>
              {productCount > 0 && <p className="text-sm text-muted-foreground mt-1">{productCount}+ products across {categories.length} categories</p>}
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((cat, i) => (
                <motion.div key={cat.slug} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                  <Link to={`/categories/${cat.slug}`} className="group block rounded-2xl overflow-hidden relative h-40 hover:scale-[1.02] transition-transform">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                    <div className="absolute inset-0 flex flex-col items-center justify-end p-4">
                      {cat.icon_url ? (
                        <img src={cat.icon_url} alt="" className="w-8 h-8 rounded-lg object-contain mb-2" />
                      ) : cat.icon ? (
                        <span className="text-xl mb-2">{cat.icon}</span>
                      ) : (
                        <Package className="w-6 h-6 text-muted-foreground mb-2" />
                      )}
                      <p className="text-xs font-semibold text-foreground text-center group-hover:text-primary transition-colors">{cat.name}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      {cfg.show_testimonials && cfg.testimonials.length > 0 && (
        <section className="py-16 md:py-24 overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary mb-2">Testimonials</p>
              <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">What Our Customers Say</h2>
            </motion.div>
            {/* Marquee-style auto scroll */}
            <div className="relative">
              <motion.div
                className="flex gap-5"
                animate={{ x: [0, -(cfg.testimonials.length * 320)] }}
                transition={{ repeat: Infinity, duration: cfg.testimonials.length * 8, ease: "linear" }}
              >
                {[...cfg.testimonials, ...cfg.testimonials].map((t, i) => (
                  <div key={i} className="shrink-0 w-[300px] rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-6">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-primary fill-primary" />)}
                    </div>
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed italic">"{t.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                        {t.name.charAt(0)}
                      </div>
                      <p className="text-xs font-semibold text-foreground">{t.name}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ CTA ═══════════════ */}
      {cfg.show_cta && (cfg.cta_title || siteName) && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              className="rounded-3xl border border-border/30 bg-card/30 backdrop-blur-xl p-10 md:p-16 text-center relative overflow-hidden">
              {/* Floating shapes behind CTA */}
              <motion.div className="absolute top-10 left-10 w-20 h-20 border border-primary/10 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ repeat: Infinity, duration: 5 }}
              />
              <motion.div className="absolute bottom-10 right-10 w-14 h-14 border border-accent/10 rounded-lg"
                animate={{ rotate: [0, 90, 180, 270, 360] }}
                transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
              />
              <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 50% 50%, hsl(var(--primary)/0.3), transparent 70%)" }} />
              <div className="relative z-10">
                <h2 className="text-2xl md:text-4xl font-bold font-display text-foreground mb-4">
                  {cfg.cta_title || (siteName ? <>Ready for <span className="text-gradient">{siteName}</span>?</> : "")}
                </h2>
                {cfg.cta_subtitle && <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">{cfg.cta_subtitle}</p>}
                <Link to="/auth">
                  <motion.span
                    whileHover={{ scale: 1.05, boxShadow: "0 8px 40px hsl(var(--primary)/0.4)" }}
                    whileTap={{ scale: 0.97 }}
                    animate={{ boxShadow: ["0 4px 20px hsl(var(--primary)/0.3)", "0 4px 30px hsl(var(--primary)/0.5)", "0 4px 20px hsl(var(--primary)/0.3)"] }}
                    transition={{ boxShadow: { repeat: Infinity, duration: 2 } }}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
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
