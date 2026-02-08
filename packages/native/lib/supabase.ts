import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

import { storageAdapter } from "@/lib/storage/adapter";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublicKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl!, supabasePublicKey!, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
