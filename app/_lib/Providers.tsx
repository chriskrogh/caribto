"use client";

import { trpc } from "@/app/_lib/trpc";

type Props = {
  children: React.ReactNode;
};

const _Providers: React.FC<Props> = ({ children }) => {
  return children;
};

export const Providers = trpc.withTRPC(_Providers) as typeof _Providers;
