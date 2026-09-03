// components/ui/image-slideshow.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export function ImageSlideshow({
  images,
  intervalMs = 5000,
}: {
  images: string[];
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [images.length, intervalMs]);

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={index}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="absolute inset-0"
      >
        <img src={images[index]} alt="" className="w-full h-full object-cover" />
      </motion.div>
    </AnimatePresence>
  );
}