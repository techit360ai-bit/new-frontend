import { motion, AnimatePresence } from "motion/react";
import { getTranslations } from "@/app/lib/i18n";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQ() {
  const { faq: { badge, title, faqs } } = getTranslations();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="py-24 bg-[#d6deec] px-6 rounded-[36px] -mt-6 md:mt-6 relative font-bricolage overflow-hidden">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h2 className="text-sm font-black uppercase tracking-widest text-[#0068ff] mb-3">
          {badge}
        </h2>
        <h1 className="text-4xl md:text-5xl font-black text-[#171330] tracking-tight leading-tight">
          {title}
        </h1>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full px-6 py-6 text-left flex justify-between items-center focus:outline-none"
            >
              <span className="font-bold text-lg text-[#171330]">{faq.q}</span>
              <motion.div
                animate={{ rotate: openIndex === i ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <ChevronDown className="text-gray-400" />
              </motion.div>
            </button>
            <AnimatePresence>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="px-6 pb-6 text-gray-500 font-medium">
                    {faq.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
