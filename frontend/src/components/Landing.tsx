import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Zap,
  ChevronDown,
  Rocket,
  Gem,
  Building2,
  Brain,
  Code2,
  Radio,
  Star,
  Handshake,
  KeyRound,
  BriefcaseBusiness,
  Sparkles,
  Compass,
  Lightbulb,
  CheckCircle,
  Hammer,
  TrendingUp,
  Users,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import CelebrationOverlay from "@/components/CelebrationOverlay";
import { ThemeToggle } from "@/components/ThemeToggle";
import "@/Landing.css";

// ── Shared components ──
function useScrollReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(28px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const SCROLL_THRESHOLD = 60;

function Navbar({ onGetStarted }: { onGetStarted: () => void }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { name: "The Problem", href: "#problem" },
    { name: "Infrastructure", href: "#infrastructure" },
    { name: "Roles", href: "#roles" },
  ];

  return (
    <>
      <div 
        className={`pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center transition-all duration-300 ${
          isScrolled 
            ? 'pt-4' 
            : 'border-b border-[#006400]/20 bg-[#006400]/10 backdrop-blur-md pt-0'
        }`}
      >
        <motion.div
          initial={false}
          animate={{
            width: isScrolled ? "auto" : "100%",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.8 }}
          className={`pointer-events-auto flex items-center justify-between max-w-7xl mx-auto transition-all duration-300 ${
            isScrolled ? 'px-4 sm:px-6 gap-8' : 'px-6 py-2 w-full gap-0'
          }`}
        >
          {/* Separate Floating Logo Pill */}
          <Link 
            to="/" 
            className={`shrink-0 flex items-center transition-all duration-300 rounded-md ${
              isScrolled 
                ? 'bg-[#006400]/20 backdrop-blur-2xl border border-[#006400]/30 p-1.5' 
                : 'gap-2 p-1.5 border border-transparent'
            }`}
          >
            <img 
              src="/TechIT-logo.png" 
              alt="TechIT Logo" 
              className="w-10 h-10 rounded-md object-contain" 
            />
            <div className={`flex flex-col justify-center leading-none transition-all duration-300 overflow-hidden whitespace-nowrap ${
              isScrolled ? 'w-0 opacity-0' : 'w-[65px] opacity-100'
            }`}>
              <span className="font-bold text-white tracking-wider text-base">TECHIT</span>
            </div>
          </Link>

          {/* Main Floating Nav Pill */}
          <motion.div
            animate={{
              borderRadius: isScrolled ? 999 : 0,
              paddingLeft: isScrolled ? 16 : 0,
              paddingRight: isScrolled ? 16 : 0,
              paddingTop: isScrolled ? 8 : 0,
              paddingBottom: isScrolled ? 8 : 0,
            }}
            className={`flex items-center justify-end md:justify-between transition-colors duration-300 ${
              isScrolled 
                ? 'bg-[#006400]/20 backdrop-blur-2xl border border-[#006400]/30' 
                : 'bg-transparent border-transparent'
            }`}
          >
            {/* Desktop Nav Links */}
            <div className="hidden md:flex gap-4 lg:gap-6 items-center justify-center">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href}
                  className="text-xs lg:text-sm font-medium transition-colors text-slate-300 hover:text-[#00FF00]"
                >
                  {link.name}
                </a>
              ))}
              <div className="w-px h-4 bg-white/10 mx-1 lg:mx-2"></div>
              <Link to="/signin" className="text-xs lg:text-sm font-bold text-white bg-[#FE2784]/20 hover:bg-[#FE2784]/40 border border-[#FE2784]/50 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full transition-colors">
                Sign In
              </Link>
              <button onClick={onGetStarted} className="flex items-center gap-1.5 bg-gradient-to-r from-[#FE2784] to-[#006400] text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm font-bold transition-all hover:-translate-y-0.5">
                Get Started <ArrowRight size={14} />
              </button>
            </div>

            <div className="flex items-center md:hidden">
              {/* Mobile Menu Toggle */}
              <button 
                className="p-2 rounded-full transition-colors bg-white/5 text-slate-200 hover:bg-white/10"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-4 top-24 z-40 md:hidden rounded-2xl bg-[#001a00]/95 backdrop-blur-xl border border-[#006400]/50 shadow-[0_0_40px_rgba(0,100,0,0.3)] overflow-hidden p-4 flex flex-col gap-4"
          >
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-semibold text-slate-200 hover:text-[#00FF00] p-2 transition-colors border-b border-white/5"
              >
                {link.name}
              </a>
            ))}
            <Link to="/signin" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-slate-200 hover:text-[#00FF00] p-2 transition-colors">
              Sign In
            </Link>
            <button onClick={() => { setIsMobileMenuOpen(false); onGetStarted(); }} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#FE2784] to-[#006400] text-white py-2.5 mt-2 rounded-xl text-base font-bold">
              Get Started <ArrowRight size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const Landing = () => {
  const [showRegistrationCelebration, setShowRegistrationCelebration] = useState(false);
  const [showFounderCelebration, setShowFounderCelebration] = useState(false);
  const [showCollaboratorCelebration, setShowCollaboratorCelebration] = useState(false);
  const [showInvestorCelebration, setShowInvestorCelebration] = useState(false);
  const [showOrganizationCelebration, setShowOrganizationCelebration] = useState(false);
  const [showExplorerCelebration, setShowExplorerCelebration] = useState(false);

  const navigate = useNavigate();

  const isCelebrationActive = () =>
    showRegistrationCelebration ||
    showFounderCelebration ||
    showCollaboratorCelebration ||
    showInvestorCelebration ||
    showOrganizationCelebration ||
    showExplorerCelebration;

  const handleGetStarted = () => {
    if (isCelebrationActive()) return;
    setShowRegistrationCelebration(true);
    setTimeout(() => {
      navigate("/signup", { state: { celebrate: true } });
      setShowRegistrationCelebration(false);
    }, 900);
  };

  const handleFounderStart = () => {
    if (isCelebrationActive()) return;
    setShowFounderCelebration(true);
    setTimeout(() => {
      navigate("/signup", { state: { celebrate: true } });
      setShowFounderCelebration(false);
    }, 900);
  };

  const handleCollaboratorStart = () => {
    if (isCelebrationActive()) return;
    setShowCollaboratorCelebration(true);
    setTimeout(() => {
      navigate("/collaborator/setup", { state: { celebrate: true } });
      setShowCollaboratorCelebration(false);
    }, 900);
  };

  const handleInvestorStart = () => {
    if (isCelebrationActive()) return;
    setShowInvestorCelebration(true);
    setTimeout(() => {
      navigate("/investor/onboarding/step-1", { state: { celebrate: true } });
      setShowInvestorCelebration(false);
    }, 900);
  };

  const handleOrganizationStart = () => {
    if (isCelebrationActive()) return;
    setShowOrganizationCelebration(true);
    setTimeout(() => {
      navigate("/org/onboarding/step-1", { state: { celebrate: true } });
      setShowOrganizationCelebration(false);
    }, 900);
  };

  const handleExplorerStart = () => {
    if (isCelebrationActive()) return;
    setShowExplorerCelebration(true);
    setTimeout(() => {
      navigate("/signup", { state: { celebrate: true } });
      setShowExplorerCelebration(false);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">
      <Navbar onGetStarted={handleGetStarted} />

      {/* 1. HERO */}
      <section className="relative pt-40 pb-32 px-6 flex flex-col items-center text-center max-w-5xl mx-auto min-h-screen justify-center">
        {/* Blur Effects */}
        <div className="absolute top-1/4 -left-[20%] w-[50vw] h-[50vw] bg-[#00FF00] opacity-[0.15] blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-1/4 -right-[20%] w-[50vw] h-[50vw] bg-[#FE2784] opacity-[0.15] blur-[150px] rounded-full pointer-events-none mix-blend-screen" />

        <Reveal delay={0}>
          <div className="inline-block px-4 py-1.5 mb-8 rounded-full bg-white/5 border border-white/10 text-[#00FF00] text-sm font-semibold tracking-widest backdrop-blur-md">
            TECHIT NETWORK
          </div>
        </Reveal>
        
        <Reveal delay={100}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-8">
            No Idea Should Be <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FE2784] to-[#00FF00]">Lost.</span>
            <br />
            Turn your idea into <span className="italic font-light">something real.</span>
          </h1>
        </Reveal>

        <Reveal delay={200}>
          <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-3xl font-light leading-relaxed">
            TechIT Network is AI-powered execution infrastructure for creating, validating, building, and growing startups.
          </p>
        </Reveal>

        <Reveal delay={300}>
          <p className="text-base md:text-lg text-gray-500 mb-12 max-w-2xl">
            From your first idea to your first customer — TechIT brings the intelligence, structure, tools, people, and execution guidance you need to move forward.
            <br /><br />
            <strong className="text-white font-medium">Your idea is the beginning.<br />TechIT helps you build what comes next.</strong>
          </p>
        </Reveal>

        <Reveal delay={400}>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button onClick={handleFounderStart} className="px-5 py-2.5 bg-gradient-to-r from-[#FE2784] via-[#006400] to-[#FE2784] bg-[length:200%_auto] animate-gradient-x hover:opacity-90 rounded-full font-bold text-base transition-all hover:scale-105 flex items-center justify-center gap-2">
              Bring My Idea to Life <Rocket size={18} />
            </button>
            <button onClick={handleExplorerStart} className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md rounded-full font-bold text-base transition-all flex items-center justify-center gap-2">
              Explore TechIT Network <Compass size={18} />
            </button>
          </div>
        </Reveal>
      </section>

      {/* 2. THE PROBLEM */}
      <section id="problem" className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold mb-8">The Problem</h2>
            <p className="text-lg md:text-xl text-gray-300 font-light mb-16">
              Great ideas don't fail because they aren't good enough.<br />
              <strong className="text-white">Many never get the chance to be built.</strong>
            </p>
          </Reveal>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-base md:text-lg font-medium text-gray-400">
            <Reveal delay={100}><div className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-[#FE2784]/30 transition-colors">Lack of capital.</div></Reveal>
            <Reveal delay={150}><div className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-[#FE2784]/30 transition-colors">Lack of expertise.</div></Reveal>
            <Reveal delay={200}><div className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-[#FE2784]/30 transition-colors">Lack of direction.</div></Reveal>
            <Reveal delay={250}><div className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-[#FE2784]/30 transition-colors">Lack of validation.</div></Reveal>
            <Reveal delay={300}><div className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-[#FE2784]/30 transition-colors">Lack of the right people.</div></Reveal>
            <Reveal delay={350}><div className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-[#FE2784]/30 transition-colors">Lack of execution.</div></Reveal>
          </div>

          <Reveal delay={450}>
            <p className="mt-16 text-2xl md:text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#00FF00] to-[#006400]">
              TechIT Network exists to close that gap.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 3. INFRASTRUCTURE */}
      <section id="infrastructure" className="py-24 px-6 relative bg-gradient-to-b from-transparent via-[#006400]/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">One Idea. One Infrastructure.</h2>
              <p className="text-lg md:text-xl text-[#00FF00]">From Concept to Company.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "IDEATE", icon: Lightbulb, desc: "Capture and structure your idea before it gets lost." },
              { title: "VALIDATE", icon: CheckCircle, desc: "Challenge assumptions, understand the market, research competitors, and discover what needs to be true." },
              { title: "BUILD", icon: Hammer, desc: "Turn validated ideas into actionable MVP plans and execution roadmaps." },
              { title: "EXECUTE", icon: Zap, desc: "Know what to do next, track progress, identify bottlenecks, and keep moving." },
              { title: "CONNECT", icon: Users, desc: "Find the mentors, collaborators, investors, organizations, and opportunities that can accelerate your journey." },
              { title: "GROW", icon: TrendingUp, desc: "Continue receiving intelligence as your startup evolves from building to launching and scaling." }
            ].map((step, i) => (
              <Reveal key={step.title} delay={i * 100}>
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:-translate-y-2 transition-transform duration-300 group h-full">
                  <div className="w-14 h-14 rounded-full bg-[#006400]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <step.icon size={28} className="text-[#00FF00]" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-4 tracking-wide">{step.title}</h3>
                  <p className="text-sm md:text-base text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. NOT JUST AN AI */}
      <section className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Not Just an AI Assistant.</h2>
            <p className="text-xl md:text-2xl font-medium mb-12">
              TechIT doesn't just answer questions.<br />
              <span className="text-[#FE2784]">It helps you move.</span>
            </p>
            <p className="text-lg md:text-xl text-gray-400 font-light leading-relaxed mb-16">
              It understands your startup's context, monitors your progress, identifies what is holding you back, and continuously helps you determine what should happen next.
            </p>
            <div className="p-10 rounded-3xl bg-gradient-to-r from-[#FE2784]/10 to-[#00FF00]/10 border border-white/10">
              <p className="text-xl md:text-2xl font-bold italic">
                From "I have an idea" <br className="md:hidden" /> <span className="text-gray-500">to</span> <br className="md:hidden" /> "I am building a company."
              </p>
              <p className="mt-6 text-base md:text-lg text-gray-400">That's the journey TechIT is designed for.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 5 & 6. ROLES / PATHS */}
      <section id="roles" className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Choose Your Path</h2>
              <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
                Every person enters the startup ecosystem differently. Your role can change. Your journey doesn't have to stop.
              </p>
            </div>
          </Reveal>

          <div className="space-y-12">
            {/* Explorer */}
            <Reveal delay={100}>
              <div className="flex flex-col md:flex-row gap-12 items-center p-10 rounded-[40px] bg-white/5 border border-white/10 hover:border-[#00FF00]/50 transition-colors">
                <div className="w-24 h-24 shrink-0 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Compass size={40} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-blue-400 tracking-widest mb-2 uppercase">Explorer</h3>
                  <h4 className="text-2xl font-bold mb-4">EXPLORE WITHOUT COMMITTING</h4>
                  <p className="text-sm md:text-base text-gray-300 mb-6 leading-relaxed">
                    Your curiosity is enough to start. You don't need a startup. You don't need a team. You don't even need to know exactly what you're looking for.<br/><br/>
                    As an Explorer, TechIT helps you discover ideas, opportunities, people, startups, knowledge, and possibilities across the ecosystem.<br/><br/>
                    <strong className="text-white">Discover. Learn. Connect. Find where you belong.</strong>
                  </p>
                  <button onClick={handleExplorerStart} className="px-4 py-2 text-sm rounded-full bg-blue-500/20 text-blue-300 font-semibold hover:bg-blue-500/30 transition-colors flex items-center gap-2 w-fit">
                    Enter as Explorer <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </Reveal>

            {/* Founder */}
            <Reveal delay={150}>
              <div className="flex flex-col md:flex-row gap-12 items-center p-10 rounded-[40px] bg-gradient-to-r from-[#FE2784]/10 to-transparent border border-[#FE2784]/30">
                <div className="w-24 h-24 shrink-0 rounded-full bg-[#FE2784]/20 flex items-center justify-center">
                  <Rocket size={40} className="text-[#FE2784]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[#FE2784] tracking-widest mb-2 uppercase">Founder</h3>
                  <h4 className="text-2xl font-bold mb-4">TURN YOUR IDEA INTO SOMETHING REAL</h4>
                  <p className="text-sm md:text-base text-gray-300 mb-6 leading-relaxed">
                    You have the idea. Let's build it.<br/><br/>
                    As a Founder, TechIT becomes your AI-powered execution infrastructure — helping you challenge your assumptions, validate your idea, understand your market, plan your MVP, execute your roadmap, and know what to do next.<br/><br/>
                    You don't have to have everything figured out. <strong className="text-white">Start with what you have. TechIT helps you build from there.</strong>
                  </p>
                  <button onClick={handleFounderStart} className="px-4 py-2 text-sm rounded-full bg-[#FE2784]/20 text-[#FE2784] font-semibold hover:bg-[#FE2784]/30 transition-colors flex items-center gap-2 w-fit">
                    Enter as Founder <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </Reveal>

            {/* Collaborator */}
            <Reveal delay={200}>
              <div className="flex flex-col md:flex-row gap-12 items-center p-10 rounded-[40px] bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors">
                <div className="w-24 h-24 shrink-0 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Zap size={40} className="text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-purple-400 tracking-widest mb-2 uppercase">Collaborator</h3>
                  <h4 className="text-2xl font-bold mb-4">YOUR SKILLS CAN BUILD SOMETHING BIGGER</h4>
                  <p className="text-sm md:text-base text-gray-300 mb-6 leading-relaxed">
                    Don't just look for a job. Find something worth building.<br/><br/>
                    As a Collaborator, discover startups, ideas, and projects where your skills can make a real difference. Connect with founders, contribute to meaningful projects, build your experience, and grow alongside the companies you help create.<br/><br/>
                    <strong className="text-white">Find a problem worth solving. Find people worth building with.</strong>
                  </p>
                  <button onClick={handleCollaboratorStart} className="px-4 py-2 text-sm rounded-full bg-purple-500/20 text-purple-300 font-semibold hover:bg-purple-500/30 transition-colors flex items-center gap-2 w-fit">
                    Enter as Collaborator <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </Reveal>

            {/* Investor */}
            <Reveal delay={250}>
              <div className="flex flex-col md:flex-row gap-12 items-center p-10 rounded-[40px] bg-white/5 border border-white/10 hover:border-teal-500/50 transition-colors">
                <div className="w-24 h-24 shrink-0 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <Gem size={40} className="text-teal-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-teal-400 tracking-widest mb-2 uppercase">Investor</h3>
                  <h4 className="text-2xl font-bold mb-4">DISCOVER WHAT COULD BE NEXT</h4>
                  <p className="text-sm md:text-base text-gray-300 mb-6 leading-relaxed">
                    Find opportunities before they become obvious.<br/><br/>
                    As an Investor, TechIT gives you intelligence into emerging startups, founder execution, market signals, startup health, and growth potential.<br/><br/>
                    <strong className="text-white">Go beyond the pitch. Understand the idea. Understand the execution. Understand the opportunity.</strong>
                  </p>
                  <button onClick={handleInvestorStart} className="px-4 py-2 text-sm rounded-full bg-teal-500/20 text-teal-300 font-semibold hover:bg-teal-500/30 transition-colors flex items-center gap-2 w-fit">
                    Enter as Investor <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </Reveal>

            {/* Organization */}
            <Reveal delay={300}>
              <div className="flex flex-col md:flex-row gap-12 items-center p-10 rounded-[40px] bg-white/5 border border-white/10 hover:border-orange-500/50 transition-colors">
                <div className="w-24 h-24 shrink-0 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Building2 size={40} className="text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-orange-400 tracking-widest mb-2 uppercase">Organization</h3>
                  <h4 className="text-2xl font-bold mb-4">ACCELERATE THE ECOSYSTEM</h4>
                  <p className="text-sm md:text-base text-gray-300 mb-6 leading-relaxed">
                    Your organization can help more founders succeed.<br/><br/>
                    As an Organization, use TechIT to support entrepreneurs, manage programs and cohorts, monitor startup progress, Hackathons, identify risks, connect founders with resources, and understand what is happening across your ecosystem.<br/><br/>
                    <strong className="text-white">Move from managing programs to building measurable entrepreneurial outcomes.</strong>
                  </p>
                  <button onClick={handleOrganizationStart} className="px-4 py-2 text-sm rounded-full bg-orange-500/20 text-orange-300 font-semibold hover:bg-orange-500/30 transition-colors flex items-center gap-2 w-fit">
                    Enter as Organization <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 7. THE MISSION & CLOSING */}
      <section className="py-32 px-6 relative text-center">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-bold mb-12">The Mission</h2>
            <p className="text-xl md:text-2xl text-gray-300 font-light mb-16 leading-relaxed">
              We believe the world has too many ideas that never get the opportunity to become real.<br/><br/>
              A solution someone never built.<br/>
              A company someone never started.<br/>
              A problem someone never solved.
            </p>
            <div className="p-10 mb-16">
              <h3 className="text-3xl md:text-4xl font-extrabold mb-6">TechIT Network exists to change that.</h3>
              <p className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FE2784] to-[#00FF00]">
                No Idea Should Be Lost.
              </p>
            </div>
            <button onClick={handleGetStarted} className="px-6 py-3 bg-white text-black rounded-full font-bold text-base shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105 flex items-center justify-center gap-2 mx-auto">
              Start Your Journey <ArrowRight size={18} />
            </button>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-12 px-6 text-center text-gray-500">
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src="/TechIT-logo.png" alt="TechIT Logo" className="w-6 h-6 object-contain" />
          <span className="font-bold text-white tracking-widest text-sm">TECHIT NETWORK</span>
        </div>
        <p className="text-sm">© 2026 TechIT Network. Built for builders.</p>
      </footer>

      {/* CELEBRATION OVERLAYS */}
      <CelebrationOverlay visible={showRegistrationCelebration} message="You're starting your registration process!" label="Registration Process" />
      <CelebrationOverlay visible={showFounderCelebration} message="You're starting your founder journey!" label="Founder Journey" />
      <CelebrationOverlay visible={showCollaboratorCelebration} message="You're starting your collaborator journey!" label="Collaborator Journey" />
      <CelebrationOverlay visible={showInvestorCelebration} message="You're starting your investor journey!" label="Investor Journey" />
      <CelebrationOverlay visible={showOrganizationCelebration} message="You're starting your organization journey!" label="Organization Journey" />
      <CelebrationOverlay visible={showExplorerCelebration} message="You're starting your explorer journey!" label="Explorer Journey" />

      <ThemeToggle />
    </div>
  );
};

export default Landing;
