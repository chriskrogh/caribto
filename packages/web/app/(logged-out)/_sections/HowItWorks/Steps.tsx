"use client";

import type { LucideIcon } from "lucide-react";
import { CreditCard, Send, UserPlus, Wallet } from "lucide-react";
import Image from "next/image";
import { useInView } from "react-intersection-observer";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/_components/ui/card";
import { Typography } from "@/_components/ui/typography";

const STEPS = [
  {
    title: "Create your free account",
    description:
      "Sign up in seconds and verify your identity with a few personal details. Quick, simple, and fully KYC-compliant.",
    direction: "left" as const,
    icon: UserPlus,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
  {
    title: "Enter your wallet address",
    description:
      "Provide the address of your self-custodial wallet. You stay in full control of your crypto at all times.",
    direction: "right" as const,
    icon: Wallet,
    iconBg: "bg-fuchsia-500/10",
    iconColor: "text-fuchsia-500",
  },
  {
    title: "Choose your payment method",
    description:
      "Pay with your local debit or credit card in TTD, BBD, or JMD. No need to convert to USD first.",
    direction: "left" as const,
    icon: CreditCard,
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-500",
  },
  {
    title: "Checkout and receive USDC",
    description:
      "Confirm your purchase and that's it — USDC on Base is sent straight to your wallet.",
    direction: "right" as const,
    logo: true,
    icon: Send,
    iconBg: "bg-lime-500/10",
    iconColor: "text-lime-500",
  },
] as const;

const AnimatedStep: React.FC<{
  step: (typeof STEPS)[number];
  index: number;
}> = ({ step, index }) => {
  const { ref, inView } = useInView({ threshold: 0.2 });

  const animationClass =
    step.direction === "left"
      ? "animate-slide-from-left"
      : "animate-slide-from-right";

  const Icon: LucideIcon = step.icon;

  return (
    <div
      ref={ref}
      className={inView ? animationClass : "opacity-0"}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <Card className="p-2 sm:p-4">
        <CardHeader className="flex flex-col sm:flex-row items-start gap-5 space-y-0">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${step.iconBg} ${step.iconColor}`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-1.5">
            <CardTitle className="text-xl flex flex-col gap-2 sm:gap-0 sm:flex-row sm:items-center">
              {step.title}
              {"logo" in step && step.logo && (
                <Image
                  src="/base.svg"
                  alt="Base"
                  width={60}
                  height={16}
                  className="ml-2 inline-block align-middle"
                />
              )}
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {step.description}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};

type Props = {
  country: string;
};

export const Steps: React.FC<Props> = ({ country }) => {
  return (
    <section className="flex w-full flex-col items-center gap-10 px-6 py-20 sm:px-8">
      <Typography as="h2" className="text-center">
        How to buy crypto in {country}
      </Typography>
      <div className="flex w-full max-w-2xl flex-col gap-6">
        {STEPS.map((step, index) => (
          <AnimatedStep key={step.title} step={step} index={index} />
        ))}
      </div>
    </section>
  );
};
