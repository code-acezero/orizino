import React from "react";
import { motion } from "framer-motion";

interface LogoLoaderProps {
  size?: number;
  className?: string;
}

/**
 * Animated SVG logo loader – draws the circular ring stroke-by-stroke,
 * then fills the arrow and dot with a scale-up, looping infinitely.
 */
const LogoLoader: React.FC<LogoLoaderProps> = ({ size = 48, className = "" }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Outer ring – draw animation */}
        <motion.path
          d="M50 8 A42 42 0 1 1 22 82"
          stroke="hsl(var(--primary))"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 1, 0] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.4, 0.7, 1],
          }}
        />

        {/* Arrow / compass needle */}
        <motion.path
          d="M38 72 L72 30 L58 50 Z"
          fill="hsl(var(--primary))"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0.3, 1, 1, 0.3],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.35, 0.7, 1],
          }}
          style={{ transformOrigin: "55px 50px" }}
        />

        {/* Small dot */}
        <motion.circle
          cx="22"
          cy="82"
          r="6"
          fill="hsl(var(--primary))"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0.1, 0.45, 0.7, 1],
          }}
          style={{ transformOrigin: "22px 82px" }}
        />

        {/* Rotating glow ring */}
        <motion.circle
          cx="50"
          cy="50"
          r="46"
          stroke="hsl(var(--primary) / 0.15)"
          strokeWidth="1"
          fill="none"
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
          strokeDasharray="8 12"
          style={{ transformOrigin: "50px 50px" }}
        />
      </motion.svg>
    </div>
  );
};

export default LogoLoader;
