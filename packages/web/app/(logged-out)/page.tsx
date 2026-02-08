import type { Metadata } from "next";
import { Suspense } from "react";

import { Calculator, CalculatorSkeleton } from "./_sections/Calculator";
import { FAQ } from "./_sections/FAQ";
import { Hero } from "./_sections/Hero";
import { HowItWorks } from "./_sections/HowItWorks";
import { Waitlist } from "./_sections/Waitlist";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

const Page: React.FC = () => {
  return (
    <>
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center">
        <Hero />
        <Suspense fallback={<CalculatorSkeleton />}>
          <Calculator />
        </Suspense>
        <Waitlist />
      </div>
      <div className="flex w-full flex-col items-center gap-16 px-6 pb-20 sm:px-8">
        <Suspense fallback={null}>
          <HowItWorks />
        </Suspense>
        <FAQ />
      </div>
    </>
  );
};

export default Page;
