import { motion } from "motion/react";
import LandingButton from "../ui/landing-btn";
import { getTranslations } from "@/app/lib/i18n";

export default function TheProblemSolver() {
  const { problemSolver: { title, buttonText } } = getTranslations();

  return (
    <div className="py-24 bg-[#d6deec] px-6 rounded-[36px] -mt-6 md:mt-6 relative font-bricolage overflow-hidden">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-6xl font-black text-[#171330] tracking-tight leading-tight mb-8"
        >
          {title}
        </motion.h1>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <LandingButton href="/auth/signup" className="bg-[#0068ff] text-white text-xl py-4 px-8 hover:bg-[#171330] hover:scale-[1.02]">
            {buttonText}
          </LandingButton>
        </motion.div>
      </div>
    </div>
  );
}
