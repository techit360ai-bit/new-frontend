import { motion, type Variants } from "motion/react";
import { getTranslations } from "@/app/lib/i18n";
import { useLocale } from "@/contexts/LocaleContext";
import { Quote, Star } from "lucide-react";

export default function Testimonials() {
  const { locale } = useLocale();
  const { testimonials: { badge, title, description, testimonials } } = getTranslations(locale.code);

  const headerVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div className="py-28 bg-[#171330] px-6 rounded-[36px] -mt-6 md:mt-6 z-20 relative font-bricolage overflow-hidden shadow-2xl">
      {/* Decorative background grids/blobs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0068ff]/15 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        variants={headerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-4xl mx-auto text-center mb-20 relative z-10"
      >
        <h2 className="text-sm font-black uppercase tracking-widest text-white/80 mb-4 bg-white/10 inline-block px-5 py-2 rounded-full border border-white/20 backdrop-blur-md">
          {badge}
        </h2>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-6">
          {title}
        </h1>
        <p className="text-white/60 text-lg max-w-2xl mx-auto font-medium">
          {description}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1400px] mx-auto relative z-10">
        {testimonials.map((testimonial, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
            whileHover={{ y: -10 }}
            className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] flex flex-col justify-between hover:bg-white/10 transition-colors shadow-xl"
          >
            <div>
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} size={16} className="fill-[#20c907] text-[#20c907]" />
                ))}
              </div>
              <Quote className="text-white/20 mb-4" size={32} />
              <p className="text-lg font-medium text-white/90 mb-8 leading-relaxed">
                "{testimonial.quote}"
              </p>
            </div>
            
            <div className="flex items-center gap-4 mt-auto border-t border-white/10 pt-6">
              <div className={`w-12 h-12 ${testimonial.color} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                {testimonial.initials}
              </div>
              <div>
                <h4 className="font-bold text-white tracking-tight">{testimonial.name}</h4>
                <p className="text-white/50 text-sm font-medium">{testimonial.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
