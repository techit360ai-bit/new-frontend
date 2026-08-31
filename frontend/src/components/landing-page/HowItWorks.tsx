import { motion, type Variants } from "motion/react";
import { getTranslations } from "@/app/lib/i18n";
import { QrCode, Smartphone, Bell } from "lucide-react";

export default function HowItWorks() {
  const {
    howItWorks: { badge, title, description, steps },
  } = getTranslations();

  const stepAssets = [
    {
      icon: QrCode,
      image:
        "https://media.istockphoto.com/id/1339827185/photo/close-up-on-a-woman-scanning-a-qr-code-at-a-restaurant.webp?a=1&b=1&s=612x612&w=0&k=20&c=IMIXbt2JDustzu85_wUIghb1JcE7dV4l_OzGEWqo0qw=",
    },
    {
      icon: Smartphone,
      image:
        "https://media.istockphoto.com/id/1445890966/photo/woman-at-a-cafe-looking-at-a-digital-menu.webp?a=1&b=1&s=612x612&w=0&k=20&c=rxRAxl8bSmZC7MloLGkc0fw4kwm1I1wpVlx088JRQPY=",
    },
    {
      icon: Bell,
      image:
        "https://images.unsplash.com/photo-1565895405139-e188df996e0b?w=500&auto=format&fit=crop&q=60",
    },
  ];

  const header: Variants = {
    hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const grid: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12, 
        delayChildren: 0.2,
      },
    },
  };

  const card: Variants = {
    hidden: { 
      opacity: 0, 
      y: 40, 
      filter: "blur(6px)" 
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 90,
        damping: 18,
      },
    },
  };

  return (
    <div className="p-5 py-20 text-white bg-[#0068ff] rounded-t-[36px] md:rounded-[36px] -mt-7.5 md:mt-6 z-50 relative overflow-hidden">
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={header}
        className="max-w-4xl mx-auto text-center mb-16"
      >
        <h2 className="text-xs font-black uppercase tracking-widest text-white/70 mb-3">
          {badge}
        </h2>
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
          {title}
        </h1>
        <p className="text-white/80 text-lg font-medium">{description}</p>
      </motion.div>

      <motion.ul 
        variants={grid}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto list-none pl-0"
      >
        {steps.map((step, index) => {
          const { icon: Icon, image } = stepAssets[index];

          return (
            <motion.li
              key={step.title}
              variants={card}
              whileHover={{ 
                y: -10, 
                scale: 1.02,
                boxShadow: "0px 25px 50px -12px rgba(0, 0, 0, 0.25)"
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex flex-col bg-white rounded-3xl shadow-xl overflow-hidden will-change-transform cursor-pointer border border-white/5"
            >
              <div className="h-48 w-full bg-gray-100 overflow-hidden relative">
                <motion.img
                  src={image}
                  alt={step.title}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="w-full h-full object-cover select-none"
                />
              </div>

              <div className="p-8 pt-0 -mt-8 relative z-10">
                <motion.div 
                  initial={{ scale: 0.6, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 + index * 0.1 }}
                  className="flex justify-center items-center mb-6 rounded-2xl bg-[#171330] size-14 border-4 border-white shadow-md"
                >
                  <Icon size={24} className="text-white" />
                </motion.div>

                <h3 className="mb-3 text-2xl font-bold text-[#171330] tracking-tight">
                  {step.title}
                </h3>

                <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base">
                  {step.description}
                </p>
              </div>
            </motion.li>
          );
        })}
      </motion.ul>
    </div>
  );
}
