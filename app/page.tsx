"use client";

import { trpc } from "@/app/_lib/trpc";

const Page: React.FC = () => {
  const { data } = trpc.hello.useQuery({ text: "world" });
  return <div>{data?.greeting}</div>;
};

export default Page;
