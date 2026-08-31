export function getTranslations(locale?: string) {
  return {
    hero: {
      title: "No Idea Should Be Lost.",
      description: "TechIT Network is an AI-powered execution infrastructure for creating, validating, building, and growing startups.",
      buttonText: "Start Building",
      buttonHref: "/auth/signup",
      imageSrc: "/mockup/laptop.png",
      imageAlt: "TechIT Dashboard"
    },
    howItWorks: {
      badge: "How It Works",
      title: "Simple & Powerful",
      description: "From concept to company in three easy steps.",
      steps: [
        { title: "Ideate", description: "Capture your vision and structure your thoughts instantly." },
        { title: "Validate", description: "Challenge your assumptions with real-time market data." },
        { title: "Execute", description: "Turn insights into action with AI-guided workflows." }
      ]
    },
    howToRegister: {
      badge: "Get Started",
      title: "Begin Your Journey",
      description: "Join the network of founders and builders transforming their ideas into reality.",
      steps: [
        { title: "Create Account", description: "Sign up securely in seconds.", imageAlt: "Sign up" },
        { title: "Set Your Goals", description: "Tell us what you're building.", imageAlt: "Set goals" },
        { title: "Launch", description: "Let the AI guide you to success.", imageAlt: "Launch" }
      ]
    },
    pricing: {
      badge: "Pricing",
      title: "Invest in Your Idea",
      description: "Simple, transparent pricing for founders at every stage.",
      monthlyLabel: "Monthly",
      yearlyLabel: "Yearly",
      popularLabel: "Most Popular",
      monthSuffix: "/mo",
      yearSuffix: "/yr",
      hardwareTitle: "Enterprise Add-ons",
      hardwareDescription: "Need dedicated infrastructure? We've got you covered.",
      standSuffix: "one-time",
      plans: [
        { name: "Explorer", tagline: "For the curious", popular: false, cta: "Start Free", features: ["Basic access", "Community support"] },
        { name: "Founder", tagline: "For the builders", popular: true, cta: "Get Started", features: ["Full platform access", "AI copilots", "Priority support"] },
        { name: "Enterprise", tagline: "For scaling teams", popular: false, cta: "Contact Sales", features: ["Custom integrations", "Dedicated account manager"] }
      ]
    },
    testimonials: {
      badge: "Community",
      title: "Built by Founders, For Founders",
      testimonials: [
        { quote: "TechIT changed how I validate my startup ideas.", initials: "JD", name: "Jane Doe", role: "CEO, TechFlow" },
        { quote: "The AI companion is like having a co-founder.", initials: "JS", name: "John Smith", role: "Founder, InnovateX" }
      ]
    },
    problemSolver: {
      title: "Don't let lack of execution hold you back.",
      buttonText: "Join TechIT Network"
    },
    header: {
      logoText: "TechIT",
      navLinks: [
        { label: "Features", href: "#features" },
        { label: "How it works", href: "#how-it-works" },
        { label: "Pricing", href: "#pricing" }
      ],
      loginButton: "Log In",
      registerButton: "Sign Up"
    },
    footer: {
      description: "TechIT Network is an AI-powered execution infrastructure for creating, validating, building, and growing startups.",
      productTitle: "Product",
      productLinks: [{ label: "Features", href: "#" }, { label: "Pricing", href: "#" }],
      companyTitle: "Company",
      companyLinks: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }],
      supportTitle: "Support",
      location: "San Francisco, CA",
      copyright: "TechIT Network. All rights reserved.",
      poweredBy: "Powered by Innovation"
    },
    finalCta: {
      badge: "Ready?",
      title: "Start Building Today",
      description: "Join thousands of founders making their ideas a reality.",
      buttonText: "Create Free Account",
      imageAlt: "TechIT Platform"
    },
    faq: {
      badge: "FAQ",
      title: "Got Questions?",
      faqs: [
        { q: "What is TechIT?", a: "TechIT is an AI execution platform for startups." },
        { q: "Is there a free tier?", a: "Yes, you can explore the platform as an Explorer for free." }
      ]
    },
    benefitGrid: {
      badge: "Benefits",
      title: "Why Choose TechIT",
      description: "Everything you need to succeed in one place.",
      benefits: [
        { title: "AI Intelligence", description: "Automate your research and validation." },
        { title: "Real-time Metrics", description: "Track your startup's health instantly." },
        { title: "Expert Network", description: "Connect with investors and collaborators." }
      ]
    }
  };
}
