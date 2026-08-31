import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Home, ArrowLeft, Compass } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { roleSafeReturnPath } from "@/lib/roleRoutes";
import { useLocale } from "@/contexts/LocaleContext";
import { getTranslations } from "@/app/lib/i18n";
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

  const { locale } = useLocale();
  const { notFound } = getTranslations(locale.code);

  const handleGoHome = () => navigate(safeHomePath);
  const handleGoBack = () => navigate(-1);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative font-bricolage overflow-hidden bg-[#d6deec] py-12">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#0068ff]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-[95%] mx-auto bg-[#0066ff] rounded-[36px] shadow-2xl flex flex-col items-center text-center py-16 px-6 md:px-12 overflow-hidden"
      >
        {/* Inner Card Background Blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-white/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-[#20c997]/20 rounded-full blur-[80px] pointer-events-none" />
        
        {/* Floating 404 Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mb-8 z-10"
        >
          <motion.h1 
            className="text-[120px] md:text-[200px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white via-white/90 to-transparent drop-shadow-sm"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            404
          </motion.h1>
          <div className="absolute inset-0 bg-linear-to-b from-transparent to-[#0066ff] pointer-events-none bottom-0 h-1/4" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6 max-w-2xl mx-auto z-10"
        >
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            {notFound.title}
          </h2>
          <p className="text-lg md:text-xl text-blue-100 font-medium leading-relaxed">
            {notFound.subtitle}
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 mt-10 w-full sm:w-auto z-10"
        >
          <button
            onClick={handleGoBack}
            className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 font-bold text-white"
          >
            <ArrowLeft className="h-5 w-5 text-white/70 group-hover:-translate-x-1 transition-transform" />
            {notFound.goBack}
          </button>
          
          <button
            onClick={handleGoHome}
            className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-white hover:bg-blue-50 transition-all duration-300 font-bold text-[#0066ff] shadow-lg hover:shadow-xl"
          >
            <Home className="h-5 w-5 group-hover:scale-110 transition-transform" />
            {notFound.goHome}
          </button>
        </motion.div>

        {/* Quick Links Glass Panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 w-full z-10"
        >
          <div className="bg-white/10 border border-white/20 rounded-[28px] p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center justify-between shadow-sm transition-colors duration-300 hover:bg-white/15">
            <div className="flex items-center gap-5 text-left">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/30 shadow-sm">
                <Compass className="text-white" size={28} />
              </div>
              <div>
                <h3 className="text-white font-black text-xl mb-1">{notFound.lookingFor}</h3>
                <p className="text-blue-100 text-sm font-medium">{notFound.explore}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
              <a href="/" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-white text-sm font-bold shadow-sm">
                {notFound.landing}
              </a>
              <a href="/support" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-white text-sm font-bold shadow-sm">
                {notFound.support}
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
