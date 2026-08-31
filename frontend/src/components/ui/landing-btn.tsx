import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface Props {
  href: string;
  className?: string;
  children: ReactNode;
  showRightArrow?: boolean;
  onClick?: () => void;
}

export default function LandingButton({ href, className = "", children, showRightArrow = true, onClick }: Props) {
  return (
    <Link to={href} onClick={onClick} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-all ${className}`}>
      {children}
      {showRightArrow && <ArrowRight size={16} />}
    </Link>
  );
}
