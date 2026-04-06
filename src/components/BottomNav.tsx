import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, LayoutGrid, ShoppingCart, Heart, User, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface BottomNavProps {
  onSearchClick: () => void;
  onAuthClick: () => void;
}

const NAV_ITEMS = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: LayoutGrid, label: "Categories", path: "__categories__" },
  { icon: ShoppingCart, label: "Cart", path: "/cart" },
  { icon: Heart, label: "Wishlist", path: "/wishlist" },
  { icon: User, label: "Profile", path: "__profile__" },
];

type NavStyle = "liquid" | "notch" | "pill" | "glow" | "wave";

const BottomNav: React.FC<BottomNavProps> = ({ onSearchClick, onAuthClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [catOpen, setCatOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Load nav style from DB
  const { data: mobileConfig } = useQuery({
    queryKey: ["mobile-ui-config"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value").eq("key", "mobile_ui_config");
      if (data?.[0]) {
        const val = data[0].value;
        return typeof val === "object" && val !== null ? (val as any).value ?? val : val;
      }
      return null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const navStyle: NavStyle = (mobileConfig as any)?.nav_style || "liquid";

  const { data: dbCategories = [] } = useQuery({
    queryKey: ["nav-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, slug, parent_id, icon, icon_url").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const parentCategories = dbCategories.filter((c) => !c.parent_id);

  const { data: cartCount = 0 } = useQuery({
    queryKey: ["cart-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("cart_items").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  const items = NAV_ITEMS.map((item) => ({
    ...item,
    path: item.path === "__profile__" ? (user ? "/profile" : "__auth__") : item.path,
  }));

  const getActiveIndex = () => {
    if (catOpen) return 1;
    return items.findIndex((item) => item.path === location.pathname);
  };

  const activeIndex = getActiveIndex();

  const handleClick = (item: typeof items[0], index: number) => {
    if (item.path === "__categories__") {
      setCatOpen(!catOpen);
    } else if (item.path === "__auth__") {
      onAuthClick();
    } else {
      setCatOpen(false);
      navigate(item.path);
    }
  };

  const CartBadge = ({ className = "" }: { className?: string }) =>
    cartCount > 0 ? (
      <span className={`absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center ${className}`}>
        {cartCount > 99 ? "99+" : cartCount}
      </span>
    ) : null;

  // ── Categories Panel (shared) ──
  const CategoriesPanel = (
    <AnimatePresence>
      {catOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden"
            onClick={() => setCatOpen(false)}
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-50 lg:hidden"
          >
            <div className="bg-card border-t border-border rounded-t-2xl max-h-[60vh] overflow-y-auto p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Categories</h3>
                <button onClick={() => setCatOpen(false)} className="text-muted-foreground">
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {parentCategories.map((cat) => (
                  <Link key={cat.id} to={`/categories/${cat.slug}`} onClick={() => setCatOpen(false)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                    {cat.icon_url ? (
                      <img src={cat.icon_url} alt="" className="w-8 h-8 rounded-lg object-contain" />
                    ) : cat.icon ? (
                      <span className="text-2xl">{cat.icon}</span>
                    ) : (
                      <LayoutGrid className="w-6 h-6 text-muted-foreground" />
                    )}
                    <span className="text-[11px] font-medium text-foreground text-center leading-tight line-clamp-2">{cat.name}</span>
                  </Link>
                ))}
              </div>
              <Link to="/shop" onClick={() => setCatOpen(false)}
                className="block mt-3 text-center text-sm text-primary font-medium py-2 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors">
                View All Products
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // ══════════════════════════════════════════════
  // STYLE 1: Liquid Ball
  // ══════════════════════════════════════════════
  const renderLiquid = () => {
    const itemCount = items.length;
    const itemWidthPercent = 100 / itemCount;
    const indicatorLeft = activeIndex >= 0
      ? `calc(${activeIndex * itemWidthPercent}% + ${itemWidthPercent / 2}% - 21px)`
      : "-999px";

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <div className="bottom-nav-bar relative">
          <ul className="bottom-nav-list">
            {items.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <li key={item.label} className={`bottom-nav-item${isActive ? " active" : ""}`}>
                  <button onClick={() => handleClick(item, index)} className="bottom-nav-link">
                    <span className="bottom-nav-icon">
                      <item.icon className="w-[18px] h-[18px]" />
                      {item.label === "Cart" && <CartBadge />}
                    </span>
                    <span className="bottom-nav-text">{item.label}</span>
                  </button>
                </li>
              );
            })}
            <div className="bottom-nav-indicator" style={{ left: indicatorLeft, transition: "left 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)" }} />
          </ul>
        </div>
        <div className="h-[env(safe-area-inset-bottom)] bg-background" />
      </nav>
    );
  };

  // ══════════════════════════════════════════════
  // STYLE 2: Notch
  // ══════════════════════════════════════════════
  const renderNotch = () => {
    const itemCount = items.length;
    const notchLeft = activeIndex >= 0
      ? `calc(${(activeIndex + 0.5) * (100 / itemCount)}% - 26px)`
      : "-999px";

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden flex justify-center pb-[env(safe-area-inset-bottom)]">
        <div className="notch-nav-wrapper w-full" ref={navRef}>
          <div className="notch-indicator" style={{ left: notchLeft, transition: "left 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }}>
            <div className="notch-dot" />
          </div>
          <div className="notch-navbar">
            {items.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <button key={item.label}
                  ref={el => { itemRefs.current[index] = el; }}
                  onClick={() => handleClick(item, index)}
                  className={`notch-nav-item${isActive ? " active" : ""}`}>
                  <item.icon className="w-[22px] h-[22px]" />
                  <AnimatePresence>
                    {isActive && (
                      <motion.span initial={{ maxHeight: 0, opacity: 0, y: 4 }} animate={{ maxHeight: 24, opacity: 1, y: 0 }} exit={{ maxHeight: 0, opacity: 0, y: 4 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="notch-label overflow-hidden">{item.label}</motion.span>
                    )}
                  </AnimatePresence>
                  {item.label === "Cart" && <CartBadge />}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    );
  };

  // ══════════════════════════════════════════════
  // STYLE 3: Pill / Capsule (floating)
  // ══════════════════════════════════════════════
  const renderPill = () => (
    <nav className="fixed bottom-3 left-4 right-4 z-50 lg:hidden">
      <div className="pill-nav-bar">
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <button key={item.label} onClick={() => handleClick(item, index)}
              className={`pill-nav-item${isActive ? " active" : ""}`}>
              <motion.div
                animate={isActive ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="relative"
              >
                <item.icon className="w-5 h-5" />
                {item.label === "Cart" && <CartBadge />}
              </motion.div>
              <AnimatePresence>
                {isActive && (
                  <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="pill-label">{item.label}</motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );

  // ══════════════════════════════════════════════
  // STYLE 4: Glow Dock
  // ══════════════════════════════════════════════
  const renderGlow = () => (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="glow-nav-bar">
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <button key={item.label} onClick={() => handleClick(item, index)}
              className={`glow-nav-item${isActive ? " active" : ""}`}>
              <motion.div
                animate={isActive ? { scale: 1.3, y: -10 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                className="relative"
              >
                <item.icon className={`w-5 h-5 transition-all duration-300 ${isActive ? "drop-shadow-[0_0_8px_hsl(var(--primary))]" : ""}`} />
                {item.label === "Cart" && <CartBadge />}
                {isActive && (
                  <motion.div
                    layoutId="glow-ring"
                    className="absolute -inset-3 rounded-full border-2 border-primary/40"
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                )}
              </motion.div>
              <motion.span
                animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 4 }}
                className="glow-label"
              >{item.label}</motion.span>
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)] bg-background" />
    </nav>
  );

  // ══════════════════════════════════════════════
  // STYLE 5: Wave
  // ══════════════════════════════════════════════
  const renderWave = () => (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="wave-nav-bar">
        <svg className="wave-nav-svg" viewBox="0 0 400 70" preserveAspectRatio="none">
          <motion.path
            animate={{
              d: activeIndex >= 0
                ? `M0,20 L${activeIndex * 80 + 10},20 Q${activeIndex * 80 + 40},0 ${activeIndex * 80 + 40},-15 Q${activeIndex * 80 + 40},0 ${activeIndex * 80 + 70},20 L400,20 L400,70 L0,70 Z`
                : "M0,20 L400,20 L400,70 L0,70 Z"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            fill="hsl(var(--card))"
            stroke="hsl(var(--border))"
            strokeWidth="0.5"
          />
        </svg>
        <div className="wave-nav-items">
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <button key={item.label} onClick={() => handleClick(item, index)}
                className={`wave-nav-item${isActive ? " active" : ""}`}>
                <motion.div
                  animate={isActive ? { y: -22, scale: 1.1 } : { y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className={`relative flex items-center justify-center ${isActive ? "w-10 h-10 rounded-full bg-primary shadow-lg" : ""}`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  {item.label === "Cart" && <CartBadge />}
                </motion.div>
                <motion.span
                  animate={{ opacity: isActive ? 1 : 0.5, y: isActive ? -4 : 0 }}
                  className="wave-label"
                >{item.label}</motion.span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="h-[env(safe-area-inset-bottom)] bg-card" />
    </nav>
  );

  const renderNav = () => {
    switch (navStyle) {
      case "notch": return renderNotch();
      case "pill": return renderPill();
      case "glow": return renderGlow();
      case "wave": return renderWave();
      default: return renderLiquid();
    }
  };

  return (
    <>
      {CategoriesPanel}
      {renderNav()}
    </>
  );
};

export default BottomNav;
