import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import React from "react";

import { GlobalLogoutHandler } from "../auth/GlobalLogoutHandler";
import { AuthSessionMonitor } from "../auth/SessionMonitor";
import { persister, queryClient, trpcClient } from "../trpc/client";
import { trpc } from "../trpc/core";

type Props = {
  children: React.ReactNode;
};

export const Providers: React.FC<Props> = ({ children }) => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        {children}
        <GlobalLogoutHandler />
        <AuthSessionMonitor />
      </trpc.Provider>
    </PersistQueryClientProvider>
  );
};
