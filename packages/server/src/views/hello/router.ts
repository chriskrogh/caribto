import { router } from "../../trpc";

import { greeting } from "./procedures/greeting";

export const hello = router({
  greeting,
});
