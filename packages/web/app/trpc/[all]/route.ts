import { createContext } from "@server/context";
import { appRouter } from "@server/views/_app";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/trpc",
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
