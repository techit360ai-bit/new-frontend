import { motion, type Variants } from "motion/react";
import { Zap, Shield, Rocket } from "lucide-react";

export default function FeatureShowcase() {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast Execution",
      description: "Go from idea to prototype in record time with AI assistance.",
    },
    {
      icon: Shield,
      title: "Enterprise Grade Security",
      description: "Your intellectual property is protected at every step of the journey.",
    },
    {
      icon: Rocket,
      title: "Scale Without Limits",
      description: "Infrastructure that grows with you from day one to IPO.",
    }
  ];

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
    <div className="py-24 bg-[#20c997] text-[#171330] px-6 rounded-[36px] -mt-6 md:mt-6 relative font-bricolage overflow-hidden shadow-2xl">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#171330]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center relative z-10">
        <div className="w-full lg:w-1/2 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-sm font-black uppercase tracking-widest text-[#171330]/80 mb-3 bg-white/30 inline-block px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/20">
              Power Features
            </h2>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-6 mt-4">
              Everything you need.<br/>Nothing you don't.
            </h1>
            <p className="text-lg text-[#171330]/80 font-medium leading-relaxed max-w-lg">
              We've stripped away the complexity of building a startup and left only the essential tools you need to succeed.
            </p>
          </motion.div>
          
          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4 pt-4"
          >
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                variants={item}
                whileHover={{ x: 10, backgroundColor: "rgba(255,255,255,0.4)" }}
                className="flex gap-5 p-5 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-white/20 hover:shadow-lg"
              >
                <div className="mt-1 w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-[#171330] text-[#20c997] shadow-xl">
                  <feature.icon size={26} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2 tracking-tight">{feature.title}</h3>
                  <p className="text-[#171330]/80 font-medium text-base leading-snug">{feature.description}</p>
                </div>
              </motion.div>
            ))}
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
          <div className="aspect-square rounded-[36px] bg-white/20 p-3 backdrop-blur-xl border border-white/40 shadow-2xl transform-gpu">
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
