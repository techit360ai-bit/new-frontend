import { motion, type Variants } from "motion/react";
import FeatureSection from "./FeatureSection";
import { getTranslations } from "@/app/lib/i18n";
import { useLocale } from "@/contexts/LocaleContext";

export default function HowToRegister() {
  const { locale } = useLocale();
  const {
    howToRegister: { badge, title, description, steps, buttonText },
  } = getTranslations(locale.code);

  const header: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.1,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 15, filter: "blur(6px)" },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: "easeOut" }
    },
  };

  return (
    <div className="bg-white py-20 rounded-t-[36px] md:rounded-[36px] -mt-6 md:mt-6 z-30 relative overflow-hidden">
      <motion.div 
        variants={header}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="text-center px-6 mb-12 max-w-3xl mx-auto"
      >
        <motion.h2 
          variants={item} 
          className="text-sm font-black uppercase tracking-widest text-[#0068ff] mb-3"
        >
          {badge}
        </motion.h2>

        <motion.h1 
          variants={item} 
          className="text-4xl md:text-5xl font-black text-[#171330] tracking-tight leading-tight"
        >
          {title}
        </motion.h1>

        <motion.p 
          variants={item} 
          className="mt-4 text-lg text-gray-500 font-medium leading-relaxed"
        >
          {description}
        </motion.p>
      </motion.div>

      <div className="space-y-4">
        <FeatureSection
          imageLeft={true}
          imageUrl="/create-account.jpg"
          imageAlt={steps[0].imageAlt}
          title={steps[0].title}
          description={steps[0].description}
          buttonText={buttonText}
        />

        <FeatureSection
          imageLeft={false}
          imageUrl="/goal-setting.avif"
          imageAlt={steps[1].imageAlt}
          title={steps[1].title}
          description={steps[1].description}
          buttonText={buttonText}
        />

        <FeatureSection
          imageLeft={true}
          imageUrl="/launch.jpg"
          imageAlt={steps[2].imageAlt}
          title={steps[2].title}
          description={steps[2].description}
          buttonText={buttonText}
        />
      </div>
    </div>
  );
}
