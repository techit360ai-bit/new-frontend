import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Home, ArrowLeft, Compass } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { roleSafeReturnPath } from "@/lib/roleRoutes";

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const safeHomePath = user
    ? roleSafeReturnPath({
        currentPath: location.pathname,
        profileRole: profile?.role ?? null,
        secondaryRoles: profile?.secondaryRoles ?? null,
      })
    : "/";

  const handleGoHome = () => navigate(safeHomePath);
  const handleGoBack = () => navigate(-1);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative font-bricolage overflow-hidden bg-[#171330]">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#0068ff]/30 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#20c997]/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#171330]/80 rounded-full blur-[80px] pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />

      <div className="relative z-10 max-w-4xl w-full px-6 flex flex-col items-center text-center py-20">
        
        {/* Floating 404 Animation */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mb-8"
        >
          <motion.h1 
            className="text-[120px] md:text-[220px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white via-white to-white/10 drop-shadow-2xl"
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            404
          </motion.h1>
          <div className="absolute inset-0 bg-linear-to-b from-transparent to-[#171330] pointer-events-none bottom-0 h-1/4" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6 max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Lost in the digital abyss
          </h2>
          <p className="text-lg md:text-xl text-gray-400 font-medium leading-relaxed">
            We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in the first place.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 mt-12 w-full sm:w-auto"
        >
          <button
            onClick={handleGoBack}
            className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 font-bold text-white backdrop-blur-md"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>
          
          <button
            onClick={handleGoHome}
            className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#0068ff] hover:bg-[#0052cc] transition-all duration-300 font-bold text-white shadow-[0_0_40px_rgba(0,104,255,0.3)] hover:shadow-[0_0_60px_rgba(0,104,255,0.5)]"
          >
            <Home className="h-5 w-5 group-hover:scale-110 transition-transform" />
            Back to Home
          </button>
        </motion.div>

        {/* Quick Links Glass Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 pt-8 w-full border-t border-white/10"
        >
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 md:p-8 max-w-3xl mx-auto flex flex-col md:flex-row gap-6 items-center justify-between shadow-2xl hover:bg-white/10 transition-colors duration-500">
            <div className="flex items-center gap-5 text-left">
              <div className="w-14 h-14 rounded-full bg-[#20c997]/20 flex items-center justify-center shrink-0 border border-[#20c997]/30 shadow-[0_0_20px_rgba(32,201,151,0.2)]">
                <Compass className="text-[#20c997]" size={28} />
              </div>
              <div>
                <h3 className="text-white font-black text-xl mb-1">Looking for something?</h3>
                <p className="text-gray-400 text-sm font-medium">Explore the TechIT Network</p>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
              <a href="/" className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-white text-sm font-bold shadow-sm">
                Landing Page
              </a>
              <a href="/support" className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-white text-sm font-bold shadow-sm">
                Support Hub
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
