import { createClient } from "@server/utils/supabase";

export const joinWaitlist = async (email: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("waitlist")
    .upsert({ email }, { onConflict: "email" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};
