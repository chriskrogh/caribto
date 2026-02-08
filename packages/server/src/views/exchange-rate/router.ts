import { router } from "@server/trpc";

import { getQuotesFromExchangeRatesQuery } from "./procedures/getQuotesFromExchangeRates";

export const exchangeRate = router({
  getQuotesFromExchangeRatesQuery,
});
