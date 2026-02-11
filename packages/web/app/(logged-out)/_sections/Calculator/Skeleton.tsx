import { Card, CardContent } from "@/_components/ui/card";
import { Skeleton } from "@/_components/ui/skeleton";

export const CalculatorSkeleton: React.FC = () => {
  return (
    <section className="slide-up flex w-full justify-center px-6 pb-12 sm:px-8 sm:pb-16">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-5 p-6">
          {/* "You receive" input */}
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-20" />
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-[72px]" />
            </div>
          </div>

          {/* "Your currency" select */}
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Exchange rate & fee rows */}
          <div className="flex flex-col gap-1 border-t border-b py-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* "You pay" output */}
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>

          {/* CTA button */}
          <Skeleton className="h-11 w-full rounded-md" />
        </CardContent>
      </Card>
    </section>
  );
};
