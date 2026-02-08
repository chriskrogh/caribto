import NetInfo from "@react-native-community/netinfo";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";

import { triggerGlobalLogout } from "../auth/globalLogout";
import { storageAdapter } from "../storage/adapter";

import { trpc } from "./core";

const DEVICE_OFFLINE_ERROR = "Network request blocked: Device is offline";

const isAuthError = (error: any) => {
  return (
    error?.code === "bad_jwt" ||
    error?.status === 403 ||
    error?.data?.code === "UNAUTHORIZED" ||
    (error instanceof TRPCClientError &&
      (error.message.toLowerCase().includes("jwt expired") ||
        error.message.toLowerCase().includes("invalid jwt")))
  );
};

const retry = (failureCount: number, error: any) => {
  if (isAuthError(error)) {
    return false;
  }
  if (error?.message?.includes(DEVICE_OFFLINE_ERROR)) {
    return false;
  }
  return failureCount < 3;
};

const throwOnError = (error: any) => {
  if (isAuthError(error)) {
    triggerGlobalLogout();
    return false;
  }
  return true;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false,
      retry,
      throwOnError,
    },
    mutations: {
      retry,
      throwOnError,
    },
  },
});

export const persister = createAsyncStoragePersister({
  storage: storageAdapter,
});

function getBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 4000}`;
}

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
      async headers() {
        try {
          const stored = await storageAdapter.getItem("auth-store");
          if (!stored) {
            return {};
          }
          const parsed = JSON.parse(stored);
          const session = parsed?.state?.session;
          return {
            authorization: session?.access_token
              ? `Bearer ${session.access_token}`
              : undefined,
          };
        } catch {
          return {};
        }
      },
      // Prevent requests when offline
      fetch: async (url: any, init: any) => {
        const netInfo = await NetInfo.fetch();
        const isConnected = netInfo.isConnected ?? false;
        if (!isConnected) {
          throw new Error(DEVICE_OFFLINE_ERROR);
        }
        return fetch(url, init);
      },
    }),
  ],
});
