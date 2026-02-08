import { getExchangeRates } from "../src/models/exchange-rate/get";
import { setExchangeRates } from "../src/models/exchange-rate/set";
import { fetchExchangeRates } from "../src/utils/exchange-rate";

const main = async () => {
  console.log("Starting exchange rates sync...");

  const [existingRates, rates] = await Promise.all([
    getExchangeRates({ admin: true }),
    fetchExchangeRates(),
  ]);

  if (existingRates.length === 0) {
    await setExchangeRates(rates);
    console.log(`Inserted ${rates.length} new exchange rates.`);
    return;
  }

  const newRates = existingRates.map((rate) => ({
    ...rate,
    rate: rates.find((r) => r.source === rate.source && r.target === rate.target)!
      .rate,
  }));

  await setExchangeRates(newRates);
  console.log(`Updated ${newRates.length} exchange rates.`);
};

main();
