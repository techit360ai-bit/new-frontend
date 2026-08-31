import { Link } from "react-router-dom";
import { getTranslations } from "@/app/lib/i18n";
import StackMenuWhiteLogo from "../ui/StackMenuWhiteLogo";
import { Twitter, Linkedin, Github } from "lucide-react";

export default function Footer() {
  const { footer: { description, productTitle, productLinks, companyTitle, companyLinks, supportTitle, location, copyright, poweredBy } } = getTranslations();

  return (
    <footer className="bg-[#171330] text-white pt-24 pb-12 px-6 font-bricolage">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10">
              <StackMenuWhiteLogo />
            </div>
            <span className="font-black text-2xl tracking-tight">TechIT</span>
          </div>
          <p className="text-gray-400 font-medium max-w-sm leading-relaxed">
            {description}
          </p>
          <div className="flex gap-4 pt-2">
            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#0068ff] transition-colors">
              <Twitter size={20} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#0068ff] transition-colors">
              <Linkedin size={20} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#0068ff] transition-colors">
              <Github size={20} />
            </a>
          </div>
        </div>
        
        <div>
          <h4 className="font-bold text-lg mb-6">{productTitle}</h4>
          <ul className="space-y-4">
            {productLinks.map((link, i) => (
              <li key={i}>
                <a href={link.href} className="text-gray-400 hover:text-white transition-colors font-medium">
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
                <a href={link.href} className="text-gray-400 hover:text-white transition-colors font-medium">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold text-lg mb-6">{supportTitle}</h4>
          <address className="not-italic text-gray-400 space-y-4 font-medium">
            <p>{location}</p>
            <p>
              <a href="mailto:hello@techit.network" className="hover:text-white transition-colors">
                hello@techit.network
              </a>
            </p>
          </address>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 font-medium">
        <p>&copy; {new Date().getFullYear()} {copyright}</p>
        <p>{poweredBy}</p>
      </div>
    </footer>
  );
}
