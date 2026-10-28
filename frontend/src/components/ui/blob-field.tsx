// components/ui/blob-field.tsx
import { motion } from "motion/react";

export function BlobField({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const isDark = variant === "dark";
  return (
    <>
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute -top-24 -right-24 w-80 h-80 rounded-full blur-[110px] ${
          isDark ? "bg-[#0066ff]/30" : "bg-[#0066ff]/20"
        }`}
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className={`absolute bottom-10 -left-20 w-72 h-72 rounded-full blur-[110px] ${
          isDark ? "bg-[#20c937]/15" : "bg-[#20c937]/20"
        }`}
      />
      <motion.div
        animate={{ x: [0, 25, 0], y: [0, -25, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className={`absolute top-1/3 left-1/4 w-56 h-56 rounded-full blur-[110px] ${
          isDark ? "bg-[#58a6ff]/15" : "bg-[#58a6ff]/25"
        }`}
      />
      <div
        className={`absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_80%)] ${
          isDark ? "opacity-[0.06]" : "opacity-[0.035]"
        }`}
      />
    </>
  );
}