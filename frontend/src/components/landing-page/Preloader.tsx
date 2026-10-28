import { motion } from "motion/react";
import TechITLogo from "../ui/TechITLogo";

export default function Preloader() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(12px)" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#171330] overflow-hidden"
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0068ff]/15 via-[#171330] to-[#171330]" />

      {/* Loader core */}
      <div className="relative z-10 flex items-center justify-center w-20 h-20 md:w-24 md:h-24">
        {/* Rotating shimmer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, #0068ff 15%, transparent 35%, transparent 65%, #ff8a00 80%, transparent 100%)",
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
            mask:
              "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
          }}
        />

        {/* Soft pulsing glow behind logo */}
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#0068ff]/40 blur-xl"
        />

        {/* Logo */}
        <motion.div
          animate={{ scale: [0.96, 1, 0.96] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center"
        >
          <div className="w-full h-full scale-[1.6] md:scale-[1.8] flex items-center justify-center">
            <TechITLogo />
          </div>
        </motion.div>
      </div>

      {/* Shimmering text */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
        className="mt-8 relative z-10"
      >
        <motion.span
          animate={{ backgroundPosition: ["200% 0%", "-200% 0%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          className="font-bricolage font-bold tracking-[0.3em] uppercase text-[11px] md:text-xs bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.35) 40%, #ffffff 50%, rgba(255,255,255,0.35) 60%, rgba(255,255,255,0.35) 100%)",
            backgroundSize: "200% 100%",
          }}
        >
          TechIT Network
        </motion.span>
      </motion.div>

      {/* Minimal progress dots */}
      <div className="mt-4 flex items-center gap-1.5 relative z-10">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1, 0.8] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
            className="w-1 h-1 rounded-full bg-[#0068ff]"
          />
        ))}
      </div>
    </motion.div>
  );
}