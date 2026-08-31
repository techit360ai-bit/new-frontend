import { motion } from "motion/react";
import StackMenuOrangeLogo from "../ui/StackMenuOrangeLogo";

export default function Preloader() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#171330]"
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0068ff]/20 via-[#171330] to-[#171330]" />

      <motion.div
        animate={{ 
          opacity: [0.5, 1, 0.5],
          scale: [0.95, 1.05, 0.95],
          filter: ["drop-shadow(0px 0px 0px rgba(0,104,255,0))", "drop-shadow(0px 0px 30px rgba(0,104,255,0.6))", "drop-shadow(0px 0px 0px rgba(0,104,255,0))"]
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center relative z-10"
      >
        <div className="relative z-10 w-full h-full scale-[2] md:scale-[2.5] flex items-center justify-center">
          <StackMenuOrangeLogo />
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mt-12 text-white/80 font-bricolage font-bold tracking-[0.3em] uppercase text-xs md:text-sm z-10"
      >
        TechIT Network
      </motion.div>
    </motion.div>
  );
}
