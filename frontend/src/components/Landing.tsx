import BenefitGrid from "./landing-page/BenefitGrid";
import FAQ from "./landing-page/FAQ";
import FeatureShowcase from "./landing-page/FeatureShowcase";
import FinalCTA from "./landing-page/FinalCta";
import Footer from "./landing-page/Footer";
import Header from "./landing-page/header";
import Hero from "./landing-page/hero";
import HowItWorks from "./landing-page/HowItWorks";
import HowToRegister from "./landing-page/HowToRegister";
import Pricing from "./landing-page/Pricing";
import Testimonials from "./landing-page/Testimonial";
import TheProblemSolver from "./landing-page/TheProblemSolver";
import "../Landing.css";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-bricolage text-text-dark selection:bg-primary-orange selection:text-white">
      <Header />
      <main className="flex flex-col gap-6 lg:gap-12 px-2 md:px-6 pt-24 md:pt-32 pb-12 overflow-hidden max-w-[1600px] mx-auto">
        <Hero />
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
  );
}
