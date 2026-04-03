import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trackClick } from "@/hooks/use-analytics";

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

/* ── 3D Tilt hook (desktop only) ── */
function use3DTilt(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const rotX = useRef(0);
  const rotY = useRef(0);
  const targetRotX = useRef(0);
  const targetRotY = useRef(0);
  const rafId = useRef<number>(0);
  const isMobile = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  useEffect(() => {
    if (!active || isMobile || !ref.current) return;
    const el = ref.current;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const ox = (e.clientX - rect.left - rect.width / 2) / (Math.PI * 3);
      const oy = -(e.clientY - rect.top - rect.height / 2) / (Math.PI * 4);
      targetRotX.current = ox;
      targetRotY.current = oy;
    };
    const onLeave = () => {
      targetRotX.current = 0;
      targetRotY.current = 0;
    };

    const tick = () => {
      rotX.current += (targetRotX.current - rotX.current) * 0.08;
      rotY.current += (targetRotY.current - rotY.current) * 0.08;
      if (el) {
        el.style.setProperty("--rotX", `${rotY.current.toFixed(2)}deg`);
        el.style.setProperty("--rotY", `${rotX.current.toFixed(2)}deg`);
      }
      rafId.current = requestAnimationFrame(tick);
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    rafId.current = requestAnimationFrame(tick);

    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafId.current);
    };
  }, [active, isMobile]);

  return ref;
}

