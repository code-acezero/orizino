import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, LayoutGrid, ShoppingCart, Heart, User, ChevronDown } from "lucide-react";
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

  const handleClick = (item: typeof items[0]) => {
    if (item.path === "__categories__") {
      setCatOpen(!catOpen);
    } else if (item.path === "__auth__") {
      onAuthClick();
    } else {
      setCatOpen(false);
      navigate(item.path);
    }
  };

  return (
    <>
      {/* Categories slide-up panel */}
      {catOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden animate-fade-in"
            onClick={() => setCatOpen(false)}
          />
          <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-50 lg:hidden animate-slide-up">
            <div className="bg-card border-t border-border rounded-t-2xl max-h-[60vh] overflow-y-auto p-4 shadow-lg">
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
          </div>
        </>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <div className="bottom-nav-bar relative">
          <ul className="bottom-nav-list">
            {items.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <li key={item.label} className={`bottom-nav-item${isActive ? " active" : ""}`}>
                  <button onClick={() => handleClick(item)} className="bottom-nav-link">
                    <span className="bottom-nav-icon">
                      <item.icon className="w-5 h-5" />
                      {item.label === "Cart" && cartCount > 0 && (
                        <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                          {cartCount > 99 ? "99+" : cartCount}
                        </span>
                      )}
                    </span>
                    <span className="bottom-nav-text">{item.label}</span>
                  </button>
                </li>
              );
            })}
            {/* Liquid indicator ball */}
            <div
              className="bottom-nav-indicator"
              style={{ transform: activeIndex >= 0 ? `translateX(calc(60px * ${activeIndex}))` : "translateX(-999px)" }}
            />
          </ul>
        </div>
        <div className="h-[env(safe-area-inset-bottom)] bg-background" />
      </nav>
    </>
  );
};

export default BottomNav;
