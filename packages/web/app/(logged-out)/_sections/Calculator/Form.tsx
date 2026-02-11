"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { Card, CardContent } from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/_components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/_components/ui/tooltip";
import { Typography } from "@/_components/ui/typography";

import type { CurrencyCode } from "../../_lib/currency";

const LOW_FEE_RATE = 0.06;
const HIGH_FEE_RATE = 0.065;
const FEE_THRESHOLD = 1000;

const getFeeRate = (usdcAmount: number): number =>
  usdcAmount >= FEE_THRESHOLD ? LOW_FEE_RATE : HIGH_FEE_RATE;

const CURRENCIES = [
  { code: "TTD", label: "TTD - Trinidad & Tobago Dollar" },
  { code: "BBD", label: "BBD - Barbados Dollar" },
  { code: "JMD", label: "JMD - Jamaican Dollar" },
  { code: "BSD", label: "BSD - Bahamian Dollar" },
  { code: "XCD", label: "XCD - Eastern Caribbean Dollar" },
  { code: "AWG", label: "AWG - Aruban Florin" },
  { code: "XCG", label: "XCG - Caribbean Guilder" },
] as const;

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const FeeLabel: React.FC<{ feePercent: number }> = ({ feePercent }) => {
  return (
    <span className="flex items-center gap-1">
      Fee ({feePercent}%)
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-muted text-[10px] font-medium leading-none text-muted-foreground transition-colors hover:bg-muted-foreground/20"
              aria-label="Fee information"
            >
              ?
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="w-48 text-xs">
            Under {FEE_THRESHOLD.toLocaleString()} USDC: {HIGH_FEE_RATE * 100}%
            fee. {FEE_THRESHOLD.toLocaleString()} USDC and above:{" "}
            {LOW_FEE_RATE * 100}% fee.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
};

type Props = {
  quotes: Record<string, number>;
  defaultCurrency: CurrencyCode | undefined;
};

export const Form: React.FC<Props> = ({ quotes, defaultCurrency }) => {
  const [currency, setCurrency] = useState<CurrencyCode | undefined>(
    defaultCurrency,
  );
  const [amount, setAmount] = useState("100");

  const exchangeRate = useMemo(() => {
    if (!currency) return null;
    const rateKey = `USD-${currency}`;
    return quotes[rateKey] ?? null;
  }, [currency, quotes]);

  const breakdown = useMemo(() => {
    const numericAmount = parseFloat(amount.replace(/,/g, ""));
    if (!numericAmount || numericAmount <= 0 || exchangeRate === null)
      return null;

    // numericAmount is how much USDC they want to receive
    const feeRate = getFeeRate(numericAmount);
    const feeUsd = numericAmount * feeRate;
    const totalUsd = numericAmount + feeUsd;

    // Convert to local currency
    const feeLocal = feeUsd * exchangeRate;
    const totalLocal = totalUsd * exchangeRate;
    const feePercent = feeRate * 100;

    return { feeLocal, totalLocal, feePercent };
  }, [amount, exchangeRate]);

  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-2">
          <Typography as="label" className="text-muted-foreground">
            You receive
          </Typography>
          <div className="flex gap-2">
            <Input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, "");
                setAmount(val);
              }}
              placeholder="0.00"
              className="flex-1 text-lg font-medium"
            />
            <div className="flex h-10 shrink-0 items-center gap-1.5 rounded-md border border-input bg-secondary/50 px-3">
              <Image src="/usdc-small.png" alt="USDC" width={20} height={20} />
              <span className="text-sm font-medium">USDC</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Typography as="label" className="text-muted-foreground">
            Your currency
          </Typography>
          <Select
            value={currency ?? ""}
            onValueChange={(val) => setCurrency(val as CurrencyCode)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 border-t border-b py-3 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Exchange rate</span>
            <span>
              {exchangeRate !== null && currency
                ? `1 USD = ${formatNumber(exchangeRate)} ${currency}`
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <FeeLabel
              feePercent={breakdown?.feePercent ?? HIGH_FEE_RATE * 100}
            />
            <span>
              {breakdown && currency
                ? `${formatNumber(breakdown.feeLocal)} ${currency}`
                : "—"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Typography as="label" className="text-muted-foreground">
            You pay
          </Typography>
          <div className="flex items-center justify-between rounded-md border border-input bg-secondary/50 px-3 py-3">
            <span className="text-lg font-semibold">
              {breakdown ? formatNumber(breakdown.totalLocal) : "0.00"}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {currency ?? "—"}
            </span>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};
