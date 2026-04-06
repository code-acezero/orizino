import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trackClick } from "@/hooks/use-analytics";
import ParticleOverlay from "@/components/slider/ParticleOverlay";

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
  particle_count: number;
  particle_speed: number;
  particle_size: number;
  show_particles: boolean;
  show_vignette: boolean;
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
  particle_count: 40,
  particle_speed: 1,
  particle_size: 1,
  show_particles: true,
  show_vignette: true,
};

const ParallaxSlider: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [paused, setPaused] = useState(false);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const touchStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollY = useMotionValue(0);

  // ── Mouse position (0-1 range, 0.5 = center) ──
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // True parallax: image layer moves OPPOSITE to mouse, text moves WITH mouse (less)
  // This creates the depth illusion like a real 3D parallax slider
  const imgX = useSpring(useTransform(mouseX, [0, 1], [20, -20]), { stiffness: 80, damping: 25 });
  const imgY = useSpring(useTransform(mouseY, [0, 1], [15, -15]), { stiffness: 80, damping: 25 });
  const textX = useSpring(useTransform(mouseX, [0, 1], [-8, 8]), { stiffness: 120, damping: 30 });
  const textY = useSpring(useTransform(mouseY, [0, 1], [-5, 5]), { stiffness: 120, damping: 30 });

  // Subtle 3D rotation on the whole container
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [1.5, -1.5]), { stiffness: 100, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-2, 2]), { stiffness: 100, damping: 25 });

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMobile || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }, [mouseX, mouseY, isMobile]);

  const onMouseLeaveReset = useCallback(() => {
    setPaused(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  // Measure container for particle canvas — immediate + ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Immediate measurement so particles render on first paint
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setContainerSize({ w: rect.width, h: rect.height });
    }
    const ro = new ResizeObserver(([entry]) => {
      setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Scroll-based parallax
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewH = window.innerHeight;
      if (rect.bottom > 0 && rect.top < viewH) {
        scrollY.set(rect.top);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollY]);

  const parallaxScrollY = useTransform(scrollY, [300, -300], [-25, 25]);
  const smoothScrollY = useSpring(parallaxScrollY, { stiffness: 100, damping: 30 });

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

  const slides = useMemo(() => dbSlides.map((s: any) => ({
    id: s.id,
    title: s.title,
    subtitle: s.subtitle || "",
    description: s.description || "",
    image: s.image_url,
    cta: s.cta_text || "",
    ctaLink: s.cta_link || "/shop",
    textAlign: (s.text_align as string) || "left",
  })), [dbSlides]);

  const wrap = useCallback((n: number) => ((n % slides.length) + slides.length) % slides.length, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || !cfg.autoplay || paused) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((p) => wrap(p + 1));
    }, cfg.autoplay_speed);
    return () => clearInterval(timer);
  }, [slides.length, cfg.autoplay, cfg.autoplay_speed, paused, wrap]);

  const goPrev = useCallback(() => { setDirection(-1); setCurrent((c) => wrap(c - 1)); }, [wrap]);
  const goNext = useCallback(() => { setDirection(1); setCurrent((c) => wrap(c + 1)); }, [wrap]);

  // Preload
  useEffect(() => { slides.forEach((s) => { const img = new Image(); img.src = s.image; }); }, [slides]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.changedTouches[0].screenX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].screenX - touchStartX.current;
    if (diff < -50) goNext();
    if (diff > 50) goPrev();
  };

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  if (slides.length === 0) return null;
  const currentSlide = slides[current];
  if (!currentSlide) return null;

  const dur = cfg.transition_duration / 1000;

  const imageVariants = {
    enter: (d: number) => ({
      x: d > 0 ? "6%" : "-6%",
      scale: 1.05,
      opacity: 0,
      filter: "brightness(0.5)",
    }),
    center: {
      x: "0%",
      scale: 1,
      opacity: 1,
      filter: "brightness(1)",
      transition: { duration: dur, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
    exit: (d: number) => ({
      x: d > 0 ? "-6%" : "6%",
      scale: 0.97,
      opacity: 0,
      filter: "brightness(0.5)",
      transition: { duration: dur * 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const },
    }),
  };

  const textVariants = {
    enter: { opacity: 0, y: 40, scale: 0.97 },
    center: {
      opacity: 1, y: 0, scale: 1,
      transition: { duration: 0.6, delay: dur * 0.4, ease: "easeOut" as const },
    },
    exit: { opacity: 0, y: -20, scale: 0.98, transition: { duration: 0.3 } },
  };

  const ctaClasses: Record<string, string> = {
    gradient: "bg-gradient-primary text-primary-foreground",
    solid: "bg-primary text-primary-foreground",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
    ghost: "bg-background/20 backdrop-blur text-foreground border border-foreground/20",
  };

  const subtitleEl = (text: string) => {
    if (!text) return null;
    if (cfg.subtitle_style === "badge") return <span className="inline-block rounded-full bg-primary/20 text-primary text-sm px-4 py-1 mb-3 font-medium">{text}</span>;
    if (cfg.subtitle_style === "underline") return <span className="inline-block text-primary text-sm mb-3 border-b-2 border-primary pb-1">{text}</span>;
    return <span className="inline-block text-primary text-sm mb-3 font-medium">{text}</span>;
  };

  const renderDot = (i: number) => {
    const active = i === current;
    if (cfg.dot_style === "number") {
      return (
        <button key={i} onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
          className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-300 ${active ? "bg-primary text-primary-foreground scale-110" : "bg-muted-foreground/30 text-muted-foreground hover:bg-muted-foreground/50"}`}>
          {i + 1}
        </button>
      );
    }
    if (cfg.dot_style === "dash" || cfg.dot_style === "pill") {
      return (
        <button key={i} onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
          className={`h-1.5 rounded-full transition-all duration-500 ${active ? "w-10 bg-primary" : "w-3 bg-muted-foreground/40 hover:bg-muted-foreground/60"}`} />
      );
    }
    return (
      <button key={i} onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
        className={`w-3 h-3 rounded-full transition-all duration-300 ${active ? "bg-primary scale-125" : "bg-muted-foreground/40 hover:bg-muted-foreground/60"}`} />
    );
  };

  return (
    <motion.div
      ref={containerRef}
      className="parallax-slider-root relative w-full overflow-hidden h-[35vh] md:h-[40vh] lg:h-[45vh] max-h-[450px] md:max-h-[500px] lg:max-h-[540px]"
      style={{
        minHeight: "200px",
        perspective: "1000px",
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseEnter={() => cfg.pause_on_hover && setPaused(true)}
      onMouseLeave={onMouseLeaveReset}
      onMouseMove={onMouseMove}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Background image layer (moves opposite to mouse = parallax depth) ── */}
      <AnimatePresence initial={false} custom={direction} mode="sync">
        <motion.div
          key={currentSlide.id}
          custom={direction}
          variants={imageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-[-30px] w-[calc(100%+60px)] h-[calc(100%+60px)]"
          style={{ x: imgX, y: imgY }}
        >
          <motion.div className="w-full h-full" style={{ y: smoothScrollY }}>
            <img
              src={currentSlide.image}
              alt={currentSlide.title}
              className={`w-full h-full object-cover ${cfg.ken_burns ? "parallax-ken-burns" : ""}`}
              loading="eager"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* ── Overlay gradient ── */}
      <div className="absolute inset-0 z-[10] pointer-events-none parallax-overlay" />

      {/* ── Vignette ── */}
      {cfg.show_vignette && <div className="absolute inset-0 z-[12] pointer-events-none" style={{ boxShadow: "inset 0 0 120px 40px rgba(0,0,0,0.5)" }} />}

      {/* ── Particle / dust overlay ── */}
      {cfg.show_particles && containerSize.w > 0 && containerSize.h > 0 && (
        <ParticleOverlay
          width={containerSize.w}
          height={containerSize.h}
          count={cfg.particle_count}
          speed={cfg.particle_speed}
          size={cfg.particle_size}
        />
      )}

      {/* ── Text layer (moves slightly WITH mouse = foreground depth) ── */}
      <motion.div
        className={`absolute inset-0 z-20 flex items-end ${
          currentSlide.textAlign === "center" ? "justify-center" : currentSlide.textAlign === "right" ? "justify-end" : "justify-start"
        }`}
        style={{ x: textX, y: textY, transformStyle: "preserve-3d" }}
      >
        <div className={`container mx-auto px-4 md:px-8 lg:px-16 pb-20 md:pb-16 ${
          currentSlide.textAlign === "center" ? "text-center flex flex-col items-center" : currentSlide.textAlign === "right" ? "text-right flex flex-col items-end" : ""
        }`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`text-${currentSlide.id}`}
              variants={textVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className={`max-w-lg ${currentSlide.textAlign === "center" ? "items-center" : currentSlide.textAlign === "right" ? "items-end" : ""}`}
            >
              {subtitleEl(currentSlide.subtitle)}
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-display mb-3 md:mb-4 leading-tight text-white drop-shadow-lg">
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
                  className={`inline-flex items-center rounded-full font-semibold text-sm md:text-lg px-6 md:px-8 py-2.5 md:py-3 shadow-lg transition-all duration-300 ${ctaClasses[cfg.cta_style] || ctaClasses.gradient}`}
                >
                  {currentSlide.cta}
                </motion.a>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Navigation controls ── */}
      {slides.length > 1 && (cfg.show_arrows || cfg.show_dots) && (
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 md:gap-4 z-30">
          {cfg.show_arrows && (
            <motion.button onClick={goPrev} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full bg-foreground/10 backdrop-blur-sm border border-foreground/10 flex items-center justify-center text-white hover:bg-foreground/20 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
          )}
          {cfg.show_dots && (
            <div className="flex items-center gap-2">
              {slides.map((_, i) => renderDot(i))}
            </div>
          )}
          {cfg.show_arrows && (
            <motion.button onClick={goNext} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full bg-foreground/10 backdrop-blur-sm border border-foreground/10 flex items-center justify-center text-white hover:bg-foreground/20 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ParallaxSlider;
