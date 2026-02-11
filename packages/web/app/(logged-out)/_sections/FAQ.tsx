"use client";

import { useInView } from "react-intersection-observer";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/_components/ui/accordion";
import { Typography } from "@/_components/ui/typography";

const FAQS = [
  {
    question: "What is USDC?",
    answer:
      "USDC (USD Coin) is a stablecoin pegged 1:1 to the US dollar. Each USDC is backed by fully reserved assets, making it a safe and reliable way to hold digital dollars. It's widely accepted across DeFi platforms, exchanges, and merchants.",
  },
  {
    question: "Which currencies can I pay with?",
    answer:
      "You can pay with Trinidad and Tobago Dollars (TTD), Barbados Dollars (BBD), Jamaican Dollars (JMD), Bahamian Dollars (BSD), Eastern Caribbean Dollars (XCD), Aruban Florin (AWG), or Caribbean Guilder (XCG) using your local debit or credit card. No need to convert to USD first — we handle the exchange for you.",
  },
  {
    question: "How long does a transaction take?",
    answer:
      "Most transactions are completed within minutes. Once your payment is confirmed, USDC is sent directly to your wallet on the Base network. You'll receive a confirmation as soon as the transfer is complete.",
  },
  {
    question: "Do I need a crypto wallet?",
    answer:
      "Yes, you'll need a self-custodial wallet that supports USDC on the Base network. Popular options include Coinbase Wallet, MetaMask, and Rainbow. You stay in full control of your funds at all times.",
  },
  {
    question: "What is the Base network?",
    answer:
      "Base is a secure, low-cost Ethereum Layer 2 network built by Coinbase. It offers fast transactions with minimal fees, making it ideal for sending and receiving USDC.",
  },
  {
    question: "Are there any fees?",
    answer:
      "We charge a small transparent fee on each transaction, which is displayed before you confirm your purchase. There are no hidden charges — what you see is what you pay.",
  },
  {
    question: "Is my personal information safe?",
    answer:
      "Absolutely. We use bank-grade encryption to protect your data and are fully KYC-compliant. Your personal information is never shared with third parties without your consent.",
  },
] as const;

export const FAQ: React.FC = () => {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <section
      ref={ref}
      className="flex w-full flex-col items-center gap-10 px-6 py-20 sm:px-8"
    >
      <Typography as="h2" className="text-center">
        Frequently asked questions
      </Typography>
      <div
        className={`w-full max-w-2xl ${inView ? "animate-fade-in" : "opacity-0"}`}
      >
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger className="text-left text-base">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
