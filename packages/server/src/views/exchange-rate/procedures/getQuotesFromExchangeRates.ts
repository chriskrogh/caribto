import { getQuotesFromExchangeRates } from "@server/controllers/exchange-rate/quotes";
import { procedure } from "@server/trpc";

export const getQuotesFromExchangeRatesQuery = procedure.query(async () => {
  return await getQuotesFromExchangeRates();
});
