import { motion } from "motion/react";
import LandingButton from "../ui/landing-btn";
import { getTranslations } from "@/app/lib/i18n";

export default function FinalCTA() {
  const { finalCta: { badge, title, description, buttonText, imageAlt } } = getTranslations();

  return (
    <div className="py-24 px-6 relative font-bricolage overflow-hidden bg-white">
      <div className="max-w-6xl mx-auto rounded-[36px] bg-[#0068ff] text-white p-10 md:p-20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12 shadow-2xl">
        <div className="w-full md:w-1/2 z-10 relative">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-sm font-black uppercase tracking-widest text-white/70 mb-3">
              {badge}
            </h2>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-6">
              {title}
            </h1>
            <p className="text-xl text-white/80 font-medium mb-10">
              {description}
            </p>
            <LandingButton href="/auth/signup" className="bg-[#171330] text-white hover:scale-105 py-4 px-8 text-lg shadow-xl">
              {buttonText}
            </LandingButton>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
          className="w-full md:w-1/2 relative z-10 hidden md:block"
        >
          <img 
            src="/mockup/laptop.png" 
            alt={imageAlt} 
            className="w-full drop-shadow-2xl translate-x-10 translate-y-10"
          />
        </motion.div>
        
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#171330]/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
      </div>
    </div>
  );
}
