import { motion, type Variants } from "motion/react";
import LandingButton from "../ui/landing-btn";

interface FeatureSectionProps {
  imageLeft?: boolean;
  imageUrl: string;
  imageAlt: string;
  title: string;
  description: string;
}

export default function FeatureSection({
  imageLeft = true,
  imageUrl,
  imageAlt,
  title,
  description,
}: FeatureSectionProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.1 
      } 
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 80, damping: 20 }
    },
  };

  const imageVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9, filter: "blur(8px)" },
    visible: { 
      opacity: 1, 
      scale: 1, 
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: "easeOut" }
    },
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
      className={`flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-24 px-6 md:px-12 py-16 ${
        !imageLeft ? "md:flex-row-reverse" : ""
      }`}
    >
      <motion.div 
        variants={imageVariants}
        className="w-full md:w-1/2 flex justify-center"
      >
        <div className="relative w-full max-w-lg aspect-square lg:aspect-[4/3] rounded-[32px] overflow-hidden shadow-2xl bg-gray-50 border border-gray-100 p-2 lg:p-4">
          <div className="w-full h-full rounded-[24px] overflow-hidden bg-white shadow-inner relative">
            <img
              src={imageUrl}
              alt={imageAlt}
              className="absolute inset-0 w-full h-full object-cover select-none"
            />
          </div>
        </div>
      </motion.div>

      <div className="w-full md:w-1/2 space-y-6 lg:max-w-xl">
        <motion.h3 
          variants={itemVariants}
          className="text-3xl md:text-4xl lg:text-5xl font-black text-[#171330] tracking-tight leading-[1.1]"
        >
          {title}
        </motion.h3>
        
        <motion.p 
          variants={itemVariants}
          className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed"
        >
          {description}
        </motion.p>
        
        <motion.div variants={itemVariants} className="pt-4">
           <LandingButton 
             href="/signup" 
             className="bg-[#0068ff] text-white hover:bg-[#171330]"
           >
             Get Started
           </LandingButton>
        </motion.div>
      </div>
    </motion.div>
  );
}
