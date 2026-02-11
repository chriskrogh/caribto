import { geolocation } from "@vercel/functions";
import { headers } from "next/headers";

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  TT: "TTD",
  BB: "BBD",
  JM: "JMD",
  BS: "BSD",
  AG: "XCD",
  DM: "XCD",
  GD: "XCD",
  KN: "XCD",
  LC: "XCD",
  VC: "XCD",
  AI: "XCD",
  MS: "XCD",
  AW: "AWG",
  CW: "XCG",
  SX: "XCG",
};

const COUNTRY_TO_NAME: Record<string, string> = {
  TT: "Trinidad & Tobago",
  BB: "Barbados",
  JM: "Jamaica",
  BS: "The Bahamas",
  AG: "Antigua & Barbuda",
  DM: "Dominica",
  GD: "Grenada",
  KN: "Saint Kitts & Nevis",
  LC: "Saint Lucia",
  VC: "Saint Vincent & Grenadines",
  AI: "Anguilla",
  MS: "Montserrat",
  AW: "Aruba",
  CW: "Curaçao",
  SX: "Sint Maarten",
};

export type CurrencyCode =
  | "TTD"
  | "BBD"
  | "JMD"
  | "BSD"
  | "XCD"
  | "AWG"
  | "XCG";

const getCountryCode = async (): Promise<string> => {
  try {
    const _headers = await headers();
    const geo = geolocation({ headers: _headers });
    return geo.country ?? "";
  } catch {
    return "";
  }
};

export const detectCurrency = async (): Promise<
  CurrencyCode | undefined
> => {
  const country = await getCountryCode();
  return (COUNTRY_TO_CURRENCY[country] as CurrencyCode) ?? undefined;
};

export const detectCountry = async (): Promise<string> => {
  const country = await getCountryCode();
  return COUNTRY_TO_NAME[country] ?? "the Caribbean";
};
