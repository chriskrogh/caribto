import type { Database } from "@server/database.types";
import { supabaseAdmin } from "@server/utils/supabase";

type ExchangeRate = Database["public"]["Tables"]["exchange_rates"]["Insert"];

export const setExchangeRates = async (rates: ExchangeRate[]) => {
  const { data, error } = await supabaseAdmin
    .from("exchange_rates")
    .upsert(rates);

  if (error) {
    throw error;
  }

  return data;
};
