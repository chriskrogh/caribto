import { joinWaitlist } from "@server/models/waitlist/join";
import { procedure } from "@server/trpc";
import { z } from "zod";

const inputSchema = z.object({
  email: z.string().email(),
});

export const joinMutation = procedure
  .input(inputSchema)
  .mutation(async ({ input }) => {
    return joinWaitlist(input.email);
  });
