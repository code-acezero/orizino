import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingCart, Heart, User, Menu, X, ChevronDown, LogOut, Bell, Settings, LayoutGrid,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AuthModal from "@/components/AuthModal";
import BottomNav from "@/components/BottomNav";

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

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

  // Close category dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
              {/* Left: Logo + Home + Categories */}
              <div className="flex items-center gap-1 shrink-0">
                <Link to="/home" className="flex items-center gap-2 mr-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">Z</span>
                  </div>
                  <span className="font-display font-bold text-xl text-foreground hidden sm:inline">Zero</span>
                </Link>

                <div className="hidden lg:flex items-center gap-0.5">
                  <Link to="/home"
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${location.pathname === "/home" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    Home
                  </Link>

                  {/* Categories button - always visible */}
                  <div ref={catRef} className="relative">
                    <button
                      onClick={() => setCatOpen(!catOpen)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${catOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                      Categories
                      <ChevronDown className={`w-3 h-3 transition-transform ${catOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {catOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 pt-2 w-64 z-50"
                        >
                          <div className="glass-strong rounded-2xl p-3 shadow-lg border border-border/50">
                            {parentCategories.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4">No categories available yet</p>
                            ) : (
                              <div className="space-y-1">
                                {parentCategories.map((cat) => {
                                  const children = getChildren(cat.id);
                                  return (
                                    <div key={cat.id}>
                                      <Link
                                        to={`/categories/${cat.slug}`}
                                        onClick={() => setCatOpen(false)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors"
                                      >
                                        {cat.icon_url ? (
                                          <img src={cat.icon_url} alt="" className="w-5 h-5 rounded object-contain" />
                                        ) : cat.icon ? (
                                          <span className="text-base">{cat.icon}</span>
                                        ) : null}
                                        {cat.name}
                                      </Link>
                                      {children.length > 0 && (
                                        <div className="ml-6 border-l border-border/50 pl-2 space-y-0.5">
                                          {children.map((sub) => (
                                            <Link
                                              key={sub.id}
                                              to={`/categories/${sub.slug}`}
                                              onClick={() => setCatOpen(false)}
                                              className="block px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                                            >
                                              {sub.name}
                                            </Link>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            <div className="border-t border-border/50 mt-2 pt-2">
                              <Link
                                to="/shop"
                                onClick={() => setCatOpen(false)}
                                className="block text-center text-xs font-medium text-primary hover:underline py-1"
                              >
                                View All Products
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Center: Search Bar */}
              <div className="hidden lg:block flex-1 max-w-md mx-auto">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-11 pr-4 py-2.5 rounded-full bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all"
                  />
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

                {user && (
                  <Link to="/profile" className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all relative">
                    <Bell className="w-5 h-5" />
                    {(unreadCount || 0) > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                )}

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
              <div className="w-full max-w-[1440px] mx-auto px-4 py-4 space-y-2">
                <form onSubmit={(e) => { handleSearchSubmit(e); setMobileOpen(false); }}>
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products..."
                    className="w-full px-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 mb-2" />
                </form>
                <Link to="/home" className="block px-4 py-2 rounded-xl text-foreground hover:bg-secondary/50" onClick={() => setMobileOpen(false)}>Home</Link>

                {/* Categories section in mobile */}
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Categories</p>
                  {parentCategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No categories available yet</p>
                  ) : (
                    parentCategories.map((cat) => {
                      const children = getChildren(cat.id);
                      return (
                        <div key={cat.id} className="mb-1">
                          <Link to={`/shop?category=${cat.slug}`} className="block py-1.5 text-sm text-foreground hover:text-primary" onClick={() => setMobileOpen(false)}>
                            {cat.icon && <span className="mr-1.5">{cat.icon}</span>}{cat.name}
                          </Link>
                          {children.map((sub) => (
                            <Link key={sub.id} to={`/shop?category=${sub.slug}`} className="block py-1 pl-5 text-xs text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(false)}>
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      );
                    })
                  )}
                </div>

                <Link to="/shop" className="block px-4 py-2 rounded-xl text-foreground hover:bg-secondary/50" onClick={() => setMobileOpen(false)}>All Products</Link>
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
