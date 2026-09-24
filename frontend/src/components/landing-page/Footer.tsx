import { Link } from "react-router-dom";
import { getTranslations } from "@/app/lib/i18n";
import { useLocale } from "@/contexts/LocaleContext";
import TechITLogo from "../ui/TechITLogo";
import { Twitter, Linkedin, Github } from "lucide-react";

export default function Footer() {
  const { locale } = useLocale();
  const { footer: { description, productTitle, productLinks, companyTitle, companyLinks, supportTitle, location, copyright, poweredBy } } = getTranslations(locale.code);

  return (
    <footer className="bg-[#002b80] dark:bg-[#0a0a0a] dark:border-t dark:border-white/10 text-white pt-24 pb-12 px-6 font-bricolage relative overflow-hidden transition-colors duration-300">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#20c907]/10 rounded-full blur-[100px] pointer-events-none translate-y-1/3 translate-x-1/3" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16 relative z-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-sm">
              <TechITLogo />
            </div>
            <span className="font-black text-2xl tracking-tight">TechIT</span>
          </div>
          <p className="text-white/80 font-medium max-w-sm leading-relaxed">
            {description}
          </p>
          <div className="flex gap-4 pt-2">
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-[#0066ff] transition-all">
              <Twitter size={20} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-[#0066ff] transition-all">
              <Linkedin size={20} />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-[#0066ff] transition-all">
              <Github size={20} />
            </a>
          </div>
        </div>
        
        <div>
          <h4 className="font-bold text-lg mb-6">{productTitle}</h4>
          <ul className="space-y-4">
            {productLinks.map((link, i) => (
              <li key={i}>
                <a href={link.href} className="text-white/70 hover:text-white transition-colors font-medium">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold text-lg mb-6">{companyTitle}</h4>
          <ul className="space-y-4">
            {companyLinks.map((link, i) => (
              <li key={i}>
                <a href={link.href} className="text-white/70 hover:text-white transition-colors font-medium">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold text-lg mb-6">{supportTitle}</h4>
          <address className="not-italic text-white/70 space-y-4 font-medium">
            <p>{location}</p>
            <p>
              <a href="mailto:hello@techit.network" className="hover:text-white transition-colors">
                hello@techit.network
              </a>
            </p>
          </address>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60 font-medium relative z-10">
        <p>&copy; {new Date().getFullYear()} {copyright}</p>
        <p>{poweredBy}</p>
      </div>
    </footer>
  );
}
