import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trackClick } from "@/hooks/use-analytics";
import heroImg from "@/assets/hero-bg.jpg";
import fashionImg from "@/assets/slide-fashion.jpg";
import electronicsImg from "@/assets/slide-electronics.jpg";
import homeImg from "@/assets/slide-home.jpg";

const fallbackSlides = [
  { id: "f1", title: "Discover the Future", subtitle: "New Arrivals", description: "Explore our curated collection of premium products.", image: heroImg, cta: "Shop Now", ctaLink: "/shop" },
  { id: "f2", title: "Street Style Redefined", subtitle: "Fashion", description: "Bold looks for the modern trendsetter.", image: fashionImg, cta: "Explore Fashion", ctaLink: "/categories/fashion" },
  { id: "f3", title: "Tech That Inspires", subtitle: "Electronics", description: "Cutting-edge gadgets designed for tomorrow.", image: electronicsImg, cta: "View Electronics", ctaLink: "/categories/electronics" },
  { id: "f4", title: "Elevate Your Space", subtitle: "Home", description: "Premium appliances for the modern home.", image: homeImg, cta: "Shop Home", ctaLink: "/categories/home-appliance" },
];

interface ShowcaseConfig {
  autoplay_speed: number;
  transition_duration: number;
  height: string;
  overlay_style: string;
  overlay_opacity: number;
  text_position: string;
  text_max_width: string;
  ken_burns: boolean;
  show_dots: boolean;
  show_arrows: boolean;
  dot_style: string;
  title_size: string;
  subtitle_style: string;
  cta_style: string;
  border_radius: string;
  autoplay: boolean;
  pause_on_hover: boolean;
}

const defaultConfig: ShowcaseConfig = {
  autoplay_speed: 6000,
  transition_duration: 800,
  height: "85vh",
  overlay_style: "gradient-left",
  overlay_opacity: 80,
  text_position: "left",
  text_max_width: "2xl",
  ken_burns: true,
  show_dots: true,
  show_arrows: true,
  dot_style: "pill",
  title_size: "7xl",
  subtitle_style: "badge",
  cta_style: "gradient",
  border_radius: "3xl",
  autoplay: true,
  pause_on_hover: true,
};

