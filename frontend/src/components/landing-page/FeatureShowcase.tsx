import { motion } from "motion/react";
import LandingButton from "../ui/landing-btn";
import { getTranslations } from "@/app/lib/i18n";
import { Zap, Shield, Rocket } from "lucide-react";

export default function FeatureShowcase() {
  const { header: { navLinks } } = getTranslations(); // reusing for text or can be mapped
  
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast Execution",
      description: "Go from idea to prototype in record time with AI assistance.",
      color: "bg-amber-100 text-amber-600"
    },
    {
      icon: Shield,
      title: "Enterprise Grade Security",
      description: "Your intellectual property is protected at every step of the journey.",
      color: "bg-blue-100 text-primary-orange"
    },
    {
      icon: Rocket,
      title: "Scale Without Limits",
      description: "Infrastructure that grows with you from day one to IPO.",
      color: "bg-green-100 text-primary-green"
    }
  ];

  return (
    <div className="py-24 bg-bg-black-btn-bg text-white px-6 rounded-[36px] -mt-6 md:mt-6 relative font-bricolage overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
        <div className="w-full lg:w-1/2 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-sm font-black uppercase tracking-widest text-primary-orange mb-3">
              Power Features
            </h2>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-6">
              Everything you need.<br/>Nothing you don't.
            </h1>
            <p className="text-lg text-gray-400 font-medium leading-relaxed">
              We've stripped away the complexity of building a startup and left only the essential tools you need to succeed.
            </p>
          </motion.div>
          
          <div className="space-y-6 pt-4">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4"
              >
                <div className={`mt-1 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${feature.color}`}>
                  <feature.icon size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="w-full lg:w-1/2 relative"
        >
          <div className="aspect-square rounded-[32px] bg-gradient-to-tr from-primary-orange to-purple-600 p-1">
            <div className="w-full h-full rounded-[31px] bg-bg-black-btn-bg overflow-hidden relative border border-white/10">
              <img 
                src="/mockup/laptop.png" 
                alt="Dashboard showcase" 
                className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-luminosity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-black-btn-bg to-transparent" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
