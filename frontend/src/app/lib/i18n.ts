import type { LocaleCode } from "@/contexts/LocaleContext";

type Translations = {
  hero: {
    title: string;
    description: string;
    buttonText: string;
    buttonHref: string;
    imageSrc: string;
    imageAlt: string;
  };
  howItWorks: {
    badge: string;
    title: string;
    description: string;
    steps: { title: string; description: string }[];
  };
  howToRegister: {
    badge: string;
    title: string;
    description: string;
    steps: { title: string; description: string; imageAlt: string }[];
    buttonText: string;
  };
  pricing: {
    badge: string;
    title: string;
    description: string;
    monthlyLabel: string;
    yearlyLabel: string;
    popularLabel: string;
    monthSuffix: string;
    yearSuffix: string;
    hardwareTitle: string;
    hardwareDescription: string;
    standSuffix: string;
    plans: { name: string; tagline: string; popular: boolean; cta: string; features: string[] }[];
  };
  login: {
    title: string;
    subtitle: string;
    noAccount: string;
    signupLink: string;
    emailLabel: string;
    emailPlaceholder: string;
    passLabel: string;
    forgot: string;
    passPlaceholder: string;
    btn: string;
  };
  signup: {
    title: string;
    subtitle: string;
    haveAccount: string;
    loginLink: string;
    step1: string;
    namePlaceholder: string;
    continueBtn: string;
    step2: string;
    emailPlaceholder: string;
    passPlaceholder: string;
  };
  notFound: {
    title: string;
    subtitle: string;
    goBack: string;
    goHome: string;
    lookingFor: string;
    explore: string;
    landing: string;
    support: string;
  };
  testimonials: {
    badge: string;
    title: string;
    description: string;
    testimonials: { quote: string; initials: string; name: string; role: string; color: string }[];
  };
  featureShowcase: {
    badge: string;
    title: string;
    description: string;
    features: { title: string; description: string }[];
  };
  faq: {
    badge: string;
    title: string;
    description: string;
    categories: { category: string; questions: { q: string; a: string }[] }[];
  };
  problemSolver: { title: string; buttonText: string };
  header: {
    logoText: string;
    navLinks: { label: string; href: string }[];
    loginButton: string;
    registerButton: string;
  };
  footer: {
    description: string;
    productTitle: string;
    productLinks: { label: string; href: string }[];
    companyTitle: string;
    companyLinks: { label: string; href: string }[];
    supportTitle: string;
    location: string;
    copyright: string;
    poweredBy: string;
  };
  finalCta: { badge: string; title: string; description: string; buttonText: string; imageAlt: string };
  benefitGrid: {
    badge: string;
    title: string;
    description: string;
    benefits: { title: string; description: string }[];
  };
};

