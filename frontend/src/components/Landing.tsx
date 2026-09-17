import BenefitGrid from "./landing-page/BenefitGrid";
import FAQ from "./landing-page/FAQ";
import FeatureShowcase from "./landing-page/FeatureShowcase";
import FinalCTA from "./landing-page/FinalCta";
import Footer from "./landing-page/Footer";
import Header from "./landing-page/header";
import Hero from "./landing-page/hero";
import DashboardShowcase from "./landing-page/DashboardShowcase";
import HowItWorks from "./landing-page/HowItWorks";
import HowToRegister from "./landing-page/HowToRegister";
import Pricing from "./landing-page/Pricing";
import Testimonials from "./landing-page/Testimonial";
import TheProblemSolver from "./landing-page/TheProblemSolver";
import "../Landing.css";

export default function Landing() {
  return (
    <>
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] font-bricolage text-[#171330] dark:text-white selection:bg-[#0068ff] selection:text-white relative overflow-hidden transition-colors duration-300">
        {/* Subtle grid pattern for non-plain background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800d_1px,transparent_1px),linear-gradient(to_bottom,#8080800d_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <Header />
        <main className="relative z-10 flex flex-col gap-6 lg:gap-12 px-2 md:px-6 pt-[15px] pb-12 overflow-hidden max-w-[1600px] mx-auto">
          <Hero />
          <DashboardShowcase />
          <HowItWorks />
          <HowToRegister />
          <FeatureShowcase />
          <BenefitGrid />
          <Pricing />
          <Testimonials />
          <TheProblemSolver />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </>
  );
}