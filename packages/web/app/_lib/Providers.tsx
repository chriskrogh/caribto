"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { DEFAULT_OPTIONS, trpc } from "@/_utils/trpc";

type Props = {
  children: React.ReactNode;
};

const ProvidersBase: React.FC<Props> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: DEFAULT_OPTIONS,
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export const Providers = trpc.withTRPC(ProvidersBase) as typeof ProvidersBase;
