import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingCart, Heart, User, Menu, X, ChevronDown, LogOut, Settings, LayoutGrid,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AuthModal from "@/components/AuthModal";
import BottomNav from "@/components/BottomNav";
import NotificationBell from "@/components/NotificationBell";

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catDropOpen, setCatDropOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { currency, setCurrency, enabledCurrencies } = useCurrency();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const catDropRef = useRef<HTMLDivElement>(null);

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings-nav"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value").in("key", ["site_name", "logo_url", "site_icon_url"]);
      const map: Record<string, any> = {};
      data?.forEach((s) => {
        const val = s.value;
        map[s.key] = typeof val === "object" && val !== null ? (val as any).value ?? val : val;
      });
      return map;
    },
    staleTime: 10 * 60 * 1000,
  });

  const siteName = (siteSettings?.site_name as string) || "Zero";
  const logoUrl = (siteSettings?.logo_url as string) || "";
  const siteIconUrl = (siteSettings?.site_icon_url as string) || "";

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
  const getChildren = (parentId: string) => dbCategories.filter((c) => c.parent_id === parentId);

  // unreadCount query removed - handled by NotificationBell component

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catDropRef.current && !catDropRef.current.contains(e.target as Node)) {
        setCatDropOpen(false);
        setHoveredCat(null);
      }
    };
    if (catDropOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [catDropOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full">
        <div className="glass-strong">
          <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-6">
            <div className="flex items-center h-16 gap-4">
              {/* Logo */}
              <Link to="/home" className="flex items-center gap-2 shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt={siteName} className="w-8 h-8 rounded-full object-cover" />
                ) : siteIconUrl ? (
                  <img src={siteIconUrl} alt={siteName} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">{siteName.charAt(0)}</span>
                  </div>
                )}
                <span className="font-display font-bold text-xl text-foreground hidden sm:inline">{siteName}</span>
              </Link>

              {/* Desktop nav links */}
              <div className="hidden lg:flex items-center gap-0.5">
                <Link to="/home"
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${location.pathname === "/home" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  Home
                </Link>
                {/* Categories dropdown */}
                <div className="relative" ref={catDropRef}>
                  <button
                    onClick={() => { setCatDropOpen(!catDropOpen); setHoveredCat(null); }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors inline-flex items-center gap-1 ${catDropOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Categories
                    <ChevronDown className={`w-3 h-3 transition-transform ${catDropOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {catDropOpen && parentCategories.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 pt-2 z-50"
                      >
                        <div className="glass-strong rounded-2xl p-2 shadow-lg border border-border/50 min-w-[200px]">
                          {parentCategories.map((cat) => {
                            const children = getChildren(cat.id);
                            return (
                              <div
                                key={cat.id}
                                className="relative"
                                onMouseEnter={() => setHoveredCat(cat.id)}
                                onMouseLeave={() => setHoveredCat(null)}
                              >
                                <Link
                                  to={`/categories/${cat.slug}`}
                                  onClick={() => setCatDropOpen(false)}
                                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    {cat.icon_url ? (
                                      <img src={cat.icon_url} alt="" className="w-4 h-4 rounded object-contain" />
                                    ) : cat.icon ? (
                                      <span className="text-sm">{cat.icon}</span>
                                    ) : null}
                                    {cat.name}
                                  </div>
                                  {children.length > 0 && (
                                    <ChevronDown className={`w-3 h-3 -rotate-90`} />
                                  )}
                                </Link>

                                {/* Subcategory flyout */}
                                <AnimatePresence>
                                  {hoveredCat === cat.id && children.length > 0 && (
                                    <motion.div
                                      initial={{ opacity: 0, x: -4 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: -4 }}
                                      transition={{ duration: 0.12 }}
                                      className="absolute left-full top-0 pl-1.5 z-50"
                                    >
                                      <div className="glass-strong rounded-xl p-1.5 shadow-lg border border-border/50 min-w-[160px]">
                                        {children.map((sub) => (
                                          <Link
                                            key={sub.id}
                                            to={`/categories/${sub.slug}`}
                                            onClick={() => setCatDropOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                                          >
                                            {sub.icon_url ? (
                                              <img src={sub.icon_url} alt="" className="w-3.5 h-3.5 rounded object-contain" />
                                            ) : sub.icon ? (
                                              <span className="text-xs">{sub.icon}</span>
                                            ) : null}
                                            {sub.name}
                                          </Link>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Center: Search */}
              <div className="hidden lg:block flex-1 max-w-md mx-auto">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products..."
                    className="w-full pl-11 pr-4 py-2.5 rounded-full bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all" />
                </form>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1 shrink-0 ml-auto lg:ml-0">
                <Link to="/wishlist" className="hidden lg:flex p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
                  <Heart className="w-5 h-5" />
                </Link>
                <Link to="/cart" className="hidden lg:flex p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all relative">
                  <ShoppingCart className="w-5 h-5" />
                </Link>

                {user && <NotificationBell />}

                {user ? (
                  <div className="relative hidden lg:block" onMouseEnter={() => setUserMenuOpen(true)} onMouseLeave={() => setUserMenuOpen(false)}>
                    <button className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                      {user.email?.charAt(0).toUpperCase()}
                    </button>
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                          className="absolute top-full right-0 pt-2 w-48">
                          <div className="glass-strong rounded-2xl p-2">
                            <Link to="/profile" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50"><User className="w-4 h-4" /> Profile</Link>
                            <Link to="/orders" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50"><ShoppingCart className="w-4 h-4" /> Orders</Link>
                            <Link to="/settings" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50"><Settings className="w-4 h-4" /> Settings</Link>
                            <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-destructive hover:bg-secondary/50 w-full text-left"><LogOut className="w-4 h-4" /> Sign Out</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <button onClick={() => setAuthOpen(true)} className="hidden lg:flex p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
                    <User className="w-5 h-5" />
                  </button>
                )}

                <button onClick={() => setMobileOpen(!mobileOpen)}
                  className="lg:hidden p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="lg:hidden glass-strong border-t border-border overflow-hidden">
              <div className="w-full max-w-[1440px] mx-auto px-4 py-4 space-y-2">
                <form onSubmit={(e) => { handleSearchSubmit(e); setMobileOpen(false); }}>
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products..."
                    className="w-full px-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 mb-2" />
                </form>
                <Link to="/home" className="block px-4 py-2 rounded-xl text-foreground hover:bg-secondary/50" onClick={() => setMobileOpen(false)}>Home</Link>
                <Link to="/shop" className="block px-4 py-2 rounded-xl text-foreground hover:bg-secondary/50" onClick={() => setMobileOpen(false)}>Shop</Link>

                {/* Categories in mobile */}
                <button
                  onClick={() => setMobileCatOpen(!mobileCatOpen)}
                  className="w-full flex items-center justify-between px-4 py-2 rounded-xl text-foreground hover:bg-secondary/50"
                >
                  <span className="flex items-center gap-2"><LayoutGrid className="w-4 h-4" /> Categories</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileCatOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {mobileCatOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="pl-4 space-y-1">
                        {parentCategories.map((cat) => {
                          const children = getChildren(cat.id);
                          return (
                            <div key={cat.id}>
                              <Link to={`/categories/${cat.slug}`} className="flex items-center gap-2 py-1.5 px-3 text-sm text-foreground hover:text-primary rounded-lg" onClick={() => setMobileOpen(false)}>
                                {cat.icon_url ? <img src={cat.icon_url} alt="" className="w-4 h-4 rounded object-contain" /> : cat.icon ? <span>{cat.icon}</span> : null}
                                {cat.name}
                              </Link>
                              {children.map((sub) => (
                                <Link key={sub.id} to={`/categories/${sub.slug}`} className="block py-1 pl-9 text-xs text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(false)}>
                                  {sub.name}
                                </Link>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {user ? (
                  <>
                    <Link to="/profile" className="block px-4 py-2 rounded-xl text-foreground hover:bg-secondary/50" onClick={() => setMobileOpen(false)}>Profile</Link>
                    <Link to="/settings" className="block px-4 py-2 rounded-xl text-foreground hover:bg-secondary/50" onClick={() => setMobileOpen(false)}>Settings</Link>
                    <button onClick={() => { handleSignOut(); setMobileOpen(false); }} className="block px-4 py-2 rounded-xl text-destructive hover:bg-secondary/50 w-full text-left">Sign Out</button>
                  </>
                ) : (
                  <button onClick={() => { setAuthOpen(true); setMobileOpen(false); }} className="block px-4 py-2 rounded-xl text-primary hover:bg-secondary/50 w-full text-left">Sign In</button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <BottomNav onSearchClick={() => {}} onAuthClick={() => setAuthOpen(true)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};

export default Navbar;
