export type FiatCurrency = 'TTD';

export type CryptoCurrency = 'TTDC';

export type Currency = FiatCurrency | CryptoCurrency;

export const isFiat = (currency: Currency): currency is FiatCurrency =>
  currency === 'TTD';
