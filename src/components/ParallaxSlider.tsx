import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trackClick } from "@/hooks/use-analytics";
import demoSlide1 from "@/assets/demo-slide-1.jpg";
import demoSlide2 from "@/assets/demo-slide-2.jpg";
import demoSlide3 from "@/assets/demo-slide-3.jpg";

const fallbackSlides = [
  { id: "demo1", title: "Step Into Style", subtitle: "New Collection", description: "Explore premium sneakers crafted for the modern trendsetter.", image: demoSlide1, cta: "Shop Now", ctaLink: "/shop", transitionType: "" },
  { id: "demo2", title: "Tech That Inspires", subtitle: "Electronics", description: "Cutting-edge gadgets and wearables designed for tomorrow.", image: demoSlide2, cta: "View Electronics", ctaLink: "/shop?category=electronics", transitionType: "zoom" },
  { id: "demo3", title: "Elevate Your Space", subtitle: "Home & Living", description: "Designer furniture and décor for the modern home.", image: demoSlide3, cta: "Explore Home", ctaLink: "/shop?category=home", transitionType: "blur" },
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
  transition_type: string;
  parallax_intensity: number;
  content_animation: string;
  slide_gap: string;
}

const defaultConfig: ShowcaseConfig = {
  autoplay_speed: 6000,
  transition_duration: 800,
  height: "50vh",
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
  transition_type: "fade",
  parallax_intensity: 20,
  content_animation: "slide-up",
  slide_gap: "0",
};

/* ── Transition variant factories ── */
const getSlideVariants = (type: string, dur: number): Variants => {
  const ease = [0.25, 0.46, 0.45, 0.94] as const;
  switch (type) {
    case "slide":
      return {
        enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 1 }),
        center: { x: 0, opacity: 1, transition: { duration: dur, ease } },
        exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 1, transition: { duration: dur, ease } }),
      };
    case "zoom":
      return {
        enter: () => ({ scale: 1.4, opacity: 0 }),
        center: { scale: 1, opacity: 1, transition: { duration: dur, ease } },
        exit: () => ({ scale: 0.6, opacity: 0, transition: { duration: dur * 0.75, ease } }),
      };
    case "flip":
      return {
        enter: (dir: number) => ({ rotateY: dir > 0 ? 90 : -90, opacity: 0 }),
        center: { rotateY: 0, opacity: 1, transition: { duration: dur, ease } },
        exit: (dir: number) => ({ rotateY: dir > 0 ? -90 : 90, opacity: 0, transition: { duration: dur * 0.75, ease } }),
      };
    case "blur":
      return {
        enter: () => ({ filter: "blur(30px)", opacity: 0, scale: 1.1 }),
        center: { filter: "blur(0px)", opacity: 1, scale: 1, transition: { duration: dur, ease } },
        exit: () => ({ filter: "blur(30px)", opacity: 0, scale: 0.95, transition: { duration: dur * 0.75, ease } }),
      };
    case "cube":
      return {
        enter: (dir: number) => ({ rotateY: dir > 0 ? 90 : -90, x: dir > 0 ? "50%" : "-50%", opacity: 0, transformOrigin: dir > 0 ? "left center" : "right center" }),
        center: { rotateY: 0, x: 0, opacity: 1, transformOrigin: "center", transition: { duration: dur, ease } },
        exit: (dir: number) => ({ rotateY: dir > 0 ? -90 : 90, x: dir > 0 ? "-50%" : "50%", opacity: 0, transformOrigin: dir > 0 ? "right center" : "left center", transition: { duration: dur * 0.75, ease } }),
      };
    case "fade":
    default:
      return {
        enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0, scale: 1.1 }),
        center: { x: 0, opacity: 1, scale: 1, transition: { duration: dur, ease } },
        exit: (dir: number) => ({ x: dir > 0 ? "-30%" : "30%", opacity: 0, scale: 0.95, transition: { duration: dur * 0.75, ease } }),
      };
  }
};

