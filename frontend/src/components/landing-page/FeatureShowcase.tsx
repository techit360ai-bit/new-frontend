import { motion, type Variants } from "motion/react";
import { Zap, Shield, Rocket } from "lucide-react";
import { getTranslations } from "@/app/lib/i18n";
import { useLocale } from "@/contexts/LocaleContext";

export default function FeatureShowcase() {
  const { locale } = useLocale();
  const { featureShowcase: { badge, title, description, features } } = getTranslations(locale.code);
  
  const iconMap = [Zap, Shield, Rocket];

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="py-24 bg-[#20c997] dark:bg-[#111111] dark:border dark:border-white/10 text-[#171330] dark:text-white px-6 rounded-[36px] -mt-6 md:mt-6 relative font-bricolage overflow-hidden shadow-2xl transition-colors duration-300">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/10 dark:bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#171330]/5 dark:bg-[#0066ff]/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center relative z-10">
        <div className="w-full lg:w-1/2 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-sm font-black uppercase tracking-widest text-[#171330]/80 dark:text-white/80 mb-3 bg-white/30 dark:bg-white/10 inline-block px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/20 dark:border-white/10">
              {badge}
            </h2>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-6 mt-4" dangerouslySetInnerHTML={{ __html: title }} />
            <p className="text-lg text-[#171330]/80 dark:text-slate-300 font-medium leading-relaxed max-w-lg">
              {description}
            </p>
          </motion.div>
          
          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4 pt-4"
          >
            {features.map((feature, i) => {
              const Icon = iconMap[i] || Zap;
              return (
                <motion.div 
                  key={i}
                  variants={item}
                  whileHover={{ x: 10 }}
                  className="flex gap-5 p-5 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-white/20 dark:hover:border-white/10 hover:bg-white/40 dark:hover:bg-white/10 hover:shadow-lg"
                >
                  <div className="mt-1 w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-[#171330] dark:bg-[#0066ff] text-[#20c997] dark:text-white shadow-xl">
                    <Icon size={26} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 tracking-tight">{feature.title}</h3>
                    <p className="text-[#171330]/80 dark:text-slate-300 font-medium text-base leading-snug">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
          whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, type: "spring" }}
          style={{ perspective: 1000 }}
          className="w-full lg:w-1/2 relative"
        >
          <div className="aspect-square rounded-[36px] bg-white/20 dark:bg-white/5 p-3 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl transform-gpu">
            <div className="w-full h-full rounded-[24px] bg-[#171330] overflow-hidden relative shadow-inner">
              <div className="w-full bg-[#171330] p-4 flex gap-2 items-center border-b border-white/10 z-20 relative">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <img 
                src="/hero2.jpg" 
                alt="Dashboard showcase" 
                className="absolute inset-0 w-full h-full object-cover opacity-90 pt-11"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#171330]/80 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

