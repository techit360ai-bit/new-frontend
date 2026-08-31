import { motion } from "motion/react";
import { getTranslations } from "@/app/lib/i18n";
import { useLocale } from "@/contexts/LocaleContext";
import { CheckCircle2 } from "lucide-react";

export default function BenefitGrid() {
  const { locale } = useLocale();
  const { benefitGrid: { badge, title, description, benefits } } = getTranslations(locale.code);

  return (
    <div className="py-24 bg-white px-6 rounded-[36px] -mt-6 md:mt-6 relative font-bricolage overflow-hidden">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h2 className="text-sm font-black uppercase tracking-widest text-[#20c907] mb-3">
          {badge}
        </h2>
        <h1 className="text-4xl md:text-5xl font-black text-[#171330] tracking-tight leading-tight mb-4">
          {title}
        </h1>
        <p className="text-xl text-gray-500 font-medium">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {benefits.map((benefit, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-8 border border-gray-100 rounded-[24px] bg-gray-50 hover:shadow-xl transition-shadow"
          >
            <div className="w-12 h-12 bg-[#20c907]/10 rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle2 className="text-[#20c907]" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-[#171330] mb-3">{benefit.title}</h3>
            <p className="text-gray-500 font-medium leading-relaxed">{benefit.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
