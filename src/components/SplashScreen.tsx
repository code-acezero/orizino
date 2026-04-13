import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import LogoLoader from "./LogoLoader";

interface SplashScreenProps {
  visible: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        key="splash"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
      >
        <LogoLoader size={72} />
      </motion.div>
    )}
  </AnimatePresence>
);

export default SplashScreen;
