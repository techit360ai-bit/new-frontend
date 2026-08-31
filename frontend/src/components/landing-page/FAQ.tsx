import { motion, AnimatePresence } from "motion/react";
import { getTranslations } from "@/app/lib/i18n";
import { useLocale } from "@/contexts/LocaleContext";
import { useState } from "react";
import { ChevronDown, MessageCircleQuestion } from "lucide-react";

export default function FAQ() {
  const { locale } = useLocale();
  const { faq: { badge, title, description, categories } } = getTranslations(locale.code);
  const [openIndex, setOpenIndex] = useState<string | null>("0-0");

  return (
    <div className="py-24 bg-[#58A6ff] px-6 rounded-[36px] -mt-6 md:mt-6 relative font-bricolage overflow-hidden shadow-2xl">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#0068ff]/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center mb-16 relative z-10">
        <h2 className="text-sm font-black uppercase tracking-widest text-white mb-4 bg-white/20 inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/30 shadow-sm backdrop-blur-md">
          <MessageCircleQuestion size={16} /> {badge}
        </h2>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-6 drop-shadow-sm">
          {title}
        </h1>
        <p className="text-white/90 text-lg md:text-xl font-medium max-w-2xl mx-auto">
          {description}
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        {categories.map((section, sectionIdx) => (
          <div key={sectionIdx} className="space-y-6">
            <h3 className="text-2xl font-black text-white/90 tracking-tight pl-3 border-l-4 border-white/50">
              {section.category}
            </h3>
            
            <div className="space-y-4">
              {section.questions.map((faq, faqIdx) => {
                const uniqueId = `${sectionIdx}-${faqIdx}`;
                const isOpen = openIndex === uniqueId;
                
                return (
                  <motion.div 
                    key={uniqueId}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: faqIdx * 0.1 }}
                    className={`bg-white rounded-[24px] overflow-hidden border border-white/50 shadow-xl transition-all duration-300 ${isOpen ? 'ring-4 ring-white/30 scale-[1.01]' : 'hover:scale-[1.01]'}`}
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : uniqueId)}
                      className="w-full px-6 py-6 md:px-8 md:py-7 text-left flex justify-between items-center focus:outline-none"
                    >
                      <span className={`font-bold text-lg md:text-xl pr-8 ${isOpen ? "text-[#0068ff]" : "text-[#171330]"}`}>
                        {faq.q}
                      </span>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isOpen ? "bg-[#0068ff]/10" : "bg-gray-100"}`}
                      >
                        <ChevronDown className={isOpen ? "text-[#0068ff]" : "text-gray-400"} />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <div className="px-6 pb-6 md:px-8 md:pb-8 text-gray-600 font-medium text-lg leading-relaxed border-t border-gray-100 pt-4">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
