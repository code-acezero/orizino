import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { subscribe, removeToast, type AppToast } from "@/lib/app-toast";

const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
  success: { icon: CheckCircle, color: "text-green-400" },
  error: { icon: XCircle, color: "text-destructive" },
  warning: { icon: AlertTriangle, color: "text-yellow-400" },
  info: { icon: Info, color: "text-primary" },
};

const AppToastOverlay: React.FC = () => {
  const [toasts, setToasts] = useState<AppToast[]>([]);

  useEffect(() => subscribe(setToasts), []);

  return (
    <div className="fixed top-20 right-4 z-[200] flex flex-col gap-2 pointer-events-none max-w-[320px]">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => {
          const cfg = iconMap[t.type] || iconMap.info;
          const IconComp = cfg.icon;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, scale: 0.5, x: 40 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5, x: 40 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="pointer-events-auto"
            >
              <div
                className="relative glass-strong rounded-2xl p-3 pr-8 border-2 border-primary/30 shadow-lg"
                style={{ boxShadow: "4px 4px 0px hsl(var(--primary) / 0.2)" }}
              >
                {/* Triangle pointer */}
                <div className="absolute -top-2 right-6 w-3 h-3 rotate-45 bg-card border-l border-t border-primary/30" />
                <button
                  onClick={() => removeToast(t.id)}
                  className="absolute top-1.5 right-1.5 p-0.5 rounded-full hover:bg-secondary/50 text-muted-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="flex items-start gap-2">
                  <IconComp className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">{t.title}</p>
                    {t.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{t.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default AppToastOverlay;