const ParallaxSlider: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const touchStartX = useRef(0);
  const sliderRef = useRef<HTMLDivElement>(null);

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

  const slides = useMemo(() => dbSlides.map((s) => ({
    id: s.id,
    title: s.title,
    subtitle: s.subtitle || "",
    description: s.description || "",
    image: s.image_url,
    cta: s.cta_text || "",
    ctaLink: s.cta_link || "/shop",
  })), [dbSlides]);

  // Wrap index helper
  const wrap = (n: number) => ((n % slides.length) + slides.length) % slides.length;

  useEffect(() => {
    if (slides.length <= 1 || !cfg.autoplay || paused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => wrap(prev + 1));
    }, cfg.autoplay_speed);
    return () => clearInterval(timer);
  }, [slides.length, cfg.autoplay, cfg.autoplay_speed, paused]);

  const prev = useCallback(() => setCurrent((c) => wrap(c - 1)), [slides.length]);
  const next = useCallback(() => setCurrent((c) => wrap(c + 1)), [slides.length]);

  // Preload images
  useEffect(() => {
    slides.forEach((s) => {
      const img = new Image();
      img.onload = () => setLoadedImages((prev) => new Set(prev).add(s.image));
      img.src = s.image;
    });
  }, [slides]);

  // Touch/swipe support
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.changedTouches[0].screenX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].screenX - touchStartX.current;
    if (diff < -50) next();
    if (diff > 50) prev();
  };

  // 3D tilt for current slide
  const tiltRef = use3DTilt(slides.length > 0);

  if (slides.length === 0) return null;

  const currentSlide = slides[current];
  const prevSlide = slides[wrap(current - 1)];
  const nextSlide = slides[wrap(current + 1)];
  if (!currentSlide) return null;

  const radiusClass = cfg.border_radius === "none" ? "" : `rounded-${cfg.border_radius}`;

  const opa = cfg.overlay_opacity / 100;

  const ctaClasses: Record<string, string> = {
    gradient: "bg-gradient-primary text-primary-foreground glow-primary",
    solid: "bg-primary text-primary-foreground",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
    ghost: "bg-background/20 backdrop-blur text-foreground border border-foreground/20",
  };

  const subtitleEl = (text: string) => {
    if (!text) return null;
    if (cfg.subtitle_style === "badge") return <span className="inline-block btn-pill bg-primary/20 text-primary text-sm mb-3">{text}</span>;
    if (cfg.subtitle_style === "underline") return <span className="inline-block text-primary text-sm mb-3 border-b-2 border-primary pb-1">{text}</span>;
    return <span className="inline-block text-primary text-sm mb-3 font-medium">{text}</span>;
  };

  const renderDot = (i: number) => {
    const active = i === current;
    if (cfg.dot_style === "number") {
      return (
        <button key={i} onClick={() => setCurrent(i)}
          className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${active ? "bg-primary text-primary-foreground glow-primary" : "bg-muted-foreground/30 text-muted-foreground hover:bg-muted-foreground/50"}`}>
          {i + 1}
        </button>
      );
    }
    if (cfg.dot_style === "circle") {
      return <button key={i} onClick={() => setCurrent(i)} className={`w-3 h-3 rounded-full transition-all ${active ? "bg-primary glow-primary scale-125" : "bg-muted-foreground/40 hover:bg-muted-foreground/60"}`} />;
    }
    if (cfg.dot_style === "dash") {
      return <button key={i} onClick={() => setCurrent(i)} className={`h-1 rounded-full transition-all ${active ? "w-10 bg-primary glow-primary" : "w-4 bg-muted-foreground/40 hover:bg-muted-foreground/60"}`} />;
    }
    return <button key={i} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all duration-300 ${active ? "w-8 bg-primary glow-primary" : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/60"}`} />;
  };

  // 3D card slide component
  const SlideCard = ({ slide, state }: { slide: typeof currentSlide; state: "current" | "prev" | "next" }) => {
    const isCurrent = state === "current";
    const transform = state === "prev"
      ? "perspective(1000px) translateX(calc(-1 * min(25vw, 300px) * 1.07)) rotateY(45deg) scale(1)"
      : state === "next"
      ? "perspective(1000px) translateX(calc(1 * min(25vw, 300px) * 1.07)) rotateY(-45deg) scale(1)"
      : "perspective(1000px) translateX(0) rotateY(0deg) scale(1.2)";

    const mobileTransform = state === "prev"
      ? "perspective(1000px) translateX(-72vw) rotateY(25deg) scale(1)"
      : state === "next"
      ? "perspective(1000px) translateX(72vw) rotateY(-25deg) scale(1)"
      : "perspective(1000px) translateX(0) rotateY(0deg) scale(1.1)";

    return (
      <motion.div
        className="absolute"
        style={{
          width: "min(25vw, 300px)",
          aspectRatio: "2/3",
          zIndex: isCurrent ? 20 : 10,
        }}
        initial={false}
        animate={{
          opacity: 1,
          filter: isCurrent ? "brightness(0.8)" : "brightness(0.5)",
        }}
        transition={{ duration: cfg.transition_duration / 1000, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div
          className="w-full h-full transition-transform"
          style={{
            transform: window.innerWidth <= 768 ? mobileTransform : transform,
            transitionDuration: `${cfg.transition_duration}ms`,
            transitionTimingFunction: "ease",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            ref={isCurrent ? tiltRef : undefined}
            className="w-full h-full"
            style={{
              transformStyle: "preserve-3d",
              transform: isCurrent ? "rotateX(var(--rotX, 0deg)) rotateY(var(--rotY, 0deg))" : undefined,
            }}
          >
            <div className="w-full h-full overflow-hidden rounded-md">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
                style={{
                  transform: "scale(1.25)",
                  willChange: "transform",
                }}
                loading={state === "current" ? "eager" : "lazy"}
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div
      ref={sliderRef}
      className={`relative w-full overflow-hidden ${radiusClass}`}
      style={{ height: cfg.height, minHeight: "250px", maxHeight: "500px" }}
      onMouseEnter={() => cfg.pause_on_hover && setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Blurred background of current slide */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${currentSlide.id}`}
          className="absolute inset-[-20%] z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: cfg.transition_duration / 1000 }}
        >
          <img src={currentSlide.image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        </motion.div>
      </AnimatePresence>

      {/* 3D Slides carousel */}
      <div className="absolute inset-0 flex items-center justify-center z-10" style={{ perspective: "1000px" }}>
        {slides.length >= 3 && <SlideCard slide={prevSlide} state="prev" />}
        <SlideCard slide={currentSlide} state="current" />
        {slides.length >= 2 && <SlideCard slide={nextSlide} state="next" />}
      </div>

      {/* Text overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none flex items-end pb-14 md:pb-8">
        <div className="container mx-auto px-4 md:px-6 lg:px-12 pointer-events-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${currentSlide.id}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-lg"
            >
              {subtitleEl(currentSlide.subtitle)}
              <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold font-display mb-2 md:mb-4 leading-tight text-white drop-shadow-lg">
                {currentSlide.title}
              </h1>
              {currentSlide.description && (
                <p className="text-sm md:text-lg text-white/80 mb-4 md:mb-6 max-w-md line-clamp-2 md:line-clamp-none drop-shadow">
                  {currentSlide.description}
                </p>
              )}
              {currentSlide.cta && (
                <motion.a
                  href={currentSlide.ctaLink}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => trackClick("slider_cta", currentSlide.id, "/home", { cta_text: currentSlide.cta, cta_link: currentSlide.ctaLink })}
                  className={`inline-flex items-center btn-pill font-semibold text-sm md:text-lg px-5 md:px-8 py-2 md:py-3 ${ctaClasses[cfg.cta_style] || ctaClasses.gradient}`}
                >
                  {currentSlide.cta}
                </motion.a>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Smoky mist overlays */}
      <div className="absolute inset-0 pointer-events-none z-15" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 35%, transparent 65%)" }} />

      {/* Navigation controls */}
      {(cfg.show_arrows || cfg.show_dots) && slides.length > 1 && (
        <div className="absolute bottom-2 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 md:gap-4 z-30">
          {cfg.show_arrows && <button onClick={prev} className="glass rounded-full p-2 text-foreground hover:text-primary transition-colors"><ChevronLeft className="w-5 h-5" /></button>}
          {cfg.show_dots && <div className="flex gap-2">{slides.map((_, i) => renderDot(i))}</div>}
          {cfg.show_arrows && <button onClick={next} className="glass rounded-full p-2 text-foreground hover:text-primary transition-colors"><ChevronRight className="w-5 h-5" /></button>}
        </div>
      )}
    </div>
  );
};

export default ParallaxSlider;
