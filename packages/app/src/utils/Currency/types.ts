export type Country = 'TT';

export type Fiat = {
  name: string;
  symbol: string;
};

export type Crypto = Fiat & {
  contractAddress: string;
};

export type Currency = Fiat | Crypto;

export type CurrencyPair = {
  fiat: Fiat;
  crypto: Crypto;
};
