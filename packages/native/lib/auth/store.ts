import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { storageAdapter } from "@/lib/storage/adapter";

type AuthState = {
  user: User | null;
  session: Session | null;
  _hasHydrated: boolean;
  logIn: (user: User, session: Session) => void;
  logOut: () => void;
  setHasHydrated: (value: boolean) => void;
  reset: () => void;
};

const DEFAULT_STATE = {
  user: null,
  session: null,
} as const;

export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      ...DEFAULT_STATE,
      _hasHydrated: false,
      logIn: (user: User, session: Session) => {
        set({ user, session });
      },
      logOut: () => {
        set({ user: null, session: null });
      },
      setHasHydrated: (value: boolean) => {
        set({ _hasHydrated: value });
      },
      reset: () => {
        set(DEFAULT_STATE);
      },
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => storageAdapter),
      onRehydrateStorage: () => {
        return (state) => {
          state?.setHasHydrated(true);
        };
      },
    }
  )
);
