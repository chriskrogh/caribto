import { router } from "../trpc";

import { exchangeRate } from "./exchange-rate/router";
import { hello } from "./hello/router";

export const appRouter = router({
  hello,
  exchangeRate,
});

export type AppRouter = typeof appRouter;
