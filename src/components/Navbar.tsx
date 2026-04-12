import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingCart, Heart, User, ChevronDown, LogOut, Settings, LayoutGrid, ArrowRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import BottomNav, { type BottomNavProductTray } from "@/components/BottomNav";
import NotificationBell from "@/components/NotificationBell";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavbarProps {
  bottomNavProductTray?: BottomNavProductTray;
}

const Navbar: React.FC<NavbarProps> = ({ bottomNavProductTray }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catDropOpen, setCatDropOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchFocused, setMobileSearchFocused] = useState(false);
  
  const isMobile = useIsMobile();
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
      const { data } = await supabase.from("site_settings").select("key, value").in("key", ["site_name", "logo_url", "site_icon_url", "logo_display_style", "logo_effect", "title_letter_colors"]);
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
  const logoEffect = (siteSettings?.logo_effect as string) || "none";
  const titleLetterColors = (siteSettings?.title_letter_colors && typeof siteSettings.title_letter_colors === "object") ? siteSettings.title_letter_colors as Record<number, string> : {};

  const getLogoEffectClass = (effect: string) => {
    switch (effect) {
      case "glossy": return "after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/20 after:to-transparent";
      case "glow": return "ring-2 ring-primary/40 shadow-[0_0_16px_hsl(var(--primary)/0.3)]";
      case "shadow": return "shadow-[0_4px_16px_hsl(0_0%_0%/0.4)]";
      case "border": return "ring-2 ring-primary/60";
      case "grayscale": return "grayscale";
      case "negative": return "invert";
      case "blur-bg": return "backdrop-blur-sm bg-background/30";
      default: return "";
    }
  };

  const { data: userProfile } = useQuery({
    queryKey: ["user-profile-nav", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("avatar_url, full_name").eq("id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const logoShapeClass = logoStyle === "square" ? "rounded-lg" : logoStyle === "circle" ? "rounded-full" : logoStyle === "shield" ? "rounded-lg [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]" : logoStyle === "pill" ? "rounded-full px-1" : "rounded-full";

  const UserAvatar = React.memo(({ className = "w-9 h-9" }: { className?: string }) => {
    if (userProfile?.avatar_url) {
      return <img src={userProfile.avatar_url} alt="" className={`${className} rounded-full object-cover`} loading="eager" decoding="async" />;
    }
    return (
      <div className={`${className} rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm`}>
        {userProfile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?"}
      </div>
    );
  });

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

  const { data: cartCount } = useQuery({
    queryKey: ["cart-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("cart_items").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
    staleTime: 30000,
  });

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
      const q = encodeURIComponent(searchQuery.trim());
      if (location.pathname === "/shop") {
        const params = new URLSearchParams(location.search);
        params.set("q", searchQuery.trim());
        navigate(`/shop?${params.toString()}`, { replace: true });
      } else {
        navigate(`/shop?q=${q}`);
      }
      setSearchQuery("");
      setMobileSearchFocused(false);
    }
  };

  const renderSiteTitle = () => {
    if (!siteName) return null;
    return (
      <span className="font-bold text-xl text-foreground" style={{ fontFamily: 'var(--font-title, var(--font-display))' }}>
        {Object.keys(titleLetterColors).length > 0
          ? siteName.split("").map((char, i) => (
              <span key={i} style={titleLetterColors[i] ? { color: titleLetterColors[i] } : undefined}>{char}</span>
            ))
          : siteName}
      </span>
    );
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full">
        <div className="glass-strong backdrop-blur-xl">
          <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-6">
            <div className="flex items-center h-16 gap-3">
              {/* Logo */}
              <Link to="/home" className="flex items-center gap-2 shrink-0">
              {logoUrl ? (
                  <img src={logoUrl} alt={siteName} className={`w-8 h-8 ${logoShapeClass} object-cover relative ${getLogoEffectClass(logoEffect)}`} />
                ) : siteIconUrl ? (
                  <img src={siteIconUrl} alt={siteName} className={`w-8 h-8 ${logoShapeClass} object-cover relative ${getLogoEffectClass(logoEffect)}`} />
                ) : siteName ? (
                  <div className={`w-8 h-8 ${logoShapeClass} bg-gradient-primary flex items-center justify-center relative ${getLogoEffectClass(logoEffect)}`}>
                    <span className="text-primary-foreground font-bold text-sm">{siteName.charAt(0)}</span>
                  </div>
                ) : null}
                {/* Desktop: always show title */}
                <span className="hidden lg:inline">
                  {renderSiteTitle()}
                </span>
              </Link>

              {/* Mobile: Site title (shrinks when search focused) */}
              <AnimatePresence>
                {!mobileSearchFocused && isMobile && siteName && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="lg:hidden truncate max-w-[100px] font-bold text-sm text-foreground shrink-0"
                    style={{ fontFamily: 'var(--font-title, var(--font-display))' }}
                  >
                    {siteName}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Mobile: Search bar — expands on focus */}
              <div className="flex-1 lg:hidden min-w-0">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                  <input type="text" value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setMobileSearchFocused(true)}
                    onBlur={() => { if (!searchQuery) setMobileSearchFocused(false); }}
                    placeholder={t("nav.search")}
                    className="w-full pl-9 pr-9 py-2 rounded-full bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all" />
                  <AnimatePresence>
                    {searchQuery.trim() && (
                      <motion.button
                        type="submit"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center z-10 text-primary"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </form>
              </div>

              {/* Desktop nav links */}
              <div className="hidden lg:flex items-center gap-0.5">
                <Link to="/home"
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${location.pathname === "/home" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {t("nav.home")}
                </Link>
                {/* Categories dropdown */}
                <div className="relative" ref={catDropRef}>
                  <button
                    onClick={() => { setCatDropOpen(!catDropOpen); setHoveredCat(null); }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors inline-flex items-center gap-1 ${catDropOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    {t("nav.categories")}
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

              {/* Center: Desktop Search */}
              <div className="hidden lg:block flex-1 max-w-md mx-auto">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("nav.search")}
                    className="w-full pl-11 pr-10 py-2.5 rounded-full bg-secondary/30 backdrop-blur-sm border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 focus:bg-secondary/50 transition-all" />
                  <AnimatePresence>
                    {searchQuery.trim() && (
                      <motion.button
                        type="submit"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-colors"
                      >
                        <ArrowRight className="w-[18px] h-[18px]" />
                      </motion.button>
                    )}
                  </AnimatePresence>
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

                {/* Notification bell */}
                {user && <NotificationBell />}

                <Link to="/wishlist" className="hidden lg:flex p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
                  <Heart className="w-5 h-5" />
                </Link>
                <Link to="/cart" id="nav-cart-icon" className="hidden lg:flex p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all relative group">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <ShoppingCart className="w-5 h-5 group-hover:text-primary transition-colors" />
                  </motion.div>
                  {(cartCount ?? 0) > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none px-1">
                      {cartCount}
                    </motion.span>
                  )}
                </Link>

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
                            <Link to="/profile" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50"><User className="w-4 h-4" /> {t("nav.profile")}</Link>
                            <Link to="/orders" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50"><ShoppingCart className="w-4 h-4" /> {t("nav.orders")}</Link>
                            <Link to="/settings" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50"><Settings className="w-4 h-4" /> {t("nav.settings")}</Link>
                            <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-destructive hover:bg-secondary/50 w-full text-left"><LogOut className="w-4 h-4" /> {t("nav.signOut")}</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <button onClick={() => navigate("/auth", { state: { from: location.pathname } })} className="hidden lg:flex p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
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
                              <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50"><User className="w-4 h-4" /> {t("nav.profile")}</Link>
                              <Link to="/orders" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50"><ShoppingCart className="w-4 h-4" /> {t("nav.orders")}</Link>
                              <Link to="/settings" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50"><Settings className="w-4 h-4" /> {t("nav.settings")}</Link>
                              <button onClick={() => { handleSignOut(); setMobileOpen(false); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-destructive hover:bg-secondary/50 w-full text-left"><LogOut className="w-4 h-4" /> {t("nav.signOut")}</button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <button onClick={() => navigate("/auth", { state: { from: location.pathname } })} className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
                      <User className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Bottom glow line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </nav>

      <BottomNav onSearchClick={() => {}} onAuthClick={() => navigate("/auth", { state: { from: location.pathname } })} productTray={bottomNavProductTray} />
    </>
  );
};

export default Navbar;
