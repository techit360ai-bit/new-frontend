import { motion, type Variants } from "motion/react";
import { Check, Sparkles } from "lucide-react";
import { getTranslations } from "@/app/lib/i18n";
import { useLocale } from "@/contexts/LocaleContext";
import { useState } from "react";

export default function Pricing() {
  const { locale } = useLocale();
  const {
    pricing: { badge, title, description, monthlyLabel, yearlyLabel, popularLabel, plans },
  } = getTranslations(locale.code);

  const [isYearly, setIsYearly] = useState(false);
  
  const getPrice = (index: number, yearly: boolean) => {
    if (index === 0) return 0;
    
    // Base USD pricing
    let basePrice = 0;
    if (index === 1) basePrice = yearly ? 190 : 19;
    if (index === 2) basePrice = yearly ? 990 : 99;

    // Exchange rates (rough estimates for display)
    const rates: Record<string, number> = {
      USD: 1,
      EUR: 0.92,
      CNY: 7.23,
      BRL: 4.95,
      SAR: 3.75,
      INR: 83.12,
      NGN: 1600,
    };
    
    const rate = rates[locale.currencyCode] || 1;
    const converted = basePrice * rate;
    
    // Format to 0 decimal places usually, but can format nicely
    return Math.round(converted).toLocaleString(locale.code);
  };

  const header: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const cardContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 90, damping: 18 },
    },
  };

  return (
    <div className="py-24 bg-[#d6deec] px-6 rounded-[36px] -mt-6 md:mt-6 z-20 relative font-bricolage overflow-hidden shadow-inner">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0068ff]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#20c907]/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        variants={header}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-4xl mx-auto text-center mb-16 relative z-10"
      >
        <h2 className="text-sm font-black uppercase tracking-widest text-[#0068ff] mb-4 bg-[#0068ff]/10 inline-block px-5 py-2 rounded-full border border-[#0068ff]/20">
          {badge}
        </h2>
        <h1 className="text-4xl md:text-6xl font-black text-[#171330] tracking-tight leading-tight mb-6">
          {title}
        </h1>
        <p className="text-[#171330]/70 text-lg md:text-xl font-medium max-w-2xl mx-auto">
          {description}
        </p>

        <div className="flex items-center justify-center mt-12 gap-2 bg-white/60 p-2 rounded-full inline-flex mx-auto backdrop-blur-md border border-white shadow-sm">
          <span 
            className={`font-bold px-6 py-2.5 rounded-full transition-all cursor-pointer ${!isYearly ? "bg-white shadow-md text-[#171330]" : "text-gray-500 hover:text-[#171330]"}`} 
            onClick={() => setIsYearly(false)}
          >
            {monthlyLabel}
          </span>
          <span 
            className={`font-bold px-6 py-2.5 rounded-full transition-all cursor-pointer flex items-center gap-2 ${isYearly ? "bg-white shadow-md text-[#171330]" : "text-gray-500 hover:text-[#171330]"}`} 
            onClick={() => setIsYearly(true)}
          >
            {yearlyLabel} 
            <span className="bg-[#20c907]/10 text-[#20c907] text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-[#20c907]/20">Save 20%</span>
          </span>
        </div>
      </motion.div>

      <motion.div
        variants={cardContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto relative z-10 items-center"
      >
        {plans.map((plan, i) => (
          <motion.div
            key={i}
            variants={cardVariants}
            whileHover={{ y: -15, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`relative flex flex-col p-10 rounded-[40px] overflow-hidden transition-all duration-300 ${
              plan.popular 
                ? "bg-[#171330] text-white shadow-[0_30px_60px_-15px_rgba(0,104,255,0.5)] md:-my-8 py-14 border border-white/10" 
                : "bg-white/70 backdrop-blur-xl text-[#171330] border border-white/50 shadow-2xl hover:bg-white/90"
            }`}
          >
            {plan.popular && (
              <div className="absolute top-6 right-6 bg-gradient-to-r from-[#0068ff] to-[#58A6ff] text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg border border-white/20">
                <Sparkles size={14} /> {popularLabel}
              </div>
            )}
            
            <h3 className="text-3xl font-black mb-2 tracking-tight">{plan.name}</h3>
            <p className={`font-semibold mb-8 text-sm ${plan.popular ? "text-[#58A6ff]" : "text-gray-500"}`}>
              {plan.tagline}
            </p>
            
            <div className="mb-10 flex items-baseline">
              <span className={`text-6xl font-black tracking-tighter ${plan.popular ? "text-white" : "text-[#171330]"}`}>
                {locale.currencySymbol}{getPrice(i, isYearly)}
              </span>
              <span className={`font-bold ml-2 ${plan.popular ? "text-white/50" : "text-gray-400"}`}>
                / {isYearly ? 'yr' : 'mo'}
              </span>
            </div>

            <button 
              onClick={() => window.location.href = '/signup'}
              className={`w-full py-4 rounded-2xl font-black text-lg mb-10 transition-all hover:scale-[1.03] active:scale-95 shadow-lg ${
              plan.popular 
                ? "bg-gradient-to-r from-[#0068ff] to-[#58A6ff] text-white hover:shadow-[#0068ff]/50" 
                : "bg-white text-[#171330] border-2 border-[#d6deec] hover:border-[#0068ff] hover:text-[#0068ff]"
            }`}>
              {plan.cta}
            </button>

            <ul className="space-y-5 mt-auto">
              {plan.features.map((feature, j) => (
                <li key={j} className="flex items-start gap-3">
                  <div className={`p-1 rounded-full shrink-0 mt-0.5 ${plan.popular ? "bg-[#20c907]/20" : "bg-[#0068ff]/10"}`}>
                    <Check size={16} strokeWidth={3} className={plan.popular ? "text-[#20c907]" : "text-[#0068ff]"} />
                  </div>
                  <span className={`font-semibold text-[15px] leading-snug ${plan.popular ? "text-white/90" : "text-[#171330]/80"}`}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
