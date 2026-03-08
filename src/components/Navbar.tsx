import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingCart, Heart, User, Menu, X, ChevronDown, LogOut, Bell, Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AuthModal from "@/components/AuthModal";
import BottomNav from "@/components/BottomNav";

// Categories fetched from DB

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const { data: dbCategories = [] } = useQuery({
    queryKey: ["nav-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, slug, parent_id").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const parentCategories = dbCategories.filter((c) => !c.parent_id);
  const getChildren = (parentId: string) => dbCategories.filter((c) => c.parent_id === parentId);

  const { data: unreadCount } = useQuery({
    queryKey: ["unread-notifications", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true })
        .or(`user_id.eq.${user!.id},user_id.is.null`).eq("is_read", false);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full">
        <div className="glass-strong">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to="/home" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">Z</span>
                </div>
                <span className="font-display font-bold text-xl text-foreground">Zero</span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden lg:flex items-center gap-1">
                <Link to="/home"
                  className={`btn-pill text-sm transition-colors ${location.pathname === "/home" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  Home
                </Link>

                {categories.map((cat) => (
                  <div key={cat.slug} className="relative"
                    onMouseEnter={() => setHoveredCat(cat.slug)}
                    onMouseLeave={() => setHoveredCat(null)}>
                    <Link to={`/shop?category=${cat.slug}`}
                      className="btn-pill text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                      {cat.name}<ChevronDown className="w-3 h-3" />
                    </Link>
                    <AnimatePresence>
                      {hoveredCat === cat.slug && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.2 }} className="absolute top-full left-0 pt-2 w-48">
                          <div className="glass-strong rounded-2xl p-2">
                            {cat.subs.map((sub) => (
                              <Link key={sub} to={`/shop?category=${cat.slug}&sub=${sub.toLowerCase()}`}
                                className="block px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                                {sub}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {/* Animated Search */}
                <div className="hidden lg:flex items-center">
                  <AnimatePresence>
                    {searchOpen && (
                      <motion.form onSubmit={handleSearchSubmit}
                        initial={{ width: 0, opacity: 0 }} animate={{ width: 220, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
                        <input ref={searchRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search products..."
                          className="w-full px-4 py-2 rounded-full bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          onBlur={() => { if (!searchQuery) setSearchOpen(false); }} />
                      </motion.form>
                    )}
                  </AnimatePresence>
                  <button onClick={() => setSearchOpen(!searchOpen)}
                    className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
                    <Search className="w-5 h-5" />
                  </button>
                </div>

                <Link to="/wishlist" className="hidden lg:flex p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
                  <Heart className="w-5 h-5" />
                </Link>
                <Link to="/cart" className="hidden lg:flex p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all relative">
                  <ShoppingCart className="w-5 h-5" />
                </Link>

                {/* Notifications bell */}
                {user && (
                  <Link to="/profile" onClick={() => {}} className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all relative">
                    <Bell className="w-5 h-5" />
                    {(unreadCount || 0) > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* User menu */}
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
                            <Link to="/profile" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                              <User className="w-4 h-4" /> Profile
                            </Link>
                            <Link to="/orders" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                              <ShoppingCart className="w-4 h-4" /> Orders
                            </Link>
                            <Link to="/settings" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                              <Settings className="w-4 h-4" /> Settings
                            </Link>
                            <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-destructive hover:bg-secondary/50 w-full text-left">
                              <LogOut className="w-4 h-4" /> Sign Out
                            </button>
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
              <div className="container mx-auto px-4 py-4 space-y-2">
                {/* Mobile search */}
                <form onSubmit={(e) => { handleSearchSubmit(e); setMobileOpen(false); }}>
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products..."
                    className="w-full px-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 mb-2" />
                </form>
                <Link to="/home" className="block px-4 py-2 rounded-xl text-foreground hover:bg-secondary/50" onClick={() => setMobileOpen(false)}>Home</Link>
                {categories.map((cat) => (
                  <Link key={cat.slug} to={`/shop?category=${cat.slug}`} className="block px-4 py-2 rounded-xl text-foreground hover:bg-secondary/50" onClick={() => setMobileOpen(false)}>
                    {cat.name}
                  </Link>
                ))}
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

      {/* Bottom Nav for Mobile */}
      <BottomNav
        onSearchClick={() => setSearchOpen(true)}
        onAuthClick={() => setAuthOpen(true)}
      />

      {/* Auth Modal */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};

export default Navbar;
