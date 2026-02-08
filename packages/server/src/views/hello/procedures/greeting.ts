import { procedure } from "../../../trpc";
import { z } from "zod";

export const greeting = procedure
  .input(
    z.object({
      text: z.string(),
    })
  )
  .query(({ input }) => {
    return {
      greeting: `hello ${input.text}`,
    };
  });
