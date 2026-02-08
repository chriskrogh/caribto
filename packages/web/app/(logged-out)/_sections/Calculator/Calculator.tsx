import { getQuotesFromExchangeRates } from "@server/controllers/exchange-rate/quotes";

import { detectCurrency } from "../../_lib/currency";

import { Form } from "./Form";

export const Calculator: React.FC = async () => {
  const [quotes, defaultCurrency] = await Promise.all([
    getQuotesFromExchangeRates(),
    detectCurrency(),
  ]);

  return (
    <section className="slide-up flex w-full justify-center px-6 pb-12 sm:px-8 sm:pb-16">
      <Form quotes={quotes} defaultCurrency={defaultCurrency} />
    </section>
  );
};
