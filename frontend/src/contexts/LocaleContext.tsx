import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export type LocaleCode = "en" | "es" | "fr" | "zh" | "pt" | "ar" | "hi" | "ng";

export interface LocaleOption {
  code: LocaleCode;
  label: string;
  nativeLabel: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  currencyCode: string;
  dir: "ltr" | "rtl";
}

export const LOCALES: LocaleOption[] = [
  {
    code: "en",
    label: "English",
    nativeLabel: "English",
    flag: "🇬🇧",
    currency: "US Dollar",
    currencySymbol: "$",
    currencyCode: "USD",
    dir: "ltr",
  },
  {
    code: "es",
    label: "Spanish",
    nativeLabel: "Español",
    flag: "🇪🇸",
    currency: "Euro",
    currencySymbol: "€",
    currencyCode: "EUR",
    dir: "ltr",
  },
  {
    code: "fr",
    label: "French",
    nativeLabel: "Français",
    flag: "🇫🇷",
    currency: "Euro",
    currencySymbol: "€",
    currencyCode: "EUR",
    dir: "ltr",
  },
  {
    code: "zh",
    label: "Chinese",
    nativeLabel: "中文",
    flag: "🇨🇳",
    currency: "Chinese Yuan",
    currencySymbol: "¥",
    currencyCode: "CNY",
    dir: "ltr",
  },
  {
    code: "pt",
    label: "Portuguese",
    nativeLabel: "Português",
    flag: "🇧🇷",
    currency: "Brazilian Real",
    currencySymbol: "R$",
    currencyCode: "BRL",
    dir: "ltr",
  },
  {
    code: "ar",
    label: "Arabic",
    nativeLabel: "العربية",
    flag: "🇸🇦",
    currency: "Saudi Riyal",
    currencySymbol: "﷼",
    currencyCode: "SAR",
    dir: "rtl",
  },
  {
    code: "hi",
    label: "Hindi",
    nativeLabel: "हिन्दी",
    flag: "🇮🇳",
    currency: "Indian Rupee",
    currencySymbol: "₹",
    currencyCode: "INR",
    dir: "ltr",
  },
  {
    code: "ng",
    label: "English (Nigeria)",
    nativeLabel: "English",
    flag: "🇳🇬",
    currency: "Nigerian Naira",
    currencySymbol: "₦",
    currencyCode: "NGN",
    dir: "ltr",
  },
];

// Map country codes to locales
const COUNTRY_TO_LOCALE: Record<string, LocaleCode> = {
  // English
  US: "en", GB: "en", AU: "en", CA: "en", NZ: "en", IE: "en", ZA: "en", GH: "en", KE: "en",
  // Nigeria
  NG: "ng",
  // Spanish
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es", VE: "es", EC: "es", BO: "es", PY: "es", UY: "es", CR: "es", GT: "es", HN: "es", SV: "es", NI: "es", PA: "es", DO: "es", CU: "es",
  // French
  FR: "fr", BE: "fr", CH: "fr", LU: "fr", MC: "fr", SN: "fr", CI: "fr", ML: "fr", BF: "fr", NE: "fr", TG: "fr", BJ: "fr", CM: "fr", GA: "fr", CG: "fr", CD: "fr", MG: "fr", DZ: "fr", MA: "fr", TN: "fr",
  // Chinese
  CN: "zh", TW: "zh", HK: "zh", SG: "zh",
  // Portuguese
  BR: "pt", PT: "pt", AO: "pt", MZ: "pt", CV: "pt", GW: "pt", ST: "pt", TL: "pt",
  // Arabic
  SA: "ar", AE: "ar", EG: "ar", IQ: "ar", JO: "ar", KW: "ar", LB: "ar", LY: "ar", OM: "ar", QA: "ar", SY: "ar", YE: "ar", BH: "ar", SD: "ar",
  // Hindi / Indian
  IN: "hi",
};

interface LocaleContextValue {
  locale: LocaleOption;
  setLocale: (code: LocaleCode) => void;
  isDetecting: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "techit_locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleOption>(LOCALES[0]);
  const [isDetecting, setIsDetecting] = useState(true);

  const applyLocale = useCallback((option: LocaleOption) => {
    setLocaleState(option);
    document.documentElement.lang = option.code;
    document.documentElement.dir = option.dir;
    localStorage.setItem(STORAGE_KEY, option.code);
  }, []);

  const setLocale = useCallback(
    (code: LocaleCode) => {
      const option = LOCALES.find((l) => l.code === code) ?? LOCALES[0];
      applyLocale(option);
    },
    [applyLocale]
  );

  useEffect(() => {
    // 1. Check localStorage first (user already chose manually)
    const saved = localStorage.getItem(STORAGE_KEY) as LocaleCode | null;
    if (saved && LOCALES.find((l) => l.code === saved)) {
      setLocale(saved);
      setIsDetecting(false);
      return;
    }

    // 2. Geolocation API — use ip-api.com (free, no key needed)
    const detect = async () => {
      try {
        const res = await fetch("https://ip-api.com/json/?fields=countryCode", {
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) {
          const data = await res.json();
          const countryCode: string = data.countryCode ?? "";
          const detectedCode = COUNTRY_TO_LOCALE[countryCode] ?? "en";
          setLocale(detectedCode);
        }
      } catch {
        // silently fall back to English
      } finally {
        setIsDetecting(false);
      }
    };

    detect();
  }, [setLocale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, isDetecting }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}
