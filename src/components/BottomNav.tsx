import React, { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, LayoutGrid, ShoppingCart, Heart, User, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

const BottomNav: React.FC<BottomNavProps> = ({ onSearchClick, onAuthClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [catOpen, setCatOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

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
  const itemWidth = 70; // px per item

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

  // Ripple effect
  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    ripple.className = "absolute rounded-full bg-primary/15 pointer-events-none animate-[ripple_0.6s_linear]";
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  return (
    <>
      {/* Categories slide-up panel */}
      <AnimatePresence>
        {catOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden"
              onClick={() => setCatOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 z-50 lg:hidden"
            >
              <div className="glass-strong border-t border-border rounded-t-2xl max-h-[60vh] overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Categories</h3>
                  <button onClick={() => setCatOpen(false)} className="text-muted-foreground">
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {parentCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/categories/${cat.slug}`}
                      onClick={() => setCatOpen(false)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                    >
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
                <Link
                  to="/shop"
                  onClick={() => setCatOpen(false)}
                  className="block mt-3 text-center text-sm text-primary font-medium py-2 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                  View All Products
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <div className="glass-strong border-t border-border relative" ref={navRef}>
          <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto relative">
            {/* Animated liquid indicator */}
            {activeIndex >= 0 && (
              <motion.div
                className="absolute -top-[22px] w-[56px] h-[56px] rounded-full bg-primary border-[5px] border-background z-0"
                style={{
                  boxShadow: "0 0 12px hsl(var(--primary) / 0.4)",
                }}
                animate={{
                  left: `calc(${(activeIndex / items.length) * 100}% + ${itemWidth / 2 - 28}px)`,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              >
                {/* Left curve cutout */}
                <div className="absolute top-[50%] -left-[19px] w-[18px] h-[18px] bg-transparent rounded-tr-[18px]"
                  style={{ boxShadow: "1px -8px 0 0 hsl(var(--background))" }} />
                {/* Right curve cutout */}
                <div className="absolute top-[50%] -right-[19px] w-[18px] h-[18px] bg-transparent rounded-tl-[18px]"
                  style={{ boxShadow: "-1px -8px 0 0 hsl(var(--background))" }} />
              </motion.div>
            )}

            {items.map((item, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={item.label}
                  onClick={(e) => { createRipple(e); handleClick(item, index); }}
                  className="relative flex-1 flex items-center justify-center h-full z-10 overflow-hidden"
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <motion.div
                      animate={{
                        y: isActive ? -18 : 0,
                        scale: isActive ? 1.1 : 1,
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="relative"
                    >
                      <item.icon
                        className={`w-5 h-5 transition-colors duration-300 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`}
                      />
                      {item.label === "Cart" && cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                          {cartCount > 99 ? "99+" : cartCount}
                        </span>
                      )}
                    </motion.div>
                    <motion.span
                      animate={{
                        opacity: isActive ? 1 : 0,
                        y: isActive ? -6 : 10,
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="text-[10px] font-semibold text-primary absolute bottom-1.5"
                    >
                      {item.label}
                    </motion.span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        {/* Safe area spacer for iOS */}
        <div className="h-[env(safe-area-inset-bottom)] bg-background" />
      </nav>
    </>
  );
};

export default BottomNav;
