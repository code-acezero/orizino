import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import heroImg from "@/assets/hero-bg.jpg";
import fashionImg from "@/assets/slide-fashion.jpg";
import electronicsImg from "@/assets/slide-electronics.jpg";
import homeImg from "@/assets/slide-home.jpg";

const defaultSlides = [
  {
    id: 1,
    title: "Discover the Future",
    subtitle: "New Arrivals",
    description: "Explore our curated collection of premium products from around the world.",
    image: heroImg,
    cta: "Shop Now",
    ctaLink: "/shop",
  },
  {
    id: 2,
    title: "Street Style Redefined",
    subtitle: "Fashion",
    description: "Bold looks for the modern trendsetter. Elevate your wardrobe.",
    image: fashionImg,
    cta: "Explore Fashion",
    ctaLink: "/categories/fashion",
  },
  {
    id: 3,
    title: "Tech That Inspires",
    subtitle: "Electronics",
    description: "Cutting-edge gadgets and devices designed for tomorrow.",
    image: electronicsImg,
    cta: "View Electronics",
    ctaLink: "/categories/electronics",
  },
  {
    id: 4,
    title: "Elevate Your Space",
    subtitle: "Home Appliances",
    description: "Premium appliances for the modern home.",
    image: homeImg,
    cta: "Shop Home",
    ctaLink: "/categories/home-appliance",
  },
];

interface ParallaxSliderProps {
  slides?: typeof defaultSlides;
}

const ParallaxSlider: React.FC<ParallaxSliderProps> = ({ slides = defaultSlides }) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  const prev = () => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  };

  const next = () => {
    setDirection(1);
    setCurrent((c) => (c + 1) % slides.length);
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 1.1,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-30%" : "30%",
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
  };

  const slide = slides[current];

  return (
    <div className="relative w-full h-[85vh] min-h-[600px] overflow-hidden rounded-3xl">
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={slide.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          {/* Parallax background */}
          <motion.div
            className="absolute inset-0"
            animate={{ scale: 1.05 }}
            transition={{ duration: 6, ease: "linear" }}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-6 lg:px-12">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="max-w-2xl"
              >
                <span className="inline-block btn-pill bg-primary/20 text-primary text-sm mb-4 border border-primary/30">
                  {slide.subtitle}
                </span>
                <h1 className="text-5xl md:text-7xl font-bold font-display mb-4 leading-tight text-foreground">
                  {slide.title}
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                  {slide.description}
                </p>
                <motion.a
                  href={slide.ctaLink}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center btn-pill bg-gradient-primary text-primary-foreground font-semibold text-lg px-8 py-3 glow-primary"
                >
                  {slide.cta}
                </motion.a>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 glass rounded-full p-3 text-foreground hover:text-primary transition-colors z-10"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 glass rounded-full p-3 text-foreground hover:text-primary transition-colors z-10"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current
                ? "w-8 bg-primary glow-primary"
                : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ParallaxSlider;
