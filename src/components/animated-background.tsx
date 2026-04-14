"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function AnimatedBackground() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Solid base */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{
          background: isDark
            ? "#0d0f18"
            : "#ffffff",
        }}
      />

      {/* Primary orb — top right */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 700,
          height: 700,
          top: "-10%",
          right: "-5%",
          filter: "blur(100px)",
          background: isDark
            ? "radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.08) 50%, transparent 75%)"
            : "radial-gradient(circle, rgba(99,102,241,0.07) 0%, rgba(139,92,246,0.03) 50%, transparent 75%)",
        }}
        animate={{ x: [0, 25, -15, 0], y: [0, -25, 15, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Secondary orb — bottom left */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 600,
          height: 600,
          bottom: "-5%",
          left: "-5%",
          filter: "blur(100px)",
          background: isDark
            ? "radial-gradient(circle, rgba(139,92,246,0.14) 0%, rgba(99,102,241,0.06) 50%, transparent 75%)"
            : "radial-gradient(circle, rgba(139,92,246,0.05) 0%, rgba(99,102,241,0.02) 50%, transparent 75%)",
        }}
        animate={{ x: [0, -20, 25, 0], y: [0, 20, -20, 0], scale: [1, 0.96, 1.08, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Accent orb — centre */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 400,
          height: 400,
          top: "35%",
          left: "42%",
          filter: "blur(90px)",
          background: isDark
            ? "radial-gradient(circle, rgba(168,85,247,0.09) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(168,85,247,0.04) 0%, transparent 70%)",
        }}
        animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0], scale: [1, 1.06, 0.94, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Light mode only — warm top-left wash */}
      {!isDark && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 500,
            height: 500,
            top: "5%",
            left: "10%",
            filter: "blur(110px)",
            background: "radial-gradient(circle, rgba(224,231,255,0.6) 0%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}
