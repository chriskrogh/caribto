import { geolocation } from "@vercel/functions";
import { headers } from "next/headers";

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  TT: "TTD",
  BB: "BBD",
  JM: "JMD",
};

const COUNTRY_TO_NAME: Record<string, string> = {
  TT: "Trinidad & Tobago",
  BB: "Barbados",
  JM: "Jamaica",
};

export type CurrencyCode = "TTD" | "BBD" | "JMD" | "USD";

const getCountryCode = async (): Promise<string> => {
  try {
    const _headers = await headers();
    const geo = geolocation({ headers: _headers });
    return geo.country ?? "";
  } catch {
    return "";
  }
};

export const detectCurrency = async (): Promise<CurrencyCode> => {
  const country = await getCountryCode();
  return (COUNTRY_TO_CURRENCY[country] as CurrencyCode) ?? "USD";
};

export const detectCountry = async (): Promise<string> => {
  const country = await getCountryCode();
  return COUNTRY_TO_NAME[country] ?? "the Caribbean";
};
