"use client";

import { useState } from "react";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Typography } from "@/_components/ui/typography";
import { trpc } from "@/_utils/trpc";

export const Waitlist: React.FC = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const joinMutation = trpc.waitlist.joinMutation.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    joinMutation.mutate({ email: email.trim() });
  };

  return (
    <section className="flex w-full flex-col items-center gap-3 px-6 pt-6 pb-4 text-center sm:px-8">
      <Typography as="p" className="text-sm text-muted-foreground">
        Join the waitlist to get early access
      </Typography>
      {submitted ? (
        <div className="rounded-md border border-primary/20 bg-primary/10 px-6 py-3">
          <Typography as="p" className="text-sm font-medium text-primary">
            You&apos;re on the list! We&apos;ll be in touch soon.
          </Typography>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
        >
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={joinMutation.isPending}
            className="sm:w-auto"
          >
            {joinMutation.isPending ? "Joining..." : "Join Waitlist"}
          </Button>
        </form>
      )}
      {joinMutation.isError && !submitted && (
        <Typography as="p" className="text-sm text-destructive">
          Something went wrong. Please try again.
        </Typography>
      )}
    </section>
  );
};
