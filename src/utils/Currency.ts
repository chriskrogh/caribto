export type FiatCurrency = 'TTD';

export type CryptoCurrency = 'TTC';

export type Currency = FiatCurrency | CryptoCurrency;

export const isFiat = (currency: Currency): boolean => currency === 'TTD';