/* ── Content animation variants ── */
const getContentVariants = (anim: string): { initial: Record<string, any>; animate: Record<string, any> } => {
  const base = { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] };
  switch (anim) {
    case "slide-left":
      return { initial: { opacity: 0, x: -60 }, animate: { opacity: 1, x: 0, transition: { delay: 0.3, ...base } } };
    case "slide-right":
      return { initial: { opacity: 0, x: 60 }, animate: { opacity: 1, x: 0, transition: { delay: 0.3, ...base } } };
    case "scale":
      return { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1, transition: { delay: 0.3, ...base } } };
    case "fade":
      return { initial: { opacity: 0 }, animate: { opacity: 1, transition: { delay: 0.3, ...base } } };
    case "rotate":
      return { initial: { opacity: 0, rotate: -5, y: 40 }, animate: { opacity: 1, rotate: 0, y: 0, transition: { delay: 0.3, ...base } } };
    case "blur-in":
      return { initial: { opacity: 0, filter: "blur(20px)" }, animate: { opacity: 1, filter: "blur(0px)", transition: { delay: 0.3, ...base } } };
    case "slide-up":
    default:
      return { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0, transition: { delay: 0.3, ...base } } };
  }
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
    ? dbSlides.map((s) => ({ id: s.id, title: s.title, subtitle: s.subtitle || "", description: s.description || "", image: s.image_url, cta: s.cta_text || "Shop Now", ctaLink: s.cta_link || "/shop", transitionType: s.transition_type || "" }))
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

  const slide = slides[current];
  if (!slide) return null;

  const activeTransition = slide.transitionType && slide.transitionType !== "fade" ? slide.transitionType : cfg.transition_type;
  const dur = cfg.transition_duration / 1000;
  const variants = getSlideVariants(activeTransition, dur);
  const contentAnim = getContentVariants(cfg.content_animation);

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

  const textAlign = cfg.text_position === "center" ? "items-center text-center" : cfg.text_position === "right" ? "items-end text-right ml-auto" : "";
  const textContainer = cfg.text_position === "center" ? "flex justify-center" : cfg.text_position === "right" ? "flex justify-end" : "";
  const titleClass = `text-4xl md:text-${cfg.title_size}`;

  const subtitleEl = (text: string) => {
    if (cfg.subtitle_style === "badge") return <span className="inline-block btn-pill bg-primary/20 text-primary text-sm mb-4 border border-primary/30 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">{text}</span>;
    if (cfg.subtitle_style === "underline") return <span className="inline-block text-primary text-sm mb-4 border-b-2 border-primary pb-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">{text}</span>;
    return <span className="inline-block text-primary text-sm mb-4 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">{text}</span>;
  };

  const ctaClasses: Record<string, string> = {
    gradient: "bg-gradient-primary text-primary-foreground glow-primary",
    solid: "bg-primary text-primary-foreground",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
    ghost: "bg-background/20 backdrop-blur text-foreground border border-foreground/20",
  };

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
    return <button key={i} onClick={() => goTo(i)} className={`h-2 rounded-full transition-all duration-300 ${active ? "w-8 bg-primary glow-primary" : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/60"}`} />;
  };

  const radiusClass = cfg.border_radius === "none" ? "" : `rounded-${cfg.border_radius}`;
  const parallaxPx = cfg.parallax_intensity || 20;

  return (
    <div
      className={`relative w-full overflow-hidden ${radiusClass}`}
      style={{ height: cfg.height, minHeight: "250px", maxHeight: "500px", perspective: activeTransition === "cube" || activeTransition === "flip" ? "1200px" : undefined }}
      onMouseEnter={() => cfg.pause_on_hover && setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence custom={direction} mode="wait">
        <motion.div key={slide.id} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" className="absolute inset-0" style={{ transformStyle: activeTransition === "cube" || activeTransition === "flip" ? "preserve-3d" : undefined }}>
          <motion.div
            className="absolute inset-0"
            animate={cfg.ken_burns ? { scale: 1.05, y: [parallaxPx * -0.5, parallaxPx * 0.5] } : {}}
            transition={{ duration: cfg.autoplay_speed / 1000, ease: "linear", y: { duration: cfg.autoplay_speed / 1000, ease: "linear", repeat: 0 } }}
          >
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
          </motion.div>

          <div className={`absolute inset-0 ${overlayClasses[cfg.overlay_style] || ""}`} style={overlayStyle} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

          <div className="absolute inset-0 flex items-center">
            <div className={`container mx-auto px-6 lg:px-12 ${textContainer}`}>
              <motion.div
                key={`content-${slide.id}`}
                initial={contentAnim.initial}
                animate={contentAnim.animate}
                className={`max-w-${cfg.text_max_width} ${textAlign}`}
              >
                {subtitleEl(slide.subtitle)}
                <h1 className={`${titleClass} font-bold font-display mb-4 leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]`}>{slide.title}</h1>
                <p className="text-lg text-white/80 mb-8 max-w-lg drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">{slide.description}</p>
                <motion.a href={slide.ctaLink} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => trackClick("slider_cta", slide.id, "/home", { cta_text: slide.cta, cta_link: slide.ctaLink })}
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
