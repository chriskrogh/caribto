import type { AppRouter } from "@server/views/_app";
import { httpBatchLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 4000}`;
}

export const DEFAULT_OPTIONS = {
  queries: {
    refetchOnMount: false,
  },
} as const;

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/trpc`,
          async headers() {
            return {};
          },
        }),
      ],
      queryClientConfig: {
        defaultOptions: DEFAULT_OPTIONS,
      },
    };
  },
  ssr: false,
});

export const NEVER_REFETCH_QUERY_OPTIONS = {
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchInterval: false,
  refetchIntervalInBackground: false,
  staleTime: Infinity,
} as const;
