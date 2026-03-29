import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { subscribe, removeToast, type AppToast } from "@/lib/app-toast";

const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
  success: { icon: CheckCircle, color: "text-emerald-400" },
  error: { icon: XCircle, color: "text-destructive" },
  warning: { icon: AlertTriangle, color: "text-amber-400" },
  info: { icon: Info, color: "text-primary" },
};

const AppToastOverlay: React.FC = () => {
  const [toasts, setToasts] = useState<AppToast[]>([]);

  useEffect(() => subscribe(setToasts), []);

  const current = toasts[0];

  return (
    <div className="fixed top-[4.5rem] left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
      <AnimatePresence mode="wait">
        {current && (() => {
          const cfg = iconMap[current.type] || iconMap.info;
          const IconComp = cfg.icon;
          return (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: -16, scaleX: 0.6 }}
              animate={{ opacity: 1, y: 0, scaleX: 1 }}
              exit={{ opacity: 0, y: -12, scaleX: 0.7 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="pointer-events-auto"
            >
              <div
                className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-card/95 backdrop-blur-xl border border-border/60 shadow-[0_4px_24px_hsl(0_0%_0%/0.5)] cursor-pointer min-w-[180px] max-w-[360px]"
                onClick={() => removeToast(current.id)}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 600, damping: 15, delay: 0.1 }}
                >
                  <IconComp className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{current.title}</p>
                  {current.description && (
                    <p className="text-[10px] text-muted-foreground truncate">{current.description}</p>
                  )}
                </div>
                {/* Progress indicator */}
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-primary/60"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default AppToastOverlay;
