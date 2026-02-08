import { createClient, supabaseAdmin } from "@server/utils/supabase";

type Options = {
  admin?: boolean;
};

export const getExchangeRates = async (options?: Options) => {
  const supabase = options?.admin ? supabaseAdmin : await createClient();
  const { data, error } = await supabase.from("exchange_rates").select("*");

  if (error) {
    throw error;
  }

  return data;
};
