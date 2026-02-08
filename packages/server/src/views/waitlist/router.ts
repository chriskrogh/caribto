import { router } from "@server/trpc";

import { joinMutation } from "./procedures/join";

export const waitlist = router({
  joinMutation,
});
