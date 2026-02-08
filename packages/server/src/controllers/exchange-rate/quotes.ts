import { getExchangeRates } from "@server/models/exchange-rate/get";
import { cache } from "react";

export const getQuotesFromExchangeRates = cache(async (admin?: true) => {
  const exchangeRates = await getExchangeRates({ admin });
  const quotes = exchangeRates.reduce(
    (acc, exchangeRate) => {
      acc[`${exchangeRate.source}-${exchangeRate.target}`] = exchangeRate.rate;
      return acc;
    },
    {} as Record<string, number>
  );
  return quotes;
});