const ParallaxSlider: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [paused, setPaused] = useState(false);

  const { data: dbSlides = [] } = useQuery({
    queryKey: ["showcase-slides"],
    queryFn: async () => {
      const { data, error } = await supabase.from("showcase_slides").select("*").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: configData } = useQuery({
    queryKey: ["showcase-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("value").eq("key", "showcase_config").maybeSingle();
      if (error) throw error;
      if (!data?.value) return defaultConfig;
      const val = data.value as any;
      return { ...defaultConfig, ...(val?.value ?? val) };
    },
    staleTime: 5 * 60 * 1000,
  });

  const cfg = configData || defaultConfig;

  const slides = dbSlides.length > 0
    ? dbSlides.map((s) => ({ id: s.id, title: s.title, subtitle: s.subtitle || "", description: s.description || "", image: s.image_url, cta: s.cta_text || "Shop Now", ctaLink: s.cta_link || "/shop" }))
    : fallbackSlides;

  useEffect(() => {
    if (slides.length <= 1 || !cfg.autoplay || paused) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % slides.length);
    }, cfg.autoplay_speed);
    return () => clearInterval(timer);
  }, [slides.length, cfg.autoplay, cfg.autoplay_speed, paused]);

  const goTo = useCallback((index: number) => { setDirection(index > current ? 1 : -1); setCurrent(index); }, [current]);
  const prev = () => { setDirection(-1); setCurrent((c) => (c - 1 + slides.length) % slides.length); };
  const next = () => { setDirection(1); setCurrent((c) => (c + 1) % slides.length); };

  const dur = cfg.transition_duration / 1000;
  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0, scale: 1.1 }),
    center: { x: 0, opacity: 1, scale: 1, transition: { duration: dur, ease: [0.25, 0.46, 0.45, 0.94] as const } },
    exit: (dir: number) => ({ x: dir > 0 ? "-30%" : "30%", opacity: 0, scale: 0.95, transition: { duration: dur * 0.75, ease: [0.25, 0.46, 0.45, 0.94] as const } }),
  };

  const slide = slides[current];
  if (!slide) return null;

  // Overlay
  const opa = cfg.overlay_opacity / 100;
  const overlayClasses: Record<string, string> = {
    "gradient-left": `bg-gradient-to-r from-background/${Math.round(opa * 90)} via-background/${Math.round(opa * 50)} to-transparent`,
    "gradient-right": `bg-gradient-to-l from-background/${Math.round(opa * 90)} via-background/${Math.round(opa * 50)} to-transparent`,
    "gradient-bottom": `bg-gradient-to-t from-background/${Math.round(opa * 90)} via-transparent to-transparent`,
    "gradient-center": "",
    "solid": "",
    "none": "hidden",
  };
  const overlayStyle = cfg.overlay_style === "gradient-center"
    ? { background: `radial-gradient(ellipse at center, transparent 30%, hsl(var(--background) / ${opa}) 100%)` }
    : cfg.overlay_style === "solid"
    ? { background: `hsl(var(--background) / ${opa})` }
    : {};

  // Text alignment
  const textAlign = cfg.text_position === "center" ? "items-center text-center" : cfg.text_position === "right" ? "items-end text-right ml-auto" : "";
  const textContainer = cfg.text_position === "center" ? "flex justify-center" : cfg.text_position === "right" ? "flex justify-end" : "";

  // Title size map
  const titleClass = `text-4xl md:text-${cfg.title_size}`;

  // Subtitle
  const subtitleEl = (text: string) => {
    if (cfg.subtitle_style === "badge") return <span className="inline-block btn-pill bg-primary/20 text-primary text-sm mb-4 border border-primary/30">{text}</span>;
    if (cfg.subtitle_style === "underline") return <span className="inline-block text-primary text-sm mb-4 border-b-2 border-primary pb-1">{text}</span>;
    return <span className="inline-block text-primary text-sm mb-4 font-medium">{text}</span>;
  };

  // CTA style
  const ctaClasses: Record<string, string> = {
    gradient: "bg-gradient-primary text-primary-foreground glow-primary",
    solid: "bg-primary text-primary-foreground",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
    ghost: "bg-background/20 backdrop-blur text-foreground border border-foreground/20",
  };

  // Dot style
  const renderDot = (i: number) => {
    const active = i === current;
    if (cfg.dot_style === "number") {
      return (
        <button key={i} onClick={() => goTo(i)}
          className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${active ? "bg-primary text-primary-foreground glow-primary" : "bg-muted-foreground/30 text-muted-foreground hover:bg-muted-foreground/50"}`}>
          {i + 1}
        </button>
      );
    }
    if (cfg.dot_style === "circle") {
      return <button key={i} onClick={() => goTo(i)} className={`w-3 h-3 rounded-full transition-all ${active ? "bg-primary glow-primary scale-125" : "bg-muted-foreground/40 hover:bg-muted-foreground/60"}`} />;
    }
    if (cfg.dot_style === "dash") {
      return <button key={i} onClick={() => goTo(i)} className={`h-1 rounded-full transition-all ${active ? "w-10 bg-primary glow-primary" : "w-4 bg-muted-foreground/40 hover:bg-muted-foreground/60"}`} />;
    }
    // pill default
    return <button key={i} onClick={() => goTo(i)} className={`h-2 rounded-full transition-all duration-300 ${active ? "w-8 bg-primary glow-primary" : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/60"}`} />;
  };

  const radiusClass = cfg.border_radius === "none" ? "" : `rounded-${cfg.border_radius}`;

  return (
    <div
      className={`relative w-full overflow-hidden ${radiusClass}`}
      style={{ height: cfg.height, minHeight: "400px" }}
      onMouseEnter={() => cfg.pause_on_hover && setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence custom={direction} mode="wait">
        <motion.div key={slide.id} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" className="absolute inset-0">
          <motion.div className="absolute inset-0" animate={cfg.ken_burns ? { scale: 1.05 } : {}} transition={{ duration: cfg.autoplay_speed / 1000, ease: "linear" }}>
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
          </motion.div>
          <div className={`absolute inset-0 ${overlayClasses[cfg.overlay_style] || ""}`} style={overlayStyle} />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className={`container mx-auto px-6 lg:px-12 ${textContainer}`}>
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className={`max-w-${cfg.text_max_width} ${textAlign}`}>
                {subtitleEl(slide.subtitle)}
                <h1 className={`${titleClass} font-bold font-display mb-4 leading-tight text-foreground`}>{slide.title}</h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-lg">{slide.description}</p>
                <motion.a href={slide.ctaLink} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className={`inline-flex items-center btn-pill font-semibold text-lg px-8 py-3 ${ctaClasses[cfg.cta_style] || ctaClasses.gradient}`}>
                  {slide.cta}
                </motion.a>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {(cfg.show_arrows || cfg.show_dots) && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
          {cfg.show_arrows && <button onClick={prev} className="glass rounded-full p-2 text-foreground hover:text-primary transition-colors"><ChevronLeft className="w-5 h-5" /></button>}
          {cfg.show_dots && <div className="flex gap-2">{slides.map((_, i) => renderDot(i))}</div>}
          {cfg.show_arrows && <button onClick={next} className="glass rounded-full p-2 text-foreground hover:text-primary transition-colors"><ChevronRight className="w-5 h-5" /></button>}
        </div>
      )}
    </div>
  );
};

export default ParallaxSlider;
