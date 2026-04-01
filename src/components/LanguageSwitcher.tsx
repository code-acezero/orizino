import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const LanguageSwitcher: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, setLanguage, allLanguages } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = allLanguages.find((l) => l.code === language);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all border border-border/50"
      >
        <Globe className="w-3.5 h-3.5" />
        {!compact && <span>{current?.nativeLabel || "English"}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 pt-2 z-50"
            >
              <div className="glass-strong rounded-2xl p-1.5 shadow-lg border border-border/50 max-h-[320px] overflow-y-auto min-w-[180px]">
                {allLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setOpen(false); }}
                    className={`flex items-center justify-between gap-2 w-full px-3 py-2 rounded-xl text-sm transition-colors ${
                      language === lang.code
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <span>{lang.nativeLabel}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{lang.code}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;
