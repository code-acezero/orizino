import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingCart, Heart, User, ChevronDown, LogOut, Settings, LayoutGrid,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AuthModal from "@/components/AuthModal";
import BottomNav from "@/components/BottomNav";
import NotificationBell from "@/components/NotificationBell";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catDropOpen, setCatDropOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { currency, setCurrency, enabledCurrencies } = useCurrency();
  const { t } = useLanguage();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const catDropRef = useRef<HTMLDivElement>(null);

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings-nav"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value").in("key", ["site_name", "logo_url", "site_icon_url", "logo_display_style"]);
      const map: Record<string, any> = {};
      data?.forEach((s) => {
        const val = s.value;
        map[s.key] = typeof val === "object" && val !== null ? (val as any).value ?? val : val;
      });
      return map;
    },
    staleTime: 10 * 60 * 1000,
  });

  const siteName = (siteSettings?.site_name as string) || "";
  const logoUrl = (siteSettings?.logo_url as string) || "";
  const siteIconUrl = (siteSettings?.site_icon_url as string) || "";
  const logoStyle = (siteSettings?.logo_display_style as string) || "rounded";

  // Fetch user profile for avatar
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile-nav", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("avatar_url, full_name").eq("id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const logoShapeClass = logoStyle === "square" ? "rounded-lg" : logoStyle === "circle" ? "rounded-full" : logoStyle === "shield" ? "rounded-lg [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]" : logoStyle === "pill" ? "rounded-full px-1" : "rounded-full";

  const UserAvatar = ({ className = "w-9 h-9" }: { className?: string }) => {
    if (userProfile?.avatar_url) {
      return <img src={userProfile.avatar_url} alt="" className={`${className} rounded-full object-cover`} />;
    }
    return (
      <div className={`${className} rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm`}>
        {userProfile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?"}
      </div>
    );
  };

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
                  <img src={logoUrl} alt={siteName} className={`w-8 h-8 ${logoShapeClass} object-cover`} />
                ) : siteIconUrl ? (
                  <img src={siteIconUrl} alt={siteName} className={`w-8 h-8 ${logoShapeClass} object-cover`} />
                ) : siteName ? (
                  <div className={`w-8 h-8 ${logoShapeClass} bg-gradient-primary flex items-center justify-center`}>
                    <span className="text-primary-foreground font-bold text-sm">{siteName.charAt(0)}</span>
                  </div>
                ) : null}
                {siteName && <span className="font-display font-bold text-xl text-foreground hidden sm:inline">{siteName}</span>}
              </Link>

              {/* Mobile: Search bar */}
              <div className="flex-1 lg:hidden">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..."
                    className="w-full pl-9 pr-3 py-2 rounded-full bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all" />
                </form>
              </div>

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
                {/* Currency selector */}
                {enabledCurrencies.length > 1 && (
                  <div className="relative hidden lg:block">
                    <button
                      onClick={() => setCurrencyOpen(!currencyOpen)}
                      className="px-2.5 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all border border-border/50"
                    >
                      {enabledCurrencies.find(c => c.code === currency)?.symbol || currency} {currency}
                    </button>
                    <AnimatePresence>
                      {currencyOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="absolute top-full right-0 pt-2 z-50"
                        >
                          <div className="glass-strong rounded-2xl p-1.5 shadow-lg border border-border/50 min-w-[140px]">
                            {enabledCurrencies.map((c) => (
                              <button
                                key={c.code}
                                onClick={() => { setCurrency(c.code); setCurrencyOpen(false); }}
                                className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-colors ${
                                  currency === c.code ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                }`}
                              >
                                <span className="font-display">{c.symbol}</span>
                                <span>{c.code}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                <Link to="/wishlist" className="hidden lg:flex p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
                  <Heart className="w-5 h-5" />
                </Link>
                <Link to="/cart" className="hidden lg:flex p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all relative">
                  <ShoppingCart className="w-5 h-5" />
                </Link>

                {user && <NotificationBell />}

                {/* Desktop user menu */}
                {user ? (
                  <div className="relative hidden lg:block" onMouseEnter={() => setUserMenuOpen(true)} onMouseLeave={() => setUserMenuOpen(false)}>
                    <button className="flex items-center justify-center">
                      <UserAvatar />
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

                {/* Mobile profile icon + dropdown */}
                <div className="relative lg:hidden">
                  {user ? (
                    <>
                      <button onClick={() => setMobileOpen(!mobileOpen)} className="flex items-center justify-center">
                        <UserAvatar />
                      </button>
                      <AnimatePresence>
                        {mobileOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full right-0 pt-2 w-48 z-50"
                          >
                            <div className="glass-strong rounded-2xl p-2 shadow-lg border border-border/50">
                              <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50"><User className="w-4 h-4" /> Profile</Link>
                              <Link to="/orders" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50"><ShoppingCart className="w-4 h-4" /> Orders</Link>
                              <Link to="/settings" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50"><Settings className="w-4 h-4" /> Settings</Link>
                              <button onClick={() => { handleSignOut(); setMobileOpen(false); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-destructive hover:bg-secondary/50 w-full text-left"><LogOut className="w-4 h-4" /> Sign Out</button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <button onClick={() => setAuthOpen(true)} className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
                      <User className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>


      <BottomNav onSearchClick={() => {}} onAuthClick={() => setAuthOpen(true)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};

export default Navbar;
