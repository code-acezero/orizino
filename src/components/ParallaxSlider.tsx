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
  border_radius: "none",
  autoplay: true,
  pause_on_hover: true,
  transition_type: "fade",
  parallax_intensity: 20,
  content_animation: "slide-up",
  slide_gap: "0",
};

/* ── 3D mouse-tilt for active slide (desktop only) ── */
function use3DTilt(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const isMobile = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  useEffect(() => {
    if (!active || isMobile || !ref.current) return;
    const el = ref.current;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      target.current.x = ((e.clientX - r.left) / r.width - 0.5) * 12;
      target.current.y = -((e.clientY - r.top) / r.height - 0.5) * 8;
    };
    const onLeave = () => { target.current = { x: 0, y: 0 }; };

    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.08;
      current.current.y += (target.current.y - current.current.y) * 0.08;
      el.style.setProperty("--rotY", `${current.current.x.toFixed(2)}deg`);
      el.style.setProperty("--rotX", `${current.current.y.toFixed(2)}deg`);
      raf.current = requestAnimationFrame(tick);
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    raf.current = requestAnimationFrame(tick);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf.current);
    };
  }, [active, isMobile]);

  return ref;
}

const ParallaxSlider: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(0);

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

  const wrap = (n: number) => ((n % slides.length) + slides.length) % slides.length;

  useEffect(() => {
    if (slides.length <= 1 || !cfg.autoplay || paused) return;
    const timer = setInterval(() => setCurrent((p) => wrap(p + 1)), cfg.autoplay_speed);
    return () => clearInterval(timer);
  }, [slides.length, cfg.autoplay, cfg.autoplay_speed, paused]);

  const goPrev = useCallback(() => setCurrent((c) => wrap(c - 1)), [slides.length]);
  const goNext = useCallback(() => setCurrent((c) => wrap(c + 1)), [slides.length]);

  // Preload
  useEffect(() => {
    slides.forEach((s) => { const img = new Image(); img.src = s.image; });
  }, [slides]);

  // Touch
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.changedTouches[0].screenX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].screenX - touchStartX.current;
    if (diff < -50) goNext();
    if (diff > 50) goPrev();
  };

  const tiltRef = use3DTilt(slides.length > 0);

  if (slides.length === 0) return null;

  const currentSlide = slides[current];
  const prevSlide = slides[wrap(current - 1)];
  const nextSlide = slides[wrap(current + 1)];
  if (!currentSlide) return null;

  const dur = cfg.transition_duration / 1000;

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

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: cfg.height, minHeight: "250px", maxHeight: "500px" }}
      onMouseEnter={() => cfg.pause_on_hover && setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Blurred background ── */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${currentSlide.id}`}
          className="absolute inset-[-20%] z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: dur }}
        >
          <img src={currentSlide.image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/80 backdrop-blur-[8px]" />
        </motion.div>
      </AnimatePresence>

      {/* ── 3D Card Carousel ── */}
      <div className="absolute inset-0 flex items-center justify-center z-10" style={{ perspective: "1000px" }}>
        {slides.length >= 3 && (
          <Slide3D slide={prevSlide} state="prev" dur={dur} />
        )}
        <Slide3D slide={currentSlide} state="current" dur={dur} tiltRef={tiltRef} />
        {slides.length >= 2 && (
          <Slide3D slide={nextSlide} state="next" dur={dur} />
        )}
      </div>

      {/* ── Text overlay ── */}
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

      {/* ── Bottom gradient mist ── */}
      <div className="absolute inset-0 pointer-events-none z-[15]" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 35%, transparent 65%)" }} />

      {/* ── Navigation ── */}
      {(cfg.show_arrows || cfg.show_dots) && slides.length > 1 && (
        <div className="absolute bottom-2 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 md:gap-4 z-30">
          {cfg.show_arrows && (
            <button onClick={goPrev} className="glass rounded-full p-2 text-foreground hover:text-primary transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {cfg.show_dots && <div className="flex gap-2">{slides.map((_, i) => renderDot(i))}</div>}
          {cfg.show_arrows && (
            <button onClick={goNext} className="glass rounded-full p-2 text-foreground hover:text-primary transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Individual 3D Slide Card ── */
interface Slide3DProps {
  slide: { id: string; title: string; image: string };
  state: "current" | "prev" | "next";
  dur: number;
  tiltRef?: React.RefObject<HTMLDivElement>;
}

const Slide3D: React.FC<Slide3DProps> = ({ slide, state, dur, tiltRef }) => {
  const isCurrent = state === "current";

  return (
    <div
      className="absolute parallax-slide"
      data-state={state}
      style={{
        width: "var(--slide-width)",
        aspectRatio: "var(--slide-aspect)",
        zIndex: isCurrent ? 20 : 10,
        perspective: "1000px",
        transform: `perspective(1000px) translate3d(var(--slide-tx), 0, 0) rotateY(var(--slide-rotY)) scale(var(--slide-scale))`,
        transition: `transform ${dur}s ease, filter ${dur}s ease`,
        filter: isCurrent ? "brightness(0.8)" : "brightness(0.5)",
      }}
    >
      <div
        ref={isCurrent ? (tiltRef as any) : undefined}
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
            style={{ transform: "translate(-50%, -50%) scale(1.25)", position: "absolute", top: "50%", left: "50%" }}
            loading={isCurrent ? "eager" : "lazy"}
          />
        </div>
      </div>
    </div>
  );
};

export default ParallaxSlider;
