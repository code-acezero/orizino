import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, ShoppingCart, Heart, User } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface BottomNavProps {
  onSearchClick: () => void;
  onAuthClick: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ onSearchClick, onAuthClick }) => {
  const location = useLocation();
  const { user } = useAuth();

  const items = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: Search, label: "Search", path: "__search__" },
    { icon: ShoppingCart, label: "Cart", path: "/cart" },
    { icon: Heart, label: "Wishlist", path: "/wishlist" },
    { icon: User, label: "Profile", path: user ? "/profile" : "__auth__" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="glass-strong border-t border-border">
        <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
          {items.map((item) => {
            const active = isActive(item.path);
            const handleClick = () => {
              if (item.path === "__search__") onSearchClick();
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
  );
};

export default BottomNav;
