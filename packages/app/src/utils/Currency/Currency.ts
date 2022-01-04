import { Country, Crypto, CurrencyPair, Fiat } from './types';

export const TTD: Fiat = {
  name: 'Trinidad and Tobago Dollar',
  symbol: 'TTD',
};

export const TTDC: Crypto = {
  name: 'Trinidad and Tobago Dollar Coin',
  symbol: 'TTDC',
  contractAddress: process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS as string,
};

export const CurrencyPairs: Record<Country, CurrencyPair> = {
  TT: {
    fiat: TTD,
    crypto: TTDC,
  },
};
