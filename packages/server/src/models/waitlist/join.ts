import { supabaseAdmin } from "@server/utils/supabase";

export const joinWaitlist = async (email: string) => {
  const { data, error } = await supabaseAdmin
    .from("waitlist")
    .upsert({ email }, { onConflict: "email" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};
