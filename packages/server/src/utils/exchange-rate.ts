export const fetchExchangeRates = async () => {
  const response = await fetch(
    `https://api.exchangerate.host/live?access_key=${process.env.EXCHANGE_RATE_API_KEY}`
  );
  const data = await response.json();
  const quotes = data.quotes as Record<string, number>;
  return Object.entries(quotes).map(([key, rate]) => ({
    source: key.slice(0, 3),
    target: key.slice(3),
    rate,
  }));
};