const translations: Record<LocaleCode, Translations> = {
  en: {
hero: {
      title: "No Idea Should Be Lost.",
      description: "TechIT Network is an AI-powered execution infrastructure for creating, validating, building, and growing startups.",
      buttonText: "Start Building",
      buttonHref: "/signup",
      imageSrc: "/mockup/laptop.png",
      imageAlt: "TechIT Dashboard",
    },
    howItWorks: {
      badge: "How It Works",
      title: "Simple & Powerful",
      description: "From concept to company in three easy steps.",
      steps: [
        { title: "Ideate", description: "Capture your vision and structure your thoughts instantly." },
        { title: "Validate", description: "Challenge your assumptions with real-time market data." },
        { title: "Execute", description: "Turn insights into action with AI-guided workflows." },
      ],
    },
    howToRegister: {
      badge: "Get Started",
      title: "Begin Your Journey",
      description: "Join the network of founders and builders transforming their ideas into reality.",
      steps: [
        { title: "Create Account", description: "Sign up securely in seconds.", imageAlt: "Sign up" },
        { title: "Set Your Goals", description: "Tell us what you're building.", imageAlt: "Set goals" },
        { title: "Launch", description: "Let the AI guide you to success.", imageAlt: "Launch" },
      ],
      buttonText: "Get Started",
    },
    pricing: {
      badge: "Pricing", title: "Invest in Your Idea", description: "Simple, transparent pricing for founders at every stage.",
      monthlyLabel: "Monthly", yearlyLabel: "Yearly", popularLabel: "Most Popular",
      monthSuffix: "/mo", yearSuffix: "/yr", hardwareTitle: "Enterprise Add-ons",
      hardwareDescription: "Need dedicated infrastructure? We've got you covered.", standSuffix: "one-time",
      plans: [
        { name: "Explorer", tagline: "For the curious", popular: false, cta: "Start Free", features: ["Basic access", "Community support"] },
        { name: "Founder", tagline: "For the builders", popular: true, cta: "Get Started", features: ["Full platform access", "AI copilots", "Priority support"] },
        { name: "Enterprise", tagline: "For scaling teams", popular: false, cta: "Contact Sales", features: ["Custom integrations", "Dedicated account manager"] },
      ],
    },
    login: {"title": "Welcome Back", "subtitle": "Log in to continue building your startup.", "noAccount": "Don't have an account?", "signupLink": "Sign up", "emailLabel": "Email Address", "emailPlaceholder": "you@example.com", "passLabel": "Password", "forgot": "Forgot password?", "passPlaceholder": "Enter your password", "btn": "Log In"},
    signup: {"title": "Create Your Account", "subtitle": "Join thousands of founders building the future.", "haveAccount": "Already have an account?", "loginLink": "Log in", "step1": "Personal Details", "namePlaceholder": "John Doe", "continueBtn": "Continue", "step2": "Account Details", "emailPlaceholder": "you@example.com", "passPlaceholder": "Create a password"},
    notFound: {"title": "Page Not Found", "subtitle": "We couldn't find the page you were looking for.", "goBack": "Go Back", "goHome": "Go Home", "lookingFor": "Looking for something else?", "explore": "Explore these links to find what you need.", "landing": "Landing Page", "support": "Support & FAQ"},
    featureShowcase: {"badge": "Power Features", "title": "Everything you need.<br/>Nothing you don't.", "description": "We've stripped away the complexity of building a startup and left only the essential tools you need to succeed.", "features": [{"title": "Lightning Fast Execution", "description": "Go from idea to prototype in record time with AI assistance."}, {"title": "Enterprise Grade Security", "description": "Your intellectual property is protected at every step of the journey."}, {"title": "Scale Without Limits", "description": "Infrastructure that grows with you from day one to IPO."}]},
    testimonials: {"badge": "Community", "title": "Built by Founders, For Founders", "description": "Don't just take our word for it. Hear from the founders and investors who are already transforming their ideas into reality on TechIT.", "testimonials": [{"quote": "TechIT changed how I validate my startup ideas. What used to take months of research now happens in days.", "initials": "JD", "name": "Jane Doe", "role": "CEO, TechFlow", "color": "bg-[#0068ff]"}, {"quote": "The AI companion is like having a co-founder who never sleeps. It constantly challenges my assumptions in the best way possible.", "initials": "JS", "name": "John Smith", "role": "Founder, InnovateX", "color": "bg-[#20c907]"}, {"quote": "Finally, an execution platform that goes beyond task management. It actually helps me figure out what to build next.", "initials": "AL", "name": "Amanda Lee", "role": "Product Lead, Vertex", "color": "bg-[#58A6ff]"}, {"quote": "As an investor, the level of insight and structure TechIT provides to early-stage founders is unprecedented.", "initials": "MR", "name": "Michael Ross", "role": "Partner, Vision VC", "color": "bg-[#0068ff]"}]},
    faq: {"badge": "FAQ", "title": "Got Questions?", "description": "Everything you need to know about building your startup on TechIT.", "categories": [{"category": "General Platform Questions", "questions": [{"q": "What exactly is TechIT Network?", "a": "TechIT Network is an AI-powered execution infrastructure designed to help you create, validate, build, and grow startups."}, {"q": "How is TechIT different from a standard AI assistant?", "a": "TechIT is not just an AI assistant. It proactively understands your startup context, monitors progress, and determines exact next steps."}]}, {"category": "For Founders & Explorers", "questions": [{"q": "Do I need a fully formed startup or team to join?", "a": "No, you can join as an Explorer to discover ideas without committing. You can transition to a Founder later."}, {"q": "How does TechIT actually help me execute my idea?", "a": "The platform guides you through a structured pipeline: Ideate, Validate, Build, Execute, Connect, and Grow."}]}, {"category": "For Collaborators, Investors & Organizations", "questions": [{"q": "I have skills but no startup idea. Is this for me?", "a": "Yes, as a Collaborator, you can discover startups where your skills are needed and grow alongside them."}, {"q": "What value does TechIT provide to early-stage investors?", "a": "Investors gain deep intelligence into emerging startups, founder execution, and growth potential."}, {"q": "Can accelerator programs or startup organizations use the platform?", "a": "Yes, Organizations can use TechIT to support entrepreneurs and manage cohorts."}]}]},
    problemSolver: { title: "Don't let lack of execution hold you back.", buttonText: "Join TechIT Network" },
    header: {
      logoText: "TechIT",
      navLinks: [{ label: "Features", href: "#features" }, { label: "How it works", href: "#how-it-works" }, { label: "Pricing", href: "#pricing" }],
      loginButton: "Log In", registerButton: "Sign Up",
    },
    footer: {
      description: "TechIT Network is an AI-powered execution infrastructure for startups.",
      productTitle: "Product", productLinks: [{ label: "Features", href: "#" }, { label: "Pricing", href: "#" }],
      companyTitle: "Company", companyLinks: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }],
      supportTitle: "Support", location: "San Francisco, CA",
      copyright: "TechIT Network. All rights reserved.", poweredBy: "Powered by Innovation",
    },
    finalCta: { badge: "Ready?", title: "Start Building Today", description: "Join thousands of founders making their ideas a reality.", buttonText: "Create Free Account", imageAlt: "TechIT Platform" },
    benefitGrid: {
      badge: "Benefits", title: "Why Choose TechIT", description: "Everything you need to succeed in one place.",
      benefits: [
        { title: "AI Intelligence", description: "Automate your research and validation." },
        { title: "Real-time Metrics", description: "Track your startup's health instantly." },
        { title: "Expert Network", description: "Connect with investors and collaborators." },
      ],
    },
  },

  es: {
hero: {
      title: "No Idea Should Be Lost.",
      description: "TechIT Network is an AI-powered execution infrastructure for creating, validating, building, and growing startups.",
      buttonText: "Start Building",
      buttonHref: "/signup",
      imageSrc: "/mockup/laptop.png",
      imageAlt: "TechIT Dashboard",
    },
    howItWorks: {
      badge: "How It Works",
      title: "Simple & Powerful",
      description: "From concept to company in three easy steps.",
      steps: [
        { title: "Ideate", description: "Capture your vision and structure your thoughts instantly." },
        { title: "Validate", description: "Challenge your assumptions with real-time market data." },
        { title: "Execute", description: "Turn insights into action with AI-guided workflows." },
      ],
    },
    howToRegister: {
      badge: "Comenzar",
      title: "Inicia Tu Viaje",
      description: "Únete a la red de fundadores y constructores que transforman sus ideas en realidad.",
      steps: [
        {
          title: "Crear Cuenta",
          description: "Regístrate de forma segura en segundos.",
          imageAlt: "Registrarse"
        },
        {
          title: "Define Tus Objetivos",
          description: "Cuéntanos qué estás construyendo.",
          imageAlt: "Definir objetivos"
        },
        {
          title: "Lanzar",
          description: "Deja que la IA te guíe hacia el éxito.",
          imageAlt: "Lanzar"
        }
      ],
      buttonText: "Comenzar"
    },
    pricing: {
      badge: "Pricing", title: "Invest in Your Idea", description: "Simple, transparent pricing for founders at every stage.",
      monthlyLabel: "Monthly", yearlyLabel: "Yearly", popularLabel: "Most Popular",
      monthSuffix: "/mo", yearSuffix: "/yr", hardwareTitle: "Enterprise Add-ons",
      hardwareDescription: "Need dedicated infrastructure? We've got you covered.", standSuffix: "one-time",
      plans: [
        { name: "Explorer", tagline: "For the curious", popular: false, cta: "Start Free", features: ["Basic access", "Community support"] },
        { name: "Founder", tagline: "For the builders", popular: true, cta: "Comenzar", features: ["Full platform access", "AI copilots", "Priority support"] },
        { name: "Enterprise", tagline: "For scaling teams", popular: false, cta: "Contact Sales", features: ["Custom integrations", "Dedicated account manager"] },
      ],
    },
    login: {"title": "Welcome Back", "subtitle": "Log in to continue building your startup.", "noAccount": "Don't have an account?", "signupLink": "Sign up", "emailLabel": "Email Address", "emailPlaceholder": "you@example.com", "passLabel": "Password", "forgot": "Forgot password?", "passPlaceholder": "Enter your password", "btn": "Log In"},
    signup: {"title": "Create Your Account", "subtitle": "Join thousands of founders building the future.", "haveAccount": "Already have an account?", "loginLink": "Log in", "step1": "Personal Details", "namePlaceholder": "John Doe", "continueBtn": "Continue", "step2": "Account Details", "emailPlaceholder": "you@example.com", "passPlaceholder": "Create a password"},
    notFound: {"title": "Page Not Found", "subtitle": "We couldn't find the page you were looking for.", "goBack": "Go Back", "goHome": "Go Home", "lookingFor": "Looking for something else?", "explore": "Explore these links to find what you need.", "landing": "Landing Page", "support": "Support & FAQ"},
    featureShowcase: {
      badge: "Funciones Potentes",
      title: "Todo lo que necesitas.<br/>Nada que no.",
      description: "Hemos eliminado la complejidad de crear una startup y dejado solo las herramientas esenciales que necesitas para triunfar.",
      features: [
        {
          title: "Ejecución Ultrarrápida",
          description: "Pasa de la idea al prototipo en tiempo récord con asistencia de IA."
        },
        {
          title: "Seguridad de Nivel Empresarial",
          description: "Tu propiedad intelectual está protegida en cada paso del camino."
        },
        {
          title: "Escala Sin Límites",
          description: "Infraestructura que crece contigo desde el día uno hasta la salida a bolsa."
        }
      ]
    },
    testimonials: {
      badge: "Comunidad",
      title: "Creado por Fundadores, Para Fundadores",
      description: "No confíes solo en nuestra palabra. Escucha a los fundadores e inversores que ya están transformando sus ideas en realidad en TechIT.",
      testimonials: [
        {
          quote: "TechIT cambió la forma en que valido mis ideas de startup. Lo que antes tomaba meses de investigación ahora ocurre en días.",
          initials: "JD",
          name: "Jane Doe",
          role: "CEO, TechFlow",
          color: "bg-[#0068ff]"
        },
        {
          quote: "El compañero de IA es como tener un cofundador que nunca duerme. Desafía mis suposiciones de la mejor manera posible.",
          initials: "JS",
          name: "John Smith",
          role: "Fundador, InnovateX",
          color: "bg-[#20c907]"
        },
        {
          quote: "Por fin, una plataforma de ejecución que va más allá de la gestión de tareas. Realmente me ayuda a decidir qué construir a continuación.",
          initials: "AL",
          name: "Amanda Lee",
          role: "Líder de Producto, Vertex",
          color: "bg-[#58A6ff]"
        },
        {
          quote: "Como inversor, el nivel de información y estructura que TechIT ofrece a los fundadores en etapa temprana es sin precedentes.",
          initials: "MR",
          name: "Michael Ross",
          role: "Socio, Vision VC",
          color: "bg-[#0068ff]"
        }
      ]
    },
    faq: {
      badge: "Preguntas Frecuentes",
      title: "¿Tienes Preguntas?",
      description: "Todo lo que necesitas saber sobre construir tu startup en TechIT.",
      categories: [
        {
          category: "Preguntas Generales de la Plataforma",
          questions: [
            {
              q: "¿Qué es exactamente TechIT Network?",
              a: "TechIT Network es una infraestructura de ejecución impulsada por IA diseñada para ayudarte a crear, validar, construir y hacer crecer startups."
            },
            {
              q: "¿En qué se diferencia TechIT de un asistente de IA estándar?",
              a: "TechIT no es solo un asistente de IA. Comprende proactivamente el contexto de tu startup, monitorea el progreso y determina los próximos pasos exactos."
            }
          ]
        },
        {
          category: "Para Fundadores y Exploradores",
          questions: [
            {
              q: "¿Necesito una startup o equipo completamente formado para unirme?",
              a: "No, puedes unirte como Explorador para descubrir ideas sin comprometerte. Puedes convertirte en Fundador más adelante."
            },
            {
              q: "¿Cómo me ayuda TechIT a ejecutar mi idea?",
              a: "La plataforma te guía a través de un pipeline estructurado: Idear, Validar, Construir, Ejecutar, Conectar y Crecer."
            }
          ]
        },
        {
          category: "Para Colaboradores, Inversores y Organizaciones",
          questions: [
            {
              q: "Tengo habilidades pero no una idea de startup. ¿Esto es para mí?",
              a: "Sí, como Colaborador, puedes descubrir startups donde se necesitan tus habilidades y crecer junto a ellas."
            },
            {
              q: "¿Qué valor proporciona TechIT a los inversores en etapa temprana?",
              a: "Los inversores obtienen información profunda sobre startups emergentes, la ejecución de los fundadores y el potencial de crecimiento."
            },
            {
              q: "¿Pueden los programas de aceleración u organizaciones de startups usar la plataforma?",
              a: "Sí, las Organizaciones pueden usar TechIT para apoyar emprendedores y gestionar cohortes."
            }
          ]
        }
      ]
    },
    problemSolver: { title: "Don't let lack of execution hold you back.", buttonText: "Join TechIT Network" },
    header: {
      logoText: "TechIT",
      navLinks: [{ label: "Funciones", href: "#features" }, { label: "Cómo funciona", href: "#how-it-works" }, { label: "Precios", href: "#pricing" }],
      loginButton: "Log In", registerButton: "Sign Up",
    },
    footer: {
      description: "TechIT Network es una infraestructura de ejecución impulsada por IA para startups.",
      productTitle: "Product", productLinks: [{ label: "Features", href: "#" }, { label: "Pricing", href: "#" }],
      companyTitle: "Company", companyLinks: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }],
      supportTitle: "Support", location: "San Francisco, CA",
      copyright: "TechIT Network. All rights reserved.", poweredBy: "Powered by Innovation",
    },
    finalCta: { badge: "Ready?", title: "Start Building Today", description: "Join thousands of founders making their ideas a reality.", buttonText: "Create Free Account", imageAlt: "TechIT Platform" },
    benefitGrid: {
      badge: "Benefits", title: "Why Choose TechIT", description: "Everything you need to succeed in one place.",
      benefits: [
        { title: "AI Intelligence", description: "Automate your research and validation." },
        { title: "Real-time Metrics", description: "Track your startup's health instantly." },
        { title: "Expert Network", description: "Connect with investors and collaborators." },
      ],
    },
  },

  fr: {
hero: {
      title: "No Idea Should Be Lost.",
      description: "TechIT Network is an AI-powered execution infrastructure for creating, validating, building, and growing startups.",
      buttonText: "Start Building",
      buttonHref: "/signup",
      imageSrc: "/mockup/laptop.png",
      imageAlt: "TechIT Dashboard",
    },
    howItWorks: {
      badge: "How It Works",
      title: "Simple & Powerful",
      description: "From concept to company in three easy steps.",
      steps: [
        { title: "Ideate", description: "Capture your vision and structure your thoughts instantly." },
        { title: "Validate", description: "Challenge your assumptions with real-time market data." },
        { title: "Execute", description: "Turn insights into action with AI-guided workflows." },
      ],
    },
    howToRegister: {
      badge: "Commencer",
      title: "Commencez Votre Parcours",
      description: "Rejoignez le réseau de fondateurs et de bâtisseurs qui transforment leurs idées en réalité.",
      steps: [
        {
          title: "Créer un Compte",
          description: "Inscrivez-vous en toute sécurité en quelques secondes.",
          imageAlt: "S'inscrire"
        },
        {
          title: "Définir Vos Objectifs",
          description: "Dites-nous ce que vous construisez.",
          imageAlt: "Définir les objectifs"
        },
        {
          title: "Lancer",
          description: "Laissez l'IA vous guider vers le succès.",
          imageAlt: "Lancer"
        }
      ],
      buttonText: "Commencer"
    },
    pricing: {
      badge: "Pricing", title: "Invest in Your Idea", description: "Simple, transparent pricing for founders at every stage.",
      monthlyLabel: "Monthly", yearlyLabel: "Yearly", popularLabel: "Most Popular",
      monthSuffix: "/mo", yearSuffix: "/yr", hardwareTitle: "Enterprise Add-ons",
      hardwareDescription: "Need dedicated infrastructure? We've got you covered.", standSuffix: "one-time",
      plans: [
        { name: "Explorer", tagline: "For the curious", popular: false, cta: "Start Free", features: ["Basic access", "Community support"] },
        { name: "Founder", tagline: "For the builders", popular: true, cta: "Commencer", features: ["Full platform access", "AI copilots", "Priority support"] },
        { name: "Enterprise", tagline: "For scaling teams", popular: false, cta: "Contact Sales", features: ["Custom integrations", "Dedicated account manager"] },
      ],
    },
    login: {"title": "Welcome Back", "subtitle": "Log in to continue building your startup.", "noAccount": "Don't have an account?", "signupLink": "Sign up", "emailLabel": "Email Address", "emailPlaceholder": "you@example.com", "passLabel": "Password", "forgot": "Forgot password?", "passPlaceholder": "Enter your password", "btn": "Log In"},
    signup: {"title": "Create Your Account", "subtitle": "Join thousands of founders building the future.", "haveAccount": "Already have an account?", "loginLink": "Log in", "step1": "Personal Details", "namePlaceholder": "John Doe", "continueBtn": "Continue", "step2": "Account Details", "emailPlaceholder": "you@example.com", "passPlaceholder": "Create a password"},
    notFound: {"title": "Page Not Found", "subtitle": "We couldn't find the page you were looking for.", "goBack": "Go Back", "goHome": "Go Home", "lookingFor": "Looking for something else?", "explore": "Explore these links to find what you need.", "landing": "Landing Page", "support": "Support & FAQ"},
    featureShowcase: {
      badge: "Fonctionnalités Puissantes",
      title: "Tout ce dont vous avez besoin.<br/>Rien de superflu.",
      description: "Nous avons éliminé la complexité de la création d'une startup et ne gardé que les outils essentiels pour réussir.",
      features: [
        {
          title: "Exécution Ultra-Rapide",
          description: "Passez de l'idée au prototype en un temps record avec l'assistance de l'IA."
        },
        {
          title: "Sécurité de Niveau Entreprise",
          description: "Votre propriété intellectuelle est protégée à chaque étape du parcours."
        },
        {
          title: "Évoluez Sans Limites",
          description: "Une infrastructure qui grandit avec vous du premier jour jusqu'à l'introduction en bourse."
        }
      ]
    },
    testimonials: {
      badge: "Communauté",
      title: "Conçu par des Fondateurs, Pour des Fondateurs",
      description: "Ne nous croyez pas sur parole. Écoutez les fondateurs et investisseurs qui transforment déjà leurs idées en réalité sur TechIT.",
      testimonials: [
        {
          quote: "TechIT a changé ma façon de valider mes idées de startup. Ce qui prenait des mois de recherche se fait maintenant en quelques jours.",
          initials: "JD",
          name: "Jane Doe",
          role: "PDG, TechFlow",
          color: "bg-[#0068ff]"
        },
        {
          quote: "Le compagnon IA, c'est comme avoir un cofondateur qui ne dort jamais. Il remet constamment en question mes hypothèses de la meilleure façon.",
          initials: "JS",
          name: "John Smith",
          role: "Fondateur, InnovateX",
          color: "bg-[#20c907]"
        },
        {
          quote: "Enfin une plateforme d'exécution qui va au-delà de la gestion des tâches. Elle m'aide vraiment à savoir quoi construire ensuite.",
          initials: "AL",
          name: "Amanda Lee",
          role: "Responsable Produit, Vertex",
          color: "bg-[#58A6ff]"
        },
        {
          quote: "En tant qu'investisseur, le niveau d'informations et de structure que TechIT apporte aux fondateurs en phase précoce est sans précédent.",
          initials: "MR",
          name: "Michael Ross",
          role: "Associé, Vision VC",
          color: "bg-[#0068ff]"
        }
      ]
    },
    faq: {
      badge: "FAQ",
      title: "Des Questions ?",
      description: "Tout ce que vous devez savoir pour construire votre startup sur TechIT.",
      categories: [
        {
          category: "Questions Générales sur la Plateforme",
          questions: [
            {
              q: "Qu'est-ce que TechIT Network exactement ?",
              a: "TechIT Network est une infrastructure d'exécution alimentée par l'IA conçue pour vous aider à créer, valider, construire et développer des startups."
            },
            {
              q: "En quoi TechIT diffère-t-il d'un assistant IA standard ?",
              a: "TechIT n'est pas qu'un assistant IA. Il comprend proactivement le contexte de votre startup, suit les progrès et détermine les prochaines étapes exactes."
            }
          ]
        },
        {
          category: "Pour les Fondateurs et Explorateurs",
          questions: [
            {
              q: "Ai-je besoin d'une startup ou d'une équipe complète pour rejoindre ?",
              a: "Non, vous pouvez rejoindre en tant qu'Explorateur pour découvrir des idées sans engagement. Vous pourrez devenir Fondateur plus tard."
            },
            {
              q: "Comment TechIT m'aide-t-il à exécuter mon idée ?",
              a: "La plateforme vous guide à travers un pipeline structuré : Idéer, Valider, Construire, Exécuter, Connecter et Grandir."
            }
          ]
        },
        {
          category: "Pour les Collaborateurs, Investisseurs et Organisations",
          questions: [
            {
              q: "J'ai des compétences mais pas d'idée de startup. Est-ce pour moi ?",
              a: "Oui, en tant que Collaborateur, vous pouvez découvrir des startups qui ont besoin de vos compétences et grandir avec elles."
            },
            {
              q: "Quelle valeur TechIT apporte-t-il aux investisseurs en phase précoce ?",
              a: "Les investisseurs obtiennent une intelligence approfondie sur les startups émergentes, l'exécution des fondateurs et le potentiel de croissance."
            },
            {
              q: "Les programmes d'accélération ou organisations startup peuvent-ils utiliser la plateforme ?",
              a: "Oui, les Organisations peuvent utiliser TechIT pour soutenir les entrepreneurs et gérer des cohortes."
            }
          ]
        }
      ]
    },
    problemSolver: { title: "Don't let lack of execution hold you back.", buttonText: "Join TechIT Network" },
    header: {
      logoText: "TechIT",
      navLinks: [{ label: "Features", href: "#features" }, { label: "How it works", href: "#how-it-works" }, { label: "Pricing", href: "#pricing" }],
      loginButton: "Log In", registerButton: "Sign Up",
    },
    footer: {
      description: "TechIT Network is an AI-powered execution infrastructure for startups.",
      productTitle: "Product", productLinks: [{ label: "Features", href: "#" }, { label: "Pricing", href: "#" }],
      companyTitle: "Company", companyLinks: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }],
      supportTitle: "Support", location: "San Francisco, CA",
      copyright: "TechIT Network. All rights reserved.", poweredBy: "Powered by Innovation",
    },
    finalCta: { badge: "Ready?", title: "Start Building Today", description: "Join thousands of founders making their ideas a reality.", buttonText: "Create Free Account", imageAlt: "TechIT Platform" },
    benefitGrid: {
      badge: "Benefits", title: "Why Choose TechIT", description: "Everything you need to succeed in one place.",
      benefits: [
        { title: "AI Intelligence", description: "Automate your research and validation." },
        { title: "Real-time Metrics", description: "Track your startup's health instantly." },
        { title: "Expert Network", description: "Connect with investors and collaborators." },
      ],
    },
  },

  zh: {
hero: {
      title: "No Idea Should Be Lost.",
      description: "TechIT Network is an AI-powered execution infrastructure for creating, validating, building, and growing startups.",
      buttonText: "Start Building",
      buttonHref: "/signup",
      imageSrc: "/mockup/laptop.png",
      imageAlt: "TechIT Dashboard",
    },
    howItWorks: {
      badge: "How It Works",
      title: "Simple & Powerful",
      description: "From concept to company in three easy steps.",
      steps: [
        { title: "Ideate", description: "Capture your vision and structure your thoughts instantly." },
        { title: "Validate", description: "Challenge your assumptions with real-time market data." },
        { title: "Execute", description: "Turn insights into action with AI-guided workflows." },
      ],
    },
    howToRegister: {
      badge: "立即开始",
      title: "开启您的旅程",
      description: "加入创始人和建设者网络，将创意变为现实。",
      steps: [
        {
          title: "创建账户",
          description: "几秒钟内安全注册。",
          imageAlt: "注册"
        },
        {
          title: "设定目标",
          description: "告诉我们您正在构建什么。",
          imageAlt: "设定目标"
        },
        {
          title: "启动",
          description: "让人工智能引导您走向成功。",
          imageAlt: "启动"
        }
      ],
      buttonText: "立即开始"
    },
    pricing: {
      badge: "Pricing", title: "Invest in Your Idea", description: "Simple, transparent pricing for founders at every stage.",
      monthlyLabel: "Monthly", yearlyLabel: "Yearly", popularLabel: "Most Popular",
      monthSuffix: "/mo", yearSuffix: "/yr", hardwareTitle: "Enterprise Add-ons",
      hardwareDescription: "Need dedicated infrastructure? We've got you covered.", standSuffix: "one-time",
      plans: [
        { name: "Explorer", tagline: "For the curious", popular: false, cta: "Start Free", features: ["Basic access", "Community support"] },
        { name: "Founder", tagline: "For the builders", popular: true, cta: "立即开始", features: ["Full platform access", "AI copilots", "Priority support"] },
        { name: "Enterprise", tagline: "For scaling teams", popular: false, cta: "Contact Sales", features: ["Custom integrations", "Dedicated account manager"] },
      ],
    },
    login: {"title": "Welcome Back", "subtitle": "Log in to continue building your startup.", "noAccount": "Don't have an account?", "signupLink": "Sign up", "emailLabel": "Email Address", "emailPlaceholder": "you@example.com", "passLabel": "Password", "forgot": "Forgot password?", "passPlaceholder": "Enter your password", "btn": "Log In"},
    signup: {"title": "Create Your Account", "subtitle": "Join thousands of founders building the future.", "haveAccount": "Already have an account?", "loginLink": "Log in", "step1": "Personal Details", "namePlaceholder": "John Doe", "continueBtn": "Continue", "step2": "Account Details", "emailPlaceholder": "you@example.com", "passPlaceholder": "Create a password"},
    notFound: {"title": "Page Not Found", "subtitle": "We couldn't find the page you were looking for.", "goBack": "Go Back", "goHome": "Go Home", "lookingFor": "Looking for something else?", "explore": "Explore these links to find what you need.", "landing": "Landing Page", "support": "Support & FAQ"},
    featureShowcase: {
      badge: "强大功能",
      title: "您所需的一切。<br/>没有多余的负担。",
      description: "我们消除了创建初创公司的复杂性，只保留您成功所需的基本工具。",
      features: [
        {
          title: "闪电般快速执行",
          description: "在人工智能的协助下，以创纪录的速度从想法到原型。"
        },
        {
          title: "企业级安全",
          description: "您的知识产权在每一步都得到保护。"
        },
        {
          title: "无限扩展",
          description: "从第一天到IPO，与您共同成长的基础设施。"
        }
      ]
    },
    testimonials: {
      badge: "社区",
      title: "由创始人打造，为创始人服务",
      description: "不要只听我们的一面之词。听听已经在 TechIT 上将创意变为现实的创始人和投资者的声音。",
      testimonials: [
        {
          quote: "TechIT 改变了我验证创业想法的方式。过去需要数月的研究现在只需数天。",
          initials: "JD",
          name: "Jane Doe",
          role: "CEO，TechFlow",
          color: "bg-[#0068ff]"
        },
        {
          quote: "AI 伙伴就像拥有一个从不睡觉的联合创始人。它以最积极的方式不断挑战我的假设。",
          initials: "JS",
          name: "John Smith",
          role: "创始人，InnovateX",
          color: "bg-[#20c907]"
        },
        {
          quote: "终于有一个超越任务管理的执行平台。它真正帮助我确定下一步该构建什么。",
          initials: "AL",
          name: "Amanda Lee",
          role: "产品负责人，Vertex",
          color: "bg-[#58A6ff]"
        },
        {
          quote: "作为投资者，TechIT 为早期创始人提供的洞察力和结构是前所未有的。",
          initials: "MR",
          name: "Michael Ross",
          role: "合伙人，Vision VC",
          color: "bg-[#0068ff]"
        }
      ]
    },
    faq: {
      badge: "常见问题",
      title: "有疑问？",
      description: "关于在 TechIT 上构建初创公司，您需要了解的一切。",
      categories: [
        {
          category: "平台一般问题",
          questions: [
            {
              q: "TechIT Network 到底是什么？",
              a: "TechIT Network 是一个由人工智能驱动的执行基础设施，旨在帮助您创建、验证、构建和发展初创公司。"
            },
            {
              q: "TechIT 与标准 AI 助手有何不同？",
              a: "TechIT 不仅仅是 AI 助手。它主动了解您的初创公司背景，监控进度，并确定确切的下一步。"
            }
          ]
        },
        {
          category: "面向创始人和探索者",
          questions: [
            {
              q: "我需要有一个完整的初创公司或团队才能加入吗？",
              a: "不需要，您可以作为探索者加入，在不承诺的情况下发现想法。您可以稍后转变为创始人。"
            },
            {
              q: "TechIT 如何真正帮助我执行我的想法？",
              a: "该平台通过结构化流程引导您：构思、验证、构建、执行、连接和成长。"
            }
          ]
        },
        {
          category: "面向合作者、投资者和组织",
          questions: [
            {
              q: "我有技能但没有创业想法。这适合我吗？",
              a: "是的，作为合作者，您可以发现需要您技能的初创公司，并与它们一起成长。"
            },
            {
              q: "TechIT 为早期投资者提供什么价值？",
              a: "投资者可以深入了解新兴初创公司、创始人的执行力和增长潜力。"
            },
            {
              q: "加速器项目或初创组织可以使用该平台吗？",
              a: "可以，组织可以使用 TechIT 支持创业者并管理批次。"
            }
          ]
        }
      ]
    },
    problemSolver: { title: "Don't let lack of execution hold you back.", buttonText: "Join TechIT Network" },
    header: {
      logoText: "TechIT",
      navLinks: [{ label: "Features", href: "#features" }, { label: "How it works", href: "#how-it-works" }, { label: "Pricing", href: "#pricing" }],
      loginButton: "Log In", registerButton: "Sign Up",
    },
    footer: {
      description: "TechIT Network is an AI-powered execution infrastructure for startups.",
      productTitle: "Product", productLinks: [{ label: "Features", href: "#" }, { label: "Pricing", href: "#" }],
      companyTitle: "Company", companyLinks: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }],
      supportTitle: "Support", location: "San Francisco, CA",
      copyright: "TechIT Network. All rights reserved.", poweredBy: "Powered by Innovation",
    },
    finalCta: { badge: "Ready?", title: "Start Building Today", description: "Join thousands of founders making their ideas a reality.", buttonText: "Create Free Account", imageAlt: "TechIT Platform" },
    benefitGrid: {
      badge: "Benefits", title: "Why Choose TechIT", description: "Everything you need to succeed in one place.",
      benefits: [
        { title: "AI Intelligence", description: "Automate your research and validation." },
        { title: "Real-time Metrics", description: "Track your startup's health instantly." },
        { title: "Expert Network", description: "Connect with investors and collaborators." },
      ],
    },
  },

  pt: {
hero: {
      title: "No Idea Should Be Lost.",
      description: "TechIT Network is an AI-powered execution infrastructure for creating, validating, building, and growing startups.",
      buttonText: "Start Building",
      buttonHref: "/signup",
      imageSrc: "/mockup/laptop.png",
      imageAlt: "TechIT Dashboard",
    },
    howItWorks: {
      badge: "How It Works",
      title: "Simple & Powerful",
      description: "From concept to company in three easy steps.",
      steps: [
        { title: "Ideate", description: "Capture your vision and structure your thoughts instantly." },
        { title: "Validate", description: "Challenge your assumptions with real-time market data." },
        { title: "Execute", description: "Turn insights into action with AI-guided workflows." },
      ],
    },
    howToRegister: {
      badge: "Começar",
      title: "Inicie Sua Jornada",
      description: "Junte-se à rede de fundadores e construtores que transformam suas ideias em realidade.",
      steps: [
        {
          title: "Criar Conta",
          description: "Cadastre-se com segurança em segundos.",
          imageAlt: "Cadastrar-se"
        },
        {
          title: "Defina Seus Objetivos",
          description: "Conte-nos o que você está construindo.",
          imageAlt: "Definir objetivos"
        },
        {
          title: "Lançar",
          description: "Deixe a IA guiá-lo ao sucesso.",
          imageAlt: "Lançar"
        }
      ],
      buttonText: "Começar"
    },
    pricing: {
      badge: "Pricing", title: "Invest in Your Idea", description: "Simple, transparent pricing for founders at every stage.",
      monthlyLabel: "Monthly", yearlyLabel: "Yearly", popularLabel: "Most Popular",
      monthSuffix: "/mo", yearSuffix: "/yr", hardwareTitle: "Enterprise Add-ons",
      hardwareDescription: "Need dedicated infrastructure? We've got you covered.", standSuffix: "one-time",
      plans: [
        { name: "Explorer", tagline: "For the curious", popular: false, cta: "Start Free", features: ["Basic access", "Community support"] },
        { name: "Founder", tagline: "For the builders", popular: true, cta: "Começar", features: ["Full platform access", "AI copilots", "Priority support"] },
        { name: "Enterprise", tagline: "For scaling teams", popular: false, cta: "Contact Sales", features: ["Custom integrations", "Dedicated account manager"] },
      ],
    },
    login: {"title": "Welcome Back", "subtitle": "Log in to continue building your startup.", "noAccount": "Don't have an account?", "signupLink": "Sign up", "emailLabel": "Email Address", "emailPlaceholder": "you@example.com", "passLabel": "Password", "forgot": "Forgot password?", "passPlaceholder": "Enter your password", "btn": "Log In"},
    signup: {"title": "Create Your Account", "subtitle": "Join thousands of founders building the future.", "haveAccount": "Already have an account?", "loginLink": "Log in", "step1": "Personal Details", "namePlaceholder": "John Doe", "continueBtn": "Continue", "step2": "Account Details", "emailPlaceholder": "you@example.com", "passPlaceholder": "Create a password"},
    notFound: {"title": "Page Not Found", "subtitle": "We couldn't find the page you were looking for.", "goBack": "Go Back", "goHome": "Go Home", "lookingFor": "Looking for something else?", "explore": "Explore these links to find what you need.", "landing": "Landing Page", "support": "Support & FAQ"},
    featureShowcase: {
      badge: "Recursos Poderosos",
      title: "Tudo o que você precisa.<br/>Nada do que não precisa.",
      description: "Eliminamos a complexidade de construir uma startup e deixamos apenas as ferramentas essenciais para o seu sucesso.",
      features: [
        {
          title: "Execução Ultrarrápida",
          description: "Vá da ideia ao protótipo em tempo recorde com assistência de IA."
        },
        {
          title: "Segurança de Nível Empresarial",
          description: "Sua propriedade intelectual está protegida em cada etapa da jornada."
        },
        {
          title: "Escale Sem Limites",
          description: "Infraestrutura que cresce com você do primeiro dia até o IPO."
        }
      ]
    },
    testimonials: {
      badge: "Comunidade",
      title: "Feito por Fundadores, Para Fundadores",
      description: "Não acredite apenas na nossa palavra. Ouça os fundadores e investidores que já estão transformando suas ideias em realidade no TechIT.",
      testimonials: [
        {
          quote: "O TechIT mudou a forma como valido minhas ideias de startup. O que levava meses de pesquisa agora acontece em dias.",
          initials: "JD",
          name: "Jane Doe",
          role: "CEO, TechFlow",
          color: "bg-[#0068ff]"
        },
        {
          quote: "O companheiro de IA é como ter um cofundador que nunca dorme. Ele constantemente desafia minhas suposições da melhor forma possível.",
          initials: "JS",
          name: "John Smith",
          role: "Fundador, InnovateX",
          color: "bg-[#20c907]"
        },
        {
          quote: "Finalmente, uma plataforma de execução que vai além da gestão de tarefas. Ela realmente me ajuda a decidir o que construir a seguir.",
          initials: "AL",
          name: "Amanda Lee",
          role: "Líder de Produto, Vertex",
          color: "bg-[#58A6ff]"
        },
        {
          quote: "Como investidor, o nível de insight e estrutura que o TechIT oferece aos fundadores em estágio inicial é sem precedentes.",
          initials: "MR",
          name: "Michael Ross",
          role: "Sócio, Vision VC",
          color: "bg-[#0068ff]"
        }
      ]
    },
    faq: {
      badge: "Perguntas Frequentes",
      title: "Tem Perguntas?",
      description: "Tudo o que você precisa saber sobre construir sua startup no TechIT.",
      categories: [
        {
          category: "Perguntas Gerais da Plataforma",
          questions: [
            {
              q: "O que exatamente é o TechIT Network?",
              a: "O TechIT Network é uma infraestrutura de execução alimentada por IA projetada para ajudá-lo a criar, validar, construir e crescer startups."
            },
            {
              q: "Como o TechIT é diferente de um assistente de IA padrão?",
              a: "O TechIT não é apenas um assistente de IA. Ele compreende proativamente o contexto da sua startup, monitora o progresso e determina os próximos passos exatos."
            }
          ]
        },
        {
          category: "Para Fundadores e Exploradores",
          questions: [
            {
              q: "Preciso de uma startup ou equipe totalmente formada para participar?",
              a: "Não, você pode participar como Explorador para descobrir ideias sem compromisso. Pode se tornar Fundador depois."
            },
            {
              q: "Como o TechIT realmente me ajuda a executar minha ideia?",
              a: "A plataforma guia você por um pipeline estruturado: Idear, Validar, Construir, Executar, Conectar e Crescer."
            }
          ]
        },
        {
          category: "Para Colaboradores, Investidores e Organizações",
          questions: [
            {
              q: "Tenho habilidades, mas não tenho ideia de startup. Isso é para mim?",
              a: "Sim, como Colaborador, você pode descobrir startups onde suas habilidades são necessárias e crescer junto com elas."
            },
            {
              q: "Que valor o TechIT oferece aos investidores em estágio inicial?",
              a: "Os investidores obtêm inteligência profunda sobre startups emergentes, execução dos fundadores e potencial de crescimento."
            },
            {
              q: "Programas de aceleração ou organizações de startups podem usar a plataforma?",
              a: "Sim, Organizações podem usar o TechIT para apoiar empreendedores e gerenciar cohorts."
            }
          ]
        }
      ]
    },
    problemSolver: { title: "Don't let lack of execution hold you back.", buttonText: "Join TechIT Network" },
    header: {
      logoText: "TechIT",
      navLinks: [{ label: "Features", href: "#features" }, { label: "How it works", href: "#how-it-works" }, { label: "Pricing", href: "#pricing" }],
      loginButton: "Log In", registerButton: "Sign Up",
    },
    footer: {
      description: "TechIT Network is an AI-powered execution infrastructure for startups.",
      productTitle: "Product", productLinks: [{ label: "Features", href: "#" }, { label: "Pricing", href: "#" }],
      companyTitle: "Company", companyLinks: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }],
      supportTitle: "Support", location: "San Francisco, CA",
      copyright: "TechIT Network. All rights reserved.", poweredBy: "Powered by Innovation",
    },
    finalCta: { badge: "Ready?", title: "Start Building Today", description: "Join thousands of founders making their ideas a reality.", buttonText: "Create Free Account", imageAlt: "TechIT Platform" },
    benefitGrid: {
      badge: "Benefits", title: "Why Choose TechIT", description: "Everything you need to succeed in one place.",
      benefits: [
        { title: "AI Intelligence", description: "Automate your research and validation." },
        { title: "Real-time Metrics", description: "Track your startup's health instantly." },
        { title: "Expert Network", description: "Connect with investors and collaborators." },
      ],
    },
  },

  ar: {
hero: {
      title: "No Idea Should Be Lost.",
      description: "TechIT Network is an AI-powered execution infrastructure for creating, validating, building, and growing startups.",
      buttonText: "Start Building",
      buttonHref: "/signup",
      imageSrc: "/mockup/laptop.png",
      imageAlt: "TechIT Dashboard",
    },
    howItWorks: {
      badge: "How It Works",
      title: "Simple & Powerful",
      description: "From concept to company in three easy steps.",
      steps: [
        { title: "Ideate", description: "Capture your vision and structure your thoughts instantly." },
        { title: "Validate", description: "Challenge your assumptions with real-time market data." },
        { title: "Execute", description: "Turn insights into action with AI-guided workflows." },
      ],
    },
    howToRegister: {
      badge: "ابدأ الآن",
      title: "ابدأ رحلتك",
      description: "انضم إلى شبكة المؤسسين والبناة الذين يحولون أفكارهم إلى واقع.",
      steps: [
        {
          title: "إنشاء حساب",
          description: "سجّل بأمان في ثوانٍ.",
          imageAlt: "التسجيل"
        },
        {
          title: "حدد أهدافك",
          description: "أخبرنا بما تبنيه.",
          imageAlt: "تحديد الأهداف"
        },
        {
          title: "الإطلاق",
          description: "دع الذكاء الاصطناعي يرشدك إلى النجاح.",
          imageAlt: "الإطلاق"
        }
      ],
      buttonText: "ابدأ الآن"
    },
    pricing: {
      badge: "Pricing", title: "Invest in Your Idea", description: "Simple, transparent pricing for founders at every stage.",
      monthlyLabel: "Monthly", yearlyLabel: "Yearly", popularLabel: "Most Popular",
      monthSuffix: "/mo", yearSuffix: "/yr", hardwareTitle: "Enterprise Add-ons",
      hardwareDescription: "Need dedicated infrastructure? We've got you covered.", standSuffix: "one-time",
      plans: [
        { name: "Explorer", tagline: "For the curious", popular: false, cta: "Start Free", features: ["Basic access", "Community support"] },
        { name: "Founder", tagline: "For the builders", popular: true, cta: "ابدأ الآن", features: ["Full platform access", "AI copilots", "Priority support"] },
        { name: "Enterprise", tagline: "For scaling teams", popular: false, cta: "Contact Sales", features: ["Custom integrations", "Dedicated account manager"] },
      ],
    },
    login: {"title": "Welcome Back", "subtitle": "Log in to continue building your startup.", "noAccount": "Don't have an account?", "signupLink": "Sign up", "emailLabel": "Email Address", "emailPlaceholder": "you@example.com", "passLabel": "Password", "forgot": "Forgot password?", "passPlaceholder": "Enter your password", "btn": "Log In"},
    signup: {"title": "Create Your Account", "subtitle": "Join thousands of founders building the future.", "haveAccount": "Already have an account?", "loginLink": "Log in", "step1": "Personal Details", "namePlaceholder": "John Doe", "continueBtn": "Continue", "step2": "Account Details", "emailPlaceholder": "you@example.com", "passPlaceholder": "Create a password"},
    notFound: {"title": "Page Not Found", "subtitle": "We couldn't find the page you were looking for.", "goBack": "Go Back", "goHome": "Go Home", "lookingFor": "Looking for something else?", "explore": "Explore these links to find what you need.", "landing": "Landing Page", "support": "Support & FAQ"},
    featureShowcase: {
      badge: "ميزات قوية",
      title: "كل ما تحتاجه.<br/>ولا شيء زائد.",
      description: "أزلنا تعقيد بناء الشركات الناشئة وتركنا فقط الأدوات الأساسية التي تحتاجها للنجاح.",
      features: [
        {
          title: "تنفيذ فائق السرعة",
          description: "انتقل من الفكرة إلى النموذج الأولي في وقت قياسي بمساعدة الذكاء الاصطناعي."
        },
        {
          title: "أمان على مستوى المؤسسات",
          description: "ملكيتك الفكرية محمية في كل خطوة من الرحلة."
        },
        {
          title: "توسّع بلا حدود",
          description: "بنية تحتية تنمو معك من اليوم الأول حتى الاكتتاب العام."
        }
      ]
    },
    testimonials: {
      badge: "المجتمع",
      title: "صُنع بواسطة المؤسسين، للمؤسسين",
      description: "لا تأخذ كلمتنا فقط. استمع إلى المؤسسين والمستثمرين الذين يحولون أفكارهم إلى واقع بالفعل على TechIT.",
      testimonials: [
        {
          quote: "غيّر TechIT طريقة تحققي من أفكار شركاتي الناشئة. ما كان يستغرق أشهراً من البحث يحدث الآن في أيام.",
          initials: "JD",
          name: "Jane Doe",
          role: "الرئيس التنفيذي، TechFlow",
          color: "bg-[#0068ff]"
        },
        {
          quote: "رفيق الذكاء الاصطناعي كأن لديك شريكاً مؤسساً لا ينام أبداً. يتحدى افتراضاتي بأفضل طريقة ممكنة.",
          initials: "JS",
          name: "John Smith",
          role: "مؤسس، InnovateX",
          color: "bg-[#20c907]"
        },
        {
          quote: "أخيراً، منصة تنفيذ تتجاوز إدارة المهام. إنها تساعدني فعلاً على معرفة ما يجب بناؤه بعد ذلك.",
          initials: "AL",
          name: "Amanda Lee",
          role: "قائدة المنتج، Vertex",
          color: "bg-[#58A6ff]"
        },
        {
          quote: "كمستثمر، مستوى الرؤية والهيكلة الذي يقدمه TechIT للمؤسسين في المراحل المبكرة غير مسبوق.",
          initials: "MR",
          name: "Michael Ross",
          role: "شريك، Vision VC",
          color: "bg-[#0068ff]"
        }
      ]
    },
    faq: {
      badge: "الأسئلة الشائعة",
      title: "لديك أسئلة؟",
      description: "كل ما تحتاج معرفته عن بناء شركتك الناشئة على TechIT.",
      categories: [
        {
          category: "أسئلة عامة عن المنصة",
          questions: [
            {
              q: "ما هو TechIT Network بالضبط؟",
              a: "TechIT Network هو بنية تحتية للتنفيذ مدعومة بالذكاء الاصطناعي مصممة لمساعدتك على إنشاء الشركات الناشئة والتحقق منها وبنائها وتنميتها."
            },
            {
              q: "كيف يختلف TechIT عن مساعد الذكاء الاصطناعي العادي؟",
              a: "TechIT ليس مجرد مساعد ذكاء اصطناعي. يفهم سياق شركتك الناشئة بشكل استباقي، ويراقب التقدم، ويحدد الخطوات التالية بدقة."
            }
          ]
        },
        {
          category: "للمؤسسين والمستكشفين",
          questions: [
            {
              q: "هل أحتاج إلى شركة ناشئة أو فريق كامل للانضمام؟",
              a: "لا، يمكنك الانضمام كمستكشف لاكتشاف الأفكار دون التزام. يمكنك التحول إلى مؤسس لاحقاً."
            },
            {
              q: "كيف يساعدني TechIT فعلياً على تنفيذ فكرتي؟",
              a: "ترشدك المنصة عبر خط أنابيب منظم: التفكير، التحقق، البناء، التنفيذ، التواصل والنمو."
            }
          ]
        },
        {
          category: "للمتعاونين والمستثمرين والمنظمات",
          questions: [
            {
              q: "لدي مهارات لكن لا توجد لدي فكرة شركة ناشئة. هل هذا لي؟",
              a: "نعم، كمتعاون، يمكنك اكتشاف الشركات الناشئة التي تحتاج مهاراتك والنمو معها."
            },
            {
              q: "ما القيمة التي يقدمها TechIT للمستثمرين في المراحل المبكرة؟",
              a: "يحصل المستثمرون على معلومات عميقة عن الشركات الناشئة الناشئة وتنفيذ المؤسسين وإمكانات النمو."
            },
            {
              q: "هل يمكن لبرامج التسريع أو منظمات الشركات الناشئة استخدام المنصة؟",
              a: "نعم، يمكن للمنظمات استخدام TechIT لدعم رواد الأعمال وإدارة الدفعات."
            }
          ]
        }
      ]
    },
    problemSolver: { title: "Don't let lack of execution hold you back.", buttonText: "Join TechIT Network" },
    header: {
      logoText: "TechIT",
      navLinks: [{ label: "Features", href: "#features" }, { label: "How it works", href: "#how-it-works" }, { label: "Pricing", href: "#pricing" }],
      loginButton: "Log In", registerButton: "Sign Up",
    },
    footer: {
      description: "TechIT Network is an AI-powered execution infrastructure for startups.",
      productTitle: "Product", productLinks: [{ label: "Features", href: "#" }, { label: "Pricing", href: "#" }],
      companyTitle: "Company", companyLinks: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }],
      supportTitle: "Support", location: "San Francisco, CA",
      copyright: "TechIT Network. All rights reserved.", poweredBy: "Powered by Innovation",
    },
    finalCta: { badge: "Ready?", title: "Start Building Today", description: "Join thousands of founders making their ideas a reality.", buttonText: "Create Free Account", imageAlt: "TechIT Platform" },
    benefitGrid: {
      badge: "Benefits", title: "Why Choose TechIT", description: "Everything you need to succeed in one place.",
      benefits: [
        { title: "AI Intelligence", description: "Automate your research and validation." },
        { title: "Real-time Metrics", description: "Track your startup's health instantly." },
        { title: "Expert Network", description: "Connect with investors and collaborators." },
      ],
    },
  },

  hi: {
hero: {
      title: "No Idea Should Be Lost.",
      description: "TechIT Network is an AI-powered execution infrastructure for creating, validating, building, and growing startups.",
      buttonText: "Start Building",
      buttonHref: "/signup",
      imageSrc: "/mockup/laptop.png",
      imageAlt: "TechIT Dashboard",
    },
    howItWorks: {
      badge: "How It Works",
      title: "Simple & Powerful",
      description: "From concept to company in three easy steps.",
      steps: [
        { title: "Ideate", description: "Capture your vision and structure your thoughts instantly." },
        { title: "Validate", description: "Challenge your assumptions with real-time market data." },
        { title: "Execute", description: "Turn insights into action with AI-guided workflows." },
      ],
    },
    howToRegister: {
      badge: "शुरू करें",
      title: "अपनी यात्रा शुरू करें",
      description: "उन संस्थापकों और निर्माताओं के नेटवर्क से जुड़ें जो अपने विचारों को वास्तविकता में बदल रहे हैं।",
      steps: [
        {
          title: "खाता बनाएं",
          description: "कुछ सेकंड में सुरक्षित रूप से साइन अप करें।",
          imageAlt: "साइन अप"
        },
        {
          title: "अपने लक्ष्य निर्धारित करें",
          description: "हमें बताएं कि आप क्या बना रहे हैं।",
          imageAlt: "लक्ष्य निर्धारित करें"
        },
        {
          title: "लॉन्च करें",
          description: "AI को आपको सफलता की ओर मार्गदर्शन करने दें।",
          imageAlt: "लॉन्च"
        }
      ],
      buttonText: "शुरू करें"
    },
    pricing: {
      badge: "Pricing", title: "Invest in Your Idea", description: "Simple, transparent pricing for founders at every stage.",
      monthlyLabel: "Monthly", yearlyLabel: "Yearly", popularLabel: "Most Popular",
      monthSuffix: "/mo", yearSuffix: "/yr", hardwareTitle: "Enterprise Add-ons",
      hardwareDescription: "Need dedicated infrastructure? We've got you covered.", standSuffix: "one-time",
      plans: [
        { name: "Explorer", tagline: "For the curious", popular: false, cta: "Start Free", features: ["Basic access", "Community support"] },
        { name: "Founder", tagline: "For the builders", popular: true, cta: "शुरू करें", features: ["Full platform access", "AI copilots", "Priority support"] },
        { name: "Enterprise", tagline: "For scaling teams", popular: false, cta: "Contact Sales", features: ["Custom integrations", "Dedicated account manager"] },
      ],
    },
    login: {"title": "Welcome Back", "subtitle": "Log in to continue building your startup.", "noAccount": "Don't have an account?", "signupLink": "Sign up", "emailLabel": "Email Address", "emailPlaceholder": "you@example.com", "passLabel": "Password", "forgot": "Forgot password?", "passPlaceholder": "Enter your password", "btn": "Log In"},
    signup: {"title": "Create Your Account", "subtitle": "Join thousands of founders building the future.", "haveAccount": "Already have an account?", "loginLink": "Log in", "step1": "Personal Details", "namePlaceholder": "John Doe", "continueBtn": "Continue", "step2": "Account Details", "emailPlaceholder": "you@example.com", "passPlaceholder": "Create a password"},
    notFound: {"title": "Page Not Found", "subtitle": "We couldn't find the page you were looking for.", "goBack": "Go Back", "goHome": "Go Home", "lookingFor": "Looking for something else?", "explore": "Explore these links to find what you need.", "landing": "Landing Page", "support": "Support & FAQ"},
    featureShowcase: {
      badge: "शक्तिशाली सुविधाएँ",
      title: "आपको जो चाहिए वह सब।<br/>जो नहीं चाहिए वह कुछ नहीं।",
      description: "हमने स्टार्टअप बनाने की जटिलता हटा दी है और केवल वे आवश्यक उपकरण रखे हैं जिनकी आपको सफलता के लिए आवश्यकता है।",
      features: [
        {
          title: "बिजली की गति से निष्पादन",
          description: "AI सहायता के साथ रिकॉर्ड समय में विचार से प्रोटोटाइप तक पहुंचें।"
        },
        {
          title: "एंटरप्राइज़-ग्रेड सुरक्षा",
          description: "आपकी बौद्धिक संपदा यात्रा के हर कदम पर सुरक्षित है।"
        },
        {
          title: "बिना सीमा के स्केल करें",
          description: "पहले दिन से IPO तक आपके साथ बढ़ने वाला बुनियादी ढांचा।"
        }
      ]
    },
    testimonials: {
      badge: "समुदाय",
      title: "संस्थापकों द्वारा, संस्थापकों के लिए बनाया गया",
      description: "केवल हमारी बात पर भरोसा न करें। उन संस्थापकों और निवेशकों से सुनें जो TechIT पर अपने विचारों को वास्तविकता में बदल रहे हैं।",
      testimonials: [
        {
          quote: "TechIT ने मेरे स्टार्टअप विचारों को मान्य करने के तरीके को बदल दिया। जो महीनों का शोध लेता था, अब दिनों में होता है।",
          initials: "JD",
          name: "Jane Doe",
          role: "CEO, TechFlow",
          color: "bg-[#0068ff]"
        },
        {
          quote: "AI साथी ऐसा है जैसे एक सह-संस्थापक हो जो कभी सोता नहीं। यह मेरे अनुमानों को सर्वोत्तम तरीके से चुनौती देता है।",
          initials: "JS",
          name: "John Smith",
          role: "संस्थापक, InnovateX",
          color: "bg-[#20c907]"
        },
        {
          quote: "अंत में, एक निष्पादन प्लेटफ़ॉर्म जो कार्य प्रबंधन से आगे जाता है। यह वास्तव में मुझे यह तय करने में मदद करता है कि आगे क्या बनाना है।",
          initials: "AL",
          name: "Amanda Lee",
          role: "उत्पाद प्रमुख, Vertex",
          color: "bg-[#58A6ff]"
        },
        {
          quote: "एक निवेशक के रूप में, TechIT प्रारंभिक चरण के संस्थापकों को जो अंतर्दृष्टि और संरचना प्रदान करता है, वह अभूतपूर्व है।",
          initials: "MR",
          name: "Michael Ross",
          role: "साझेदार, Vision VC",
          color: "bg-[#0068ff]"
        }
      ]
    },
    faq: {
      badge: "अक्सर पूछे जाने वाले प्रश्न",
      title: "प्रश्न हैं?",
      description: "TechIT पर अपना स्टार्टअप बनाने के बारे में आपको जो कुछ जानना है।",
      categories: [
        {
          category: "सामान्य प्लेटफ़ॉर्म प्रश्न",
          questions: [
            {
              q: "TechIT Network वास्तव में क्या है?",
              a: "TechIT Network एक AI-संचालित निष्पादन बुनियादी ढांचा है जो आपको स्टार्टअप बनाने, मान्य करने, निर्माण करने और बढ़ाने में मदद करने के लिए डिज़ाइन किया गया है।"
            },
            {
              q: "TechIT एक मानक AI सहायक से कैसे अलग है?",
              a: "TechIT केवल एक AI सहायक नहीं है। यह सक्रिय रूप से आपके स्टार्टअप संदर्भ को समझता है, प्रगति की निगरानी करता है, और सटीक अगले कदम निर्धारित करता है।"
            }
          ]
        },
        {
          category: "संस्थापकों और खोजकर्ताओं के लिए",
          questions: [
            {
              q: "क्या मुझे शामिल होने के लिए पूर्ण रूप से बनी स्टार्टअप या टीम की आवश्यकता है?",
              a: "नहीं, आप बिना प्रतिबद्धता के विचारों की खोज के लिए एक खोजकर्ता के रूप में शामिल हो सकते हैं। आप बाद में संस्थापक बन सकते हैं।"
            },
            {
              q: "TechIT वास्तव में मेरे विचार को निष्पादित करने में कैसे मदद करता है?",
              a: "प्लेटफ़ॉर्म आपको एक संरचित पाइपलाइन के माध्यम से मार्गदर्शन करता है: विचार, मान्यता, निर्माण, निष्पादन, कनेक्ट और विकास।"
            }
          ]
        },
        {
          category: "सहयोगियों, निवेशकों और संगठनों के लिए",
          questions: [
            {
              q: "मेरे पास कौशल है लेकिन कोई स्टार्टअप विचार नहीं। क्या यह मेरे लिए है?",
              a: "हाँ, एक सहयोगी के रूप में, आप उन स्टार्टअप की खोज कर सकते हैं जहाँ आपके कौशल की आवश्यकता है और उनके साथ बढ़ सकते हैं।"
            },
            {
              q: "TechIT प्रारंभिक चरण के निवेशकों को क्या मूल्य प्रदान करता है?",
              a: "निवेशकों को उभरते स्टार्टअप, संस्थापक निष्पादन और विकास क्षमता पर गहन जानकारी मिलती है।"
            },
            {
              q: "क्या त्वरक कार्यक्रम या स्टार्टअप संगठन प्लेटफ़ॉर्म का उपयोग कर सकते हैं?",
              a: "हाँ, संगठन उद्यमियों का समर्थन करने और cohorts प्रबंधित करने के लिए TechIT का उपयोग कर सकते हैं।"
            }
          ]
        }
      ]
    },
    problemSolver: { title: "Don't let lack of execution hold you back.", buttonText: "Join TechIT Network" },
    header: {
      logoText: "TechIT",
      navLinks: [{ label: "Features", href: "#features" }, { label: "How it works", href: "#how-it-works" }, { label: "Pricing", href: "#pricing" }],
      loginButton: "Log In", registerButton: "Sign Up",
    },
    footer: {
      description: "TechIT Network is an AI-powered execution infrastructure for startups.",
      productTitle: "Product", productLinks: [{ label: "Features", href: "#" }, { label: "Pricing", href: "#" }],
      companyTitle: "Company", companyLinks: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }],
      supportTitle: "Support", location: "San Francisco, CA",
      copyright: "TechIT Network. All rights reserved.", poweredBy: "Powered by Innovation",
    },
    finalCta: { badge: "Ready?", title: "Start Building Today", description: "Join thousands of founders making their ideas a reality.", buttonText: "Create Free Account", imageAlt: "TechIT Platform" },
    benefitGrid: {
      badge: "Benefits", title: "Why Choose TechIT", description: "Everything you need to succeed in one place.",
      benefits: [
        { title: "AI Intelligence", description: "Automate your research and validation." },
        { title: "Real-time Metrics", description: "Track your startup's health instantly." },
        { title: "Expert Network", description: "Connect with investors and collaborators." },
      ],
    },
  },

  ng: {
hero: {
      title: "No Idea Should Be Lost.",
      description: "TechIT Network is an AI-powered execution infrastructure for creating, validating, building, and growing startups.",
      buttonText: "Start Building",
      buttonHref: "/signup",
      imageSrc: "/mockup/laptop.png",
      imageAlt: "TechIT Dashboard",
    },
    howItWorks: {
      badge: "How It Works",
      title: "Simple & Powerful",
      description: "From concept to company in three easy steps.",
      steps: [
        { title: "Ideate", description: "Capture your vision and structure your thoughts instantly." },
        { title: "Validate", description: "Challenge your assumptions with real-time market data." },
        { title: "Execute", description: "Turn insights into action with AI-guided workflows." },
      ],
    },
    howToRegister: {
      badge: "Get Started",
      title: "Begin Your Journey",
      description: "Join the network of founders and builders transforming their ideas into reality.",
      steps: [
        { title: "Create Account", description: "Sign up securely in seconds.", imageAlt: "Sign up" },
        { title: "Set Your Goals", description: "Tell us what you're building.", imageAlt: "Set goals" },
        { title: "Launch", description: "Let the AI guide you to success.", imageAlt: "Launch" },
      ],
      buttonText: "Get Started",
    },
    pricing: {
      badge: "Pricing", title: "Invest in Your Idea", description: "Simple, transparent pricing for founders at every stage.",
      monthlyLabel: "Monthly", yearlyLabel: "Yearly", popularLabel: "Most Popular",
      monthSuffix: "/mo", yearSuffix: "/yr", hardwareTitle: "Enterprise Add-ons",
      hardwareDescription: "Need dedicated infrastructure? We've got you covered.", standSuffix: "one-time",
      plans: [
        { name: "Explorer", tagline: "For the curious", popular: false, cta: "Start Free", features: ["Basic access", "Community support"] },
        { name: "Founder", tagline: "For the builders", popular: true, cta: "Get Started", features: ["Full platform access", "AI copilots", "Priority support"] },
        { name: "Enterprise", tagline: "For scaling teams", popular: false, cta: "Contact Sales", features: ["Custom integrations", "Dedicated account manager"] },
      ],
    },
    login: {"title": "Welcome Back", "subtitle": "Log in to continue building your startup.", "noAccount": "Don't have an account?", "signupLink": "Sign up", "emailLabel": "Email Address", "emailPlaceholder": "you@example.com", "passLabel": "Password", "forgot": "Forgot password?", "passPlaceholder": "Enter your password", "btn": "Log In"},
    signup: {"title": "Create Your Account", "subtitle": "Join thousands of founders building the future.", "haveAccount": "Already have an account?", "loginLink": "Log in", "step1": "Personal Details", "namePlaceholder": "John Doe", "continueBtn": "Continue", "step2": "Account Details", "emailPlaceholder": "you@example.com", "passPlaceholder": "Create a password"},
    notFound: {"title": "Page Not Found", "subtitle": "We couldn't find the page you were looking for.", "goBack": "Go Back", "goHome": "Go Home", "lookingFor": "Looking for something else?", "explore": "Explore these links to find what you need.", "landing": "Landing Page", "support": "Support & FAQ"},
    featureShowcase: {"badge": "Power Features", "title": "Everything you need.<br/>Nothing you don't.", "description": "We've stripped away the complexity of building a startup and left only the essential tools you need to succeed.", "features": [{"title": "Lightning Fast Execution", "description": "Go from idea to prototype in record time with AI assistance."}, {"title": "Enterprise Grade Security", "description": "Your intellectual property is protected at every step of the journey."}, {"title": "Scale Without Limits", "description": "Infrastructure that grows with you from day one to IPO."}]},
    testimonials: {"badge": "Community", "title": "Built by Founders, For Founders", "description": "Don't just take our word for it. Hear from the founders and investors who are already transforming their ideas into reality on TechIT.", "testimonials": [{"quote": "TechIT changed how I validate my startup ideas. What used to take months of research now happens in days.", "initials": "JD", "name": "Jane Doe", "role": "CEO, TechFlow", "color": "bg-[#0068ff]"}, {"quote": "The AI companion is like having a co-founder who never sleeps. It constantly challenges my assumptions in the best way possible.", "initials": "JS", "name": "John Smith", "role": "Founder, InnovateX", "color": "bg-[#20c907]"}, {"quote": "Finally, an execution platform that goes beyond task management. It actually helps me figure out what to build next.", "initials": "AL", "name": "Amanda Lee", "role": "Product Lead, Vertex", "color": "bg-[#58A6ff]"}, {"quote": "As an investor, the level of insight and structure TechIT provides to early-stage founders is unprecedented.", "initials": "MR", "name": "Michael Ross", "role": "Partner, Vision VC", "color": "bg-[#0068ff]"}]},
    faq: {"badge": "FAQ", "title": "Got Questions?", "description": "Everything you need to know about building your startup on TechIT.", "categories": [{"category": "General Platform Questions", "questions": [{"q": "What exactly is TechIT Network?", "a": "TechIT Network is an AI-powered execution infrastructure designed to help you create, validate, build, and grow startups."}, {"q": "How is TechIT different from a standard AI assistant?", "a": "TechIT is not just an AI assistant. It proactively understands your startup context, monitors progress, and determines exact next steps."}]}, {"category": "For Founders & Explorers", "questions": [{"q": "Do I need a fully formed startup or team to join?", "a": "No, you can join as an Explorer to discover ideas without committing. You can transition to a Founder later."}, {"q": "How does TechIT actually help me execute my idea?", "a": "The platform guides you through a structured pipeline: Ideate, Validate, Build, Execute, Connect, and Grow."}]}, {"category": "For Collaborators, Investors & Organizations", "questions": [{"q": "I have skills but no startup idea. Is this for me?", "a": "Yes, as a Collaborator, you can discover startups where your skills are needed and grow alongside them."}, {"q": "What value does TechIT provide to early-stage investors?", "a": "Investors gain deep intelligence into emerging startups, founder execution, and growth potential."}, {"q": "Can accelerator programs or startup organizations use the platform?", "a": "Yes, Organizations can use TechIT to support entrepreneurs and manage cohorts."}]}]},
    problemSolver: { title: "Don't let lack of execution hold you back.", buttonText: "Join TechIT Network" },
    header: {
      logoText: "TechIT",
      navLinks: [{ label: "Features", href: "#features" }, { label: "How it works", href: "#how-it-works" }, { label: "Pricing", href: "#pricing" }],
      loginButton: "Log In", registerButton: "Sign Up",
    },
    footer: {
      description: "TechIT Network is an AI-powered execution infrastructure for startups.",
      productTitle: "Product", productLinks: [{ label: "Features", href: "#" }, { label: "Pricing", href: "#" }],
      companyTitle: "Company", companyLinks: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }],
      supportTitle: "Support", location: "San Francisco, CA",
      copyright: "TechIT Network. All rights reserved.", poweredBy: "Powered by Innovation",
    },
    finalCta: { badge: "Ready?", title: "Start Building Today", description: "Join thousands of founders making their ideas a reality.", buttonText: "Create Free Account", imageAlt: "TechIT Platform" },
    benefitGrid: {
      badge: "Benefits", title: "Why Choose TechIT", description: "Everything you need to succeed in one place.",
      benefits: [
        { title: "AI Intelligence", description: "Automate your research and validation." },
        { title: "Real-time Metrics", description: "Track your startup's health instantly." },
        { title: "Expert Network", description: "Connect with investors and collaborators." },
      ],
    },
  },
};

export function getTranslations(locale?: string): Translations {
  return translations[(locale as LocaleCode) ?? "en"] ?? translations.en;
}

export { translations };
