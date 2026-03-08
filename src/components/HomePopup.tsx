import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const HomePopup: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [popup, setPopup] = useState<any>(null);

  const { data: popups = [] } = useQuery({
    queryKey: ["active-popups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("popups")
        .select("*")
        .eq("is_active", true)
        .lte("starts_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (popups.length === 0) return;
    const p = popups[0] as any;

    // Check end date
    if (p.ends_at && new Date(p.ends_at) < new Date()) return;

    // Check view count from localStorage
    const storageKey = `popup_views_${p.id}`;
    const views = Number(localStorage.getItem(storageKey) || 0);
    if (views >= (p.max_views || 1)) return;

    // Check duration
    const lastShown = localStorage.getItem(`popup_last_${p.id}`);
    if (lastShown) {
      const hoursSince = (Date.now() - Number(lastShown)) / (1000 * 60 * 60);
      if (hoursSince < (p.duration_hours || 24)) return;
    }

    setPopup(p);
    // Delay showing popup
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [popups]);

  const dismiss = () => {
    if (popup) {
      const storageKey = `popup_views_${popup.id}`;
      const views = Number(localStorage.getItem(storageKey) || 0);
      localStorage.setItem(storageKey, String(views + 1));
      localStorage.setItem(`popup_last_${popup.id}`, String(Date.now()));
    }
    setVisible(false);
  };

  if (!popup) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={dismiss}
        >
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative glass-strong rounded-3xl overflow-hidden max-w-md w-full shadow-2xl"
          >
            <button onClick={dismiss} className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-background/50 hover:bg-background/80 text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>

            {popup.image_url && (
              <img src={popup.image_url} alt="" className="w-full h-48 object-cover" />
            )}

            <div className="p-6 space-y-3">
              <h3 className="text-xl font-bold font-display text-foreground">{popup.title}</h3>
              {popup.message && <p className="text-sm text-muted-foreground">{popup.message}</p>}
              {popup.link_url && (
                <a
                  href={popup.link_url}
                  onClick={dismiss}
                  className="inline-block btn-pill bg-gradient-primary text-primary-foreground font-semibold px-6 py-2.5 text-sm"
                >
                  {popup.link_text || "Learn More"}
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HomePopup;
