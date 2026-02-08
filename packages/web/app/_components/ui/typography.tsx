import { cn } from "@shared/utils/cn";

type Props = {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "p" | "label";
  className?: string;
  children: React.ReactNode;
};

export const Typography: React.FC<Props> = ({
  as = "p",
  className,
  children,
}) => {
  switch (as) {
    case "h1":
      return (
        <h1
          className={cn(
            "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
            className
          )}
        >
          {children}
        </h1>
      );
    case "h2":
      return (
        <h2
          className={cn(
            "scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0",
            className
          )}
        >
          {children}
        </h2>
      );
    case "h3":
      return (
        <h3
          className={cn(
            "scroll-m-20 text-2xl font-semibold tracking-tight",
            className
          )}
        >
          {children}
        </h3>
      );
    case "h4":
      return (
        <h4
          className={cn(
            "scroll-m-20 text-xl font-semibold tracking-tight",
            className
          )}
        >
          {children}
        </h4>
      );
    case "h5":
      return (
        <h5
          className={cn(
            "scroll-m-20 text-lg font-medium tracking-tight",
            className
          )}
        >
          {children}
        </h5>
      );
    case "p":
      return <p className={className}>{children}</p>;
    case "label":
      return <p className={cn("text-sm", className)}>{children}</p>;
  }
};
