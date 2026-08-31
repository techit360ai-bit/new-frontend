import re
import json

with open('src/app/lib/i18n.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix types
types_to_insert = """  login: {
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
  problemSolver: { title: string; buttonText: string };"""

text = re.sub(r'  testimonials: \{.*?\];\n  \};\n', '', text, flags=re.DOTALL)
text = re.sub(r'  faq: \{.*?\] \};\n', '', text, flags=re.DOTALL)
text = text.replace('  problemSolver: { title: string; buttonText: string };', types_to_insert)

text = text.replace(
    'steps: { title: string; description: string; imageAlt: string }[];',
    'steps: { title: string; description: string; imageAlt: string }[];\n    buttonText: string;'
)

translations_data = {
    'en': {
        'howToRegister_buttonText': 'Get Started',
        'login': {
            'title': 'Welcome Back',
            'subtitle': 'Log in to continue building your startup.',
            'noAccount': "Don't have an account?",
            'signupLink': 'Sign up',
            'emailLabel': 'Email Address',
            'emailPlaceholder': 'you@example.com',
            'passLabel': 'Password',
            'forgot': 'Forgot password?',
            'passPlaceholder': 'Enter your password',
            'btn': 'Log In'
        },
        'signup': {
            'title': 'Create Your Account',
            'subtitle': 'Join thousands of founders building the future.',
            'haveAccount': 'Already have an account?',
            'loginLink': 'Log in',
            'step1': 'Personal Details',
            'namePlaceholder': 'John Doe',
            'continueBtn': 'Continue',
            'step2': 'Account Details',
            'emailPlaceholder': 'you@example.com',
            'passPlaceholder': 'Create a password'
        },
        'notFound': {
            'title': 'Page Not Found',
            'subtitle': "We couldn't find the page you were looking for.",
            'goBack': 'Go Back',
            'goHome': 'Go Home',
            'lookingFor': 'Looking for something else?',
            'explore': 'Explore these links to find what you need.',
            'landing': 'Landing Page',
            'support': 'Support & FAQ'
        },
        'featureShowcase': {
            'badge': 'Power Features',
            'title': "Everything you need.<br/>Nothing you don't.",
            'description': "We've stripped away the complexity of building a startup and left only the essential tools you need to succeed.",
            'features': [
                {'title': 'Lightning Fast Execution', 'description': 'Go from idea to prototype in record time with AI assistance.'},
                {'title': 'Enterprise Grade Security', 'description': 'Your intellectual property is protected at every step of the journey.'},
                {'title': 'Scale Without Limits', 'description': 'Infrastructure that grows with you from day one to IPO.'}
            ]
        },
        'testimonials': {
            'badge': 'Community',
            'title': 'Built by Founders, For Founders',
            'description': "Don't just take our word for it. Hear from the founders and investors who are already transforming their ideas into reality on TechIT.",
            'testimonials': [
                {'quote': 'TechIT changed how I validate my startup ideas. What used to take months of research now happens in days.', 'initials': 'JD', 'name': 'Jane Doe', 'role': 'CEO, TechFlow', 'color': 'bg-[#0068ff]'},
                {'quote': 'The AI companion is like having a co-founder who never sleeps. It constantly challenges my assumptions in the best way possible.', 'initials': 'JS', 'name': 'John Smith', 'role': 'Founder, InnovateX', 'color': 'bg-[#20c907]'},
                {'quote': 'Finally, an execution platform that goes beyond task management. It actually helps me figure out what to build next.', 'initials': 'AL', 'name': 'Amanda Lee', 'role': 'Product Lead, Vertex', 'color': 'bg-[#58A6ff]'},
                {'quote': 'As an investor, the level of insight and structure TechIT provides to early-stage founders is unprecedented.', 'initials': 'MR', 'name': 'Michael Ross', 'role': 'Partner, Vision VC', 'color': 'bg-[#0068ff]'}
            ]
        },
        'faq': {
            'badge': 'FAQ',
            'title': 'Got Questions?',
            'description': 'Everything you need to know about building your startup on TechIT.',
            'categories': [
                {
                    'category': 'General Platform Questions',
                    'questions': [
                        {'q': 'What exactly is TechIT Network?', 'a': 'TechIT Network is an AI-powered execution infrastructure designed to help you create, validate, build, and grow startups.'},
                        {'q': 'How is TechIT different from a standard AI assistant?', 'a': 'TechIT is not just an AI assistant. It proactively understands your startup context, monitors progress, and determines exact next steps.'}
                    ]
                },
                {
                    'category': 'For Founders & Explorers',
                    'questions': [
                        {'q': 'Do I need a fully formed startup or team to join?', 'a': 'No, you can join as an Explorer to discover ideas without committing. You can transition to a Founder later.'},
                        {'q': 'How does TechIT actually help me execute my idea?', 'a': 'The platform guides you through a structured pipeline: Ideate, Validate, Build, Execute, Connect, and Grow.'}
                    ]
                },
                {
                    'category': 'For Collaborators, Investors & Organizations',
                    'questions': [
                        {'q': 'I have skills but no startup idea. Is this for me?', 'a': 'Yes, as a Collaborator, you can discover startups where your skills are needed and grow alongside them.'},
                        {'q': 'What value does TechIT provide to early-stage investors?', 'a': 'Investors gain deep intelligence into emerging startups, founder execution, and growth potential.'},
                        {'q': 'Can accelerator programs or startup organizations use the platform?', 'a': 'Yes, Organizations can use TechIT to support entrepreneurs and manage cohorts.'}
                    ]
                }
            ]
        }
    }
}
for lang in ['es', 'fr', 'zh', 'pt', 'ar', 'hi', 'ng']:
    translations_data[lang] = translations_data['en']

# Remove ALL existing faq and testimonials from the data objects
text = re.sub(r'    testimonials: \{.*?      \],\n    \},\n', '', text, flags=re.DOTALL)
text = re.sub(r'    faq: \{.*?      \],\n    \},\n', '', text, flags=re.DOTALL)
text = re.sub(r'    login: \{.*?    \},\n', '', text, flags=re.DOTALL)
text = re.sub(r'    signup: \{.*?    \},\n', '', text, flags=re.DOTALL)
text = re.sub(r'    notFound: \{.*?    \},\n', '', text, flags=re.DOTALL)

for lang, data in translations_data.items():
    insert_str = f"""    login: {json.dumps(data['login'], ensure_ascii=False)},
    signup: {json.dumps(data['signup'], ensure_ascii=False)},
    notFound: {json.dumps(data['notFound'], ensure_ascii=False)},
    featureShowcase: {json.dumps(data['featureShowcase'], ensure_ascii=False)},
    testimonials: {json.dumps(data['testimonials'], ensure_ascii=False)},
    faq: {json.dumps(data['faq'], ensure_ascii=False)},
"""
    # Replace into the object. Find problemSolver inside this lang's block
    if lang == 'ng':
        # Add ng if it doesn't exist
        if '  ng: {' not in text:
            # Duplicate EN but call it ng
            en_block = text.split('  en: {')[1].split('  },\\n\\n')[0]
            if 'es: {' in en_block:
                en_block = en_block.split('  es: {')[0].strip()
            if en_block.endswith('},'):
                en_block = en_block[:-1]
            if en_block.endswith('}'):
                en_block = en_block[:-1]
            text = text.replace('};', f'  ng: {{{en_block}\n  }},\n}};', 1)

    # Now insert into this lang block
    lang_start = text.find(f"  {lang}: {{")
    prob_start = text.find("    problemSolver: {", lang_start)
    if prob_start != -1:
        text = text[:prob_start] + insert_str + text[prob_start:]
    
    # Add howToRegister buttonText
    htr_start = text.find("    howToRegister: {", lang_start)
    if htr_start != -1:
        steps_start = text.find("      steps: [", htr_start)
        steps_end = text.find("      ],", steps_start)
        buttonText = f"\n      buttonText: {json.dumps(data['howToRegister_buttonText'], ensure_ascii=False)},"
        text = text[:steps_end+8] + buttonText + text[steps_end+8:]

with open('src/app/lib/i18n.ts', 'w', encoding='utf-8') as f:
    f.write(text)
