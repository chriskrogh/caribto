import { router } from "../trpc";

import { exchangeRate } from "./exchange-rate/router";
import { hello } from "./hello/router";
import { waitlist } from "./waitlist/router";

export const appRouter = router({
  hello,
  exchangeRate,
  waitlist,
});

export type AppRouter = typeof appRouter;
