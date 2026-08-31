const fs = require('fs');
let code = fs.readFileSync('src/app/lib/i18n.ts', 'utf8');

// 1. Add types to Translations
code = code.replace(
  '  benefitGrid: {',
  `  notFound: { title: string; subtitle: string; goBack: string; goHome: string; lookingFor: string; explore: string; landing: string; support: string };
  login: { title: string; subtitle: string; emailLabel: string; emailPlaceholder: string; passLabel: string; passPlaceholder: string; forgot: string; btn: string; noAccount: string; signupLink: string; backToHome: string };
  signup: { title: string; subtitle: string; step1: string; step2: string; step3: string; nameLabel: string; namePlaceholder: string; emailLabel: string; emailPlaceholder: string; passLabel: string; passPlaceholder: string; confirmPassLabel: string; confirmPassPlaceholder: string; continueBtn: string; roleLabel: string; roleFounder: string; roleInvestor: string; roleCollaborator: string; backBtn: string; goalsLabel: string; goalsPlaceholder: string; skillsLabel: string; skillsPlaceholder: string; submitBtn: string; haveAccount: string; loginLink: string; backToHome: string };
  benefitGrid: {`
);

const additions = {
  en: {
    notFound: { title: "Lost in the digital abyss", subtitle: "We couldn't find the page you're looking for. It might have been moved, deleted, or never existed.", goBack: "Go Back", goHome: "Back to Home", lookingFor: "Looking for something?", explore: "Explore the TechIT Network", landing: "Landing Page", support: "Support Hub" },
    login: { title: "Sign In", subtitle: "Welcome back to TechIT Network. Please enter your details.", emailLabel: "Email Address", emailPlaceholder: "Enter your email", passLabel: "Password", passPlaceholder: "Enter your password", forgot: "Forgot password?", btn: "Sign In", noAccount: "Don't have an account?", signupLink: "Sign up", backToHome: "Back to home" },
    signup: { title: "Create Account", subtitle: "Join the TechIT Network and start building your future.", step1: "Account Details", step2: "Role", step3: "Goals", nameLabel: "Full Name", namePlaceholder: "Enter your name", emailLabel: "Email Address", emailPlaceholder: "Enter your email", passLabel: "Password", passPlaceholder: "Create a password", confirmPassLabel: "Confirm Password", confirmPassPlaceholder: "Confirm your password", continueBtn: "Continue", roleLabel: "Select Your Role", roleFounder: "Founder", roleInvestor: "Investor", roleCollaborator: "Collaborator", backBtn: "Back", goalsLabel: "What are your goals?", goalsPlaceholder: "Briefly describe what you want to achieve", skillsLabel: "Key Skills", skillsPlaceholder: "e.g. React, Node, Marketing", submitBtn: "Complete Registration", haveAccount: "Already have an account?", loginLink: "Log in", backToHome: "Back to home" }
  },
  es: {
    notFound: { title: "Perdido en el abismo digital", subtitle: "No pudimos encontrar la página que buscas. Puede haber sido movida, eliminada o nunca existió.", goBack: "Volver", goHome: "Ir al Inicio", lookingFor: "¿Buscas algo?", explore: "Explora TechIT Network", landing: "Página de Inicio", support: "Centro de Soporte" },
    login: { title: "Iniciar Sesión", subtitle: "Bienvenido a TechIT Network. Por favor, introduce tus datos.", emailLabel: "Correo Electrónico", emailPlaceholder: "Introduce tu correo", passLabel: "Contraseña", passPlaceholder: "Introduce tu contraseña", forgot: "¿Olvidaste tu contraseña?", btn: "Iniciar Sesión", noAccount: "¿No tienes cuenta?", signupLink: "Regístrate", backToHome: "Volver al inicio" },
    signup: { title: "Crear Cuenta", subtitle: "Únete a TechIT Network y comienza a construir tu futuro.", step1: "Detalles de la Cuenta", step2: "Rol", step3: "Metas", nameLabel: "Nombre Completo", namePlaceholder: "Introduce tu nombre", emailLabel: "Correo Electrónico", emailPlaceholder: "Introduce tu correo", passLabel: "Contraseña", passPlaceholder: "Crea una contraseña", confirmPassLabel: "Confirmar Contraseña", confirmPassPlaceholder: "Confirma tu contraseña", continueBtn: "Continuar", roleLabel: "Selecciona Tu Rol", roleFounder: "Fundador", roleInvestor: "Inversor", roleCollaborator: "Colaborador", backBtn: "Atrás", goalsLabel: "¿Cuáles son tus metas?", goalsPlaceholder: "Describe brevemente lo que quieres lograr", skillsLabel: "Habilidades Clave", skillsPlaceholder: "ej. React, Node, Marketing", submitBtn: "Completar Registro", haveAccount: "¿Ya tienes una cuenta?", loginLink: "Iniciar sesión", backToHome: "Volver al inicio" }
  },
  fr: {
    notFound: { title: "Perdu dans l'abîme numérique", subtitle: "Nous n'avons pas trouvé la page que vous cherchez. Elle a peut-être été déplacée, supprimée ou n'a jamais existé.", goBack: "Retour", goHome: "Accueil", lookingFor: "Vous cherchez quelque chose ?", explore: "Explorer TechIT Network", landing: "Page d'accueil", support: "Centre de Support" },
    login: { title: "Se Connecter", subtitle: "Bienvenue sur TechIT Network. Veuillez saisir vos coordonnées.", emailLabel: "Adresse E-mail", emailPlaceholder: "Saisissez votre e-mail", passLabel: "Mot de passe", passPlaceholder: "Saisissez votre mot de passe", forgot: "Mot de passe oublié ?", btn: "Se Connecter", noAccount: "Vous n'avez pas de compte ?", signupLink: "S'inscrire", backToHome: "Retour à l'accueil" },
    signup: { title: "Créer un Compte", subtitle: "Rejoignez TechIT Network et commencez à construire votre avenir.", step1: "Détails du Compte", step2: "Rôle", step3: "Objectifs", nameLabel: "Nom Complet", namePlaceholder: "Saisissez votre nom", emailLabel: "Adresse E-mail", emailPlaceholder: "Saisissez votre e-mail", passLabel: "Mot de passe", passPlaceholder: "Créez un mot de passe", confirmPassLabel: "Confirmer le mot de passe", confirmPassPlaceholder: "Confirmez votre mot de passe", continueBtn: "Continuer", roleLabel: "Sélectionnez Votre Rôle", roleFounder: "Fondateur", roleInvestor: "Investisseur", roleCollaborator: "Collaborateur", backBtn: "Retour", goalsLabel: "Quels sont vos objectifs ?", goalsPlaceholder: "Décrivez brièvement ce que vous souhaitez accomplir", skillsLabel: "Compétences Clés", skillsPlaceholder: "ex. React, Node, Marketing", submitBtn: "Terminer l'Inscription", haveAccount: "Vous avez déjà un compte ?", loginLink: "Se connecter", backToHome: "Retour à l'accueil" }
  },
  zh: {
    notFound: { title: "迷失在数字深渊", subtitle: "我们找不到您要的页面，它可能已被移动、删除或从未存在。", goBack: "返回", goHome: "回到首页", lookingFor: "在寻找什么？", explore: "探索 TechIT Network", landing: "首页", support: "支持中心" },
    login: { title: "登录", subtitle: "欢迎回到 TechIT Network。请输入您的详细信息。", emailLabel: "电子邮件", emailPlaceholder: "输入您的电子邮件", passLabel: "密码", passPlaceholder: "输入您的密码", forgot: "忘记密码？", btn: "登录", noAccount: "没有账户？", signupLink: "注册", backToHome: "回到首页" },
    signup: { title: "创建账户", subtitle: "加入 TechIT Network 并开始构建您的未来。", step1: "账户详情", step2: "角色", step3: "目标", nameLabel: "全名", namePlaceholder: "输入您的名字", emailLabel: "电子邮件", emailPlaceholder: "输入您的电子邮件", passLabel: "密码", passPlaceholder: "创建一个密码", confirmPassLabel: "确认密码", confirmPassPlaceholder: "确认您的密码", continueBtn: "继续", roleLabel: "选择您的角色", roleFounder: "创始人", roleInvestor: "投资者", roleCollaborator: "合作者", backBtn: "返回", goalsLabel: "您的目标是什么？", goalsPlaceholder: "简要描述您希望实现的成就", skillsLabel: "核心技能", skillsPlaceholder: "例如：React、Node、营销", submitBtn: "完成注册", haveAccount: "已有账户？", loginLink: "登录", backToHome: "回到首页" }
  },
  pt: {
    notFound: { title: "Perdido no abismo digital", subtitle: "Não encontramos a página que você procura. Ela pode ter sido movida, excluída ou nunca existiu.", goBack: "Voltar", goHome: "Ir para Início", lookingFor: "Procurando algo?", explore: "Explore a TechIT Network", landing: "Página Inicial", support: "Central de Suporte" },
    login: { title: "Entrar", subtitle: "Bem-vindo de volta à TechIT Network. Por favor, insira seus dados.", emailLabel: "Endereço de E-mail", emailPlaceholder: "Insira seu e-mail", passLabel: "Senha", passPlaceholder: "Insira sua senha", forgot: "Esqueceu a senha?", btn: "Entrar", noAccount: "Não tem uma conta?", signupLink: "Cadastre-se", backToHome: "Voltar ao início" },
    signup: { title: "Criar Conta", subtitle: "Junte-se à TechIT Network e comece a construir seu futuro.", step1: "Detalhes da Conta", step2: "Função", step3: "Objetivos", nameLabel: "Nome Completo", namePlaceholder: "Insira seu nome", emailLabel: "Endereço de E-mail", emailPlaceholder: "Insira seu e-mail", passLabel: "Senha", passPlaceholder: "Crie uma senha", confirmPassLabel: "Confirmar Senha", confirmPassPlaceholder: "Confirme sua senha", continueBtn: "Continuar", roleLabel: "Selecione Sua Função", roleFounder: "Fundador", roleInvestor: "Investidor", roleCollaborator: "Colaborador", backBtn: "Voltar", goalsLabel: "Quais são seus objetivos?", goalsPlaceholder: "Descreva brevemente o que você deseja alcançar", skillsLabel: "Habilidades Principais", skillsPlaceholder: "ex: React, Node, Marketing", submitBtn: "Concluir Cadastro", haveAccount: "Já tem uma conta?", loginLink: "Entrar", backToHome: "Voltar ao início" }
  },
  ar: {
    notFound: { title: "ضاع في الهاوية الرقمية", subtitle: "لم نتمكن من العثور على الصفحة التي تبحث عنها. ربما تم نقلها أو حذفها أو لم تكن موجودة من البداية.", goBack: "رجوع", goHome: "العودة للرئيسية", lookingFor: "هل تبحث عن شيء؟", explore: "استكشف TechIT Network", landing: "الصفحة الرئيسية", support: "مركز الدعم" },
    login: { title: "تسجيل الدخول", subtitle: "مرحباً بعودتك إلى TechIT Network. الرجاء إدخال بياناتك.", emailLabel: "عنوان البريد الإلكتروني", emailPlaceholder: "أدخل بريدك الإلكتروني", passLabel: "كلمة المرور", passPlaceholder: "أدخل كلمة المرور", forgot: "نسيت كلمة المرور؟", btn: "تسجيل الدخول", noAccount: "ليس لديك حساب؟", signupLink: "إنشاء حساب", backToHome: "العودة للرئيسية" },
    signup: { title: "إنشاء حساب", subtitle: "انضم إلى TechIT Network وابدأ في بناء مستقبلك.", step1: "تفاصيل الحساب", step2: "الدور", step3: "الأهداف", nameLabel: "الاسم الكامل", namePlaceholder: "أدخل اسمك", emailLabel: "عنوان البريد الإلكتروني", emailPlaceholder: "أدخل بريدك الإلكتروني", passLabel: "كلمة المرور", passPlaceholder: "أنشئ كلمة مرور", confirmPassLabel: "تأكيد كلمة المرور", confirmPassPlaceholder: "أكد كلمة المرور", continueBtn: "متابعة", roleLabel: "اختر دورك", roleFounder: "مؤسس", roleInvestor: "مستثمر", roleCollaborator: "متعاون", backBtn: "رجوع", goalsLabel: "ما هي أهدافك؟", goalsPlaceholder: "صف بإيجاز ما تريد تحقيقه", skillsLabel: "المهارات الأساسية", skillsPlaceholder: "مثل: React، Node، التسويق", submitBtn: "إكمال التسجيل", haveAccount: "لديك حساب بالفعل؟", loginLink: "تسجيل الدخول", backToHome: "العودة للرئيسية" }
  },
  hi: {
    notFound: { title: "डिजिटल रसातल में खो गए", subtitle: "हम वह पेज नहीं ढूंढ पाए जो आप खोज रहे हैं। शायद इसे हटा दिया गया हो या यह कभी था ही नहीं।", goBack: "वापस जाएं", goHome: "होम पर जाएं", lookingFor: "कुछ ढूंढ रहे हैं?", explore: "TechIT Network एक्सप्लोर करें", landing: "लैंडिंग पेज", support: "सपोर्ट हब" },
    login: { title: "लॉग इन", subtitle: "TechIT Network में वापस स्वागत है। कृपया अपना विवरण दर्ज करें।", emailLabel: "ईमेल पता", emailPlaceholder: "अपना ईमेल दर्ज करें", passLabel: "पासवर्ड", passPlaceholder: "अपना पासवर्ड दर्ज करें", forgot: "पासवर्ड भूल गए?", btn: "लॉग इन", noAccount: "खाता नहीं है?", signupLink: "साइन अप करें", backToHome: "होम पर वापस आएं" },
    signup: { title: "खाता बनाएं", subtitle: "TechIT Network से जुड़ें और अपना भविष्य बनाना शुरू करें।", step1: "खाता विवरण", step2: "भूमिका", step3: "लक्ष्य", nameLabel: "पूरा नाम", namePlaceholder: "अपना नाम दर्ज करें", emailLabel: "ईमेल पता", emailPlaceholder: "अपना ईमेल दर्ज करें", passLabel: "पासवर्ड", passPlaceholder: "एक पासवर्ड बनाएं", confirmPassLabel: "पासवर्ड की पुष्टि करें", confirmPassPlaceholder: "अपने पासवर्ड की पुष्टि करें", continueBtn: "जारी रखें", roleLabel: "अपनी भूमिका चुनें", roleFounder: "संस्थापक", roleInvestor: "निवेशक", roleCollaborator: "सहयोगी", backBtn: "वापस", goalsLabel: "आपके लक्ष्य क्या हैं?", goalsPlaceholder: "संक्षेप में बताएं कि आप क्या हासिल करना चाहते हैं", skillsLabel: "मुख्य कौशल", skillsPlaceholder: "जैसे React, Node, मार्केटिंग", submitBtn: "पंजीकरण पूरा करें", haveAccount: "क्या आपके पास पहले से खाता है?", loginLink: "लॉग इन", backToHome: "होम पर वापस आएं" }
  }
};

let newCode = "";
const locales = ["en", "es", "fr", "zh", "pt", "ar", "hi"];

for (const lang of locales) {
  const lines = code.split("\\n");
  let inLang = false;
  let newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === \`\${lang}: {\`) {
      inLang = true;
    }
    
    if (inLang && line.includes("poweredBy:")) {
      newLines.push(line);
      newLines.push(\`    notFound: \${JSON.stringify(additions[lang].notFound)},\`);
      newLines.push(\`    login: \${JSON.stringify(additions[lang].login)},\`);
      newLines.push(\`    signup: \${JSON.stringify(additions[lang].signup)},\`);
      inLang = false; // Done for this language
    } else {
      newLines.push(line);
    }
  }
  code = newLines.join("\\n");
}

// Extract English object completely
let enObjectMatch = code.match(/en: \{([\s\S]*?)\},[\s]*es:/);
if (enObjectMatch) {
  let enObject = enObjectMatch[1];
  code = code.replace("hi: {", "ng: {" + enObject + "},\n\n  hi: {");
}

fs.writeFileSync('src/app/lib/i18n.ts', code);
