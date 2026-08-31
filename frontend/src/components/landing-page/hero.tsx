import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { getTranslations } from "@/app/lib/i18n";
import { useLocale } from "@/contexts/LocaleContext";
import LandingButton from "../ui/landing-btn";


const SLIDE_IMAGES = [
  "/hero1.jpg",
  "/hero2.jpg",
  "/hero3.jpg",
  "/hero4.jpg",
];

export default function Hero() {
  const { locale } = useLocale();
  const text = getTranslations(locale.code);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % SLIDE_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="relative flex overflow-hidden flex-col items-center justify-center p-5 min-h-[80vh] md:h-screen text-white rounded-[24px] md:rounded-[36px]"
    >
      {/* Background Slideshow */}
      <AnimatePresence initial={false}>
        <motion.div
          key={currentImageIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
        >
          <img
            src={SLIDE_IMAGES[currentImageIndex]}
            alt="Hero Background"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Dark Overlay for Readability */}
      <div className="absolute inset-0 bg-[#171330]/60 z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#171330]/90 via-transparent to-transparent z-0" />

      {/* Content */}
      <div className="flex flex-col gap-y-4 items-center z-10 text-center w-full max-w-4xl px-4 mt-16 md:mt-0">
        <h1 className="text-4xl font-black md:text-5xl lg:text-7xl tracking-tight flex flex-wrap justify-center gap-x-3 gap-y-1">
          {titleWords.map((word, index) => (
            <motion.span
              key={index}
              variants={wordtext}
              className="inline-block origin-bottom drop-shadow-sm"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p 
          variants={fadeUpBlur}
          className="leading-relaxed text-center max-w-2xl text-white/90 md:text-lg drop-shadow mt-4"
        >
          {text.hero.description}
        </motion.p>

        <motion.div 
          variants={fadeUpBlur}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="mt-8"
        >
          <LandingButton
            href={text.hero.buttonHref}
            className="bg-[#0068ff] text-white backdrop-blur-md transition-shadow hover:shadow-xl hover:bg-blue-600 border-none"
          >
            {text.hero.buttonText}
          </LandingButton>
        </motion.div>
      </div>
    </motion.div>
  );
}
