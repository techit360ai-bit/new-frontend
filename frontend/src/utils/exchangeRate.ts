export interface CurrencyInfo {
  code: string;
  symbol: string;
  rate: number;
}

export const BASE_PRICES_NGN = {
  basic: { monthly: 5000, yearly: 50000 },
  regular: { monthly: 15000, yearly: 150000 },
  premium: { monthly: 50000, yearly: 500000 },
  stand: 150000
};

export const BASE_PRICES_INTL = {
  basic: { monthly: 5, yearly: 50 },
  regular: { monthly: 15, yearly: 150 },
  premium: { monthly: 50, yearly: 500 },
  stand: 150
};

export async function getCurrencyInfo(): Promise<CurrencyInfo> {
  return { code: "USD", symbol: "$", rate: 1 };
}
