import { motion } from "motion/react";
import LandingButton from "../ui/landing-btn";
import { getTranslations } from "@/app/lib/i18n";

export default function FinalCTA() {
  const { finalCta: { badge, title, description, buttonText } } = getTranslations();

  return (
    <div className="py-6 px-6 relative font-bricolage h-[90vh] md:h-[95vh] w-full">
      <div className="w-full h-full mx-auto rounded-[36px] bg-gradient-to-br from-[#0068ff] to-[#171330] text-white relative overflow-hidden flex flex-col items-center justify-center text-center px-4 md:px-12 shadow-2xl">
        {/* Animated Background Gradients & Blobs */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-[#20c907]/20 rounded-full blur-[120px] pointer-events-none" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], x: [0, 100, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-[#58A6ff]/30 rounded-full blur-[120px] pointer-events-none" 
        />

        <div className="z-10 relative max-w-5xl mx-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-sm font-black uppercase tracking-widest text-white mb-8 bg-white/10 inline-block px-6 py-2.5 rounded-full border border-white/20 backdrop-blur-md shadow-lg">
              {badge}
            </h2>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-tight mb-8 drop-shadow-xl">
              {title}
            </h1>
            <p className="text-xl md:text-2xl text-white/80 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
              {description}
            </p>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              <LandingButton 
                href="/auth/signup" 
                className="bg-[#20c907] hover:bg-[#1bb506] text-white py-6 px-12 text-xl md:text-2xl font-black shadow-[0_0_40px_rgba(32,201,7,0.4)] border-none rounded-[20px] transition-colors"
              >
                {buttonText}
              </LandingButton>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
