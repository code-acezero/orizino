import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

const categories = [
  { name: "Fashion", slug: "fashion", subs: ["Men", "Women", "Kids", "Shoes", "Bags"] },
  { name: "Electronics", slug: "electronics", subs: ["Phones", "Laptops", "Audio", "Wearables"] },
  { name: "Home Appliance", slug: "home-appliance", subs: ["Kitchen", "Cleaning", "Smart Home"] },
  { name: "Accessories", slug: "accessories", subs: ["Watches", "Jewelry", "Sunglasses"] },
  { name: "Groceries", slug: "groceries", subs: ["Fresh", "Pantry", "Beverages"] },
];

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full">
      <div className="glass-strong">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">Z</span>
              </div>
              <span className="font-display font-bold text-xl text-foreground">
                Zero
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              <Link
                to="/"
                className={`btn-pill text-sm transition-colors ${
                  location.pathname === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Home
              </Link>

              {categories.map((cat) => (
                <div
                  key={cat.slug}
                  className="relative"
                  onMouseEnter={() => setHoveredCat(cat.slug)}
                  onMouseLeave={() => setHoveredCat(null)}
                >
                  <Link
                    to={`/categories/${cat.slug}`}
                    className="btn-pill text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    {cat.name}
                    <ChevronDown className="w-3 h-3" />
                  </Link>
                  <AnimatePresence>
                    {hoveredCat === cat.slug && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 pt-2 w-48"
                      >
                        <div className="glass-strong rounded-2xl p-2">
                          {cat.subs.map((sub) => (
                            <Link
                              key={sub}
                              to={`/categories/${cat.slug}/${sub.toLowerCase()}`}
                              className="block px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                            >
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
            <div className="flex items-center gap-2">
              <Link
                to="/search"
                className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
              >
                <Search className="w-5 h-5" />
              </Link>
              <Link
                to="/wishlist"
                className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
              >
                <Heart className="w-5 h-5" />
              </Link>
              <Link
                to="/cart"
                className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all relative"
              >
                <ShoppingCart className="w-5 h-5" />
              </Link>
              <Link
                to="/auth"
                className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
              >
                <User className="w-5 h-5" />
              </Link>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass-strong border-t border-border overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              <Link to="/" className="block px-4 py-2 rounded-xl text-foreground hover:bg-secondary/50" onClick={() => setMobileOpen(false)}>
                Home
              </Link>
              {categories.map((cat) => (
                <div key={cat.slug}>
                  <Link
                    to={`/categories/${cat.slug}`}
                    className="block px-4 py-2 rounded-xl text-foreground hover:bg-secondary/50"
                    onClick={() => setMobileOpen(false)}
                  >
                    {cat.name}
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
