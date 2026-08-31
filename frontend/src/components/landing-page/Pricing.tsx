import { motion, type Variants } from "motion/react";
import { Check } from "lucide-react";
import { getTranslations } from "@/app/lib/i18n";
import { useState, useEffect } from "react";
import { getCurrencyInfo } from "@/utils/exchangeRate";

export default function Pricing() {
  const {
    pricing: { badge, title, description, monthlyLabel, yearlyLabel, popularLabel, plans, hardwareTitle, hardwareDescription },
  } = getTranslations();

  const [isYearly, setIsYearly] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  
  useEffect(() => {
    getCurrencyInfo().then(info => setCurrencySymbol(info.symbol));
  }, []);

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
    <div className="py-24 bg-bg-grey-subtle px-6 rounded-[36px] -mt-6 md:mt-6 z-20 relative font-bricolage overflow-hidden">
      <motion.div
        variants={header}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-4xl mx-auto text-center mb-16"
      >
        <h2 className="text-sm font-black uppercase tracking-widest text-primary-orange mb-3">
          {badge}
        </h2>
        <h1 className="text-4xl md:text-6xl font-black text-text-dark tracking-tight leading-none mb-6">
          {title}
        </h1>
        <p className="text-gray-600 text-lg md:text-xl font-medium max-w-2xl mx-auto">
          {description}
        </p>

        <div className="flex items-center justify-center mt-10 gap-4">
          <span className={`font-semibold ${!isYearly ? "text-text-dark" : "text-gray-400"}`}>
            {monthlyLabel}
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className="w-16 h-8 bg-gray-200 rounded-full p-1 relative transition-colors focus:outline-none"
            aria-label="Toggle pricing"
          >
            <motion.div
              className="w-6 h-6 bg-primary-orange rounded-full shadow-md"
              animate={{ x: isYearly ? 32 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`font-semibold ${isYearly ? "text-text-dark" : "text-gray-400"}`}>
            {yearlyLabel}
          </span>
        </div>
      </motion.div>

      <motion.div
        variants={cardContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto"
      >
        {plans.map((plan, i) => (
          <motion.div
            key={i}
            variants={cardVariants}
            className={`relative flex flex-col p-8 rounded-[32px] overflow-hidden ${
              plan.popular 
                ? "bg-bg-black-btn-bg text-white shadow-2xl scale-100 md:scale-105 z-10" 
                : "bg-white text-text-dark border border-gray-100 shadow-xl"
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-primary-orange text-white text-xs font-bold px-4 py-1.5 rounded-bl-[16px] uppercase tracking-wider">
                {popularLabel}
              </div>
            )}
            
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <p className={`font-medium mb-6 ${plan.popular ? "text-gray-400" : "text-gray-500"}`}>
              {plan.tagline}
            </p>
            
            <div className="mb-8">
              <span className="text-5xl font-black tracking-tighter">
                {currencySymbol}{isYearly ? "X" : "Y"}
              </span>
              <span className={`font-medium ml-2 ${plan.popular ? "text-gray-400" : "text-gray-500"}`}>
                / {isYearly ? 'yr' : 'mo'}
              </span>
            </div>

            <button className={`w-full py-4 rounded-2xl font-bold text-lg mb-8 transition-transform hover:scale-[1.02] active:scale-95 ${
              plan.popular 
                ? "bg-white text-bg-black-btn-bg" 
                : "bg-bg-grey-subtle text-text-dark"
            }`}>
              {plan.cta}
            </button>

            <ul className="space-y-4 mt-auto">
              {plan.features.map((feature, j) => (
                <li key={j} className="flex items-center gap-3">
                  <div className={`p-1 rounded-full ${plan.popular ? "bg-white/10" : "bg-primary-orange/10"}`}>
                    <Check size={16} className={plan.popular ? "text-white" : "text-primary-orange"} />
                  </div>
                  <span className={`font-medium ${plan.popular ? "text-gray-200" : "text-gray-700"}`}>
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
