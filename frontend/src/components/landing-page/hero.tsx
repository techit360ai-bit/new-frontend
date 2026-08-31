import { motion, type Variants } from "motion/react";
import { LANG } from "@/app/types/globalLang";
import LandingButton from "../ui/landing-btn";
import { getTranslations } from "@/app/lib/i18n";

const locale = LANG; 
const text = getTranslations(locale);

export default function Hero() {
  const titleWords = text.hero.title.split(" ");

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08, 
        delayChildren: 0.2,
      },
    },
  };

  const wordtext: Variants = {
    hidden: { 
      opacity: 0, 
      y: 25, 
      filter: "blur(6px)" 
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
      },
    },
  };

  const fadeUpBlur: Variants = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const imageRevealVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 60,
      clipPath: "inset(100% 0% 0% 0% rounded 24px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      clipPath: "inset(0% 0% 0% 0% rounded 0px)",
      transition: {
        duration: 1.4,
        ease: [0.16, 1, 0.3, 1],
        delay: 0.6,
      },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="relative flex overflow-hidden flex-col items-center p-5 md:h-screen bg-primary-orange text-bg-white xl:rounded-[36px]"
    >
      <div className="flex flex-col gap-y-4 items-center my-16 z-10">
        <h1 className="mt-7 text-4xl max-w-3xl font-black text-center md:text-5xl lg:text-6xl tracking-tight flex flex-wrap justify-center gap-x-3 gap-y-1">
          {titleWords.map((word, index) => (
            <motion.span
              key={index}
              variants={wordtext}
              className="inline-block origin-bottom"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p 
          variants={fadeUpBlur}
          className="leading-relaxed text-center max-w-2xl text-white/85"
        >
          {text.hero.description}
        </motion.p>

        <motion.div 
          variants={fadeUpBlur}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="mt-2"
        >
          <LandingButton
            href={text.hero.buttonHref}
            className="bg-bg-black-btn-bg text-white backdrop-blur-md transition-shadow hover:shadow-xl"
          >
            {text.hero.buttonText}
          </LandingButton>
        </motion.div>
      </div>

      <motion.div 
        variants={imageRevealVariants}
        className="mb-0 lg:-mb-37.5 md:max-w-[50vw] will-change-transform rounded-2xl md:rounded-t-3xl overflow-hidden"
      >
        <img 
          src={text.hero.imageSrc} 
          alt={text.hero.imageAlt} 
          className="w-full object-cover select-none"
        />
      </motion.div>
    </motion.div>
  );
}
