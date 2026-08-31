import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { getTranslations } from "@/app/lib/i18n";
import { LANG } from "@/app/types/globalLang";

export default function DashboardShowcase() {
  const { hero } = getTranslations(LANG);
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [150, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.8, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.95, 1]);

  return (
    <div className="w-full flex justify-center -mt-16 md:-mt-32 relative z-30 px-2 md:px-6 pointer-events-none">
      <motion.div 
        ref={ref}
        style={{ y, opacity, scale }}
        className="w-full max-w-6xl rounded-[24px] md:rounded-[36px] overflow-hidden shadow-2xl border-[6px] border-white/10 bg-[#171330] pointer-events-auto"
      >
        <div className="w-full bg-[#171330] p-2 md:p-4 flex gap-2 items-center border-b border-white/10">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
        </div>
        <img 
          src={hero.imageSrc} 
          alt={hero.imageAlt} 
          className="w-full h-auto object-cover bg-[#171330]"
          loading="lazy"
          decoding="async"
        />
      </motion.div>
    </div>
  );
}
