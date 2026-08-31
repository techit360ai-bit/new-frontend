import { motion } from "motion/react";
import { getTranslations } from "@/app/lib/i18n";

export default function Testimonials() {
  const { testimonials: { badge, title, testimonials } } = getTranslations();

  return (
    <div className="py-24 bg-white px-6 rounded-[36px] -mt-6 md:mt-6 relative font-bricolage overflow-hidden">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h2 className="text-sm font-black uppercase tracking-widest text-primary-orange mb-3">
          {badge}
        </h2>
        <h1 className="text-4xl md:text-5xl font-black text-text-dark tracking-tight leading-tight">
          {title}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {testimonials.map((testimonial, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-8 bg-bg-grey-subtle rounded-[24px]"
          >
            <p className="text-xl font-medium text-text-dark mb-6">"{testimonial.quote}"</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-orange rounded-full flex items-center justify-center text-white font-bold">
                {testimonial.initials}
              </div>
              <div>
                <h4 className="font-bold text-text-dark">{testimonial.name}</h4>
                <p className="text-gray-500 text-sm font-medium">{testimonial.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
