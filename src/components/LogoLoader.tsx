import React from "react";
import { motion } from "framer-motion";

interface LogoLoaderProps {
  size?: number;
  className?: string;
}

/**
 * Animated SVG logo loader – draws the Orizino "O" ring with an arrow,
 * fully visible and centered. The ring draws on, the arrow fills in,
 * then everything fades and loops.
 */
const LogoLoader: React.FC<LogoLoaderProps> = ({ size = 48, className = "" }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.svg
        width={size}
        height={size}
        viewBox="-5 -5 110 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Full circle ring – draw animation */}
        <motion.circle
          cx="50"
          cy="50"
          r="42"
          stroke="hsl(var(--primary))"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0.3 }}
          animate={{
            pathLength: [0, 1, 1, 0],
            opacity: [0.3, 1, 1, 0.3],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.4, 0.65, 1],
          }}
        />

        {/* Arrow / compass needle – centered */}
        <motion.path
          d="M36 68 L68 32 L54 50 Z"
          fill="hsl(var(--primary))"
          initial={{ opacity: 0, scale: 0.2 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0.2, 1, 1, 0.2],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0.05, 0.4, 0.65, 1],
          }}
          style={{ transformOrigin: "52px 50px" }}
        />

        {/* Small accent dot */}
        <motion.circle
          cx="30"
          cy="74"
          r="4.5"
          fill="hsl(var(--primary))"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0.1, 0.45, 0.65, 1],
          }}
          style={{ transformOrigin: "30px 74px" }}
        />

        {/* Rotating dashed glow ring */}
        <motion.circle
          cx="50"
          cy="50"
          r="48"
          stroke="hsl(var(--primary) / 0.12)"
          strokeWidth="1"
          fill="none"
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
          strokeDasharray="6 10"
          style={{ transformOrigin: "50px 50px" }}
        />
      </motion.svg>
    </div>
  );
};

export default LogoLoader;
