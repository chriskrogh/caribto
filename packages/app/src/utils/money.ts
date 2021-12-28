export const buildFormatter = (currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });

export const moneyFloor = (value: number): number =>
  Math.floor(value * 100) / 100;

export const moneyRound = (value: number): number =>
  Math.round(value * 100) / 100;
