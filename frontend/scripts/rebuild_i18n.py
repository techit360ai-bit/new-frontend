import json

with open('src/app/lib/i18n.ts', 'r', encoding='utf-8') as f:
    orig = f.read()

# 1. Update the types
# Find the end of `testimonials` type and `faq` type to remove them.
# We'll just take the types up to `testimonials:`
type_start = orig.find('  testimonials: {')
top_part = orig[:type_start]

# Also add buttonText to howToRegister steps
top_part = top_part.replace(
    'steps: { title: string; description: string; imageAlt: string }[];',
    'steps: { title: string; description: string; imageAlt: string }[];\n    buttonText: string;'
)

new_types = """  login: {
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
"""

# Find the end of the Translations type definition
type_end = orig.find('};\n\nconst translations: Record<LocaleCode, Translations> = {')

# The original has header, footer, finalCta, benefitGrid AFTER problemSolver!
# Let's just find them and append them.
header_start = orig.find('  header: {')
rest_of_types = orig[header_start:type_end]
# But remove the old faq type from rest_of_types if it's there
faq_type_start = rest_of_types.find('  faq: {')
if faq_type_start != -1:
    faq_type_end = rest_of_types.find('};\n', faq_type_start) + 3
    rest_of_types = rest_of_types[:faq_type_start] + rest_of_types[faq_type_end:]

full_top = top_part + new_types + rest_of_types + '};\n\nconst translations: Record<LocaleCode, Translations> = {\n'

# 2. Extract original EN data blocks for hero, howItWorks, pricing, header, footer, finalCta, benefitGrid
en_data_start = orig.find('  en: {\n')
es_data_start = orig.find('\n  es: {\n')
en_data_raw = orig[en_data_start+8 : es_data_start].strip()

# Now we need to parse en_data_raw or just use it!
# Wait, en_data_raw contains the OLD testimonials, OLD faq, etc.
# We want to replace them.
import re
en_data_cleaned = re.sub(r'    testimonials: \{.*?      \],\n    \},\n', '', en_data_raw, flags=re.DOTALL)
en_data_cleaned = re.sub(r'    faq: \{.*?      \],\n    \},\n', '', en_data_cleaned, flags=re.DOTALL)
# Add buttonText to howToRegister
en_data_cleaned = en_data_cleaned.replace(
    '      ],\n    },\n    pricing:',
    '      ],\n      buttonText: "Get Started",\n    },\n    pricing:'
)

new_data_dict = {
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

new_data_str = ""
for key, val in new_data_dict.items():
    new_data_str += f"    {key}: {json.dumps(val, ensure_ascii=False)},\n"

# Inject new data BEFORE problemSolver
if '    problemSolver: {' in en_data_cleaned:
    en_data_cleaned = en_data_cleaned.replace('    problemSolver: {', new_data_str + '    problemSolver: {')
else:
    en_data_cleaned += '\n' + new_data_str

out = full_top
langs = ['en', 'es', 'fr', 'zh', 'pt', 'ar', 'hi', 'ng']
for i, lang in enumerate(langs):
    out += f"  {lang}: {{\n"
    out += en_data_cleaned
    out += "\n  }"
    if i < len(langs) - 1:
        out += ",\n\n"
    else:
        out += "\n};\n\n"

# Append the rest of the file
tail_start = orig.find('export function getTranslations(locale?: string): Translations {')
out += orig[tail_start:]

with open('src/app/lib/i18n.ts', 'w', encoding='utf-8') as f:
    f.write(out)
