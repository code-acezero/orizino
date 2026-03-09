import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, LayoutGrid, ShoppingCart, Heart, User, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface BottomNavProps {
  onSearchClick: () => void;
  onAuthClick: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ onSearchClick, onAuthClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [catOpen, setCatOpen] = useState(false);

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

  const items = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: LayoutGrid, label: "Categories", path: "__categories__" },
    { icon: ShoppingCart, label: "Cart", path: "/cart" },
    { icon: Heart, label: "Wishlist", path: "/wishlist" },
    { icon: User, label: "Profile", path: user ? "/profile" : "__auth__" },
  ];

  const isActive = (path: string) => location.pathname === path;

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
              className="fixed bottom-16 left-0 right-0 z-50 lg:hidden"
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
        <div className="glass-strong border-t border-border">
          <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
            {items.map((item) => {
              const active = item.path === "__categories__" ? catOpen : isActive(item.path);
              const handleClick = () => {
                if (item.path === "__categories__") setCatOpen(!catOpen);
                else if (item.path === "__auth__") onAuthClick();
              };

              const content = (
                <div className="flex flex-col items-center gap-0.5 relative py-1">
                  {active && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -top-1 w-6 h-0.5 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <item.icon className={`w-5 h-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-[10px] font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
                    {item.label}
                  </span>
                </div>
              );

              if (item.path.startsWith("__")) {
                return (
                  <button key={item.label} onClick={handleClick} className="flex-1 flex items-center justify-center">
                    {content}
                  </button>
                );
              }

              return (
                <Link key={item.label} to={item.path} className="flex-1 flex items-center justify-center">
                  {content}
                </Link>
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
